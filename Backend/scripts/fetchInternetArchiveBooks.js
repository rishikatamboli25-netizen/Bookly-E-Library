import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// ============================================================
// PATH SETUP
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, "../data");

const OUTPUT_FILE = path.join(
  OUTPUT_DIR,
  "internetArchiveBooks.json"
);

const REJECTION_FILE = path.join(
  OUTPUT_DIR,
  "internetArchiveRejectedBooks.json"
);


// ============================================================
// CONFIGURATION
// ============================================================

const MAX_TOTAL_CANDIDATES = 200;

const BOOK_CATEGORIES = [
  "Fiction",
  "Non-fiction",
  "Self-help",
  "Science",
  "History",
  "Technology",
  "Philosophy",
  "Psychology",
  "Educational",
];

const CANDIDATES_PER_CATEGORY = Math.floor(
  MAX_TOTAL_CANDIDATES / BOOK_CATEGORIES.length
);

const SEARCH_API =
  "https://archive.org/advancedsearch.php";

const METADATA_API =
  "https://archive.org/metadata";

const DOWNLOAD_API =
  "https://archive.org/download";


// ============================================================
// NON-BOOK KEYWORDS
// ============================================================
// These are strong signals that an item is NOT a book.
//
// We do not reject based on one weak keyword alone.
// The title/metadata is checked using multiple signals.
// ============================================================

const NON_BOOK_PATTERNS = [
  /\bnewspaper\b/i,
  /\bnewspapers\b/i,
  /\btimes\b/i,
  /\bgazette\b/i,
  /\bherald\b/i,
  /\bnewsletter\b/i,
  /\bmagazine\b/i,
  /\bperiodical\b/i,
  /\bjournal\b/i,

  /\bannual report\b/i,
  /\bresearch report\b/i,
  /\btechnical report\b/i,
  /\bfinal report\b/i,
  /\bprogress report\b/i,
  /\bworking paper\b/i,

  /\bthesis\b/i,
  /\bdissertation\b/i,
  /\bconference paper\b/i,
  /\bconference proceedings\b/i,
  /\bproceedings\b/i,

  /\bcourse notes\b/i,
  /\bcourse handout\b/i,
  /\bhandout\b/i,
  /\btutorial\b/i,
  /\blecture notes\b/i,
  /\bclass notes\b/i,

  /\bcheat sheet\b/i,
  /\bcheatsheet\b/i,
  /\bglossary\b/i,

  /\bnewsletter\b/i,
  /\bbulletin\b/i,

  /\bletter\b/i,
  /\bcorrespondence\b/i,

  /\bflyer\b/i,
  /\bposter\b/i,
  /\bnotice\b/i,

  /\bpress release\b/i,

  /\bpoem\b/i,
  /\bpoetry pamphlet\b/i,

  /\bblog post\b/i,
  /\bblog\b/i,

  /\bfaq\b/i,
  /\bquestion and answer\b/i,

  /\buser manual\b/i,
  /\bmanual\b/i,

  /\bguidebook\b/i,

  /\btranscript\b/i,
];


// ============================================================
// RESTRICTED / BORROW-ONLY KEYWORDS
// ============================================================
// These are used as warning signals.
//
// We do NOT rely only on file.restricted.
// Internet Archive can expose metadata for files that are
// not actually directly downloadable.
// ============================================================

const RESTRICTED_PATTERNS = [
  /\bborrow\b/i,
  /\bborrow only\b/i,
  /\bborrowable\b/i,
  /\bcontrolled digital lending\b/i,
  /\baccess restricted\b/i,
  /\brestricted access\b/i,
  /\bprotected\b/i,
  /\bprivate\b/i,
  /\bencrypted\b/i,
];


// ============================================================
// LANGUAGE NORMALIZATION
// ============================================================

