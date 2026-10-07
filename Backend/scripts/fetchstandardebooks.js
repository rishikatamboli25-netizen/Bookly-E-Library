import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";

// ============================================================
// PATH SETUP
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, "../data");

const OUTPUT_FILE = path.join(
  OUTPUT_DIR,
  "standardEbooksBooks.json"
);

const REJECTION_FILE = path.join(
  OUTPUT_DIR,
  "standardEbooksRejectedBooks.json"
);

// ============================================================
// CONFIG
// ============================================================

// Keep 3 for testing.
// Once test passes, change to 60.
const MAX_BOOKS = 60;

const BOOKS_PER_PAGE = 48;

const BROWSE_URL =
  "https://standardebooks.org/ebooks";

const GITHUB_RAW =
  "https://raw.githubusercontent.com";

const GITHUB_ORG =
  "standardebooks";

const REQUEST_DELAY = 250;

const MAX_RETRIES = 3;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/154.0.0.0 Safari/537.36";

const EPUB_ACCEPT =
  "application/epub+zip,application/octet-stream;q=0.9,*/*;q=0.1";

// ============================================================
// HELPERS
// ============================================================

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function cleanText(value) {
  if (!value) return null;

  return (
    String(value)
      .replace(/\s+/g, " ")
      .trim() || null
  );
}

// ============================================================
// FETCH TEXT
// ============================================================

async function fetchText(url, attempt = 1) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} ${response.statusText}`
      );
    }

    return await response.text();
  } catch (error) {
    if (attempt >= MAX_RETRIES) {
      throw error;
    }

    const delay =
      1000 * Math.pow(2, attempt - 1);

    console.log(
      `  ↻ Retry ${attempt}/${MAX_RETRIES} in ${delay}ms`
    );

    await sleep(delay);

    return fetchText(url, attempt + 1);
  }
}

// ============================================================
// FETCH BINARY
// ============================================================

async function fetchBinary(url, attempt = 1) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: EPUB_ACCEPT,
        Referer:
          "https://standardebooks.org/",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} ${response.statusText}`
      );
    }

    const contentType =
      response.headers.get("content-type") || "";

    const buffer = Buffer.from(
      await response.arrayBuffer()
    );

    return {
      response,
      buffer,
      contentType,
    };
  } catch (error) {
    if (attempt >= MAX_RETRIES) {
      throw error;
    }

    const delay =
      1000 * Math.pow(2, attempt - 1);

    console.log(
      `  ↻ Binary retry ${attempt}/${MAX_RETRIES} in ${delay}ms`
    );

    await sleep(delay);

    return fetchBinary(url, attempt + 1);
  }
}

// ============================================================
// XML HELPERS
// ============================================================

function localName(tagName) {
  if (!tagName) return "";

  const parts =
    String(tagName).split(":");

  return parts[
    parts.length - 1
  ].toLowerCase();
}

function getXmlNodes($, name) {
  const nodes = [];

  $("*").each((_, element) => {
    if (
      localName(element.tagName) ===
      name.toLowerCase()
    ) {
      nodes.push(element);
    }
  });

  return nodes;
}

function getNodeText($, node) {
  if (!node) return null;

  return cleanText($(node).text());
}

function getAttribute($, node, name) {
  if (!node) return null;

  return $(node).attr(name) || null;
}

// ============================================================
// METADATA EXTRACTION
// ============================================================

function extractTitle($) {
  const titles =
    getXmlNodes($, "title");

  for (const title of titles) {
    if (
      getAttribute($, title, "id") ===
      "title"
    ) {
      return getNodeText($, title);
    }
  }

  return (
    getNodeText($, titles[0]) ||
    null
  );
}

function extractAuthors($) {
  const creators =
    getXmlNodes($, "creator");

  const authors = [];

  for (const creator of creators) {
    const name =
      getNodeText($, creator);

    if (name) {
      authors.push(name);
    }
  }

  return [
    ...new Set(authors),
  ];
}

function extractLanguage($) {
  const languages =
    getXmlNodes($, "language");

  const language =
    getNodeText(
      $,
      languages[0]
    );

  if (!language) {
    return null;
  }

  const normalized =
    language.toLowerCase();

  if (
    normalized === "en" ||
    normalized.startsWith("en-")
  ) {
    return "English";
  }

  return language;
}

