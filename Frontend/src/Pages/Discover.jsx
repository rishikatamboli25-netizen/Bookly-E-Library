import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  LuArrowRight,
  LuSearch,
  LuX,
  LuSlidersHorizontal,
} from "react-icons/lu";

import {
  useSearchParams,
} from "react-router-dom";

import Cardtwo from "../compontents/Cardtwo";
import CardtwoSkeleton from "../compontents/Loading/CardtwoSkeleton";

import {
  getCatalog,
  refreshCatalog,
  getFriendlyError,
} from "../utils/api";
import "../App.css";

// ============================================================
// HELPERS
// ============================================================

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const toArray = (value) =>
  Array.isArray(value)
    ? value
    : [];

const formatReleaseDate = (
  date
) => {
  if (!date) {
    return null;
  }

  const parsed =
    new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return null;
  }

  return parsed.toLocaleDateString(
    undefined,
    {
      month: "short",
      year: "numeric",
    }
  );
};

// ============================================================
// SEARCH MATCH SCORE
// ============================================================

const getSearchScore = (
  book,
  query
) => {
  if (!query) {
    return 0;
  }

  const q =
    normalize(query);

  const title =
    normalize(book.title);

  const author =
    normalize(book.author);

  const description =
    normalize(
      book.description
    );

  const category =
    normalize(
      book.category
    );

  const subjects =
    toArray(
      book.subjects
    ).map(normalize);

  let score = 0;

  // Exact title
  if (title === q) {
    score += 100;
  }

  // Title begins with search
  if (
    title.startsWith(q)
  ) {
    score += 60;
  }

  // Title contains search
  if (
    title.includes(q)
  ) {
    score += 40;
  }

  // Author
  if (
    author === q
  ) {
    score += 50;
  }

  if (
    author.includes(q)
  ) {
    score += 25;
  }

  // Category
  if (
    category.includes(q)
  ) {
    score += 15;
  }

  // Subjects
  subjects.forEach(
    (subject) => {
      if (
        subject === q
      ) {
        score += 20;
      } else if (
        subject.includes(q)
      ) {
        score += 10;
      }
    }
  );

  // Description
  if (
    description.includes(q)
  ) {
    score += 8;
  }

  return score;
};

// ============================================================
// COMPONENT
// ============================================================

