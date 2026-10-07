import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  HiArrowLeft,
  HiOutlineBookmark,
  HiOutlineBookOpen,
} from "react-icons/hi";

import {
  HiOutlineCheckCircle,
} from "react-icons/hi2";

import {
  LuChevronDown,
  LuChevronUp,
} from "react-icons/lu";

import axios from "axios";

import BookDetailSkeleton from "../compontents/Loading/BookDetailSkeleton";

// ============================================================
// CONFIG
// ============================================================

const API_BASE =
  import.meta.env.VITE_BASE_URL ||
  "http://localhost:5000";

// ============================================================
// HELPERS
// ============================================================

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getCoverUrl = (identifier) => {
  if (!identifier) {
    return "";
  }

  return `${API_BASE}/api/images/cover/${identifier}`;
};

const formatReleaseDate = (date) => {
  if (!date) {
    return null;
  }

  const parsedDate = new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return null;
  }

  return parsedDate.toLocaleDateString(
    undefined,
    {
      month: "short",
      year: "numeric",
    }
  );
};

// ============================================================
// SIMILARITY SCORE
// ============================================================

const getSimilarityScore = (
  currentBook,
  candidate
) => {
  if (
    !currentBook ||
    !candidate
  ) {
    return 0;
  }

  let score = 0;

  // Same category
  if (
    normalize(
      currentBook.category
    ) ===
      normalize(
        candidate.category
      )
  ) {
    score += 8;
  }

  // Same author
  if (
    normalize(
      currentBook.author
    ) ===
      normalize(
        candidate.author
      )
  ) {
    score += 10;
  }

  const currentSubjects =
    Array.isArray(
      currentBook.subjects
    )
      ? currentBook.subjects.map(
          normalize
        )
      : [];

  const candidateSubjects =
    Array.isArray(
      candidate.subjects
    )
      ? candidate.subjects.map(
          normalize
        )
      : [];

  // Shared subjects
  currentSubjects.forEach(
    (subject) => {
      if (
        subject &&
        candidateSubjects.includes(
          subject
        )
      ) {
        score += 4;
      }
    }
  );

  return score;
};

// ============================================================
// COMPONENT
// ============================================================

