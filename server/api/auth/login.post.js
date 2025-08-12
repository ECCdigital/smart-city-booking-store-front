export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event);

  const apiRes = await fetch("https://deine-api.com/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!apiRes.ok) {
    return { success: false, message: "Ungültige Login-Daten" };
  }

  const setCookieHeader = apiRes.headers.get("set-cookie");
  if (setCookieHeader) {
    setCookie(event, "session", setCookieHeader.split(";")[0].split("=")[1], {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  }

  return { success: true };
});
