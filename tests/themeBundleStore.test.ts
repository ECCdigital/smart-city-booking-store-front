import { describe, expect, it, vi } from "vitest";

import {
  createThemeBundleStore,
  type ThemeBundleFetch,
} from "~~/server/utils/themeBundleStore";

/**
 * The store is the storefront's single revalidation point for the Theme
 * Bundle (storefront ADR 0001). These tests drive it through an injected
 * fetcher and clock, so nothing here talks to a backend or waits on a timer
 * it does not control.
 */

/** A clock the test moves by hand. */
function clock(start = 1_000_000) {
  let now = start;
  return {
    now: () => now,
    advance: (seconds: number) => {
      now += seconds * 1000;
    },
  };
}

function view(etag: string) {
  return {
    etag,
    name: `name-${etag}`,
    heroLayout: null,
    background: null,
    logo: null,
  };
}

function setup(
  fetchBundle: ThemeBundleFetch,
  overrides: Record<string, unknown> = {},
) {
  const time = clock();
  const warn = vi.fn();
  const store = createThemeBundleStore({
    fetchBundle,
    buildView: (_bundle, etag) => view(etag),
    revalidateSeconds: 5,
    timeoutMs: 2000,
    now: time.now,
    logger: { warn },
    ...overrides,
  });
  return { store, time, warn };
}

/** A fetcher that always reports fresh content under a new etag. */
function alwaysModified(etags: string[]): ThemeBundleFetch {
  let call = 0;
  return vi.fn(async () => ({
    status: "modified" as const,
    bundle: { name: "portal" },
    etag: etags[Math.min(call++, etags.length - 1)]!,
  }));
}

