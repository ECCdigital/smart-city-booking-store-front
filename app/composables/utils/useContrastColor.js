export function useContrastColor() {
    const primaryColor = computed(() => {
        if(document){
            const root = document.documentElement;
            return getComputedStyle(root).getPropertyValue('--color-primary').trim()
        }
        return "";
    });
    const secondaryColor = computed(() => {
        if(document){
            const root = document.documentElement;
            return getComputedStyle(root).getPropertyValue('--color-secondary').trim()
        }
        return "";
    });

    const contrastToPrimary = () => {
        return getContrastColor(primaryColor.value);
    };

    const contrastToSecondary = () => {
        return getContrastColor(secondaryColor.value);
    };
    const lighterColor = () => getLighterColor(primaryColor.value, secondaryColor.value);
    const darkerColor = () => getDarkerColor(primaryColor.value, secondaryColor.value);

    function getContrastColor(hex) {
        // luminance check
        if (hex) {
            const c = hex.substring(1);
            const rgb = parseInt(c, 16);
            const r = (rgb >> 16) & 0xff;
            const g = (rgb >> 8) & 0xff;
            const b = (rgb >> 0) & 0xff;
            const luma = 0.299 * r + 0.587 * g + 0.114 * b;
            return luma > 180 ? "#000000" : "#ffffff";
        }
        return "";
    }
    function hexToRgb(hex) {
        const cleanHex = hex.replace('#', '');
        const bigint = parseInt(cleanHex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return { r, g, b };
    }
    function getLuminance(hexColor) {
        const { r, g, b } = hexToRgb(hexColor);
        const [R, G, B] = [r, g, b].map(v => {
            const val = v / 255;
            return val <= 0.03928
                ? val / 12.92
                : Math.pow((val + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    }

    function getLighterColor(color1, color2) {
        const l1 = getLuminance(color1);
        const l2 = getLuminance(color2);
        return l1 > l2 ? color1 : color2;
    }
    function getDarkerColor(color1, color2) {
        const l1 = getLuminance(color1);
        const l2 = getLuminance(color2);
        return l1 < l2 ? color1 : color2;
    }

    return { contrastToPrimary, contrastToSecondary, lighterColor, darkerColor };
}
