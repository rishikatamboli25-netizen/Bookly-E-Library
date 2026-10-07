import { apiClient } from "./apiClient";

const BOOK_CACHE_TTL = 5 * 60 * 1000;
const BOOK_STALE_TTL = 15 * 60 * 1000;
const BOOK_LIST_LIMIT = 60;
const SESSION_KEY = "bookly:catalog:v1";

let booksCache = null;
let booksCacheTime = 0;
let booksRequest = null;

const bookCache = new Map();
const bookRequests = new Map();

const normalizeArray = (value) =>
  Array.isArray(value) ? value : [];

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const readSessionCatalog = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      !Array.isArray(parsed.data) ||
      !Number.isFinite(parsed.time)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const writeSessionCatalog = (data) => {
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        data,
        time: Date.now(),
      })
    );
  } catch {
    // Session storage is only a performance enhancement.
  }
};

const hydrateBookCache = (books) => {
  books.forEach((book) => {
    if (book?.identifier) {
      bookCache.set(book.identifier, book);
    }
  });
};

const getStaleCatalog = () => {
  if (
    booksCache &&
    Date.now() - booksCacheTime < BOOK_STALE_TTL
  ) {
    return booksCache;
  }

  const session = readSessionCatalog();

  if (
    session &&
    Date.now() - session.time < BOOK_STALE_TTL
  ) {
    return session.data;
  }

  return null;
};

const scoreBook = (book, query) => {
  const q = normalizeText(query);
  if (!q) return 0;

  const title = normalizeText(book?.title);
  const author = normalizeText(book?.author);
  const category = normalizeText(book?.category);
  const description = normalizeText(book?.description);
  const subjects = normalizeArray(book?.subjects).map(normalizeText);
  const genres = normalizeArray(book?.genres).map(normalizeText);

  let score = 0;

  if (title === q) score += 100;
  if (title.startsWith(q)) score += 60;
  if (title.includes(q)) score += 40;
  if (author === q) score += 50;
  if (author.includes(q)) score += 25;
  if (category.includes(q)) score += 15;

  subjects.forEach((subject) => {
    if (subject === q) score += 20;
    else if (subject.includes(q)) score += 10;
  });

  genres.forEach((genre) => {
    if (genre === q) score += 12;
    else if (genre.includes(q)) score += 6;
  });

  if (description.includes(q)) score += 8;

  return score;
};

export const getBooksCatalog = async ({ force = false } = {}) => {
  if (!force && booksCache) {
    const age = Date.now() - booksCacheTime;
    if (age < BOOK_CACHE_TTL) {
      return booksCache;
    }
  }

  if (!force && !booksCache) {
    const session = readSessionCatalog();

    if (session && Date.now() - session.time < BOOK_CACHE_TTL) {
      booksCache = session.data;
      booksCacheTime = session.time;
      hydrateBookCache(session.data);
      return session.data;
    }

    if (session && Date.now() - session.time < BOOK_STALE_TTL) {
      booksCache = session.data;
      booksCacheTime = session.time;
      hydrateBookCache(session.data);
    }
  }

  if (!force && booksRequest) {
    return booksRequest;
  }

  booksRequest = apiClient
    .get("/api/book/getBooks", {
      params: {
        limit: BOOK_LIST_LIMIT,
      },
    })
    .then((response) => {
      const data = Array.isArray(response.data)
        ? response.data
        : [];

      booksCache = data;
      booksCacheTime = Date.now();
      hydrateBookCache(data);
      writeSessionCatalog(data);

      return data;
    })
    .catch((error) => {
      const stale = getStaleCatalog();
      if (stale) {
        console.warn("Catalog request failed; using cached catalog.");
        return stale;
      }

      throw error;
    })
    .finally(() => {
      booksRequest = null;
    });

  return booksRequest;
};

export const getBookByIdentifier = async (
  identifier,
  { force = false } = {}
) => {
  if (!identifier) {
    throw new Error("Missing book identifier");
  }

  if (!force && bookCache.has(identifier)) {
    return bookCache.get(identifier);
  }

  if (!force && bookRequests.has(identifier)) {
    return bookRequests.get(identifier);
  }

  const request = apiClient
    .get(`/api/book/${encodeURIComponent(identifier)}`)
    .then((response) => {
      const book = response.data || null;

      if (book?.identifier) {
        bookCache.set(book.identifier, book);
      }

      return book;
    })
    .catch((error) => {
      const stale = bookCache.get(identifier);
      if (stale) {
        console.warn("Book request failed; using cached book.");
        return stale;
      }
      throw error;
    })
    .finally(() => {
      bookRequests.delete(identifier);
    });

  bookRequests.set(identifier, request);
  return request;
};

export const searchBooks = (books, query, limit = 6) => {
  const cleanQuery = normalizeText(query);
  if (!cleanQuery) return [];

  return books
    .map((book) => ({
      book,
      score: scoreBook(book, cleanQuery),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.book);
};

export const getRelatedBooks = (books, currentBook, limit = 6) => {
  if (!currentBook) return [];

  const currentCategory = normalizeText(currentBook.category);
  const currentAuthor = normalizeText(currentBook.author);
  const currentSubjects = new Set(
    normalizeArray(currentBook.subjects).map(normalizeText)
  );
  const currentGenres = new Set(
    normalizeArray(currentBook.genres).map(normalizeText)
  );

  return books
    .filter(
      (book) =>
        book?.identifier &&
        book.identifier !== currentBook.identifier
    )
    .map((book) => {
      const category = normalizeText(book.category);
      const author = normalizeText(book.author);
      const subjects = normalizeArray(book.subjects).map(normalizeText);
      const genres = normalizeArray(book.genres).map(normalizeText);

      let score = 0;

      if (category && category === currentCategory) score += 30;
      if (author && author === currentAuthor) score += 20;

      subjects.forEach((subject) => {
        if (currentSubjects.has(subject)) score += 6;
      });

      genres.forEach((genre) => {
        if (currentGenres.has(genre)) score += 4;
      });

      if (book.coverUrl) score += 2;
      if (book.description) score += 1;

      return { book, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.book);
};

export const clearBookCache = () => {
  booksCache = null;
  booksCacheTime = 0;
  bookCache.clear();
  booksRequest = null;
  bookRequests.clear();

  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore storage failures.
  }
};
