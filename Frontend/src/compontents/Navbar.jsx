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

import {
  useNavigate,
} from "react-router-dom";

import axios from "axios";

const API_BASE =
  import.meta.env.VITE_BASE_URL ||
  "http://localhost:5000";

// ============================================================
// HELPERS
// ============================================================

const getCoverUrl = (identifier) => {
  if (!identifier) {
    return "";
  }

  return `${API_BASE}/api/images/cover/${identifier}`;
};

// ============================================================
// NAVBAR
// ============================================================

const Navbar = ({
  openSidebar,
}) => {
  const navigate =
    useNavigate();

  const searchInputRef =
    useRef(null);

  const searchContainerRef =
    useRef(null);

  const abortControllerRef =
    useRef(null);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    books,
    setBooks,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    showResults,
    setShowResults,
  ] = useState(false);

  // ==========================================================
  // SEARCH BOOKS
  // ==========================================================

  useEffect(() => {
    const query =
      search.trim();

    if (!query) {
      setBooks([]);
      setLoading(false);
      setShowResults(false);

      if (
        abortControllerRef.current
      ) {
        abortControllerRef.current.abort();
      }

      return;
    }

    setShowResults(true);

    const timer =
      setTimeout(
        async () => {
          // Cancel previous request
          if (
            abortControllerRef.current
          ) {
            abortControllerRef.current.abort();
          }

          const controller =
            new AbortController();

          abortControllerRef.current =
            controller;

          try {
            setLoading(true);

            const response =
              await axios.get(
                `${API_BASE}/api/book/getBooks`,
                {
                  params: {
                    search: query,
                    limit: 6,
                  },

                  signal:
                    controller.signal,
                }
              );

            if (
              !controller.signal
                .aborted
            ) {
              setBooks(
                Array.isArray(
                  response.data
                )
                  ? response.data
                  : []
              );
            }
          } catch (error) {
            // Ignore cancelled requests
            if (
              error?.code ===
                "ERR_CANCELED" ||
              error?.name ===
                "CanceledError"
            ) {
              return;
            }

            console.error(
              "Search error:",
              error
            );

            setBooks([]);
          } finally {
            if (
              !controller.signal
                .aborted
            ) {
              setLoading(false);
            }
          }
        },
        300
      );

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  // ==========================================================
  // CLEANUP REQUEST
  // ==========================================================

  useEffect(() => {
    return () => {
      if (
        abortControllerRef.current
      ) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ==========================================================
  // CLICK OUTSIDE
  // ==========================================================

  useEffect(() => {
    const handleClickOutside =
      (event) => {
        if (
          searchContainerRef.current &&
          !searchContainerRef.current.contains(
            event.target
          )
        ) {
          setShowResults(false);
        }
      };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // ==========================================================
  // CLEAR SEARCH
  // ==========================================================

  const clearSearch = () => {
    setSearch("");
    setBooks([]);
    setShowResults(false);

    searchInputRef.current?.focus();
  };

  // ==========================================================
  // OPEN BOOK
  // ==========================================================

  const handleBookClick = (
    book
  ) => {
    if (
      !book?.identifier
    ) {
      return;
    }

    clearSearch();

    navigate(
      `/BookDetail/${book.identifier}`
    );
  };

  // ==========================================================
  // VIEW ALL RESULTS
  // ==========================================================

  const handleViewAll = () => {
    const query =
      search.trim();

    if (!query) {
      return;
    }

    setShowResults(false);

    navigate(
      `/Discover?q=${encodeURIComponent(
        query
      )}`
    );
  };

  // ==========================================================
  // KEYBOARD
  // ==========================================================

  const handleKeyDown = (
    event
  ) => {
    // Escape → close search dropdown
    if (
      event.key === "Escape"
    ) {
      setShowResults(false);
      return;
    }

    // Enter → full Discover search
    if (
      event.key === "Enter" &&
      search.trim()
    ) {
      event.preventDefault();
      handleViewAll();
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <nav
      className="
        fixed
        left-0
        right-0
        top-0
        z-30
        h-20
        border-b
        border-border-light
        bg-background/80
        backdrop-blur-xl
      "
    >
      <div
        className="
          flex
          h-full
          items-center
          gap-3
          px-4
          sm:gap-4
          sm:px-6
          lg:px-8
        "
      >
        {/* ==================================================
            MOBILE MENU
        ================================================== */}

        <button
          onClick={
            openSidebar
          }
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-lg
            transition-colors
            hover:bg-brand-light
            md:hidden
          "
          aria-label="Open menu"
        >
          <LuMenu
            size={22}
          />
        </button>

        {/* ==================================================
            SEARCH CONTAINER
        ================================================== */}

        <div
          ref={
            searchContainerRef
          }
          className="
            relative
            mx-auto
            w-full
            max-w-full
            sm:max-w-xl
            lg:max-w-2xl
            xl:max-w-3xl
          "
        >
          {/* =================================================
              SEARCH BAR
          ================================================= */}

          <div
            className="
              flex
              h-12
              w-full
              items-center
              gap-3
              rounded-xl
              border
              border-border-light
              bg-background-card
              px-4
              shadow-md
              transition-all
              duration-300
              focus-within:border-brand/40
              focus-within:shadow-lg
            "
          >
            <LuSearch
              size={20}
              className="
                shrink-0
                text-text-secondary
              "
            />

            <input
              ref={
                searchInputRef
              }
              type="text"
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              onFocus={() => {
                if (
                  search.trim()
                ) {
                  setShowResults(
                    true
                  );
                }
              }}
              onKeyDown={
                handleKeyDown
              }
              placeholder="Search books, authors, subjects..."
              autoComplete="off"
              className="
                h-full
                min-w-0
                flex-1
                bg-transparent
                text-sm
                outline-none
                placeholder:text-text-secondary
              "
            />

            {search.length >
              0 && (
              <button
                type="button"
                onClick={
                  clearSearch
                }
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  text-text-secondary
                  transition
                  hover:bg-brand-light
                  hover:text-brand
                "
                aria-label="Clear search"
              >
                <LuX
                  size={18}
                />
              </button>
            )}
          </div>

          {/* =================================================
              SEARCH RESULTS
          ================================================= */}

          {showResults &&
            search.trim() && (
              <div
                className="
                  absolute
                  left-0
                  right-0
                  mt-3
                  max-h-[28rem]
                  overflow-hidden
                  rounded-2xl
                  border
                  border-border-light
                  bg-background-card
                  shadow-xl
                  z-50
                "
              >
                {/* ==========================================
                    LOADING
                ========================================== */}

                {loading && (
                  <div
                    className="
                      flex
                      items-center
                      gap-3
                      px-5
                      py-5
                    "
                  >
                    <LuSearch
                      size={18}
                      className="
                        animate-pulse
                        text-brand
                      "
                    />

                    <span
                      className="
                        text-sm
                        text-text-secondary
                      "
                    >
                      Searching...
                    </span>
                  </div>
                )}

                {/* ==========================================
                    EMPTY
                ========================================== */}

                {!loading &&
                  books.length ===
                    0 && (
                    <div
                      className="
                        px-6
                        py-8
                        text-center
                      "
                    >
                      <div
                        className="
                          mx-auto
                          mb-3
                          flex
                          h-10
                          w-10
                          items-center
                          justify-center
                          rounded-full
                          bg-brand-light
                        "
                      >
                        <LuSearch
                          size={18}
                          className="text-brand"
                        />
                      </div>

                      <p
                        className="
                          text-sm
                          font-medium
                          text-text-primary
                        "
                      >
                        No books found
                      </p>

                      <p
                        className="
                          mt-1
                          text-xs
                          text-text-secondary
                        "
                      >
                        Try another title,
                        author, or subject.
                      </p>
                    </div>
                  )}

                {/* ==========================================
                    BOOK RESULTS
                ========================================== */}

                {!loading &&
                  books.length >
                    0 && (
                    <div
                      className="
                        max-h-[21rem]
                        overflow-y-auto
                      "
                    >
                      {books.map(
                        (book) => (
                          <button
                            key={
                              book._id ||
                              book.identifier
                            }
                            onClick={() =>
                              handleBookClick(
                                book
                              )
                            }
                            className="
                              flex
                              w-full
                              items-center
                              gap-4
                              border-b
                              border-border-light
                              px-4
                              py-3
                              text-left
                              transition
                              hover:bg-brand-light/40
                              last:border-b-0
                            "
                          >
                            {/* COVER */}

                            <img
                              src={getCoverUrl(
                                book.identifier
                              )}
                              alt={
                                book.title
                              }
                              className="
                                h-16
                                w-11
                                shrink-0
                                rounded-md
                                object-cover
                                shadow
                              "
                            />

                            {/* INFO */}

                            <div
                              className="
                                min-w-0
                                flex-1
                              "
                            >
                              <p
                                className="
                                  truncate
                                  text-sm
                                  font-semibold
                                  text-text-primary
                                "
                              >
                                {
                                  book.title
                                }
                              </p>

                              <p
                                className="
                                  mt-1
                                  truncate
                                  text-xs
                                  text-text-secondary
                                "
                              >
                                {
                                  book.author ||
                                  "Unknown author"
                                }
                              </p>

                              <div
                                className="
                                  mt-1.5
                                  flex
                                  min-w-0
                                  items-center
                                  gap-1.5
                                "
                              >
                                {book.category && (
                                  <span
                                    className="
                                      max-w-[45%]
                                      truncate
                                      rounded-full
                                      bg-brand-light
                                      px-2
                                      py-1
                                      text-[10px]
                                      font-medium
                                      text-brand
                                    "
                                  >
                                    {
                                      book.category
                                    }
                                  </span>
                                )}

                                {Array.isArray(
                                  book.subjects
                                ) &&
                                  book.subjects
                                    .slice(
                                      0,
                                      1
                                    )
                                    .map(
                                      (
                                        subject
                                      ) => (
                                        <span
                                          key={
                                            subject
                                          }
                                          className="
                                            max-w-[45%]
                                            truncate
                                            text-[10px]
                                            text-text-secondary
                                          "
                                        >
                                          {
                                            subject
                                          }
                                        </span>
                                      )
                                    )}
                              </div>
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  )}

                {/* ==========================================
                    VIEW ALL
                ========================================== */}

                {!loading &&
                  books.length >
                    0 && (
                    <button
                      onClick={
                        handleViewAll
                      }
                      className="
                        flex
                        w-full
                        items-center
                        justify-between
                        border-t
                        border-border-light
                        bg-background-card
                        px-5
                        py-3.5
                        text-left
                        transition
                        hover:bg-brand-light/30
                      "
                    >
                      <span
                        className="
                          text-sm
                          font-medium
                          text-text-primary
                        "
                      >
                        View all results for{" "}
                        <span className="text-brand">
                          "{search.trim()}"
                        </span>
                      </span>

                      <LuArrowRight
                        size={17}
                        className="
                          shrink-0
                          text-text-secondary
                        "
                      />
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