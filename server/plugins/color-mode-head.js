// Colour mode now lives in a cookie so the server can SSR the right class.
// Visitors who already chose a mode in localStorage (the previous storage)
// would otherwise lose it on the first request, because the inline script
// only reads the cookie. Copy localStorage → cookie before that script runs,
// and move the script to the top of <head> so the class is applied before
// first paint even when the cookie is not yet on the request.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("render:html", (html) => {
    html.head.unshift(
      `<script>try{var k="nuxt-color-mode";var s=localStorage.getItem(k);if(s&&document.cookie.indexOf(k+"=")<0)document.cookie=k+"="+s+";path=/;max-age=31536000"}catch(e){}</script>`,
    );
    const i = html.head.findIndex(
      (h) => typeof h === "string" && h.includes("__NUXT_COLOR_MODE__"),
    );
    if (i > 0) {
      const [script] = html.head.splice(i, 1);
      html.head.splice(1, 0, script);
    }
  });
});