function extractSubjects($) {
  const subjects =
    getXmlNodes($, "subject");

  return [
    ...new Set(
      subjects
        .map((subject) =>
          getNodeText($, subject)
        )
        .filter(Boolean)
    ),
  ];
}

function extractGenres($) {
  const genres = [];

  $(
    'meta[property="schema:genre"]'
  ).each((_, element) => {
    const value = cleanText(
      $(element).attr("content") ||
        $(element).text()
    );

    if (value) {
      genres.push(value);
    }
  });

  return [
    ...new Set(genres),
  ];
}

function extractAbstract($) {
  const values = [];

  $(
    'meta[property="schema:abstract"]'
  ).each((_, element) => {
    const value = cleanText(
      $(element).attr("content") ||
        $(element).text()
    );

    if (value) {
      values.push(value);
    }
  });

  return values[0] || null;
}

function extractDescription($) {
  const descriptions =
    getXmlNodes(
      $,
      "description"
    );

  for (
    const description of descriptions
  ) {
    const value = cleanText(
      $(description).text()
    );

    if (value) {
      return value;
    }
  }

  return extractAbstract($);
}

function extractReleaseDate($) {
  const dates =
    getXmlNodes($, "date");

  const value =
    getNodeText(
      $,
      dates[0]
    );

  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}

// ============================================================
// CATEGORY
// ============================================================

function classifyCategory(
  genres,
  subjects,
  title,
  description
) {
  const text = [
    ...genres,
    ...subjects,
    title,
    description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    /technology|computer|programming|software|engineering|internet|artificial intelligence/.test(
      text
    )
  ) {
    return "Technology";
  }

  if (
    /psychology|psychological|mental health|cognitive/.test(
      text
    )
  ) {
    return "Psychology";
  }

  if (
    /philosophy|ethics|metaphysics|epistemology|stoicism|logic/.test(
      text
    )
  ) {
    return "Philosophy";
  }

  if (
    /science fiction|science|biology|physics|chemistry|mathematics|astronomy|geology/.test(
      text
    )
  ) {
    return "Science";
  }

  if (
    /history|historical|civilization|war|ancient|medieval|renaissance/.test(
      text
    )
  ) {
    return "History";
  }

  if (
    /self-help|self help|personal development|motivation|success|productivity/.test(
      text
    )
  ) {
    return "Self-help";
  }

  if (
    /education|educational|teaching|learning|pedagogy/.test(
      text
    )
  ) {
    return "Educational";
  }

  if (
    /biography|autobiography|memoir|travel|spirituality/.test(
      text
    )
  ) {
    return "Non-fiction";
  }

  return "Fiction";
}

// ============================================================
// REPOSITORY NAME
// ============================================================

function getRepositoryName(bookUrl) {
  const url = new URL(bookUrl);

  const segments =
    url.pathname
      .split("/")
      .filter(Boolean);

  const ebooksIndex =
    segments.indexOf("ebooks");

  if (ebooksIndex === -1) {
    throw new Error(
      "Invalid Standard Ebooks URL"
    );
  }

  const bookSegments =
    segments.slice(
      ebooksIndex + 1
    );

  if (
    bookSegments.length < 2
  ) {
    throw new Error(
      "Could not determine repository name"
    );
  }

  return bookSegments.join("_");
}

// ============================================================
// EPUB CANDIDATE SCORING
// ============================================================

function getCandidateScore({
  url = "",
  text = "",
  type = "",
  rel = "",
  className = "",
}) {
  const lowerUrl =
    String(url).toLowerCase();

  const lowerText =
    String(text).toLowerCase();

  const lowerType =
    String(type).toLowerCase();

  const lowerRel =
    String(rel).toLowerCase();

  const lowerClass =
    String(className).toLowerCase();

  let score = 0;

  if (
    lowerText.includes(
      "compatible epub"
    )
  ) {
    score += 200;
  }

  if (
    lowerClass.includes("epub")
  ) {
    score += 50;
  }

  if (
    lowerRel.includes("epub")
  ) {
    score += 40;
  }

  if (
    lowerType.includes("epub")
  ) {
    score += 40;
  }

  if (
    lowerText === "epub"
  ) {
    score += 80;
  }

  if (
    lowerText.includes("epub")
  ) {
    score += 30;
  }

  if (
    lowerUrl.includes(".epub")
  ) {
    score += 30;
  }

  if (
    lowerText.includes("advanced")
  ) {
    score -= 150;
  }

  if (
    lowerText.includes("kepub")
  ) {
    score -= 150;
  }

  return score;
}

