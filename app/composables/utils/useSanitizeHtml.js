import { parseDocument } from "htmlparser2";
import render from "dom-serializer";

export function useSanitizeHtml() {
    function sanitizeHtml(htmlString) {
        if (!htmlString) return "";

        try {
            const doc = parseDocument(htmlString);

            removeDangerousNodes(doc);

            return render(doc);
        } catch (err) {
            console.error("[useSanitizeHtml] Error at Cleaning:", err);
            return "";
        }
    }

    function removeDangerousNodes(node) {
        if (!node.children) return;

        node.children = node.children.filter((child) => {
            if (child.type === "tag" || child.type === "script") {
                const name = child.name?.toLowerCase();
                if (name === "script" || name === "style") {
                    return false;
                }

                if (child.attribs) {
                    for (const attr of Object.keys(child.attribs)) {
                        const val = child.attribs[attr];
                        if (
                            attr.startsWith("on") ||
                            (val && val.toLowerCase().includes("javascript:"))
                        ) {
                            delete child.attribs[attr];
                        }
                    }
                }

                removeDangerousNodes(child);
            }

            return true;
        });
    }

    return { sanitizeHtml };
}