describe("the Theme Bundle store", () => {
  it("asks the backend on the first read and answers with the built view", async () => {
    const fetchBundle = alwaysModified(["v1"]);
    const { store } = setup(fetchBundle);

    expect(await store.get(null)).toEqual({
      bundle: { name: "portal" },
      etag: "v1",
      view: view("v1"),
    });
    expect(fetchBundle).toHaveBeenCalledTimes(1);
  });

  it("serves the stored view without asking again inside the interval", async () => {
    const fetchBundle = alwaysModified(["v1", "v2"]);
    const { store, time } = setup(fetchBundle);

    await store.get(null);
    time.advance(4);
    const second = await store.get(null);

    expect(second?.etag).toBe("v1");
    expect(fetchBundle).toHaveBeenCalledTimes(1);
  });

  it("revalidates once the interval has passed", async () => {
    const fetchBundle = alwaysModified(["v1", "v2"]);
    const { store, time } = setup(fetchBundle);

    await store.get(null);
    time.advance(5);

    expect((await store.get(null))?.etag).toBe("v2");
    expect(fetchBundle).toHaveBeenCalledTimes(2);
  });

  it("sends the stored etag so the backend can answer 304", async () => {
    const fetchBundle = vi
      .fn<ThemeBundleFetch>()
      .mockResolvedValueOnce({
        status: "modified",
        bundle: { name: "portal" },
        etag: "v1",
      })
      .mockResolvedValueOnce({ status: "not-modified" });
    const { store, time } = setup(fetchBundle);

    await store.get(null);
    time.advance(5);
    const second = await store.get(null);

    expect(fetchBundle.mock.calls[1]?.[0]).toMatchObject({
      slug: null,
      etag: '"v1"',
    });
    expect(second?.etag).toBe("v1");
    expect(second?.view).toEqual(view("v1"));
  });

  it("does not rebuild the view for a 304", async () => {
    const buildView = vi.fn((_bundle: unknown, etag: string) => view(etag));
    const fetchBundle = vi
      .fn<ThemeBundleFetch>()
      .mockResolvedValueOnce({
        status: "modified",
        bundle: { name: "portal" },
        etag: "v1",
      })
      .mockResolvedValueOnce({ status: "not-modified" });
    const { store, time } = setup(fetchBundle, { buildView });

    await store.get(null);
    time.advance(5);
    await store.get(null);

    expect(buildView).toHaveBeenCalledTimes(1);
  });

  it("revalidates on every read when the interval is zero", async () => {
    const fetchBundle = alwaysModified(["v1", "v2", "v3"]);
    const { store } = setup(fetchBundle, { revalidateSeconds: 0 });

    await store.get(null);
    await store.get(null);

    expect(fetchBundle).toHaveBeenCalledTimes(2);
  });

  it("shares one in-flight revalidation between concurrent reads", async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const fetchBundle = vi.fn<ThemeBundleFetch>(async () => {
      await gate;
      return { status: "modified", bundle: { name: "portal" }, etag: "v1" };
    });
    const { store } = setup(fetchBundle);

    const reads = Promise.all([store.get(null), store.get(null), store.get(null)]);
    release!();
    const [a, b, c] = await reads;

    expect(fetchBundle).toHaveBeenCalledTimes(1);
    expect(a?.etag).toBe("v1");
    expect(b).toBe(a);
    expect(c).toBe(a);
  });

  it("strips the transport quoting so the etag can be used in a URL", async () => {
    const fetchBundle = vi.fn<ThemeBundleFetch>().mockResolvedValue({
      status: "modified",
      bundle: { name: "portal" },
      etag: '"6046b013e65e0627"',
    });
    const { store } = setup(fetchBundle);

    expect((await store.get(null))?.etag).toBe("6046b013e65e0627");
  });

  it("strips a weak validator's prefix too", async () => {
    const fetchBundle = vi.fn<ThemeBundleFetch>().mockResolvedValue({
      status: "modified",
      bundle: { name: "portal" },
      etag: 'W/"6046b013e65e0627"',
    });
    const { store } = setup(fetchBundle);

    expect((await store.get(null))?.etag).toBe("6046b013e65e0627");
  });

  it("sends the etag back in the quoted form the backend used", async () => {
    const fetchBundle = vi
      .fn<ThemeBundleFetch>()
      .mockResolvedValueOnce({
        status: "modified",
        bundle: { name: "portal" },
        etag: '"6046b013e65e0627"',
      })
      .mockResolvedValueOnce({ status: "not-modified" });
    const { store, time } = setup(fetchBundle);

    await store.get(null);
    time.advance(5);
    await store.get(null);

    expect(fetchBundle.mock.calls[1]?.[0]?.etag).toBe('"6046b013e65e0627"');
  });

  it("keeps one entry per slug", async () => {
    const fetchBundle = vi.fn<ThemeBundleFetch>(async ({ slug }) => ({
      status: "modified" as const,
      bundle: { name: slug ?? "root" },
      etag: `etag-${slug ?? "root"}`,
    }));
    const { store } = setup(fetchBundle);

    expect((await store.get(null))?.etag).toBe("etag-root");
    expect((await store.get("sport"))?.etag).toBe("etag-sport");
    expect((await store.get(null))?.etag).toBe("etag-root");
    expect(fetchBundle).toHaveBeenCalledTimes(2);
  });

  it("serves the stored copy when the backend fails", async () => {
    const fetchBundle = vi
      .fn<ThemeBundleFetch>()
      .mockResolvedValueOnce({
        status: "modified",
        bundle: { name: "portal" },
        etag: "v1",
      })
      .mockRejectedValue(Object.assign(new Error("gone"), { status: 503 }));
    const { store, time } = setup(fetchBundle);

    await store.get(null);
    time.advance(5);

    expect((await store.get(null))?.etag).toBe("v1");
  });

  it("keeps serving the stored copy however long the backend stays down", async () => {
    const fetchBundle = vi
      .fn<ThemeBundleFetch>()
      .mockResolvedValueOnce({
        status: "modified",
        bundle: { name: "portal" },
        etag: "v1",
      })
      .mockRejectedValue(Object.assign(new Error("gone"), { status: 503 }));
    const { store, time } = setup(fetchBundle);

    await store.get(null);
    for (let attempt = 0; attempt < 20; attempt += 1) {
      time.advance(60);
      expect((await store.get(null))?.etag).toBe("v1");
    }
  });

  it("serves the stored copy when the backend does not answer in time", async () => {
    const fetchBundle = vi
      .fn<ThemeBundleFetch>()
      .mockResolvedValueOnce({
        status: "modified",
        bundle: { name: "portal" },
        etag: "v1",
      })
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 200)),
      );
    const { store, time } = setup(fetchBundle, { timeoutMs: 10 });

    await store.get(null);
    time.advance(5);

    expect((await store.get(null))?.etag).toBe("v1");
  });

  it("aborts the request it gave up waiting for", async () => {
    let seen: AbortSignal | undefined;
    const fetchBundle = vi.fn<ThemeBundleFetch>(
      ({ signal }) =>
        new Promise((resolve) => {
          seen = signal;
          setTimeout(resolve, 200);
        }),
    );
    const { store } = setup(fetchBundle, { timeoutMs: 10 });

    await store.get(null);

    expect(seen?.aborted).toBe(true);
  });

  it("returns null when the backend fails and nothing is stored", async () => {
    const fetchBundle = vi
      .fn<ThemeBundleFetch>()
      .mockRejectedValue(Object.assign(new Error("gone"), { status: 503 }));
    const { store } = setup(fetchBundle);

    expect(await store.get(null)).toBeNull();
  });

  it("does not hammer a backend that is down", async () => {
    const fetchBundle = vi
      .fn<ThemeBundleFetch>()
      .mockRejectedValue(Object.assign(new Error("gone"), { status: 503 }));
    const { store, time } = setup(fetchBundle);

    await store.get(null);
    time.advance(1);
    await store.get(null);

    expect(fetchBundle).toHaveBeenCalledTimes(1);
  });

  it("warns once for a series of the same failure, naming slug and status", async () => {
    const fetchBundle = vi
      .fn<ThemeBundleFetch>()
      .mockRejectedValue(Object.assign(new Error("gone"), { status: 503 }));
    const { store, time, warn } = setup(fetchBundle);

    await store.get("sport");
    time.advance(5);
    await store.get("sport");
    time.advance(5);
    await store.get("sport");

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain("sport");
    expect(warn.mock.calls[0]?.[0]).toContain("503");
  });

  it("names the instance catalog rather than a slug when there is none", async () => {
    const fetchBundle = vi
      .fn<ThemeBundleFetch>()
      .mockRejectedValue(Object.assign(new Error("gone"), { status: 503 }));
    const { store, warn } = setup(fetchBundle);

    await store.get(null);

    expect(warn.mock.calls[0]?.[0]).toContain("instance");
  });

  it("starts a new series when the failure changes", async () => {
    const fetchBundle = vi
      .fn<ThemeBundleFetch>()
      .mockRejectedValueOnce(Object.assign(new Error("gone"), { status: 503 }))
      .mockRejectedValueOnce(Object.assign(new Error("nope"), { status: 401 }));
    const { store, time, warn } = setup(fetchBundle);

    await store.get(null);
    time.advance(5);
    await store.get(null);

    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("warns again after the backend has recovered in between", async () => {
    const fetchBundle = vi
      .fn<ThemeBundleFetch>()
      .mockRejectedValueOnce(Object.assign(new Error("gone"), { status: 503 }))
      .mockResolvedValueOnce({
        status: "modified",
        bundle: { name: "portal" },
        etag: "v1",
      })
      .mockRejectedValueOnce(Object.assign(new Error("gone"), { status: 503 }));
    const { store, time, warn } = setup(fetchBundle);

    await store.get(null);
    time.advance(5);
    await store.get(null);
    time.advance(5);
    await store.get(null);

    expect(warn).toHaveBeenCalledTimes(2);
  });
});