function normalizeLanguage(language) {
  if (!language) {
    return null;
  }

  if (Array.isArray(language)) {
    language = language[0];
  }

  if (typeof language !== "string") {
    return null;
  }

  const value = language.trim().toLowerCase();

  if (
    value === "eng" ||
    value === "english" ||
    value === "en"
  ) {
    return "English";
  }

  if (
    value === "fre" ||
    value === "fra" ||
    value === "french" ||
    value === "fr"
  ) {
    return "French";
  }

  if (
    value === "spa" ||
    value === "spanish" ||
    value === "es"
  ) {
    return "Spanish";
  }

  if (
    value === "chi" ||
    value === "zho" ||
    value === "chinese" ||
    value === "zh"
  ) {
    return "Chinese";
  }

  return language;
}


// ============================================================
// DESCRIPTION NORMALIZATION
// ============================================================

function normalizeDescription(description) {
  if (!description) {
    return null;
  }

  if (Array.isArray(description)) {
    const cleaned = description
      .filter(
        (item) =>
          typeof item === "string" &&
          item.trim().length > 0
      )
      .map((item) => item.trim());

    if (cleaned.length === 0) {
      return null;
    }

    // Remove physical catalog descriptions such as:
    // "222 p. : 22 cm"
    const meaningful = cleaned.filter(
      (item) =>
        !/^\d+\s*(p|pages|pp)\b/i.test(item) &&
        !/^\d+\s*cm\b/i.test(item)
    );

    return (
      meaningful.join(" ") ||
      cleaned.join(" ")
    );
  }

  if (typeof description === "string") {
    const cleaned = description.trim();

    if (!cleaned) {
      return null;
    }

    // Reject catalog-only descriptions
    if (
      /^\d+\s*(p|pages|pp)\b/i.test(cleaned) ||
      /^\d+\s*cm\b/i.test(cleaned) ||
      /^scans?$/i.test(cleaned)
    ) {
      return null;
    }

    return cleaned;
  }

  return null;
}


// ============================================================
// SUBJECT NORMALIZATION
// ============================================================

function normalizeSubjects(subjects) {
  if (!subjects) {
    return [];
  }

  if (Array.isArray(subjects)) {
    return subjects
      .filter(
        (subject) =>
          typeof subject === "string" &&
          subject.trim().length > 0
      )
      .map((subject) => subject.trim());
  }

  if (typeof subjects === "string") {
    return subjects
      .split(";")
      .map((subject) => subject.trim())
      .filter(Boolean);
  }

  return [];
}


// ============================================================
// YEAR EXTRACTION
// ============================================================

function extractYear(meta) {
  if (meta.year) {
    const yearMatch =
      String(meta.year).match(/\b(1[5-9]\d{2}|20\d{2})\b/);

    if (yearMatch) {
      return Number(yearMatch[1]);
    }
  }

  if (meta.date) {
    const yearMatch =
      String(meta.date).match(/\b(1[5-9]\d{2}|20\d{2})\b/);

    if (yearMatch) {
      return Number(yearMatch[1]);
    }
  }

  return null;
}


// ============================================================
// CATEGORY CLASSIFICATION
// ============================================================

function classifyCategory(
  subjects,
  title,
  searchedCategory
) {
  const text = [
    title,
    searchedCategory,
    ...subjects,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    /self-help|self help|personal development|motivation|success|productivity/i.test(
      text
    )
  ) {
    return "Self-help";
  }

  if (
    /psychology|psychological|mental health|cognitive/i.test(
      text
    )
  ) {
    return "Psychology";
  }

  if (
    /philosophy|ethics|metaphysics|epistemology|logic/i.test(
      text
    )
  ) {
    return "Philosophy";
  }

  if (
    /computer|software|programming|technology|engineering|internet|artificial intelligence/i.test(
      text
    )
  ) {
    return "Technology";
  }

  if (
    /science|biology|physics|chemistry|mathematics|astronomy|geology/i.test(
      text
    )
  ) {
    return "Science";
  }

  if (
    /history|historical|civilization|war|ancient|medieval/i.test(
      text
    )
  ) {
    return "History";
  }

  if (
    /education|educational|teaching|learning|pedagogy|school/i.test(
      text
    )
  ) {
    return "Educational";
  }

  if (
    /fiction|novel|novels|literature|fantasy|mystery|romance|thriller/i.test(
      text
    )
  ) {
    return "Fiction";
  }

  if (
    /non-fiction|nonfiction|biography|autobiography|memoir/i.test(
      text
    )
  ) {
    return "Non-fiction";
  }

  return searchedCategory;
}


