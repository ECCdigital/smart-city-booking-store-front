import { describe, expect, it } from "vitest";

import { loadCheckoutAddons } from "~/utils/checkoutAddons.js";

function notFound() {
  return Object.assign(new Error("Not found"), { statusCode: 404 });
}

function stubFetch(answers) {
  const calls = [];
  const fetchAddon = async (id) => {
    calls.push(id);
    const answer = answers[id];
    if (answer instanceof Error) throw answer;
    return answer;
  };
  return { fetchAddon, calls };
}

const B = { id: "B", name: "Flutlicht" };
const C = { id: "C", name: "Umkleide" };

describe("loading the add-ons of a checkout", () => {
  it("leaves out an optional add-on the backend no longer has", async () => {
    const { fetchAddon } = stubFetch({ B: notFound(), C });

    const addons = await loadCheckoutAddons(
      [
        { bookableId: "B", mandatory: false },
        { bookableId: "C", mandatory: false },
      ],
      fetchAddon,
    );

    expect(addons).toEqual([{ item: C, mandatory: false }]);
  });

  it("keeps every add-on in the order of checkoutBookableIds", async () => {
    const { fetchAddon, calls } = stubFetch({ B, C });

    const addons = await loadCheckoutAddons(
      [
        { bookableId: "B", mandatory: false },
        { bookableId: "C", mandatory: true },
      ],
      fetchAddon,
    );

    expect(addons).toEqual([
      { item: B, mandatory: false },
      { item: C, mandatory: true },
    ]);
    expect(calls).toEqual(["B", "C"]);
  });

  it("returns an empty list without add-ons", async () => {
    const { fetchAddon, calls } = stubFetch({});

    expect(await loadCheckoutAddons(undefined, fetchAddon)).toEqual([]);
    expect(await loadCheckoutAddons(null, fetchAddon)).toEqual([]);
    expect(await loadCheckoutAddons([], fetchAddon)).toEqual([]);
    expect(calls).toEqual([]);
  });

  it("fails with the 404 when a mandatory add-on is missing", async () => {
    const missing = notFound();
    const { fetchAddon } = stubFetch({ B: missing });

    await expect(
      loadCheckoutAddons([{ bookableId: "B", mandatory: true }], fetchAddon),
    ).rejects.toBe(missing);
  });

  it("fails with any other error, also for an optional add-on", async () => {
    const serverError = Object.assign(new Error("Server error"), {
      statusCode: 500,
    });
    const networkError = new TypeError("fetch failed");

    await expect(
      loadCheckoutAddons(
        [{ bookableId: "B", mandatory: false }],
        stubFetch({ B: serverError }).fetchAddon,
      ),
    ).rejects.toBe(serverError);
    await expect(
      loadCheckoutAddons(
        [{ bookableId: "B", mandatory: false }],
        stubFetch({ B: networkError }).fetchAddon,
      ),
    ).rejects.toBe(networkError);
  });
});
