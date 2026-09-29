export const navigationPresets = {
  user: [
    {
      value: null,
      labelKey: "navigation.activities",
    },
    {
      value: "/account/bookings",
      labelKey: "navigation.bookings",
      icon: "i-lucide-book-marked",
      disabled: false,
    },
    {
      value: "/mobile-key",
      labelKey: "navigation.keys",
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
      labelKey: "navigation.invoices",
      icon: "i-lucide-wallet-cards",
      disabled: false,
    },
    {
      value: null,
      labelKey: "navigation.account",
    },
    {
      value: "/account/settings",
      labelKey: "navigation.settings",
      icon: "i-lucide-user-round-pen",
      disabled: false,
    },
  ],
} as const;

export type NavigationPreset = keyof typeof navigationPresets;