// ============================================================
// HELPER: FETCH JSON
// ============================================================

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}


// ============================================================
// SEARCH INTERNET ARCHIVE
// ============================================================

async function searchInternetArchive(category) {
  const params = new URLSearchParams();

  params.set(
    "q",
    `mediatype:texts AND subject:"${category}"`
  );

  params.append("fl[]", "identifier");
  params.append("fl[]", "title");
  params.append("fl[]", "creator");
  params.append("fl[]", "description");
  params.append("fl[]", "date");
  params.append("fl[]", "subject");
  params.append("fl[]", "language");

  params.set(
    "rows",
    String(CANDIDATES_PER_CATEGORY)
  );

  params.set("page", "1");
  params.set("output", "json");

  const url =
    `${SEARCH_API}?${params.toString()}`;

  console.log(
    `\n🔎 Searching category: ${category}`
  );

  const data = await fetchJson(url);

  return data.response?.docs || [];
}


// ============================================================
// CHECK BASIC BOOK METADATA
// ============================================================

function hasBasicMetadata(candidate) {
  if (!candidate) {
    return false;
  }

  const hasTitle =
    typeof candidate.title === "string" &&
    candidate.title.trim().length > 0;

  const hasCreator =
    typeof candidate.creator === "string" &&
    candidate.creator.trim().length > 0;

  const hasIdentifier =
    typeof candidate.identifier === "string" &&
    candidate.identifier.trim().length > 0;

  return (
    hasTitle &&
    hasCreator &&
    hasIdentifier
  );
}


// ============================================================
// DETECT OBVIOUS NON-BOOKS
// ============================================================

function detectNonBook(candidate) {
  const title =
    candidate.title || "";

  const description =
    normalizeDescription(candidate.description) || "";

  const subjects =
    normalizeSubjects(candidate.subject);

  const combinedText = [
    title,
    description,
    ...subjects,
  ].join(" ");

  const matchedPatterns =
    NON_BOOK_PATTERNS.filter(
      (pattern) =>
        pattern.test(combinedText)
    );

  // Strong signals
  if (matchedPatterns.length >= 2) {
    return {
      rejected: true,
      reason: "Likely non-book material",
      matchedPatterns:
        matchedPatterns.map(
          (pattern) =>
            pattern.source
        ),
    };
  }

  // One strong title-level signal
  const titleMatches =
    NON_BOOK_PATTERNS.filter(
      (pattern) =>
        pattern.test(title)
    );

  if (titleMatches.length >= 1) {
    return {
      rejected: true,
      reason:
        "Title strongly indicates non-book material",
      matchedPatterns:
        titleMatches.map(
          (pattern) =>
            pattern.source
        ),
    };
  }

  return {
    rejected: false,
  };
}


// ============================================================
// CHECK LANGUAGE
// ============================================================

function isEnglishBook(metadata) {
  const language =
    normalizeLanguage(
      metadata.metadata?.language
    );

  // We want English for this dataset.
  // Missing language is rejected because it creates
  // uncertainty about the actual book language.

  return language === "English";
}


// ============================================================
// CHECK FOR RESTRICTED / BORROW SIGNALS
// ============================================================

function hasRestrictedSignals(metadata) {
  const meta =
    metadata.metadata || {};

  const fullText = JSON.stringify(
    meta
  ).toLowerCase();

  const matchedPatterns =
    RESTRICTED_PATTERNS.filter(
      (pattern) =>
        pattern.test(fullText)
    );

  return {
    restricted:
      matchedPatterns.length > 0,

    matchedPatterns:
      matchedPatterns.map(
        (pattern) =>
          pattern.source
      ),
  };
}


// ============================================================
// FIND PDF / EPUB FILES
// ============================================================