// ============================================================
// FIND EPUB LINKS
// ============================================================

function findCompatibleEpubCandidates(
  $,
  pageUrl
) {
  const candidates = [];

  $("a[href]").each(
    (_, element) => {
      const href =
        $(element).attr(
          "href"
        );

      if (!href) return;

      let absoluteUrl;

      try {
        absoluteUrl =
          new URL(
            href,
            pageUrl
          ).href;
      } catch {
        return;
      }

      const text =
        cleanText(
          $(element).text()
        ) || "";

      const type =
        $(element).attr("type") ||
        "";

      const rel =
        $(element).attr("rel") ||
        "";

      const className =
        $(element).attr("class") ||
        "";

      if (
        !absoluteUrl
          .toLowerCase()
          .includes(".epub")
      ) {
        return;
      }

      const score =
        getCandidateScore({
          url: absoluteUrl,
          text,
          type,
          rel,
          className,
        });

      candidates.push({
        url: absoluteUrl,
        text,
        type,
        rel,
        className,
        score,
      });
    }
  );

  candidates.sort(
    (a, b) =>
      b.score - a.score
  );

  return candidates;
}

// ============================================================
// META REFRESH
// ============================================================

function findMetaRefreshUrl(
  html,
  currentUrl
) {
  const $ =
    cheerio.load(html);

  let refreshContent = null;

  $("meta[http-equiv]").each(
    (_, element) => {
      const httpEquiv =
        (
          $(element).attr(
            "http-equiv"
          ) || ""
        )
          .toLowerCase()
          .trim();

      if (
        httpEquiv === "refresh"
      ) {
        refreshContent =
          $(element).attr(
            "content"
          ) || null;
      }
    }
  );

  if (!refreshContent) {
    return null;
  }

  const match =
    refreshContent.match(
      /url\s*=\s*["']?([^"';]+)["']?/i
    );

  if (!match) {
    return null;
  }

  try {
    return new URL(
      match[1].trim(),
      currentUrl
    ).href;
  } catch {
    return null;
  }
}

// ============================================================
// EPUB VALIDATION
// ============================================================

function isValidEpubBuffer(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    return false;
  }

  if (
    buffer.length < 4 ||
    buffer[0] !== 0x50 ||
    buffer[1] !== 0x4b ||
    buffer[2] !== 0x03 ||
    buffer[3] !== 0x04
  ) {
    return false;
  }

  const head =
    buffer.subarray(
      0,
      Math.min(
        buffer.length,
        1024
      )
    );

  const text =
    head.toString("latin1");

  return text.includes(
    "mimetype"
  );
}

// ============================================================
// RESOLVE REAL EPUB
// ============================================================

