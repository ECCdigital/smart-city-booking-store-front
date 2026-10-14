// The rate limit of nuxt-security in the built server (ECCdigital/tickets#555).
// Runs after the pages, on the same server. The limiter counts per address,
// which it reads from `X-Forwarded-For`, so each check sends one of its own
// and starts with a full budget: 500 requests in 5 minutes.
//
// Files that never change between deploys do not count against the limit:
// the build's own files, the messages, icons, theme stylesheet, font and
// favicon.

const LIMIT = 500;
const IMAGE_LIMIT = 2000;

/** A request from `address`, answered with its status. */
async function status(base, path, address) {
  const res = await fetch(base + path, {
    headers: { "x-forwarded-for": address, accept: "text/html" },
    redirect: "manual",
  });
  await res.arrayBuffer();
  return res.status;
}

/** The files of a page that never change between deploys. */
function staticFiles(html) {
  const chunk = html.match(/"(\/_nuxt\/[^"]+\.js)"/)?.[1];
  const version = html.match(/\/api\/theme\/css\?v=([^"&]+)/)?.[1];
  return [
    chunk,
    "/fonts/inter/inter-5.3.0-latin-wght-normal.woff2",
    "/favicon.ico",
    "/wasm/zxing_reader.wasm",
    "/_i18n/smoke/de/messages.json",
    "/api/_nuxt_icon/lucide.json?icons=search",
    `/api/theme/css?v=${version}`,
    `/api/theme/font?v=${version}`,
    `/api/theme/favicon?v=${version}`,
  ].filter(Boolean);
}

/** The images of a page, all through the image proxy. */
function images(html) {
  return [...html.matchAll(/<img\b[^>]*\bsrc="(\/api\/img\?[^"]+)"/g)].map(
    ([, src]) => src.replaceAll("&amp;", "&"),
  );
}

// Cold page views from one address within the interval: ten people opening
// four pages each.
const VIEWS = 40;

/**
 * What is wrong with the rate limit, one line per problem.
 *
 * @param {string} base - The storefront's address.
 * @param {string[]} pages - The pages to view.
 * @returns {Promise<string[]>}
 */
export async function rateLimitProblems(base, pages) {
  const problems = [];
  const report = (name, problem) => {
    console.log(`${problem ? "FAIL" : "ok  "} rate limit: ${name}`);
    if (problem) problems.push(`rate limit, ${name}: ${problem}`);
  };

  const home = await (await fetch(base + "/")).text();

  // Each file more often than the limit allows, from an address of its own,
  // then the page from that address: it still answers.
  for (const [i, path] of staticFiles(home).entries()) {
    const address = `203.0.113.${i + 1}`;
    let limited = false;
    for (let n = 0; n <= LIMIT && !limited; n++) {
      limited = (await status(base, path, address)) === 429;
    }
    const page = await status(base, "/", address);
    report(
      `${path} does not count`,
      limited
        ? "answered 429"
        : page !== 200
          ? `the page answered ${page} afterwards`
          : undefined,
    );
  }

  // More images than the limit allows, then the page from the same address:
  // images have a budget of their own.
  {
    const address = "203.0.113.50";
    const image = images(home)[0];
    let limited = false;
    for (let n = 0; n <= LIMIT && !limited; n++) {
      limited = (await status(base, image, address)) === 429;
    }
    const page = await status(base, "/", address);
    report(
      "images do not count against the limit of the pages",
      limited
        ? "an image answered 429"
        : page !== 200
          ? `the page answered ${page} afterwards`
          : undefined,
    );
  }

  // Several people behind one address, as in an office or a school, open the
  // storefront with an empty cache: each page, then what the browser fetches
  // for it. Images have a budget of their own.
  {
    const address = "203.0.113.100";
    let limited;
    for (let view = 0; view < VIEWS && !limited; view++) {
      const page = pages[view % pages.length];
      const res = await fetch(base + page, {
        headers: { "x-forwarded-for": address, accept: "text/html" },
      });
      const html = await res.text();
      if (res.status === 429) {
        limited = page;
        break;
      }
      for (const path of [...staticFiles(html), ...images(html)]) {
        if ((await status(base, path, address)) === 429) {
          limited = `${path} of ${page}`;
          break;
        }
      }
    }
    report(
      `${VIEWS} cold page views from one address`,
      limited && `${limited} answered 429`,
    );
  }

  // The API and the image proxy stay limited, each with its own budget.
  for (const [path, budget, address] of [
    ["/api/catalog/mode", LIMIT, "203.0.113.200"],
    [images(home)[0], IMAGE_LIMIT, "203.0.113.201"],
  ]) {
    const answered = [];
    for (let n = 0; n <= budget + 1; n++) {
      answered.push(await status(base, path, address));
    }
    const first = answered.indexOf(429);
    report(
      `${path.split("?")[0]} stays limited to ${budget}`,
      first === -1
        ? `no 429 after ${answered.length} requests`
        : first < budget
          ? `429 after ${first} requests`
          : undefined,
    );
  }

  // A page from an address that has used up its budget says so, in the
  // storefront's own error page.
  {
    const res = await fetch(base + "/", {
      headers: { "x-forwarded-for": "203.0.113.200", accept: "text/html" },
    });
    const html = await res.text();
    report(
      "a limited page shows a hint",
      res.status !== 429
        ? `answered ${res.status}`
        : !html.includes(">Zu viele Anfragen<")
          ? `no hint: ${html.includes("Too Many Requests") ? "Nuxt's fallback page" : "other page"}`
          : undefined,
    );
  }

  return problems;
}