function findBookFiles(metadata) {
  const files =
    metadata.files || [];

  let pdf = null;
  let epub = null;

  for (const file of files) {
    const name =
      file.name || "";

    const lowerName =
      name.toLowerCase();

    // Ignore metadata/system files
    if (
      lowerName.includes("_meta.") ||
      lowerName.includes("_files.xml") ||
      lowerName.includes("torrent") ||
      lowerName.endsWith(".md5") ||
      lowerName.endsWith(".sha1") ||
      lowerName.endsWith(".sha256")
    ) {
      continue;
    }

    // Ignore encrypted files
    if (
      lowerName.includes("encrypted") ||
      lowerName.includes("_enc.")
    ) {
      continue;
    }

    // PDF
    if (
      !pdf &&
      lowerName.endsWith(".pdf")
    ) {
      pdf = {
        name: file.name,

        url:
          `${DOWNLOAD_API}/` +
          `${encodeURIComponent(
            metadata.metadata.identifier
          )}/` +
          `${encodeURIComponent(
            file.name
          )}`,

        size:
          file.size
            ? Number(file.size)
            : null,

        metadata: file,
      };
    }

    // EPUB
    if (
      !epub &&
      lowerName.endsWith(".epub")
    ) {
      epub = {
        name: file.name,

        url:
          `${DOWNLOAD_API}/` +
          `${encodeURIComponent(
            metadata.metadata.identifier
          )}/` +
          `${encodeURIComponent(
            file.name
          )}`,

        size:
          file.size
            ? Number(file.size)
            : null,

        metadata: file,
      };
    }
  }

  return {
    pdf,
    epub,
  };
}


// ============================================================
// CHECK FILE METADATA RESTRICTION
// ============================================================

function isFileRestricted(file) {
  if (!file) {
    return true;
  }

  if (
    file.metadata?.restricted === true
  ) {
    return true;
  }

  if (
    file.metadata?.private === true
  ) {
    return true;
  }

  if (
    file.metadata?.format &&
    String(file.metadata.format)
      .toLowerCase()
      .includes("encrypted")
  ) {
    return true;
  }

  return false;
}


// ============================================================
// ACTUALLY TEST FILE ACCESS
// ============================================================

async function testFileAccess(file) {
  if (!file) {
    return {
      accessible: false,
      reason: "File does not exist",
    };
  }

  if (isFileRestricted(file)) {
    return {
      accessible: false,
      reason:
        "File metadata indicates restricted/private/encrypted access",
    };
  }

  try {
    // We use a HEAD request first.
    // This avoids downloading the entire book.
    const response =
      await fetch(
        file.url,
        {
          method: "HEAD",
          redirect: "follow",
        }
      );

    if (!response.ok) {
      return {
        accessible: false,
        reason:
          `HTTP ${response.status}`,
      };
    }

    const contentType =
      response.headers.get(
        "content-type"
      );

    const contentLength =
      response.headers.get(
        "content-length"
      );

    return {
      accessible: true,

      status:
        response.status,

      contentType:
        contentType || null,

      contentLength:
        contentLength
          ? Number(contentLength)
          : file.size || null,
    };

  } catch (error) {
    return {
      accessible: false,

      reason:
        error.message,
    };
  }
}


// ============================================================
// VALIDATE BOOK FILES
// ============================================================

async function validateBookFiles(files) {
  let pdfResult = null;
  let epubResult = null;

  // Test PDF
  if (files.pdf) {
    pdfResult =
      await testFileAccess(
        files.pdf
      );
  }

  // Test EPUB
  if (files.epub) {
    epubResult =
      await testFileAccess(
        files.epub
      );
  }

  const hasAccessiblePdf =
    files.pdf &&
    pdfResult?.accessible;

  const hasAccessibleEpub =
    files.epub &&
    epubResult?.accessible;

  return {
    hasAccessiblePdf:
      Boolean(hasAccessiblePdf),

    hasAccessibleEpub:
      Boolean(hasAccessibleEpub),

    pdfResult,

    epubResult,
  };
}


// ============================================================
// PROCESS ONE BOOK
// ============================================================

