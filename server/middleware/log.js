export default defineEventHandler((event) => {
    const url = getRequestURL(event);
    console.log(`[nitro] ${event.method} ${url.pathname}`);
});