function BookDetail() {
  const navigate =
    useNavigate();

  const { bookId } =
    useParams();

  const [book, setBook] =
    useState(null);

  const [readBooks, setReadBooks] =
    useState([]);

  const [
    readBooksLoading,
    setReadBooksLoading,
  ] = useState(true);

  const [
    userProgress,
    setUserProgress,
  ] = useState(null);

  const [
    relatedBooks,
    setRelatedBooks,
  ] = useState([]);

  const [
    relatedLoading,
    setRelatedLoading,
  ] = useState(true);

  const [
    descriptionExpanded,
    setDescriptionExpanded,
  ] = useState(false);

  // ==========================================================
  // FETCH BOOK
  // ==========================================================

  useEffect(() => {
    const findBook = async () => {
      try {
        const response =
          await axios.get(
            `${API_BASE}/api/book/${bookId}`
          );

        setBook(
          response.data
        );
      } catch (error) {
        console.error(
          "Error fetching book:",
          error
        );
      }
    };

    findBook();
  }, [bookId]);

  // ==========================================================
  // FETCH USER PROGRESS
  // ==========================================================

  useEffect(() => {
    const getUserProgress =
      async () => {
        const token =
          localStorage.getItem(
            "token"
          );

        if (!token) {
          setUserProgress(null);
          return;
        }

        try {
          const response =
            await axios.get(
              `${API_BASE}/api/users/get-user-progress`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          if (
            response.data?.progress
          ) {
            setUserProgress(
              response.data.progress
            );
          }
        } catch (error) {
          console.error(
            "Error fetching progress:",
            error
          );
        }
      };

    getUserProgress();
  }, [bookId]);

  // ==========================================================
  // CHECK READ BOOKS
  // ==========================================================

  useEffect(() => {
    const checkAsRead =
      async () => {
        const token =
          localStorage.getItem(
            "token"
          );

        if (!token) {
          setReadBooks([]);
          setReadBooksLoading(
            false
          );
          return;
        }

        try {
          const response =
            await axios.get(
              `${API_BASE}/api/users/checkReadBooks`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          setReadBooks(
            Array.isArray(
              response.data?.data
            )
              ? response.data.data
              : []
          );
        } catch (error) {
          console.error(
            "Error fetching read books:",
            error.response
              ?.data ||
              error.message
          );

          setReadBooks([]);
        } finally {
          setReadBooksLoading(
            false
          );
        }
      };

    checkAsRead();
  }, []);

  // ==========================================================
  // FETCH RELATED BOOKS
  // ==========================================================

  useEffect(() => {
    if (!book?.category) {
      return;
    }

    const getRelatedBooks =
      async () => {
        try {
          setRelatedLoading(
            true
          );

          const response =
            await axios.get(
              `${API_BASE}/api/book/getBooks`,
              {
                params: {
                  category:
                    book.category,
                  limit: 20,
                },
              }
            );

          const books =
            Array.isArray(
              response.data
            )
              ? response.data
              : [];

          const scored =
            books
              .filter(
                (item) =>
                  item.identifier !==
                  book.identifier
              )
              .map(
                (item) => ({
                  ...item,
                  similarity:
                    getSimilarityScore(
                      book,
                      item
                    ),
                })
              )
              .sort(
                (a, b) =>
                  b.similarity -
                  a.similarity
              )
              .slice(0, 6);

          setRelatedBooks(
            scored
          );
        } catch (error) {
          console.error(
            "Error fetching related books:",
            error
          );

          setRelatedBooks([]);
        } finally {
          setRelatedLoading(
            false
          );
        }
      };

    getRelatedBooks();
  }, [book]);

  // ==========================================================
  // MARK AS READ
  // ==========================================================

  const markAsRead =
    async () => {
      try {
        const token =
          localStorage.getItem(
            "token"
          );

        if (!token) {
          console.error(
            "Authentication token not found"
          );
          return;
        }

        await axios.put(
          `${API_BASE}/api/users/mark-as-read`,
          {
            bookId:
              book?._id,
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        console.log(
          "Marked as Read ✅"
        );

        setReadBooks(
          (prev) => [
            ...prev,
            book._id,
          ]
        );
      } catch (error) {
        console.error(
          "Error Marking Read:",
          error.response
            ?.data ||
            error.message
        );
      }
    };

  // ==========================================================
  // READ NOW
  // ==========================================================

  const handleReadNow =
    async () => {
      try {
        const token =
          localStorage.getItem(
            "token"
          );

        if (!token) {
          console.error(
            "Authentication token not found"
          );
          return;
        }

        await axios.put(
          `${API_BASE}/api/users/recent-books`,
          {
            bookId:
              book._id,
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        navigate(
          `/reader/${book.identifier}`
        );
      } catch (error) {
        console.error(
          "Error adding recent book:",
          error.response
            ?.data ||
            error.message
        );
      }
    };

  // ==========================================================
  // ADD TO COLLECTION
  // ==========================================================

  const handleAddToCollection =
    () => {
      navigate(
        "/Collection",
        {
          state: {
            mode: "add-book",
            bookId:
              book.identifier,
          },
        }
      );
    };

  // ==========================================================
  // CURRENT READING PROGRESS
  // ==========================================================

  const currentProgress =
    useMemo(() => {
      const recentBooks =
        Array.isArray(
          userProgress?.recentReadBooks
        )
          ? userProgress.recentReadBooks
          : [];

      const current =
        recentBooks.find(
          (entry) =>
            entry?.book
              ?.identifier ===
            book?.identifier
        );

      if (!current) {
        return null;
      }

      if (
        !current.totalPages ||
        current.pagesRead == null
      ) {
        return null;
      }

      const percent =
        Math.min(
          100,
          Math.floor(
            (current.pagesRead /
              current.totalPages) *
              100
          )
        );

      return {
        pagesRead:
          current.pagesRead,

        totalPages:
          current.totalPages,

        percent,
      };
    }, [
      userProgress,
      book,
    ]);

  // ==========================================================
  // READ STATUS
  // ==========================================================

  const isRead =
    !readBooksLoading &&
    book?._id &&
    readBooks.includes(
      book._id
    );

  // ==========================================================
  // RELEASE DATE
  // ==========================================================

  const releaseDate =
    formatReleaseDate(
      book?.releaseDate
    );

  // ==========================================================
  // LOADING
  // ==========================================================

  if (!book) {
    return (
      <BookDetailSkeleton />
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div
      className="
        w-full
        px-5
        py-5
        md:px-10
        md:py-7
        lg:px-16
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-6xl
        "
      >
        {/* ==================================================
            BACK
        ================================================== */}

        <button
          onClick={() =>
            navigate(-1)
          }
          className="
            mb-6
            flex
            w-fit
            items-center
            gap-2
            text-sm
            text-text-secondary
            transition
            hover:text-text-primary
          "
        >
          <HiArrowLeft
            size={18}
          />

          Back
        </button>

        {/* ==================================================
            BOOK HERO
        ================================================== */}

        <section
          className="
            grid
            grid-cols-1
            items-start
            gap-7
            lg:grid-cols-[210px_1fr]
            lg:gap-10
          "
        >
          {/* =================================================
              COVER
          ================================================= */}

          <div
            className="
              flex
              justify-center
              lg:justify-start
            "
          >
            <div
              className="
                aspect-[2/3]
                w-[175px]
                overflow-hidden
                rounded-xl
                bg-background-card
                p-1.5
                shadow-md
                sm:w-[200px]
              "
            >
              <img
                src={getCoverUrl(
                  book.identifier
                )}
                alt={
                  book.title
                }
                className="
                  h-full
                  w-full
                  rounded
                  object-cover
                "
              />
            </div>
          </div>

          {/* =================================================
              INFORMATION
          ================================================= */}

          <div
            className="
              flex
              flex-col
              justify-start
              pt-1
            "
          >
            {/* Category */}

            <span
              className="
                mb-2
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.16em]
                text-brand
              "
            >
              {book.category}
            </span>

            {/* Title */}

            <h1
              className="
                max-w-3xl
                text-3xl
                font-bold
                leading-tight
                tracking-tight
                text-text-primary
                md:text-4xl
              "
            >
              {book.title}
            </h1>

            {/* Author */}

            <p
              className="
                mt-2
                text-base
                text-text-secondary
              "
            >
              By{" "}
              <span
                className="
                  font-semibold
                  text-text-primary
                "
              >
                {book.author}
              </span>
            </p>

            {/* Description */}

            {book.description && (
              <div
                className="
                  mt-5
                  max-w-3xl
                "
              >
                <p
                  className={`
                    text-sm
                    leading-6
                    text-text-secondary
                    ${
                      descriptionExpanded
                        ? ""
                        : "line-clamp-4"
                    }
                  `}
                >
                  {book.description}
                </p>

                {book.description.length >
                  280 && (
                  <button
                    onClick={() =>
                      setDescriptionExpanded(
                        (prev) =>
                          !prev
                      )
                    }
                    className="
                      mt-2
                      flex
                      items-center
                      gap-1
                      text-xs
                      font-medium
                      text-text-primary
                      transition
                      hover:text-brand
                    "
                  >
                    {descriptionExpanded
                      ? "Show less"
                      : "Read more"}

                    {descriptionExpanded ? (
                      <LuChevronUp
                        size={14}
                      />
                    ) : (
                      <LuChevronDown
                        size={14}
                      />
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Progress */}

            {currentProgress && (
              <div
                className="
                  mt-5
                  max-w-md
                "
              >
                <div
                  className="
                    mb-1.5
                    flex
                    items-center
                    justify-between
                    text-xs
                  "
                >
                  <span className="text-text-secondary">
                    Your progress
                  </span>

                  <span
                    className="
                      font-semibold
                      text-brand
                    "
                  >
                    {
                      currentProgress.percent
                    }
                    %
                  </span>
                </div>

                <div
                  className="
                    h-1.5
                    overflow-hidden
                    rounded-full
                    bg-gray-200
                  "
                >
                  <div
                    className="
                      h-full
                      rounded-full
                      bg-brand
                      transition-all
                    "
                    style={{
                      width: `${currentProgress.percent}%`,
                    }}
                  />
                </div>

                <p
                  className="
                    mt-1.5
                    text-[11px]
                    text-text-secondary
                  "
                >
                  {
                    currentProgress.pagesRead
                  }{" "}
                  of{" "}
                  {
                    currentProgress.totalPages
                  }{" "}
                  pages
                </p>
              </div>
            )}

            {/* Action Buttons */}

            <div
              className="
                mt-6
                flex
                flex-wrap
                gap-2.5
              "
            >
              <button
                onClick={
                  handleReadNow
                }
                className="
                  flex
                  items-center
                  gap-2
                  rounded-full
                  bg-brand
                  px-5
                  py-2.5
                  text-sm
                  font-medium
                  text-white
                  transition
                  hover:bg-brand-hover
                "
              >
                <HiOutlineBookOpen
                  size={18}
                />

                {currentProgress
                  ? "Continue Reading"
                  : "Read Now"}
              </button>

              <button
                onClick={
                  handleAddToCollection
                }
                className="
                  flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-border-light
                  bg-background-card
                  px-5
                  py-2.5
                  text-sm
                  font-medium
                  text-text-primary
                  transition
                  hover:bg-brand-light
                "
              >
                <HiOutlineBookmark
                  size={18}
                />

                Add to Collection
              </button>

              {isRead ? (
                <button
                  disabled
                  className="
                    flex
                    cursor-not-allowed
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-border-light
                    bg-background-card
                    px-5
                    py-2.5
                    text-sm
                    font-medium
                    text-text-primary
                    opacity-70
                  "
                >
                  <HiOutlineCheckCircle
                    size={18}
                  />

                  Read
                </button>
              ) : (
                <button
                  onClick={
                    markAsRead
                  }
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-border-light
                    bg-background-card
                    px-5
                    py-2.5
                    text-sm
                    font-medium
                    text-text-primary
                    transition
                    hover:bg-brand-light
                  "
                >
                  <HiOutlineCheckCircle
                    size={18}
                  />

                  Mark as Read
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ==================================================
            AT A GLANCE
        ================================================== */}

        <section
          className="
            mt-9
            overflow-hidden
            rounded-xl
            border
            border-border-light
            bg-background-card
          "
        >
          <div
            className="
              grid
              grid-cols-2
              gap-y-5
              gap-x-6
              p-5
              sm:grid-cols-4
            "
          >
            <div>
              <p className="mb-1 text-xs text-text-secondary">
                Author
              </p>

              <p className="truncate text-sm font-semibold text-text-primary">
                {book.author}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs text-text-secondary">
                Language
              </p>

              <p className="text-sm font-semibold text-text-primary">
                {book.language ||
                  "English"}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs text-text-secondary">
                Format
              </p>

              <p className="text-sm font-semibold uppercase text-text-primary">
                {book.files?.epub
                  ? "EPUB"
                  : book.files?.pdf
                  ? "PDF"
                  : "—"}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs text-text-secondary">
                Released
              </p>

              <p className="text-sm font-semibold text-text-primary">
                {releaseDate ||
                  "—"}
              </p>
            </div>
          </div>
        </section>

        {/* ==================================================
            SUBJECTS
        ================================================== */}

        {Array.isArray(
          book.subjects
        ) &&
          book.subjects.length > 0 && (
            <section className="mt-8">
              <h2
                className="
                  text-lg
                  font-semibold
                  text-text-primary
                "
              >
                Themes & Subjects
              </h2>

              <div
                className="
                  mt-3
                  flex
                  flex-wrap
                  gap-2
                "
              >
                {book.subjects
                  .slice(0, 10)
                  .map(
                    (subject) => (
                      <button
                        key={
                          subject
                        }
                        onClick={() =>
                          navigate(
                            `/Discover?subject=${encodeURIComponent(
                              subject
                            )}`
                          )
                        }
                        className="
                          rounded-full
                          border
                          border-border-light
                          bg-background-card
                          px-3.5
                          py-2
                          text-xs
                          text-text-secondary
                          transition
                          hover:border-brand/30
                          hover:text-text-primary
                        "
                      >
                        {subject}
                      </button>
                    )
                  )}
              </div>
            </section>
          )}

        {/* ==================================================
            YOU MIGHT ALSO LIKE
        ================================================== */}

        {!relatedLoading &&
          relatedBooks.length > 0 && (
            <section
              className="
                mt-10
                pb-14
              "
            >
              <div
                className="
                  mb-4
                  flex
                  items-center
                  justify-between
                "
              >
                <div>
                  <h2
                    className="
                      text-lg
                      font-semibold
                      text-text-primary
                      sm:text-xl
                    "
                  >
                    You might also like
                  </h2>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-text-secondary
                    "
                  >
                    Similar books based on
                    subject and category.
                  </p>
                </div>
              </div>

              <div
                className="
                  scrollbar-hide
                  flex
                  gap-4
                  overflow-x-auto
                  py-2
                  sm:gap-6
                "
              >
                {relatedBooks.map(
                  (item) => (
                    <div
                      key={
                        item.identifier
                      }
                      className="shrink-0"
                    >
                      {/* Simple reusable Cardone/Cardtwo
                          isn't used here so Book Detail
                          remains self-contained. */}

                      <button
                        onClick={() =>
                          navigate(
                            `/BookDetail/${item.identifier}`
                          )
                        }
                        className="
                          group
                          w-32
                          text-left
                          sm:w-36
                        "
                      >
                        <div
                          className="
                            aspect-[2/3]
                            overflow-hidden
                            rounded-xl
                            border
                            border-border-light
                            bg-gray-50
                            shadow-sm
                            transition
                            group-hover:-translate-y-1
                            group-hover:shadow-md
                          "
                        >
                          <img
                            src={getCoverUrl(
                              item.identifier
                            )}
                            alt={
                              item.title
                            }
                            loading="lazy"
                            className="
                              h-full
                              w-full
                              object-cover
                              transition-transform
                              duration-300
                              group-hover:scale-[1.02]
                            "
                          />
                        </div>

                        <p
                          className="
                            mt-2
                            line-clamp-2
                            text-xs
                            font-medium
                            leading-tight
                            text-text-primary
                          "
                        >
                          {
                            item.title
                          }
                        </p>

                        <p
                          className="
                            mt-1
                            truncate
                            text-[11px]
                            text-text-secondary
                          "
                        >
                          {
                            item.author
                          }
                        </p>
                      </button>
                    </div>
                  )
                )}
              </div>
            </section>
          )}
      </div>
    </div>
  );
}

export default BookDetail;