async function processBook(candidate) {
  const identifier =
    candidate.identifier;

  console.log(
    `\n📖 Checking: ${
      candidate.title ||
      identifier
    }`
  );

  // ----------------------------------------------------------
  // STEP 1: BASIC METADATA
  // ----------------------------------------------------------

  if (
    !hasBasicMetadata(candidate)
  ) {
    return {
      accepted: false,

      reason:
        "Missing title, author, or identifier",
    };
  }


  // ----------------------------------------------------------
  // STEP 2: NON-BOOK FILTER
  // ----------------------------------------------------------

  const nonBookCheck =
    detectNonBook(
      candidate
    );

  if (
    nonBookCheck.rejected
  ) {
    return {
      accepted: false,

      reason:
        nonBookCheck.reason,

      details:
        nonBookCheck.matchedPatterns,
    };
  }


  try {

    // --------------------------------------------------------
    // STEP 3: FETCH FULL METADATA
    // --------------------------------------------------------

    const metadata =
      await fetchJson(
        `${METADATA_API}/` +
        `${encodeURIComponent(
          identifier
        )}`
      );

    if (
      !metadata.metadata
    ) {
      return {
        accepted: false,

        reason:
          "Missing detailed metadata",
      };
    }

    const meta =
      metadata.metadata;


    // --------------------------------------------------------
    // STEP 4: VERIFY FULL METADATA
    // --------------------------------------------------------

    const title =
      typeof meta.title === "string"
        ? meta.title.trim()
        : "";

    const author =
      typeof meta.creator === "string"
        ? meta.creator.trim()
        : "";

    if (
      !title ||
      !author ||
      !meta.identifier
    ) {
      return {
        accepted: false,

        reason:
          "Incomplete book metadata",
      };
    }


    // --------------------------------------------------------
    // STEP 5: VERIFY BOOK TYPE AGAIN
    // --------------------------------------------------------

    const fullBookCheck =
      detectNonBook({
        title,
        creator: author,
        description:
          meta.description,
        subject:
          meta.subject,
      });

    if (
      fullBookCheck.rejected
    ) {
      return {
        accepted: false,

        reason:
          fullBookCheck.reason,

        details:
          fullBookCheck.matchedPatterns,
      };
    }


    // --------------------------------------------------------
    // STEP 6: LANGUAGE CHECK
    // --------------------------------------------------------

    if (
      !isEnglishBook(
        metadata
      )
    ) {
      return {
        accepted: false,

        reason:
          "Not identified as an English-language book",
      };
    }


    // --------------------------------------------------------
    // STEP 7: RESTRICTED ACCESS CHECK
    // --------------------------------------------------------

    const restrictedCheck =
      hasRestrictedSignals(
        metadata
      );

    if (
      restrictedCheck.restricted
    ) {
      return {
        accepted: false,

        reason:
          "Metadata contains restricted/borrow-only access signals",

        details:
          restrictedCheck.matchedPatterns,
      };
    }


    // --------------------------------------------------------
    // STEP 8: FIND PDF / EPUB
    // --------------------------------------------------------

    const files =
      findBookFiles(
        metadata
      );

    if (
      !files.pdf &&
      !files.epub
    ) {
      return {
        accepted: false,

        reason:
          "No PDF or EPUB file found",
      };
    }


    // --------------------------------------------------------
    // STEP 9: ACTUALLY TEST FILE ACCESS
    // --------------------------------------------------------

    const fileValidation =
      await validateBookFiles(
        files
      );

    if (
      !fileValidation.hasAccessiblePdf &&
      !fileValidation.hasAccessibleEpub
    ) {
      return {
        accepted: false,

        reason:
          "PDF/EPUB exists in metadata but is not directly accessible",

        details: {
          pdf:
            fileValidation.pdfResult,

          epub:
            fileValidation.epubResult,
        },
      };
    }


    // --------------------------------------------------------
    // STEP 10: NORMALIZE DATA
    // --------------------------------------------------------

    const subjects =
      normalizeSubjects(
        meta.subject
      );

    const description =
      normalizeDescription(
        meta.description
      );

    const language =
      normalizeLanguage(
        meta.language
      );

    const year =
      extractYear(
        meta
      );


    // --------------------------------------------------------
    // STEP 11: CLASSIFY CATEGORY
    // --------------------------------------------------------

    const category =
      classifyCategory(
        subjects,

        title,

        candidate.searchedCategory
      );


    // --------------------------------------------------------
    // STEP 12: CREATE FINAL BOOK
    // --------------------------------------------------------

    console.log(
      "  ✅ ACCEPTED"
    );

    return {
      accepted: true,

      book: {
        identifier:
          meta.identifier,

        title,

        author,

        description,

        category,

        subjects,

        language,

        year,

        files: {
          pdf:
            fileValidation
              .hasAccessiblePdf
              ? {
                  name:
                    files.pdf.name,

                  url:
                    files.pdf.url,

                  size:
                    files.pdf.size,

                  contentType:
                    fileValidation
                      .pdfResult
                      ?.contentType ||
                    null,
                }
              : null,

          epub:
            fileValidation
              .hasAccessibleEpub
              ? {
                  name:
                    files.epub.name,

                  url:
                    files.epub.url,

                  size:
                    files.epub.size,

                  contentType:
                    fileValidation
                      .epubResult
                      ?.contentType ||
                    null,
                }
              : null,
        },

        source: {
          name:
            "Internet Archive",

          itemUrl:
            `https://archive.org/details/` +
            `${meta.identifier}`,
        },
      },
    };

  } catch (error) {

    return {
      accepted: false,

      reason:
        "Failed while processing book",

      details:
        error.message,
    };
  }
}


