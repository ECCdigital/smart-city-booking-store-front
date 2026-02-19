// middleware/user-redirect.ts
export default defineNuxtRouteMiddleware((to) => {
    if (to.path === '/user' || to.path === '/user/') {
        return navigateTo('/user/bookings')
    }
})
