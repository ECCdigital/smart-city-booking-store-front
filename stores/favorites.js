import { useFavorites } from "~/composables/api/useFavorites.js";
import { favoriteKey } from "~/composables/favorites/favoriteReference.js";

// The one fetch of the session in flight, so a page full of cards that all
// ask for the list on mount triggers a single request.
let inflight = null;

/**
 * The references of the signed-in user's favorites: loaded once per session,
 * updated from the answer of every write, never reloaded per card.
 */
export const useFavoritesStore = defineStore("favorites", {
  state: () => ({
    initialized: false,
    references: [],
    // Keys of the references a write is on its way for.
    pending: [],
  }),
  getters: {
    keys: (state) => new Set(state.references.map(favoriteKey)),
    isFavorite() {
      return (reference) => this.keys.has(favoriteKey(reference));
    },
    isPending: (state) => (reference) =>
      state.pending.includes(favoriteKey(reference)),
  },
  actions: {
    async fetchFavorites({ force = false } = {}) {
      if (import.meta.server) return this.references;
      if (this.initialized && !force) return this.references;
      if (inflight) return inflight;

      const { fetchFavorites } = useFavorites();
      inflight = (async () => {
        try {
          this.references = await fetchFavorites();
          this.initialized = true;
        } catch (error) {
          console.error("Error fetching favorites:", error);
          this.references = [];
        } finally {
          inflight = null;
        }
        return this.references;
      })();
      return inflight;
    },

    /**
     * Marks the offer. The heart fills at once; the reference the backend
     * answers replaces the provisional one, and a refused write takes the
     * mark back and rethrows so the caller can tell the user why.
     */
    async mark(reference) {
      const key = favoriteKey(reference);
      if (this.keys.has(key) || this.pending.includes(key)) return;

      const { markFavorite } = useFavorites();
      this.pending.push(key);
      this.references = [{ ...reference }, ...this.references];
      try {
        const favorite = await markFavorite(reference);
        this.references = this.references.map((entry) =>
          favoriteKey(entry) === key ? referenceFrom(favorite, reference) : entry,
        );
      } catch (error) {
        this.references = this.references.filter(
          (entry) => favoriteKey(entry) !== key,
        );
        throw error;
      } finally {
        this.pending = this.pending.filter((entry) => entry !== key);
      }
    },

    /** Removes the mark. Idempotent on the backend, so a failure only restores it. */
    async unmark(reference) {
      const key = favoriteKey(reference);
      if (this.pending.includes(key)) return;
      const removed = this.references.find((entry) => favoriteKey(entry) === key);
      if (!removed) return;

      const { removeFavorite } = useFavorites();
      this.pending.push(key);
      this.references = this.references.filter(
        (entry) => favoriteKey(entry) !== key,
      );
      try {
        await removeFavorite(reference);
      } catch (error) {
        this.references = [removed, ...this.references];
        throw error;
      } finally {
        this.pending = this.pending.filter((entry) => entry !== key);
      }
    },
  },
});

function referenceFrom(favorite, fallback) {
  return {
    tenantId: favorite?.tenantId ?? fallback.tenantId,
    targetType: favorite?.targetType ?? fallback.targetType,
    targetId: favorite?.targetId ?? fallback.targetId,
    created: favorite?.created ?? fallback.created ?? new Date().toISOString(),
  };
}
