import {useWindowSize} from "@vueuse/core";

export function useBreakpointCheck(){
    
    const isGreaterThanSm = computed(() => {
        const { width } = useWindowSize();
        return width.value >= 640
    });
    
    return { isGreaterThanSm }; 
}