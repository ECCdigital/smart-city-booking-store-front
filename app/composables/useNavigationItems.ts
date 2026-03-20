export const navigationPresets = {
  user: [
    {
      value: "/account/bookings",
      label: "Buchungen",
      icon: "i-lucide-book-marked",
      disabled: false,
    },
    {
      value: "/account/keys",
      label: "Schlüssel",
      icon: "i-lucide-key-round",
      disabled: false,
    },
    {
      value: "/account/invoices",
      label: "Rechnungen",
      icon: "i-lucide-wallet-cards",
      disabled: true,
    },
    {
      value: "/account/favorites",
      label: "Favoriten",
      icon: "i-lucide-book-heart",
      disabled: true,
    },
  ],
  settings: [
    {
      value: "/account/settings",
      label: "Persönliche Daten",
      icon: "i-lucide-user-round-pen",
      disabled: false,
    },
    {
      value: "/account/settings/appearance",
      label: "Darstellung",
      icon: "i-lucide-paintbrush",
      disabled: false,
    },
  ],
} as const;

export type NavigationPreset = keyof typeof navigationPresets;
