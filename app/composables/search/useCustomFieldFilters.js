import { computed } from "vue";

/**
 * Aggregiert Custom-Field-Definitionen aus allen Bookables (dedupliziert per id)
 * und sammelt die zugehörigen Werte für die Filter-UI.
 *
 * @param {Ref<Array>} bookables - Reaktive Liste von Wrappern ({ item, status })
 * @param {Object} options
 * @param {'sidebar'|'navigation'|'searchbar'} options.position
 */
export function useCustomFieldFilters(bookables, { position = "sidebar" } = {}) {
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
            const values = collectFieldValues(bookables.value, def.id);
            return {
                definition: def,
                filterType: def.usageOptions.catalogFilterType,
                meta: buildMeta(def, values),
            };
        });
    });

    return { definitions, aggregated };
}

function collectFieldValues(wrappers, fieldId) {
    const values = [];
    for (const w of wrappers || []) {
        const v = getCustomFieldValue(w?.item, fieldId);
        if (v === undefined || v === null || v === "") continue;
        values.push(v);
    }
    return values;
}

function buildMeta(def, values) {
    const type = def.usageOptions.catalogFilterType;

    if (type === "select") {
        const counts = values.reduce((acc, v) => {
            acc[v] = (acc[v] || 0) + 1;
            return acc;
        }, {});

        let options;

        if (def.inputType === "string" || def.inputType === "text" || def.inputType === "numeric" || def.inputType === "boolean") {
            options = Object.entries(counts)
                .map(([value, count]) => ({
                    value,
                    label: value,
                    count,
                }))
                .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
        } else {
            options = (def.options || []).map((opt) => ({
                value: opt.value,
                label: opt.caption,
                count: counts[opt.value] || 0,
            }));
        }

        return { options };
    }

    if (type === "slider" || type === "range") {
        const numeric = values.map(Number).filter((n) => !Number.isNaN(n));

        if (numeric.length === 0) {
            return {
                min: 0,
                max: 0,
                step: 1,
                values: type === "range" ? [0, 0] : 0,
            };
        }

        const min = Math.floor(Math.min(...numeric));
        const max = Math.ceil(Math.max(...numeric));
        const step = computeStep(min, max);

        return {
            min,
            max,
            step,
            values: type === "range" ? [min, max] : max,
        };
    }

    if (type === "checkbox") {
        const trueCount = values.filter((v) => v === true || v === "true").length;
        return { trueCount };
    }

    return {};
}

function computeStep(min, max) {
    const range = max - min;
    if (range <= 0) return 1;

    let step = Math.ceil(range / 20);

    if (range >= 20) {
        step = Math.max(5, Math.ceil(step / 5) * 5);
    }

    return step;
}

export function getCustomFieldValue(item, fieldId) {
    const entry = item?.customFieldValues?.find((v) => v.fieldId === fieldId);
    return entry?.value;
}