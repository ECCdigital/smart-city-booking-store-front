import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue";

// What `useFetch` returns from Nuxt 4.5 on: a promise that resolves to the
// async data, carrying the same fields and an own, enumerable then/catch/finally.
function nuxtFetchResult(payload: unknown) {
  const fields = { data: ref(payload), pending: ref(false), error: ref(null) };
  const promise = Promise.resolve().then(() => fields);
  Object.assign(promise, fields);
  Object.defineProperties(promise, {
    then: { enumerable: true, value: promise.then.bind(promise) },
    catch: { enumerable: true, value: promise.catch.bind(promise) },
    finally: { enumerable: true, value: promise.finally.bind(promise) },
  });
  return promise as typeof promise & typeof fields;
}

const stored = { etag: "abc 1", portalName: "Gespeichert" };
const states = new Map<string, ReturnType<typeof ref>>();

vi.stubGlobal("computed", computed);
vi.stubGlobal("useFetch", () => nuxtFetchResult(stored));
vi.stubGlobal("useState", (key: string, init: () => unknown) => {
  if (!states.has(key)) states.set(key, ref(init()));
  return states.get(key);
});

const { useThemeBundle, useHeroPreviewOverride } =
  await import("~/composables/useThemeBundle");

describe("useThemeBundle, awaited as during server rendering", () => {
  beforeEach(() => states.clear());

  it("keeps the version of the stored bundle", async () => {
    const { version } = await useThemeBundle();
    expect(version.value).toBe("?v=abc%201");
  });

  it("prefers the Live Preview's Draft in data", async () => {
    useHeroPreviewOverride().value = { portalName: "Entwurf" } as never;
    const { data } = await useThemeBundle();
    expect(data.value).toEqual({ portalName: "Entwurf" });
  });

  it("serves the stored bundle in data without a Draft", async () => {
    const { data } = await useThemeBundle();
    expect(data.value).toEqual(stored);
  });
});

describe("useThemeBundle, not awaited", () => {
  beforeEach(() => states.clear());

  it("carries data and version right away", () => {
    const { data, version } = useThemeBundle();
    expect(data.value).toEqual(stored);
    expect(version.value).toBe("?v=abc%201");
  });
});