async function resolveRealEpubUrl(
  epubUrl
) {
  console.log(
    `  → Checking EPUB: ${epubUrl}`
  );

  const first =
    await fetchBinary(
      epubUrl
    );

  // ----------------------------------------------------------
  // DIRECT EPUB
  // ----------------------------------------------------------

  if (
    first.contentType
      .toLowerCase()
      .includes(
        "application/epub+zip"
      ) &&
    isValidEpubBuffer(
      first.buffer
    )
  ) {
    console.log(
      "  ✅ Direct EPUB verified"
    );

    return {
      finalUrl: epubUrl,
      size:
        first.buffer.length,
      contentType:
        "application/epub+zip",
    };
  }

  // ----------------------------------------------------------
  // DOWNLOAD WRAPPER
  // ----------------------------------------------------------

  const html =
    first.buffer
      .toString("utf8")
      .slice(0, 50000);

  const refreshUrl =
    findMetaRefreshUrl(
      html,
      epubUrl
    );

  if (!refreshUrl) {
    throw new Error(
      `EPUB URL did not return a valid EPUB or download wrapper (content-type: ${
        first.contentType ||
        "unknown"
      })`
    );
  }

  console.log(
    "  ↪ Download wrapper detected"
  );

  console.log(
    `  → Following download URL: ${refreshUrl}`
  );

  // ----------------------------------------------------------
  // ACTUAL EPUB
  // ----------------------------------------------------------

  const second =
    await fetchBinary(
      refreshUrl
    );

  if (
    !second.contentType
      .toLowerCase()
      .includes(
        "application/epub+zip"
      )
  ) {
    throw new Error(
      `Final download is not EPUB (content-type: ${
        second.contentType ||
        "unknown"
      })`
    );
  }

  if (
    !isValidEpubBuffer(
      second.buffer
    )
  ) {
    throw new Error(
      "Final download has EPUB content-type but invalid EPUB ZIP bytes"
    );
  }

  console.log(
    `  ✅ Final EPUB verified (${second.buffer.length.toLocaleString()} bytes)`
  );

  return {
    finalUrl: refreshUrl,
    size:
      second.buffer.length,
    contentType:
      "application/epub+zip",
  };
}

// ============================================================
// FETCH OPF METADATA
// ============================================================

async function fetchOPFMetadata(
  repoName
) {
  const branches = [
    "master",
    "main",
  ];

  let lastError = null;

  for (
    const branch of branches
  ) {
    const opfUrl =
      `${GITHUB_RAW}/${GITHUB_ORG}/${repoName}/${branch}/src/epub/content.opf`;

    console.log(
      `  → Metadata: ${opfUrl}`
    );

    try {
      const xml =
        await fetchText(opfUrl);

      const $ =
        cheerio.load(xml, {
          xmlMode: true,
        });

      const title =
        extractTitle($);

      const authors =
        extractAuthors($);

      const language =
        extractLanguage($);

      const subjects =
        extractSubjects($);

      const genres =
        extractGenres($);

      const description =
        extractDescription($);

      const releaseDate =
        extractReleaseDate($);

      if (!title) {
        throw new Error(
          "Missing title in content.opf"
        );
      }

      if (
        authors.length === 0
      ) {
        throw new Error(
          "Missing author in content.opf"
        );
      }

      console.log(
        `  ✅ Metadata loaded`
      );

      return {
        title,
        author:
          authors.join(", "),
        description,
        language,
        subjects,
        genres,
        releaseDate,
      };
    } catch (error) {
      lastError = error;

      console.log(
        `  ⚠️ Metadata branch ${branch} failed: ${error.message}`
      );
    }
  }

  throw new Error(
    `Could not fetch content.opf: ${
      lastError?.message ||
      "Unknown error"
    }`
  );
}

// ============================================================
// FETCH BOOK
// ============================================================

