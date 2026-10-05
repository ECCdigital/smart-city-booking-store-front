import { describe, expect, it, vi } from "vitest";
import { createPinia, defineStore } from "pinia";
import { createPersistedState } from "pinia-plugin-persistedstate";
import { createApp, nextTick } from "vue";

// `stores/tenant.js` relies on Nuxt's auto-imported `defineStore`.
vi.stubGlobal("defineStore", defineStore);

const KEY = "tenant-store";

/** A Web Storage stand-in that keeps its entries in memory. */
function memoryStorage(entries = {}) {
  const items = new Map(Object.entries(entries));
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: (key) => items.delete(key),
  };
}

/**
 * What earlier releases left in Local Storage: the whole tenant store, the
 * tenant list with its contacts included.
 */
const FULL_STORE_ENTRY = JSON.stringify({
  initialized: true,
  tenants: [
    {
      id: "stadtbibliothek",
      name: "Stadtbibliothek",
      contactName: "Erika Mustermann",
      mail: "bibliothek@example.org",
      phone: "+49 30 1234567",
    },
  ],
  unlistedTenants: [{ id: "sportverein", name: "Sportverein" }],
  loadedFor: "stadtbibliothek",
  currentTenantID: "stadtbibliothek",
});

/**
 * Starts the tenant store the way the client plugin does: a fresh pinia with
 * the persisted-state plugin, here writing to the given storage.
 */
async function startTenantStore(storage) {
  const pinia = createPinia();
  pinia.use(createPersistedState({ storage }));
  // Pinia applies plugins only once it is installed into an app.
  createApp({}).use(pinia);
  const { useTenantStore } = await import("~~/stores/tenant.js");
  return useTenantStore(pinia);
}

describe("tenant store persistence", () => {
  it("restores the chosen tenant from an entry holding the whole store, but not the tenant lists", async () => {
    const store = await startTenantStore(
      memoryStorage({ [KEY]: FULL_STORE_ENTRY }),
    );

    expect(store.currentTenantID).toBe("stadtbibliothek");
    expect(store.tenants).toEqual([]);
    expect(store.unlistedTenants).toEqual([]);
    expect(store.initialized).toBe(false);
  });

  it("leaves only the chosen tenant in storage once the store has started", async () => {
    const storage = memoryStorage({ [KEY]: FULL_STORE_ENTRY });

    await startTenantStore(storage);

    expect(JSON.parse(storage.getItem(KEY))).toEqual({
      currentTenantID: "stadtbibliothek",
    });
  });

  it("keeps the tenant list out of storage when it changes later", async () => {
    const storage = memoryStorage({ [KEY]: FULL_STORE_ENTRY });
    const store = await startTenantStore(storage);

    store.tenants = [{ id: "musikschule", name: "Musikschule" }];
    store.initialized = true;
    await nextTick();

    expect(JSON.parse(storage.getItem(KEY))).toEqual({
      currentTenantID: "stadtbibliothek",
    });
  });

  it("remembers a newly chosen tenant", async () => {
    const storage = memoryStorage();
    const store = await startTenantStore(storage);

    store.setCurrentTenantID("musikschule");
    await nextTick();

    expect(JSON.parse(storage.getItem(KEY))).toEqual({
      currentTenantID: "musikschule",
    });
    expect((await startTenantStore(storage)).currentTenantID).toBe(
      "musikschule",
    );
  });
});
