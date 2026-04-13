export interface HeroConfig {
    height?: "sm" | "md" | "lg" | "xl";
    mobileHeight?: "sm" | "md" | "lg" | "xl";
    titleClass?: string;
    subtitleClass?: string;
    showOnMobile?: boolean;
    staticTitle?: string;
    staticSubtitle?: string;
}

const defaults: HeroConfig = {
    height: "sm",
    mobileHeight: "sm",
    titleClass: "text-sm md:text-md",
    subtitleClass: "text-xl md:text-3xl",
    showOnMobile: true,
};

export function useHeroConfig(): ComputedRef<HeroConfig> {
    const route = useRoute();

    return computed(() => ({
        ...defaults,
        ...(route.meta.hero as HeroConfig | undefined),
    }));
}