async function fetchBook(
  bookUrl,
  catalogRank
) {
  console.log(
    `\n📖 Fetching: ${bookUrl}`
  );

  // ----------------------------------------------------------
  // BOOK PAGE
  // ----------------------------------------------------------

  const html =
    await fetchText(bookUrl);

  const $ =
    cheerio.load(html);

  // ----------------------------------------------------------
  // REPOSITORY
  // ----------------------------------------------------------

  const repoName =
    getRepositoryName(
      bookUrl
    );

  console.log(
    `  → Repository: ${repoName}`
  );

  // ----------------------------------------------------------
  // EPUB CANDIDATES
  // ----------------------------------------------------------

  const candidates =
    findCompatibleEpubCandidates(
      $,
      bookUrl
    );

  if (
    candidates.length === 0
  ) {
    throw new Error(
      "No EPUB download links found"
    );
  }

  console.log(
    `  → EPUB candidates found: ${candidates.length}`
  );

  // ----------------------------------------------------------
  // FIND VALID EPUB
  // ----------------------------------------------------------

  let epubResult = null;

  for (
    const candidate of candidates
  ) {
    console.log(
      `  • Testing [score ${candidate.score}] ${
        candidate.text ||
        candidate.url
      }`
    );

    try {
      epubResult =
        await resolveRealEpubUrl(
          candidate.url
        );

      break;
    } catch (error) {
      console.log(
        `    ✕ Candidate failed: ${error.message}`
      );
    }

    await sleep(150);
  }

  if (!epubResult) {
    throw new Error(
      "No candidate produced a valid EPUB"
    );
  }

  // ----------------------------------------------------------
  // METADATA
  // ----------------------------------------------------------

  const metadata =
    await fetchOPFMetadata(
      repoName
    );

  // ----------------------------------------------------------
  // CATEGORY
  // ----------------------------------------------------------

  const category =
    classifyCategory(
      metadata.genres,
      metadata.subjects,
      metadata.title,
      metadata.description
    );

  // ----------------------------------------------------------
  // COVER
  // ----------------------------------------------------------

  const coverUrl =
    `${GITHUB_RAW}/${GITHUB_ORG}/${repoName}/master/src/epub/images/cover.svg`;

  // ----------------------------------------------------------
  // BOOK OBJECT
  // ----------------------------------------------------------

  return {
    identifier:
      repoName,

    title:
      metadata.title,

    author:
      metadata.author,

    description:
      metadata.description,

    coverUrl,

    category,

    subjects:
      metadata.subjects,

    genres:
      metadata.genres,

    language:
      metadata.language,

    year:
      metadata.releaseDate
        ? metadata.releaseDate.getFullYear()
        : null,

    releaseDate:
      metadata.releaseDate,

    catalogRank,

    catalogRankedAt:
      new Date(),

    files: {
      pdf: null,

      epub: {
        name:
          `${repoName}.epub`,

        url:
          epubResult.finalUrl,

        size:
          epubResult.size,

        contentType:
          epubResult.contentType,
      },
    },

    source: {
      name:
        "Standard Ebooks",

      itemUrl:
        bookUrl,
    },
  };
}

// ============================================================
// EXTRACT BOOK PAGE URLS
// ============================================================

function extractBookUrls(html) {
  const $ =
    cheerio.load(html);

  const urls =
    new Set();

  $("a[href]").each(
    (_, element) => {
      const href =
        $(element).attr(
          "href"
        );

      if (!href) return;

      let absoluteUrl;

      try {
        absoluteUrl =
          new URL(
            href,
            BROWSE_URL
          ).href;
      } catch {
        return;
      }

      const url =
        new URL(
          absoluteUrl
        );

      if (
        url.hostname !==
        "standardebooks.org"
      ) {
        return;
      }

      const segments =
        url.pathname
          .split("/")
          .filter(Boolean);

      if (
        segments[0] !==
        "ebooks"
      ) {
        return;
      }

      if (
        segments.length !== 3
      ) {
        return;
      }

      urls.add(
        `https://standardebooks.org${url.pathname}`
      );
    }
  );

  return [
    ...urls,
  ];
}

// ============================================================
// COLLECT BOOK URLS
// ============================================================

async function collectBookUrls() {
  const urls = [];

  let page = 1;

  while (
    urls.length < MAX_BOOKS
  ) {
    const browseUrl =
      `${BROWSE_URL}?per-page=${BOOKS_PER_PAGE}&sort=popularity&view=list&page=${page}`;

    console.log(
      `\n🔎 Reading catalog page ${page}`
    );

    const html =
      await fetchText(
        browseUrl
      );

    const pageUrls =
      extractBookUrls(
        html
      );

    console.log(
      `Found ${pageUrls.length} book links`
    );

    if (
      pageUrls.length === 0
    ) {
      break;
    }

    for (
      const url of pageUrls
    ) {
      if (
        !urls.includes(url)
      ) {
        urls.push(url);
      }

      if (
        urls.length >=
        MAX_BOOKS
      ) {
        break;
      }
    }

    page++;

    await sleep(
      REQUEST_DELAY
    );
  }

  return urls;
}

// ============================================================
// REMOVE DUPLICATES
// ============================================================

