export type ThemePreference = "light" | "dark" | "system";

export interface ThemePreferenceOption {
  value: ThemePreference;
  label: string;
  icon: string;
}

export function useThemePreference() {
  const colorMode = useColorMode();

  const preference = computed({
    get: () => colorMode.preference as ThemePreference,
    set: (value: ThemePreference) => {
      colorMode.preference = value;
    },
  });

  const resolved = computed(() => colorMode.value);
  const isDark = computed(() => colorMode.value === "dark");
  const isSystem = computed(() => colorMode.preference === "system");

  const options: ThemePreferenceOption[] = [
    { value: "light", label: "Hell", icon: "i-lucide-sun" },
    { value: "dark", label: "Dunkel", icon: "i-lucide-moon" },
    { value: "system", label: "System", icon: "i-lucide-monitor" },
  ];

  const activeOption = computed(
    () => options.find((option) => option.value === preference.value) ?? options[2],
  );

  return { preference, resolved, isDark, isSystem, options, activeOption };
}
