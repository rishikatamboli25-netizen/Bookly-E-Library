import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  LuSearch,
  LuX,
  LuMenu,
  LuArrowRight,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import BookCover from "./BookCover";
import {
  getCatalog,
  getFriendlyError,
} from "../utils/api";

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getSearchScore = (book, query) => {
  const q = normalize(query);
  if (!q) return 0;

  const title = normalize(book?.title);
  const author = normalize(book?.author);
  const category = normalize(book?.category);
  const description = normalize(book?.description);
  const subjects = Array.isArray(book?.subjects)
    ? book.subjects.map(normalize)
    : [];

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

  if (description.includes(q)) score += 8;

  return score;
};

const Navbar = ({ openSidebar }) => {
  const navigate = useNavigate();

  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  const [search, setSearch] = useState("");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [searchRetry, setSearchRetry] = useState(0);

  useEffect(() => {
    const query = search.trim();

    if (!query) {
      setBooks([]);
      setLoading(false);
      setSearchError("");
      setShowResults(false);
      return undefined;
    }

    setShowResults(true);
    setSearchError("");

    let active = true;

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const catalog = await getCatalog();

        if (!active) return;

        const results = catalog
          .map((book) => ({
            book,
            score: getSearchScore(book, query),
          }))
          .filter((item) => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 6)
          .map((item) => item.book);

        setBooks(results);
      } catch (error) {
        if (!active) return;

        setBooks([]);
        setSearchError(
          getFriendlyError(
            error,
            "Search is temporarily unavailable. Please try again."
          )
        );
      } finally {
        if (active) setLoading(false);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, searchRetry]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const clearSearch = () => {
    setSearch("");
    setBooks([]);
    setSearchError("");
    setShowResults(false);
    searchInputRef.current?.focus();
  };

  const handleBookClick = (book) => {
    if (!book?.identifier) return;

    clearSearch();
    navigate(`/BookDetail/${book.identifier}`);
  };

  const handleViewAll = () => {
    const query = search.trim();
    if (!query) return;

    setShowResults(false);
    navigate(`/Discover?q=${encodeURIComponent(query)}`);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setShowResults(false);
      return;
    }

    if (event.key === "Enter" && search.trim()) {
      event.preventDefault();
      handleViewAll();
    }
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-30 h-20 border-b border-border-light bg-background/80 backdrop-blur-xl">
      <div className="flex h-full items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <button
          onClick={openSidebar}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-brand-light md:hidden"
          aria-label="Open menu"
        >
          <LuMenu size={22} />
        </button>

        <div
          ref={searchContainerRef}
          className="relative mx-auto w-full max-w-full sm:max-w-xl lg:max-w-2xl xl:max-w-3xl"
        >
          <div className="flex h-12 w-full items-center gap-3 rounded-xl border border-border-light bg-background-card px-4 shadow-md transition-all duration-300 focus-within:border-brand/40 focus-within:shadow-lg">
            <LuSearch
              size={20}
              className="shrink-0 text-text-secondary"
            />

            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onFocus={() => {
                if (search.trim()) setShowResults(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search books, authors, subjects..."
              autoComplete="off"
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-secondary"
            />

            {search.length > 0 && (
              <button
                type="button"
                onClick={clearSearch}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-secondary transition hover:bg-brand-light hover:text-brand"
                aria-label="Clear search"
              >
                <LuX size={18} />
              </button>
            )}
          </div>

          {showResults && search.trim() && (
            <div className="absolute left-0 right-0 z-50 mt-3 max-h-[28rem] overflow-hidden rounded-2xl border border-border-light bg-background-card shadow-xl">
              {loading && (
                <div className="flex items-center gap-3 px-5 py-5">
                  <LuSearch
                    size={18}
                    className="animate-pulse text-brand"
                  />
                  <span className="text-sm text-text-secondary">
                    Searching your library...
                  </span>
                </div>
              )}

              {!loading && searchError && (
                <div className="px-5 py-6">
                  <p className="text-sm font-medium text-text-primary">
                    Search unavailable
                  </p>
                  <p className="mt-1 text-xs leading-5 text-text-secondary">
                    {searchError}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchRetry((value) => value + 1)}
                    className="mt-4 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white"
                  >
                    Try again
                  </button>
                </div>
              )}

              {!loading && !searchError && books.length === 0 && (
                <div className="px-6 py-8 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-light">
                    <LuSearch size={18} className="text-brand" />
                  </div>
                  <p className="text-sm font-medium text-text-primary">
                    No books found
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    Try another title, author, or subject.
                  </p>
                </div>
              )}

              {!loading && !searchError && books.length > 0 && (
                <div className="max-h-[21rem] overflow-y-auto">
                  {books.map((book) => (
                    <button
                      key={book._id || book.identifier}
                      onClick={() => handleBookClick(book)}
                      className="flex w-full items-center gap-4 border-b border-border-light px-4 py-3 text-left transition hover:bg-brand-light/40 last:border-b-0"
                    >
                      <BookCover
                        book={book}
                        alt={book.title}
                        loading="lazy"
                        sizes="44px"
                        className="h-16 w-11 shrink-0 rounded-md object-cover shadow"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-text-primary">
                          {book.title}
                        </p>

                        <p className="mt-1 truncate text-xs text-text-secondary">
                          {book.author || "Unknown author"}
                        </p>

                        <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
                          {book.category && (
                            <span className="max-w-[45%] truncate rounded-full bg-brand-light px-2 py-1 text-[10px] font-medium text-brand">
                              {book.category}
                            </span>
                          )}

                          {Array.isArray(book.subjects) &&
                            book.subjects.slice(0, 1).map((subject) => (
                              <span
                                key={subject}
                                className="max-w-[45%] truncate text-[10px] text-text-secondary"
                              >
                                {subject}
                              </span>
                            ))}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!loading && !searchError && books.length > 0 && (
                <button
                  onClick={handleViewAll}
                  className="flex w-full items-center justify-between border-t border-border-light bg-background-card px-5 py-3.5 text-left transition hover:bg-brand-light/30"
                >
                  <span className="text-sm font-medium text-text-primary">
                    View all results for{" "}
                    <span className="text-brand">
                      &quot;{search.trim()}&quot;
                    </span>
                  </span>
                  <LuArrowRight size={17} className="shrink-0 text-text-secondary" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