// ============================================================
// COLLECT CANDIDATES
// ============================================================

async function collectCandidates() {

  let candidates = [];

  console.log(
    "\n================================="
  );

  console.log(
    "🔎 COLLECTING BOOK CANDIDATES"
  );

  console.log(
    "================================="
  );


  for (
    const category
    of BOOK_CATEGORIES
  ) {

    const results =
      await searchInternetArchive(
        category
      );


    console.log(
      `Found ${results.length} candidates for ${category}`
    );


    candidates.push(
      ...results.map(
        (book) => ({
          ...book,

          searchedCategory:
            category,
        })
      )
    );
  }


  // ----------------------------------------------------------
  // LIMIT TOTAL CANDIDATES
  // ----------------------------------------------------------

  if (
    candidates.length >
    MAX_TOTAL_CANDIDATES
  ) {

    candidates =
      candidates.slice(
        0,
        MAX_TOTAL_CANDIDATES
      );
  }


  return candidates;
}


// ============================================================
// REMOVE DUPLICATES
// ============================================================

function removeDuplicateBooks(
  candidates
) {

  const uniqueBooks =
    new Map();


  for (
    const book
    of candidates
  ) {

    if (
      !book.identifier
    ) {
      continue;
    }


    if (
      !uniqueBooks.has(
        book.identifier
      )
    ) {

      uniqueBooks.set(
        book.identifier,
        book
      );
    }
  }


  return [
    ...uniqueBooks.values(),
  ];
}


// ============================================================
// VALIDATE ALL BOOKS
// ============================================================

async function validateBooks(
  candidates
) {

  const validBooks = [];

  const rejectedBooks = [];


  for (
    const candidate
    of candidates
  ) {

    const result =
      await processBook(
        candidate
      );


    if (
      result.accepted
    ) {

      validBooks.push(
        result.book
      );

    } else {

      rejectedBooks.push({

        identifier:
          candidate.identifier,

        title:
          candidate.title ||
          null,

        author:
          candidate.creator ||
          null,

        searchedCategory:
          candidate.searchedCategory ||
          null,

        reason:
          result.reason,

        details:
          result.details ||
          null,
      });
    }
  }


  return {
    validBooks,

    rejectedBooks,
  };
}


// ============================================================
// REMOVE DUPLICATE WORKS
// ============================================================
// Different Internet Archive identifiers can sometimes
// represent different copies/editions of the same work.
//
// We use a normalized title + author key.
// ============================================================