const Discover = () => {
  const [books, setBooks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [searchParams, setSearchParams] =
    useSearchParams();

  const [
    searchInput,
    setSearchInput,
  ] = useState(
    searchParams.get(
      "q"
    ) || ""
  );

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState(
    searchParams.get(
      "category"
    ) || "All"
  );

  const [
    selectedSubject,
    setSelectedSubject,
  ] = useState(
    searchParams.get(
      "subject"
    ) || "All"
  );

  // Refs for editorial rows
  const popularBooksRef =
    useRef(null);

  const newReleasesRef =
    useRef(null);

  // ==========================================================
  // GET BOOKS
  // ==========================================================

  useEffect(() => {
    let active = true;

    const loadBooks = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const data = await getCatalog();

        if (active) {
          setBooks(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!active) return;

        setBooks([]);
        setLoadError(
          getFriendlyError(
            error,
            "We couldn't load the library right now."
          )
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    loadBooks();

    return () => {
      active = false;
    };
  }, []);

  const handleRetryBooks = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const data = await refreshCatalog();
      setBooks(Array.isArray(data) ? data : []);
    } catch (error) {
      setBooks([]);
      setLoadError(
        getFriendlyError(
          error,
          "We couldn't load the library right now."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // SYNC URL → STATE
  // ==========================================================

  useEffect(() => {
    const urlCategory =
      searchParams.get(
        "category"
      ) || "All";

    const urlSubject =
      searchParams.get(
        "subject"
      ) || "All";

    const urlQuery =
      searchParams.get(
        "q"
      ) || "";

    setSelectedCategory(
      urlCategory
    );

    setSelectedSubject(
      urlSubject
    );

    setSearchInput(
      urlQuery
    );
  }, [searchParams]);

  // ==========================================================
  // CATEGORIES
  // ==========================================================

  const categories =
    useMemo(() => {
      const counts =
        new Map();

      books.forEach(
        (book) => {
          const category =
            book.category;

          if (!category) {
            return;
          }

          counts.set(
            category,
            (counts.get(
              category
            ) || 0) + 1
          );
        }
      );

      return [
        "All",
        ...[
          ...counts.entries(),
        ]
          .sort(
            (a, b) =>
              b[1] - a[1]
          )
          .map(
            ([category]) =>
              category
          ),
      ];
    }, [books]);

  // ==========================================================
  // SUBJECTS
  // ==========================================================

  const subjects =
    useMemo(() => {
      const counts =
        new Map();

      books.forEach(
        (book) => {
          toArray(
            book.subjects
          ).forEach(
            (subject) => {
              if (!subject) {
                return;
              }

              counts.set(
                subject,
                (counts.get(
                  subject
                ) || 0) + 1
              );
            }
          );
        }
      );

      return [
        "All",
        ...[
          ...counts.entries(),
        ]
          .sort(
            (a, b) =>
              b[1] - a[1]
          )
          .slice(0, 14)
          .map(
            ([subject]) =>
              subject
          ),
      ];
    }, [books]);

  // ==========================================================
  // POPULAR
  // ==========================================================

  const popularBooks =
    useMemo(() => {
      return [...books]
        .filter(
          (book) =>
            Number.isFinite(
              Number(
                book.catalogRank
              )
            )
        )
        .sort(
          (a, b) =>
            Number(
              a.catalogRank
            ) -
            Number(
              b.catalogRank
            )
        )
        .slice(0, 14);
    }, [books]);

  // ==========================================================
  // NEW RELEASES
  // ==========================================================

  const newReleases =
    useMemo(() => {
      return [...books]
        .filter(
          (book) =>
            book.releaseDate
        )
        .sort(
          (a, b) =>
            new Date(
              b.releaseDate
            ) -
            new Date(
              a.releaseDate
            )
        )
        .slice(0, 14);
    }, [books]);

  // ==========================================================
  // SEARCH + FILTER
  // ==========================================================

  const filteredBooks =
    useMemo(() => {
      const query =
        normalize(
          searchParams.get(
            "q"
          )
        );

      const category =
        normalize(
          selectedCategory
        );

      const subject =
        normalize(
          selectedSubject
        );

      const hasQuery =
        query.length > 0;

      const filtered =
        books.filter(
          (book) => {
            // ----------------------------------------------
            // Category
            // ----------------------------------------------

            if (
              category &&
              category !== "all" &&
              normalize(
                book.category
              ) !== category
            ) {
              return false;
            }

            // ----------------------------------------------
            // Subject
            // ----------------------------------------------

            if (
              subject &&
              subject !== "all"
            ) {
              const bookSubjects =
                toArray(
                  book.subjects
                ).map(
                  normalize
                );

              if (
                !bookSubjects.includes(
                  subject
                )
              ) {
                return false;
              }
            }

            // ----------------------------------------------
            // Search
            // ----------------------------------------------

            if (
              hasQuery
            ) {
              const score =
                getSearchScore(
                  book,
                  query
                );

              if (
                score <= 0
              ) {
                return false;
              }
            }

            return true;
          }
        );

      // Search results get relevance ordering.
      if (hasQuery) {
        return filtered.sort(
          (a, b) =>
            getSearchScore(
              b,
              query
            ) -
            getSearchScore(
              a,
              query
            )
        );
      }

      // Filter-only results:
      // newest Standard Ebooks releases first.
      return filtered.sort(
        (a, b) => {
          if (
            !a.releaseDate &&
            !b.releaseDate
          ) {
            return 0;
          }

          if (
            !a.releaseDate
          ) {
            return 1;
          }

          if (
            !b.releaseDate
          ) {
            return -1;
          }

          return (
            new Date(
              b.releaseDate
            ) -
            new Date(
              a.releaseDate
            )
          );
        }
      );
    }, [
      books,
      searchParams,
      selectedCategory,
      selectedSubject,
    ]);

  // ==========================================================
  // IS RESULT MODE?
  // ==========================================================

  const isResultMode =
    Boolean(
      searchParams.get(
        "q"
      ) ||
        (
          selectedCategory &&
          selectedCategory !==
            "All"
        ) ||
        (
          selectedSubject &&
          selectedSubject !==
            "All"
        )
    );

  // ==========================================================
  // RESULTS TITLE
  // ==========================================================

  const resultsTitle =
    useMemo(() => {
      const query =
        searchParams.get(
          "q"
        );

      if (query) {
        return `Results for "${query}"`;
      }

      if (
        selectedSubject !==
        "All"
      ) {
        return selectedSubject;
      }

      if (
        selectedCategory !==
        "All"
      ) {
        return selectedCategory;
      }

      return "All Books";
    }, [
      searchParams,
      selectedCategory,
      selectedSubject,
    ]);

  // ==========================================================
  // UPDATE URL
  // ==========================================================

  const updateParams =
    ({
      query = searchParams.get(
        "q"
      ) || "",
      category =
        selectedCategory,
      subject =
        selectedSubject,
    }) => {
      const nextParams =
        new URLSearchParams();

      const cleanQuery =
        query.trim();

      if (cleanQuery) {
        nextParams.set(
          "q",
          cleanQuery
        );
      }

      if (
        category &&
        category !== "All"
      ) {
        nextParams.set(
          "category",
          category
        );
      }

      if (
        subject &&
        subject !== "All"
      ) {
        nextParams.set(
          "subject",
          subject
        );
      }

      setSearchParams(
        nextParams
      );
    };

  // ==========================================================
  // SEARCH SUBMIT
  // ==========================================================

  const handleSearchSubmit =
    (event) => {
      event.preventDefault();

      updateParams({
        query:
          searchInput,
        category:
          selectedCategory,
        subject:
          selectedSubject,
      });
    };

  // ==========================================================
  // CATEGORY
  // ==========================================================

  const handleCategory =
    (category) => {
      setSelectedCategory(
        category
      );

      setSelectedSubject(
        "All"
      );

      updateParams({
        query:
          searchParams.get(
            "q"
          ) || "",
        category,
        subject: "All",
      });
    };

  // ==========================================================
  // SUBJECT
  // ==========================================================

  const handleSubject =
    (subject) => {
      setSelectedSubject(
        subject
      );

      updateParams({
        query:
          searchParams.get(
            "q"
          ) || "",
        category:
          selectedCategory,
        subject,
      });
    };

  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  const clearFilters =
    () => {
      setSearchInput("");
      setSelectedCategory(
        "All"
      );
      setSelectedSubject(
        "All"
      );

      setSearchParams({});
    };

  // ==========================================================
  // HORIZONTAL SCROLLS
  // ==========================================================

  const scrollRow = (
    ref
  ) => {
    if (!ref.current) {
      return;
    }

    ref.current.scrollBy({
      left: 500,
      behavior: "smooth",
    });
  };

  // ==========================================================
  // CATEGORY COUNTS
  // ==========================================================

  const resultCount =
    filteredBooks.length;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/* ======================================================
          DISCOVER HEADER
      ====================================================== */}

      <section
        className="
          mx-auto
          max-w-[1600px]
          px-4
          pt-5
          sm:px-8
          sm:pt-10
          md:px-12
          lg:px-20
        "
      >
        <div>
          <h1
            className="
              text-2xl
              font-semibold
              tracking-tight
              text-text-primary
              sm:text-3xl
              md:text-4xl
            "
          >
            Discover
          </h1>

          <p
            className="
              mt-1
              text-sm
              text-text-secondary
              sm:text-base
            "
          >
            Find something worth getting
            lost in.
          </p>
        </div>

        {/* ==================================================
            SEARCH
        ================================================== */}

        <form
          onSubmit={
            handleSearchSubmit
          }
          className="
            relative
            mt-6
            max-w-3xl
          "
        >
          <LuSearch
            className="
              pointer-events-none
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-text-secondary
            "
            size={18}
          />

          <input
            value={
              searchInput
            }
            onChange={(event) =>
              setSearchInput(
                event.target.value
              )
            }
            placeholder="Search books, authors, subjects..."
            className="
              h-12
              w-full
              rounded-full
              border
              border-border-light
              bg-background-card
              pl-11
              pr-24
              text-sm
              text-text-primary
              outline-none
              placeholder:text-text-secondary
              focus:border-brand/40
              focus:ring-2
              focus:ring-brand/10
            "
          />

          {searchInput && (
            <button
              type="button"
              onClick={() =>
                setSearchInput("")
              }
              className="
                absolute
                right-20
                top-1/2
                -translate-y-1/2
                rounded-full
                p-1.5
                text-text-secondary
                transition-colors
                hover:bg-gray-100
                hover:text-text-primary
              "
              aria-label="Clear search"
            >
              <LuX size={16} />
            </button>
          )}

          <button
            type="submit"
            className="
              absolute
              right-1.5
              top-1/2
              -translate-y-1/2
              rounded-full
              bg-brand
              px-4
              py-2
              text-xs
              font-semibold
              text-white
              transition-all
              hover:-translate-y-1/2
              hover:shadow-md
            "
          >
            Search
          </button>
        </form>

        {/* ==================================================
            CATEGORY FILTERS
        ================================================== */}

        <div className="mt-7">
          <div
            className="
              mb-3
              flex
              items-center
              gap-2
              text-xs
              font-medium
              uppercase
              tracking-[0.12em]
              text-text-secondary
            "
          >
            <LuSlidersHorizontal
              size={14}
            />

            Browse by category
          </div>

          <div
            className="
              scrollbar-hide
              flex
              gap-2
              overflow-x-auto
              pb-1
            "
          >
            {categories.map(
              (category) => {
                const active =
                  normalize(
                    selectedCategory
                  ) ===
                  normalize(
                    category
                  );

                return (
                  <button
                    key={category}
                    onClick={() =>
                      handleCategory(
                        category
                      )
                    }
                    className={`
                      shrink-0
                      rounded-full
                      border
                      px-4
                      py-2
                      text-sm
                      transition-all
                      ${
                        active
                          ? "border-brand bg-brand text-white"
                          : "border-border-light bg-background-card text-text-secondary hover:border-brand/30 hover:text-text-primary"
                      }
                    `}
                  >
                    {category}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* ==================================================
            SUBJECT FILTERS
        ================================================== */}

        <div className="mt-5">
          <div
            className="
              mb-3
              text-xs
              font-medium
              uppercase
              tracking-[0.12em]
              text-text-secondary
            "
          >
            Subjects
          </div>

          <div
            className="
              scrollbar-hide
              flex
              gap-2
              overflow-x-auto
              pb-1
            "
          >
            {subjects.map(
              (subject) => {
                const active =
                  normalize(
                    selectedSubject
                  ) ===
                  normalize(
                    subject
                  );

                return (
                  <button
                    key={subject}
                    onClick={() =>
                      handleSubject(
                        subject
                      )
                    }
                    className={`
                      shrink-0
                      rounded-full
                      border
                      px-3.5
                      py-1.5
                      text-xs
                      transition-all
                      ${
                        active
                          ? "border-text-primary bg-text-primary text-white"
                          : "border-border-light bg-background-card text-text-secondary hover:text-text-primary"
                      }
                    `}
                  >
                    {subject}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* ==================================================
            ACTIVE FILTERS
        ================================================== */}

        {isResultMode && (
          <div
            className="
              mt-5
              flex
              flex-wrap
              items-center
              gap-2
            "
          >
            <span
              className="
                text-sm
                text-text-secondary
              "
            >
              {resultCount}{" "}
              {resultCount === 1
                ? "book"
                : "books"}
            </span>

            <span className="text-text-secondary">
              ·
            </span>

            <button
              onClick={
                clearFilters
              }
              className="
                flex
                items-center
                gap-1.5
                text-sm
                text-text-secondary
                transition-colors
                hover:text-text-primary
              "
            >
              Clear filters
              <LuX size={14} />
            </button>
          </div>
        )}
      </section>

      {loadError && !loading && (
        <section className="mx-auto max-w-[1600px] px-4 pt-10 sm:px-8 md:px-12 lg:px-20">
          <div className="rounded-2xl border border-border-light bg-background-card p-6 shadow-sm">
            <p className="text-sm font-semibold text-text-primary">
              We couldn't load the library
            </p>
            <p className="mt-1 max-w-xl text-sm leading-6 text-text-secondary">
              {loadError}
            </p>
            <button
              type="button"
              onClick={handleRetryBooks}
              className="mt-4 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Try again
            </button>
          </div>
        </section>
      )}

      {/* ======================================================
          EDITORIAL DISCOVER
      ====================================================== */}

      {!loading && !loadError &&
        !isResultMode && (
          <>
            {/* ==================================================
                POPULAR
            ================================================== */}

            <section
              className="
                mx-auto
                max-w-[1600px]
                px-4
                pt-12
                sm:px-8
                md:px-12
                lg:px-20
              "
            >
              <div
                className="
                  mb-4
                  flex
                  items-end
                  justify-between
                  sm:mb-6
                "
              >
                <div>
                  <h2
                    className="
                      text-lg
                      font-semibold
                      text-text-primary
                      sm:text-xl
                      md:text-2xl
                    "
                  >
                    Popular on Standard Ebooks
                  </h2>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-text-secondary
                      sm:text-sm
                    "
                  >
                    A look at the books readers
                    are gravitating toward.
                  </p>
                </div>

                <button
                  onClick={() =>
                    scrollRow(
                      popularBooksRef
                    )
                  }
                  className="
                    flex
                    shrink-0
                    cursor-pointer
                    items-center
                    gap-2
                    text-sm
                    text-text-secondary
                    transition-colors
                    hover:text-text-primary
                    sm:text-base
                  "
                >
                  Scroll
                  <LuArrowRight
                    className="text-base"
                  />
                </button>
              </div>

              <div
                ref={
                  popularBooksRef
                }
                className="
                  scrollbar-hide
                  flex
                  gap-4
                  overflow-x-auto
                  scroll-smooth
                  py-2
                  sm:gap-6
                "
              >
                {popularBooks.map(
                  (book) => (
                    <div
                      key={
                        book.identifier
                      }
                      className="shrink-0"
                    >
                      <Cardtwo
                        book={book}
                      />
                    </div>
                  )
                )}
              </div>
            </section>

            {/* ==================================================
                NEW RELEASES
            ================================================== */}

            <section
              className="
                mx-auto
                max-w-[1600px]
                px-4
                pt-14
                sm:px-8
                md:px-12
                lg:px-20
              "
            >
              <div
                className="
                  mb-4
                  flex
                  items-end
                  justify-between
                  sm:mb-6
                "
              >
                <div>
                  <h2
                    className="
                      text-lg
                      font-semibold
                      text-text-primary
                      sm:text-xl
                      md:text-2xl
                    "
                  >
                    New Releases
                  </h2>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-text-secondary
                      sm:text-sm
                    "
                  >
                    Recently released editions
                    from Standard Ebooks.
                  </p>
                </div>

                <button
                  onClick={() =>
                    scrollRow(
                      newReleasesRef
                    )
                  }
                  className="
                    flex
                    shrink-0
                    cursor-pointer
                    items-center
                    gap-2
                    text-sm
                    text-text-secondary
                    transition-colors
                    hover:text-text-primary
                    sm:text-base
                  "
                >
                  Scroll
                  <LuArrowRight
                    className="text-base"
                  />
                </button>
              </div>

              <div
                ref={
                  newReleasesRef
                }
                className="
                  scrollbar-hide
                  flex
                  gap-4
                  overflow-x-auto
                  scroll-smooth
                  py-2
                  sm:gap-6
                "
              >
                {newReleases.map(
                  (book) => (
                    <div
                      key={
                        book.identifier
                      }
                      className="shrink-0"
                    >
                      <Cardtwo
                        book={book}
                      />
                    </div>
                  )
                )}
              </div>
            </section>

            {/* ==================================================
                SUBJECT EXPLORATION
            ================================================== */}

            <section
              className="
                mx-auto
                mb-20
                max-w-[1600px]
                px-4
                pt-16
                sm:px-8
                md:px-12
                lg:px-20
              "
            >
              <div>
                <h2
                  className="
                    text-lg
                    font-semibold
                    text-text-primary
                    sm:text-xl
                    md:text-2xl
                  "
                >
                  Browse by Subject
                </h2>

                <p
                  className="
                    mt-1
                    text-xs
                    text-text-secondary
                    sm:text-sm
                  "
                >
                  Follow an idea, not just a
                  genre.
                </p>
              </div>

              <div
                className="
                  mt-5
                  flex
                  flex-wrap
                  gap-3
                "
              >
                {subjects
                  .filter(
                    (subject) =>
                      subject !==
                      "All"
                  )
                  .map(
                    (subject) => (
                      <button
                        key={
                          subject
                        }
                        onClick={() =>
                          handleSubject(
                            subject
                          )
                        }
                        className="
                          rounded-full
                          border
                          border-border-light
                          bg-background-card
                          px-4
                          py-2.5
                          text-sm
                          text-text-secondary
                          shadow-sm
                          transition-all
                          duration-200
                          hover:-translate-y-0.5
                          hover:border-brand/30
                          hover:text-text-primary
                          hover:shadow-md
                        "
                      >
                        {subject}
                      </button>
                    )
                  )}
              </div>
            </section>
          </>
        )}

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading && (
        <section
          className="
            mx-auto
            max-w-[1600px]
            px-4
            pt-12
            sm:px-8
            md:px-12
            lg:px-20
          "
        >
          <div
            className="
              grid
              grid-cols-2
              gap-4
              sm:grid-cols-3
              md:grid-cols-4
              lg:grid-cols-5
              xl:grid-cols-6
            "
          >
            {Array.from({
              length: 12,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="shrink-0"
                >
                  <CardtwoSkeleton />
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* ======================================================
          SEARCH / FILTER RESULTS
      ====================================================== */}

      {!loading && !loadError &&
        isResultMode && (
          <section
            className="
              mx-auto
              mb-20
              max-w-[1600px]
              px-4
              pt-10
              sm:px-8
              md:px-12
              lg:px-20
            "
          >
            <div
              className="
                mb-6
                flex
                items-end
                justify-between
                gap-4
              "
            >
              <div>
                <h2
                  className="
                    text-lg
                    font-semibold
                    text-text-primary
                    sm:text-xl
                    md:text-2xl
                  "
                >
                  {resultsTitle}
                </h2>

                <p
                  className="
                    mt-1
                    text-xs
                    text-text-secondary
                    sm:text-sm
                  "
                >
                  {resultCount}{" "}
                  {resultCount ===
                  1
                    ? "book"
                    : "books"}{" "}
                  found
                </p>
              </div>
            </div>

            {filteredBooks.length >
            0 ? (
              <div
                className="
                  grid
                  grid-cols-2
                  gap-x-3
                  gap-y-8
                  sm:grid-cols-3
                  sm:gap-x-5
                  md:grid-cols-4
                  lg:grid-cols-5
                  xl:grid-cols-6
                "
              >
                {filteredBooks.map(
                  (book) => (
                    <div
                      key={
                        book.identifier
                      }
                      className="
                        flex
                        justify-center
                      "
                    >
                      <Cardtwo
                        book={book}
                      />
                    </div>
                  )
                )}
              </div>
            ) : (
              <div
                className="
                  flex
                  min-h-[320px]
                  flex-col
                  items-center
                  justify-center
                  rounded-3xl
                  border
                  border-border-light
                  bg-background-card
                  px-6
                  text-center
                "
              >
                <div
                  className="
                    text-lg
                    font-semibold
                    text-text-primary
                  "
                >
                  Nothing here yet.
                </div>

                <p
                  className="
                    mt-2
                    max-w-md
                    text-sm
                    leading-6
                    text-text-secondary
                  "
                >
                  Try another search or
                  explore a different
                  category or subject.
                </p>

                <button
                  onClick={
                    clearFilters
                  }
                  className="
                    mt-5
                    rounded-full
                    bg-brand
                    px-5
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    transition-all
                    hover:-translate-y-0.5
                    hover:shadow-md
                  "
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        )}
    </>
  );
};

export default Discover;