export const navigationPresets = {
  user: [
    {
      value: null,
      label: "Aktivitäten",
    },
    {
      value: "/account/bookings",
      label: "Buchungen",
      icon: "i-lucide-book-marked",
      disabled: false,
    },
    {
      value: "/mobile-key",
      label: "Schlüssel",
      icon: "i-lucide-key-round",
      disabled: false,
    },

    /*{
      value: "/account/favorites",
      label: "Favoriten",
      icon: "i-lucide-book-heart",
      disabled: true,
    },*/
    {
      value: "/account/invoices",
      label: "Rechnungen",
      icon: "i-lucide-wallet-cards",
      disabled: false,
    },
    {
      value: null,
      label: "Benutzerkonto",
    },
    {
      value: "/account/settings",
      label: "Einstellungen",
      icon: "i-lucide-user-round-pen",
      disabled: false,
    },
  ],
} as const;

export type NavigationPreset = keyof typeof navigationPresets;