function removeDuplicateWorks(
  books
) {

  const uniqueWorks =
    new Map();


  for (
    const book
    of books
  ) {

    const normalizedTitle =
      book.title
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          " "
        )
        .trim();


    const normalizedAuthor =
      book.author
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          " "
        )
        .trim();


    const key =
      `${normalizedTitle}::${normalizedAuthor}`;


    if (
      !uniqueWorks.has(key)
    ) {

      uniqueWorks.set(
        key,
        book
      );
    }
  }


  return [
    ...uniqueWorks.values(),
  ];
}


// ============================================================
// SAVE FINAL DATA
// ============================================================

async function saveBooksToFile(
  validBooks
) {

  await fs.mkdir(
    OUTPUT_DIR,
    {
      recursive: true,
    }
  );


  const jsonData =
    JSON.stringify(
      validBooks,
      null,
      2
    );


  await fs.writeFile(
    OUTPUT_FILE,

    jsonData,

    "utf-8"
  );
}


// ============================================================
// SAVE REJECTION REPORT
// ============================================================

async function saveRejectionReport(
  rejectedBooks
) {

  await fs.mkdir(
    OUTPUT_DIR,
    {
      recursive: true,
    }
  );


  const jsonData =
    JSON.stringify(
      rejectedBooks,
      null,
      2
    );


  await fs.writeFile(
    REJECTION_FILE,

    jsonData,

    "utf-8"
  );
}


// ============================================================
// MAIN FUNCTION
// ============================================================

async function main() {

  console.log(
    "\n================================="
  );

  console.log(
    "🚀 INTERNET ARCHIVE BOOK COLLECTOR"
  );

  console.log(
    "================================="
  );


  console.log(
    `Maximum candidates: ${MAX_TOTAL_CANDIDATES}`
  );


  console.log(
    `Categories: ${BOOK_CATEGORIES.length}`
  );


  console.log(
    `Candidates per category: ${CANDIDATES_PER_CATEGORY}`
  );


  // ==========================================================
  // STEP 1
  // COLLECT CANDIDATES
  // ==========================================================

  const candidates =
    await collectCandidates();


  console.log(
    `\nRaw candidates collected: ${candidates.length}`
  );


  // ==========================================================
  // STEP 2
  // REMOVE DUPLICATE IDENTIFIERS
  // ==========================================================

  const uniqueCandidates =
    removeDuplicateBooks(
      candidates
    );


  console.log(
    `Unique candidates: ${uniqueCandidates.length}`
  );


  // ==========================================================
  // STEP 3
  // VALIDATE BOOKS
  // ==========================================================

  const {
    validBooks,
    rejectedBooks,
  } =
    await validateBooks(
      uniqueCandidates
    );


  // ==========================================================
  // STEP 4
  // REMOVE DUPLICATE WORKS
  // ==========================================================

  const finalBooks =
    removeDuplicateWorks(
      validBooks
    );


  // ==========================================================
  // STEP 5
  // SAVE FINAL DATA
  // ==========================================================

  await saveBooksToFile(
    finalBooks
  );


  // ==========================================================
  // STEP 6
  // SAVE REJECTION REPORT
  // ==========================================================

  await saveRejectionReport(
    rejectedBooks
  );


  // ==========================================================
  // FINAL REPORT
  // ==========================================================

  console.log(
    "\n================================="
  );

  console.log(
    "🎉 COLLECTION COMPLETE"
  );

  console.log(
    "================================="
  );


  console.log(
    `Candidates searched: ${uniqueCandidates.length}`
  );


  console.log(
    `Valid books before duplicate-work removal: ${validBooks.length}`
  );


  console.log(
    `Final usable books: ${finalBooks.length}`
  );


  console.log(
    `Rejected candidates: ${rejectedBooks.length}`
  );


  console.log(
    `\n📚 Final dataset:`
  );

  console.log(
    OUTPUT_FILE
  );


  console.log(
    `\n📝 Rejection report:`
  );

  console.log(
    REJECTION_FILE
  );


  console.log(
    "\n================================="
  );
}


// ============================================================
// RUN SCRIPT
// ============================================================

main().catch(
  (error) => {

    console.error(
      "\n❌ Fatal error:",
      error
    );

    process.exit(1);
  }
);