export default defineEventHandler(async (event) => {
    const primary = '#ff8b00'
    const secondary = '#1d9ecc'

    console.log('Fetching default theme CSS...')

    // Asynchronität simulieren (z. B. API-Call)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setHeader(event, 'Content-Type', 'text/css')
    return `
    :root {
      --ui-primary: ${primary};
      --ui-secondary: ${secondary};
    }
  `
})