function removeDuplicateBooks(
  books
) {
  const map = new Map();

  for (
    const book of books
  ) {
    if (
      !book.identifier
    ) {
      continue;
    }

    if (
      !map.has(
        book.identifier
      )
    ) {
      map.set(
        book.identifier,
        book
      );
    }
  }

  return [
    ...map.values(),
  ];
}

// ============================================================
// SAVE JSON
// ============================================================

async function saveJson(
  filePath,
  data
) {
  await fs.mkdir(
    OUTPUT_DIR,
    {
      recursive: true,
    }
  );

  const tempFile =
    `${filePath}.tmp`;

  await fs.writeFile(
    tempFile,
    JSON.stringify(
      data,
      null,
      2
    ),
    "utf8"
  );

  await fs.rename(
    tempFile,
    filePath
  );
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log(
    "\n========================================"
  );

  console.log(
    "🚀 STANDARD EBOOKS BOOK COLLECTOR"
  );

  console.log(
    "========================================"
  );

  console.log(
    `Maximum valid books: ${MAX_BOOKS}`
  );

  console.log(
    `Output: ${OUTPUT_FILE}`
  );

  // ----------------------------------------------------------
  // FIND BOOK PAGES
  // ----------------------------------------------------------

  const bookUrls =
    await collectBookUrls();

  console.log(
    `\n📚 Book pages found: ${bookUrls.length}`
  );

  if (
    bookUrls.length === 0
  ) {
    throw new Error(
      "No Standard Ebooks book pages found"
    );
  }

  // ----------------------------------------------------------
  // PROCESS
  // ----------------------------------------------------------

  const validBooks = [];
  const rejectedBooks = [];

  for (
    let index = 0;
    index < bookUrls.length;
    index++
  ) {
    const url =
      bookUrls[index];

    const catalogRank =
      index + 1;

    try {
      const book =
        await fetchBook(
          url,
          catalogRank
        );

      validBooks.push(
        book
      );

      console.log(
        `✅ Accepted ${validBooks.length}/${MAX_BOOKS}: ${book.title}`
      );
    } catch (error) {
      const reason =
        error?.message ||
        String(error);

      console.log(
        `❌ Rejected: ${reason}`
      );

      rejectedBooks.push({
        itemUrl: url,
        catalogRank,
        reason,
      });
    }

    await sleep(
      REQUEST_DELAY
    );

    if (
      validBooks.length >=
      MAX_BOOKS
    ) {
      break;
    }
  }

  // ----------------------------------------------------------
  // DEDUP
  // ----------------------------------------------------------

  const finalBooks =
    removeDuplicateBooks(
      validBooks
    );

  // ----------------------------------------------------------
  // SAVE
  // ----------------------------------------------------------

  await saveJson(
    OUTPUT_FILE,
    finalBooks
  );

  await saveJson(
    REJECTION_FILE,
    rejectedBooks
  );

  // ----------------------------------------------------------
  // REPORT
  // ----------------------------------------------------------

  console.log(
    "\n========================================"
  );

  console.log(
    "🎉 COLLECTION COMPLETE"
  );

  console.log(
    "========================================"
  );

  console.log(
    `Book pages found: ${bookUrls.length}`
  );

  console.log(
    `Valid books: ${validBooks.length}`
  );

  console.log(
    `Final books: ${finalBooks.length}`
  );

  console.log(
    `Rejected books: ${rejectedBooks.length}`
  );

  console.log(
    `\n📚 Dataset saved to:\n${OUTPUT_FILE}`
  );

  console.log(
    `\n📝 Rejections saved to:\n${REJECTION_FILE}`
  );

  console.log(
    "\n========================================"
  );

  if (
    validBooks.length ===
    MAX_BOOKS
  ) {
    console.log(
      "✅ TEST PASSED"
    );

    console.log(
      "EPUB + metadata pipeline is working."
    );

    console.log(
      "Next: change MAX_BOOKS from 3 to 60."
    );
  } else {
    console.log(
      "⚠️ TEST NOT PASSED"
    );
  }

  console.log(
    "========================================\n"
  );
}

// ============================================================
// START
// ============================================================

main().catch((error) => {
  console.error(
    "\n❌ Fatal error:",
    error.message
  );

  process.exit(1);
});