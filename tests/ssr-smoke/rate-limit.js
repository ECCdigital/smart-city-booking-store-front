// The rate limit of nuxt-security in the built server (ECCdigital/tickets#555).
// Runs after the pages, on the same server. The limiter counts per address,
// which it reads from `X-Forwarded-For`, so each check sends one of its own
// and starts with a full budget: 500 requests in 5 minutes.
//
// What a page loads besides itself and the API does not count against that
// budget: the build's own files, the messages, and the theme's stylesheet,
// font and favicon. Images and icons have a budget of their own.

const LIMIT = 500;
const PROXY_LIMIT = 2000;

// Cold page views from one address within the interval: ten people opening
// four pages each.
const VIEWS = 40;

/** A request from `address`, answered with its status and body. */
async function request(base, path, address, headers = {}) {
  const res = await fetch(base + path, {
    headers: { "x-forwarded-for": address, accept: "text/html", ...headers },
    redirect: "manual",
  });
  return { status: res.status, html: await res.text() };
}

/**
 * Asks for `path` from `address` up to `requests` times and answers how many
 * got through before the first 429, or null when none was refused.
 */
async function passedBefore429(base, path, address, requests) {
  for (let n = 0; n < requests; n++) {
    if ((await request(base, path, address)).status === 429) return n;
  }
  return null;
}

/** The files of a page that do not change until the next deploy or bundle. */
function staticFiles(html) {
  const chunk = html.match(/"(\/_nuxt\/[^"]+\.js)"/)?.[1];
  const version = html.match(/\/api\/theme\/css\?v=([^"&]+)/)?.[1];
  return [
    chunk,
    "/fonts/inter/inter-5.3.0-latin-wght-normal.woff2",
    "/favicon.ico",
    "/wasm/zxing_reader.wasm",
    "/_i18n/smoke/de/messages.json",
    `/api/theme/css?v=${version}`,
    `/api/theme/font?v=${version}`,
    `/api/theme/favicon?v=${version}`,
  ].filter(Boolean);
}

const ICONS = "/api/_nuxt_icon/lucide.json?icons=search";

/** The images of a page, all through the image proxy. */
function images(html) {
  return [...html.matchAll(/<img\b[^>]*\bsrc="(\/api\/img\?[^"]+)"/g)].map(
    ([, src]) => src.replaceAll("&amp;", "&"),
  );
}

/**
 * What is wrong with the rate limit, one line per problem.
 *
 * @param {string} base - The storefront's address.
 * @param {string[]} pages - The pages to view.
 * @param {{ hits: Map<string, number> }} backend - The backend stand-in.
 * @returns {Promise<string[]>}
 */
export async function rateLimitProblems(base, pages, backend) {
  const problems = [];
  const report = (name, problem) => {
    console.log(`${problem ? "FAIL" : "ok  "} rate limit: ${name}`);
    if (problem) problems.push(`rate limit, ${name}: ${problem}`);
  };

  const home = await (await fetch(base + "/")).text();
  const image = images(home)[0];
  if (!image) report("images", "no image on /");

  // More visitors than the limit allows, each from an address of its own,
  // open a page. Each render asks the backend who is signed in: the server's
  // own requests during a render share no budget across visitors.
  {
    const visitors = LIMIT + 11;
    const before = backend.hits.get("/auth/me") ?? 0;
    for (let i = 0; i < visitors; i++) {
      const address = `198.51.${Math.floor(i / 250)}.${i % 250}`;
      await request(base, "/", address, { cookie: "access-token=smoke" });
    }
    const asked = (backend.hits.get("/auth/me") ?? 0) - before;
    report(
      `${visitors} visitors share no budget`,
      asked < visitors && `the backend was asked ${asked} times`,
    );
  }

  // Each file more often than the limit allows, from an address of its own,
  // then the page from that address: it still answers.
  const uncounted = [...staticFiles(home), ICONS, image].filter(Boolean);
  for (const [i, path] of uncounted.entries()) {
    const address = `203.0.113.${i + 1}`;
    const passed = await passedBefore429(base, path, address, LIMIT + 1);
    const page = await request(base, "/", address);
    report(
      `${path.split("?")[0]} does not count against the pages`,
      passed !== null
        ? `429 after ${passed} requests`
        : page.status !== 200 && `the page answered ${page.status} afterwards`,
    );
  }

  // Several people behind one address, as in an office or a school, open the
  // storefront with an empty cache: each page, then what the browser fetches
  // for it.
  {
    const address = "203.0.113.100";
    const refused = async () => {
      for (let view = 0; view < VIEWS; view++) {
        const page = pages[view % pages.length];
        const { status, html } = await request(base, page, address);
        if (status === 429) return page;
        for (const path of [...staticFiles(html), ICONS, ...images(html)]) {
          if ((await request(base, path, address)).status === 429) {
            return `${path} of ${page}`;
          }
        }
      }
    };
    const limited = await refused();
    report(
      `${VIEWS} cold page views from one address`,
      limited && `${limited} answered 429`,
    );
  }

  // The API, the images and the icons stay limited, each with its own budget.
  for (const [path, budget, address] of [
    ["/api/catalog/mode", LIMIT, "203.0.113.200"],
    [image, PROXY_LIMIT, "203.0.113.201"],
    [ICONS, PROXY_LIMIT, "203.0.113.202"],
  ]) {
    if (!path) continue;
    const passed = await passedBefore429(base, path, address, budget + 2);
    report(
      `${path.split("?")[0]} stays limited to ${budget}`,
      passed === null
        ? `no 429 after ${budget + 2} requests`
        : passed < budget && `429 after ${passed} requests`,
    );
  }

  // A page from an address that has used up its budget says so, in the
  // storefront's own error page.
  {
    const address = "203.0.113.210";
    await passedBefore429(base, "/api/catalog/mode", address, LIMIT + 2);
    const { status, html } = await request(base, "/", address);
    report(
      "a limited page shows a hint",
      status !== 429
        ? `answered ${status}`
        : !html.includes(">Zu viele Anfragen<") &&
            `no hint: ${html.includes("Too Many Requests") ? "Nuxt's fallback page" : "other page"}`,
    );
  }

  // The server's own requests go unlimited because they carry no address.
  // A request with an empty `X-Forwarded-For` is counted by its connection.
  {
    const passed = await passedBefore429(base, "/api/catalog/mode", "", LIMIT + 2);
    report(
      "an empty X-Forwarded-For stays limited",
      passed === null && `no 429 after ${LIMIT + 2} requests`,
    );
  }

  return problems;
}
