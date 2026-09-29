import { computed } from "vue";
import { computeSliderStep } from "~/utils/sliderStep";

/**
 * Aggregates the custom field definitions of all bookables (deduplicated by
 * id) and collects their values for the filter UI.
 *
 * The option list and the slider bounds come from `bookables`, so they stay
 * put while the user filters. The counts and histogram bars come from the
 * wrappers `facetItems(fieldId)` returns for that field, which lets a caller
 * count against the results the other filters leave over. Without
 * `facetItems`, counts and bars come from `bookables` too.
 *
 * @param {Ref<Array>} bookables - Reactive list of wrappers ({ item, matchStatus })
 * @param {Object} options
 * @param {'sidebar'|'navigation'|'searchbar'} options.position
 * @param {(fieldId: string) => Array} [options.facetItems]
 */
export function useCustomFieldFilters(
  bookables,
  { position = "sidebar", facetItems = null } = {},
) {
  const definitions = computed(() => {
    const map = new Map();

    for (const wrapper of bookables.value || []) {
      const fields = wrapper?.item?.customFields || [];

      for (const field of fields) {
        const usage = field?.usageOptions;
        if (!usage) continue;
        if (usage.context !== "catalog") continue;
        if (!usage.catalogFilterType) continue;
        if (usage.catalogFilterPosition !== position) continue;

        if (!map.has(field.id)) {
          map.set(field.id, field);
        }
      }
    }

    return Array.from(map.values());
  });

  const aggregated = computed(() => {
    return definitions.value.map((def) => {
      const allValues = collectFieldValues(bookables.value, def.id);
      const facetValues = facetItems
        ? collectFieldValues(facetItems(def.id), def.id)
        : allValues;
      return {
        definition: def,
        filterType: def.usageOptions.catalogFilterType,
        meta: buildMeta(def, allValues, facetValues),
      };
    });
  });

  return { definitions, aggregated };
}

function collectFieldValues(wrappers, fieldId) {
  const values = [];
  for (const w of wrappers || []) {
    values.push(
      ...scalarCustomFieldValues(getCustomFieldValue(w?.item, fieldId)),
    );
  }
  return values;
}

/**
 * Turns a stored custom-field value into the scalars the filter counts.
 * A `multiselect` stores an array of option values; each selected option
 * is one occurrence. Empty / missing values yield nothing.
 */
export function scalarCustomFieldValues(value) {
  if (value === undefined || value === null || value === "") return [];
  const list = Array.isArray(value) ? value : [value];
  return list.filter((item) => item !== undefined && item !== null && item !== "");
}

function countValues(values) {
  return values.reduce((acc, v) => {
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});
}

/**
 * @param def - the field definition
 * @param allValues - values of every bookable; sets the options and bounds
 * @param facetValues - values of the facet base; sets the counts and bars
 */
function buildMeta(def, allValues, facetValues) {
  const filterType = def.usageOptions.catalogFilterType;

  if (filterType === "select") {
    const allCounts = countValues(allValues);
    const facetCounts = countValues(facetValues);

    let options;

    if (
      def.inputType === "string" ||
      def.inputType === "text" ||
      def.inputType === "numeric" ||
      def.inputType === "boolean"
    ) {
      options = Object.entries(allCounts)
        .sort(([a, ac], [b, bc]) => bc - ac || a.localeCompare(b))
        .map(([value]) => ({
          value,
          label: value,
          count: facetCounts[value] || 0,
        }));
    } else {
      options = (def.options || []).map((opt) => ({
        value: opt.value,
        label: opt.caption,
        count: facetCounts[opt.value] || 0,
      }));
    }

    return { options };
  }

  if (filterType === "slider" || filterType === "range") {
    if (def.inputType === "select") {
      const mappedValues = facetValues.map((v) => {
        const index = def.options?.findIndex((opt) => opt.value === v);
        return index !== -1 ? index + 1 : null;
      });

      return {
        min: 1,
        max: def.options.length || 1,
        step: 1,
        values:
          filterType === "range"
            ? [1, def.options.length || 1]
            : def.options.length,
        bars: mappedValues,
      };
    }

    const numeric = allValues.map(Number).filter((n) => !Number.isNaN(n));

    if (numeric.length === 0) {
      return {
        min: 0,
        max: 0,
        step: 1,
        values: filterType === "range" ? [0, 0] : 0,
        bars: facetValues,
      };
    }

    const min = Math.floor(Math.min(...numeric));
    const max = Math.ceil(Math.max(...numeric));
    const step = computeSliderStep(min, max);

    return {
      min,
      max,
      step,
      values: filterType === "range" ? [min, max] : max,
      bars: facetValues,
    };
  }

  if (filterType === "checkbox") {
    const trueCount = facetValues.filter(
      (v) => v === true || v === "true",
    ).length;
    return { trueCount };
  }

  return {};
}

export function getCustomFieldValue(item, fieldId) {
  const entry = item?.customFieldValues?.find((v) => v.fieldId === fieldId);
  return entry?.value;
}
