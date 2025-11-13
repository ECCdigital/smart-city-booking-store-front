export function useSanitizeHtml() {
    /**
     * Entfernt gefährliche Tags und Attribute aus HTML-Strings.
     * Funktioniert sowohl im Browser als auch bei SSR.
     */
    function sanitizeHtml(htmlString) {
        if (!htmlString) return ''

        try {
            // SSR: Wenn kein DOM verfügbar ist, einfach den String zurückgeben
            if (typeof window === 'undefined') {
               return htmlString;
            }

            const parser = new DOMParser()
            const doc = parser.parseFromString(htmlString, 'text/html')
            // Entferne <script> und <style>-Tags
            doc.querySelectorAll('script, style').forEach(el => el.remove())
            // Entferne gefährliche Attribute (z. B. onClick, javascript:)
            doc.querySelectorAll('*').forEach(el => {
                for (const attr of el.getAttributeNames()) {
                    const val = el.getAttribute(attr)
                    if (attr.startsWith('on') || (val && val.toLowerCase().includes('javascript:'))) {
                        el.removeAttribute(attr)
                    }
                }
            })

            return doc.body.innerHTML
        } catch (err) {
            console.error('[useSanitizeHtml] Error at Cleaning:', err)
            return htmlString
        }
    }

    return { sanitizeHtml }
}