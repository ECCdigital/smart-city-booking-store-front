export default defineEventHandler(async (event) => {
    deleteCookie(event, 'access-token')
    deleteCookie(event, 'refresh-token')

    return { success: true }
})