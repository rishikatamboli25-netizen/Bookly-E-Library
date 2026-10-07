import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Cardone from "../compontents/Cardone";
import CardoneSkeleton from "../compontents/Loading/CardoneSkeleton";

import {
  buildStyles,
  CircularProgressbar,
} from "react-circular-progressbar";

import {
  LuArrowRight,
  LuBookOpen,
} from "react-icons/lu";

import Login from "../compontents/Login";
import axios from "axios";
import HomeHero from "../compontents/HomeHero";
import HomeHeroSkeleton from "../compontents/Loading/HomeHeroSkeleton";
import { useNavigate } from "react-router-dom";

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
// DYNAMIC GREETINGS
// ============================================================
//
// 20 total lines.
// 4 lines for each time period.
//
// The selected line rotates every 30 minutes.
// The wording is intentionally conversational rather than
// simply saying "Good morning / afternoon / evening / night."
// ============================================================

const GREETING_LINES = [
  // ----------------------------------------------------------
  // MIDNIGHT — 00:00 → 04:59
  // ----------------------------------------------------------

  {
    period: "midnight",
    text: "Still up{name}?",
  },
  {
    period: "midnight",
    text: "Quiet hours. Good stories.",
  },
  {
    period: "midnight",
    text: "The world's quiet. The library isn't.",
  },
  {
    period: "midnight",
    text: "Late-night reading hits different.",
  },

  // ----------------------------------------------------------
  // MORNING — 05:00 → 11:59
  // ----------------------------------------------------------

  {
    period: "morning",
    text: "Morning{name}. What's worth reading today?",
  },
  {
    period: "morning",
    text: "A new day. A new chapter.",
  },
  {
    period: "morning",
    text: "Start the day somewhere interesting.",
  },
  {
    period: "morning",
    text: "Fresh day. Fresh pages.",
  },

  // ----------------------------------------------------------
  // AFTERNOON — 12:00 → 16:59
  // ----------------------------------------------------------

  {
    period: "afternoon",
    text: "Afternoon{name}. Got a few pages in you?",
  },
  {
    period: "afternoon",
    text: "Take a little break. Read something good.",
  },
  {
    period: "afternoon",
    text: "Your next chapter is waiting.",
  },
  {
    period: "afternoon",
    text: "A few quiet minutes could use a good book.",
  },

  // ----------------------------------------------------------
  // EVENING — 17:00 → 20:59
  // ----------------------------------------------------------

  {
    period: "evening",
    text: "Evening{name}. Let's find something worth reading.",
  },
  {
    period: "evening",
    text: "The day's winding down. The stories aren't.",
  },
  {
    period: "evening",
    text: "Leave the day at the door.",
  },
  {
    period: "evening",
    text: "The clock is slowing down. The pages aren't.",
  },

  // ----------------------------------------------------------
  // LATE NIGHT — 21:00 → 23:59
  // ----------------------------------------------------------

  {
    period: "night",
    text: "Still here{name}? Nice.",
  },
  {
    period: "night",
    text: "One more chapter won't hurt.",
  },
  {
    period: "night",
    text: "The day can wait. This chapter can't.",
  },
  {
    period: "night",
    text: "Quiet night. Good book. Sounds right.",
  },
];

// ============================================================
// GET GREETING PERIOD
// ============================================================

const getGreetingPeriod = (hour) => {
  if (hour >= 0 && hour < 5) {
    return "midnight";
  }

  if (hour >= 5 && hour < 12) {
    return "morning";
  }

  if (hour >= 12 && hour < 17) {
    return "afternoon";
  }

  if (hour >= 17 && hour < 21) {
    return "evening";
  }

  return "night";
};

// ============================================================
// GET DYNAMIC GREETING
// ============================================================

const getGreeting = (
  username,
  currentTime
) => {
  const date = new Date(currentTime);

  const hour = date.getHours();

  const period =
    getGreetingPeriod(hour);

  const options =
    GREETING_LINES.filter(
      (line) =>
        line.period === period
    );

  if (options.length === 0) {
    return username
      ? `Welcome back, ${username}.`
      : "Welcome back.";
  }

  // Change every 30 minutes.
  const halfHourSlot =
    Math.floor(
      currentTime /
        (30 * 60 * 1000)
    );

  const selected =
    options[
      halfHourSlot % options.length
    ];

  const name =
    username
      ? `, ${username}`
      : "";

  return selected.text.replace(
    "{name}",
    name
  );
};

// ============================================================
// SAFE ARRAY HELPER
// ============================================================

const toArray = (value) => {
  return Array.isArray(value)
    ? value
    : [];
};

// ============================================================
// EXTRACT BOOK IDENTIFIER FROM PROGRESS
// ============================================================

const getBookIdentifier = (
  bookEntry
) => {
  if (!bookEntry) {
    return null;
  }

  if (
    typeof bookEntry === "string"
  ) {
    return bookEntry;
  }

  if (
    typeof bookEntry.book ===
    "string"
  ) {
    return bookEntry.book;
  }

  return (
    bookEntry?.book?.identifier ||
    bookEntry?.identifier ||
    null
  );
};

// ============================================================
// NORMALIZE VALUE
// ============================================================

const normalizeValue = (
  value
) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

// ============================================================
// SCORE RECOMMENDATION
// ============================================================

const scoreBook = (
  candidate,
  readBooks
) => {
  if (!candidate) {
    return 0;
  }

  let score = 0;

  const candidateCategory =
    normalizeValue(
      candidate.category
    );

  const candidateAuthor =
    normalizeValue(
      candidate.author
    );

  const candidateSubjects =
    toArray(
      candidate.subjects
    ).map(normalizeValue);

  for (
    const readBookEntry of readBooks
  ) {
    const readBook =
      readBookEntry?.book ||
      readBookEntry;

    if (!readBook) {
      continue;
    }

    const readCategory =
      normalizeValue(
        readBook.category
      );

    const readAuthor =
      normalizeValue(
        readBook.author
      );

    const readSubjects =
      toArray(
        readBook.subjects
      ).map(normalizeValue);

    // Same category
    if (
      candidateCategory &&
      candidateCategory ===
        readCategory
    ) {
      score += 8;
    }

    // Same author
    if (
      candidateAuthor &&
      candidateAuthor ===
        readAuthor
    ) {
      score += 6;
    }

    // Shared subjects
    for (
      const subject of candidateSubjects
    ) {
      if (
        subject &&
        readSubjects.includes(
          subject
        )
      ) {
        score += 3;
      }
    }
  }

  return score;
};

// ============================================================
// METADATA RICHNESS
// ============================================================

const getMetadataScore = (
  book
) => {
  if (!book) {
    return 0;
  }

  let score = 0;

  if (book.description) {
    score += 4;
  }

  if (book.coverUrl) {
    score += 2;
  }

  if (book.category) {
    score += 2;
  }

  score += Math.min(
    toArray(
      book.subjects
    ).length,
    5
  );

  if (book.author) {
    score += 1;
  }

  if (book.files?.epub?.url) {
    score += 1;
  }

  return score;
};

// ============================================================
// COMPONENT
// ============================================================

const Home = () => {
  const [loginOpen, setLoginOpen] =
    useState(true);

  const [bookData, setBookData] =
    useState([]);

  const [bookLoading, setBookLoading] =
    useState(true);

  const [
    userProgress,
    setUserProgress,
  ] = useState(null);

  const [userGoal, setUserGoal] =
    useState(0);

  const [
    progressLoading,
    setProgressLoading,
  ] = useState(true);

  const [
    recentReadPercent,
    setRecentReadPercent,
  ] = useState(0);

  const [
    goalPercentage,
    setGoalPercentage,
  ] = useState(0);

  // Used only to refresh the time-aware greeting.
  // Greeting itself changes every 30 minutes.
  const [
    currentTime,
    setCurrentTime,
  ] = useState(() =>
    Date.now()
  );

  const navigate =
    useNavigate();

  const recommendationsRef =
    useRef(null);

  // ==========================================================
  // USER
  // ==========================================================

  const token =
    localStorage.getItem(
      "token"
    );

  let user = null;

  try {
    user = JSON.parse(
      localStorage.getItem(
        "user"
      )
    );
  } catch (error) {
    console.error(
      "Error parsing user:",
      error
    );
  }

  // ==========================================================
  // DYNAMIC TIME
  // ==========================================================

  useEffect(() => {
    const interval =
      setInterval(() => {
        setCurrentTime(
          Date.now()
        );
      }, 60 * 1000);

    return () =>
      clearInterval(interval);
  }, []);

  const greeting =
    useMemo(
      () =>
        getGreeting(
          user?.username,
          currentTime
        ),
      [
        currentTime,
        user?.username,
      ]
    );

  // ==========================================================
  // BOOKS
  // ==========================================================

  useEffect(() => {
    const getBook = async () => {
      try {
        const response =
          await axios.get(
            `${API_BASE}/api/book/getBooks`
          );

        setBookData(
          Array.isArray(
            response.data
          )
            ? response.data
            : []
        );
      } catch (error) {
        console.error(
          "Error fetching books:",
          error
        );
      } finally {
        setBookLoading(false);
      }
    };

    getBook();
  }, []);

  // ==========================================================
  // USER PROGRESS
  // ==========================================================

  useEffect(() => {
    const getUserProgress =
      async () => {
        const storedToken =
          localStorage.getItem(
            "token"
          );

        if (!storedToken) {
          setUserProgress({
            recentReadBooks: [],
            totalReadBooks: 0,
          });

          setUserGoal(0);
          setProgressLoading(
            false
          );

          return;
        }

        try {
          const response =
            await axios.get(
              `${API_BASE}/api/users/get-user-progress`,
              {
                headers: {
                  Authorization:
                    `Bearer ${storedToken}`,
                },

                validateStatus:
                  (status) =>
                    status >= 200 &&
                    status < 400,
              }
            );

          if (
            response.data &&
            response.data.progress
          ) {
            const progress =
              response.data
                .progress || {};

            const recentReadBooks =
              Array.isArray(
                progress.recentReadBooks
              )
                ? progress.recentReadBooks
                : [];

            const totalReadBooks =
              progress.totalReadBooks ??
              0;

            setUserProgress({
              ...progress,
              recentReadBooks,
              totalReadBooks,
            });

            setUserGoal(
              response.data.goal ??
                0
            );

            return;
          }

          setUserProgress({
            recentReadBooks: [],
            totalReadBooks: 0,
          });

          setUserGoal(0);
        } catch (error) {
          console.error(
            "Error fetching user progress:",
            error
          );

          setUserProgress({
            recentReadBooks: [],
            totalReadBooks: 0,
          });

          setUserGoal(0);
        } finally {
          setProgressLoading(
            false
          );
        }
      };

    getUserProgress();
  }, []);

  // ==========================================================
  // CALCULATE PROGRESS
  // ==========================================================

  useEffect(() => {
    const recentBooks =
      userProgress?.recentReadBooks;

    // --------------------------------------------------------
    // CONTINUE READING %
    // --------------------------------------------------------

    if (
      recentBooks &&
      recentBooks.length > 0
    ) {
      const firstBook =
        recentBooks[0];

      if (
        firstBook.pagesRead ===
          0 ||
        !firstBook.totalPages
      ) {
        setRecentReadPercent(
          0
        );
      } else {
        const percentage =
          Math.floor(
            (firstBook.pagesRead /
              firstBook.totalPages) *
              100
          );

        setRecentReadPercent(
          Math.min(
            percentage,
            100
          )
        );
      }
    } else {
      setRecentReadPercent(
        0
      );
    }

    // --------------------------------------------------------
    // YEARLY GOAL %
    // --------------------------------------------------------

    if (
      userProgress?.totalReadBooks !=
        null &&
      userGoal > 0
    ) {
      const percentage =
        Math.floor(
          (userProgress.totalReadBooks /
            userGoal) *
            100
        );

      setGoalPercentage(
        Math.min(
          percentage,
          100
        )
      );
    } else {
      setGoalPercentage(
        0
      );
    }
  }, [
    userProgress,
    userGoal,
  ]);

  // ==========================================================
  // RECENT / READ IDENTIFIERS
  // ==========================================================

  const readIdentifiers =
    useMemo(() => {
      const recentBooks =
        toArray(
          userProgress?.recentReadBooks
        );

      return new Set(
        recentBooks
          .map(
            getBookIdentifier
          )
          .filter(Boolean)
      );
    }, [userProgress]);

  // ==========================================================
  // RECOMMENDATIONS
  // ==========================================================

  const recommendedBooks =
    useMemo(() => {
      if (
        !Array.isArray(
          bookData
        ) ||
        bookData.length === 0
      ) {
        return [];
      }

      const recentBooks =
        toArray(
          userProgress?.recentReadBooks
        );

      const unreadBooks =
        bookData.filter(
          (book) =>
            !readIdentifiers.has(
              book.identifier
            )
        );

      // ------------------------------------------------------
      // USER WITH READING HISTORY
      // ------------------------------------------------------

      if (
        recentBooks.length > 0
      ) {
        const matchedBooks =
          unreadBooks
            .map((book) => ({
              book,
              score:
                scoreBook(
                  book,
                  recentBooks
                ),
            }))
            .filter(
              (item) =>
                item.score > 0
            )
            .sort(
              (a, b) =>
                b.score - a.score
            )
            .map(
              (item) =>
                item.book
            );

        const matchedIds =
          new Set(
            matchedBooks.map(
              (book) =>
                book.identifier
            )
          );

        const fallbackBooks =
          unreadBooks
            .filter(
              (book) =>
                !matchedIds.has(
                  book.identifier
                )
            )
            .sort(
              (a, b) =>
                getMetadataScore(
                  b
                ) -
                getMetadataScore(
                  a
                )
            );

        return [
          ...matchedBooks,
          ...fallbackBooks,
        ].slice(0, 14);
      }

      // ------------------------------------------------------
      // NEW / LOGGED-OUT USER
      // ------------------------------------------------------

      return [
        ...unreadBooks,
      ]
        .sort(
          (a, b) =>
            getMetadataScore(
              b
            ) -
            getMetadataScore(
              a
            )
        )
        .slice(0, 14);
    }, [
      bookData,
      userProgress,
      readIdentifiers,
    ]);

  // ==========================================================
  // TOP INTEREST
  // ==========================================================

  const topInterest =
    useMemo(() => {
      const recentBooks =
        toArray(
          userProgress?.recentReadBooks
        );

      if (
        recentBooks.length === 0
      ) {
        return null;
      }

      const categoryCounts =
        new Map();

      const subjectCounts =
        new Map();

      for (
        const entry of recentBooks
      ) {
        const book =
          entry?.book ||
          entry;

        if (!book) {
          continue;
        }

        // ----------------------------------------------------
        // CATEGORY
        // ----------------------------------------------------

        if (book.category) {
          const key =
            normalizeValue(
              book.category
            );

          if (
            !categoryCounts.has(
              key
            )
          ) {
            categoryCounts.set(
              key,
              {
                count: 0,
                label:
                  book.category,
              }
            );
          }

          categoryCounts.get(
            key
          ).count += 1;
        }

        // ----------------------------------------------------
        // SUBJECTS
        // ----------------------------------------------------

        for (
          const subject of toArray(
            book.subjects
          )
        ) {
          const key =
            normalizeValue(
              subject
            );

          if (!key) {
            continue;
          }

          if (
            !subjectCounts.has(
              key
            )
          ) {
            subjectCounts.set(
              key,
              {
                count: 0,
                label: subject,
              }
            );
          }

          subjectCounts.get(
            key
          ).count += 1;
        }
      }

      const strongestCategory =
        [
          ...categoryCounts.entries(),
        ].sort(
          (a, b) =>
            b[1].count -
            a[1].count
        )[0];

      const strongestSubject =
        [
          ...subjectCounts.entries(),
        ].sort(
          (a, b) =>
            b[1].count -
            a[1].count
        )[0];

      return {
        category:
          strongestCategory
            ? strongestCategory[1]
                .label
            : null,

        subject:
          strongestSubject
            ? strongestSubject[1]
                .label
            : null,
      };
    }, [userProgress]);

  // ==========================================================
  // INTEREST BOOKS
  // ==========================================================

  const interestBooks =
    useMemo(() => {
      if (
        !topInterest ||
        !Array.isArray(
          bookData
        )
      ) {
        return [];
      }

      const category =
        normalizeValue(
          topInterest.category
        );

      const subject =
        normalizeValue(
          topInterest.subject
        );

      return bookData
        .filter(
          (book) =>
            !readIdentifiers.has(
              book.identifier
            )
        )
        .map((book) => {
          let score = 0;

          // Same category
          if (
            category &&
            normalizeValue(
              book.category
            ) === category
          ) {
            score += 8;
          }

          // Shared subject
          const subjects =
            toArray(
              book.subjects
            ).map(
              normalizeValue
            );

          if (
            subject &&
            subjects.includes(
              subject
            )
          ) {
            score += 5;
          }

          return {
            book,
            score,
          };
        })
        .filter(
          (item) =>
            item.score > 0
        )
        .sort(
          (a, b) =>
            b.score - a.score
        )
        .map(
          (item) =>
            item.book
        )
        .slice(0, 14);
    }, [
      topInterest,
      bookData,
      readIdentifiers,
    ]);

  // ==========================================================
  // FEATURED BOOK
  // ==========================================================

  const featuredBook =
    useMemo(() => {
      if (
        !Array.isArray(
          bookData
        ) ||
        bookData.length === 0
      ) {
        return null;
      }

      const unreadBooks =
        bookData.filter(
          (book) =>
            !readIdentifiers.has(
              book.identifier
            )
        );

      const pool =
        unreadBooks.length > 0
          ? unreadBooks
          : bookData;

      return [...pool].sort(
        (a, b) =>
          getMetadataScore(
            b
          ) -
          getMetadataScore(
            a
          )
      )[0];
    }, [
      bookData,
      readIdentifiers,
    ]);

  // ==========================================================
  // CATEGORIES
  // ==========================================================

  const categories =
    useMemo(() => {
      const counts =
        new Map();

      for (
        const book of bookData
      ) {
        if (!book.category) {
          continue;
        }

        counts.set(
          book.category,
          (counts.get(
            book.category
          ) || 0) + 1
        );
      }

      return [
        ...counts.entries(),
      ]
        .sort(
          (a, b) =>
            b[1] - a[1]
        )
        .slice(0, 8)
        .map(
          ([category]) =>
            category
        );
    }, [bookData]);

  // ==========================================================
  // GOAL REMAINING
  // ==========================================================

  const booksLeft =
    Math.max(
      (userGoal || 0) -
        (userProgress
          ?.totalReadBooks ||
          0),
      0
    );

  // ==========================================================
  // HORIZONTAL SCROLL
  // ==========================================================

  const handleViewAll =
    () => {
      if (
        recommendationsRef.current
      ) {
        recommendationsRef.current.scrollBy(
          {
            left: 500,
            behavior: "smooth",
          }
        );
      }
    };

  // ==========================================================
  // DISCOVER CATEGORY
  // ==========================================================

  const handleCategoryClick =
    (category) => {
      navigate(
        `/Discover?category=${encodeURIComponent(
          category
        )}`
      );
    };

  // ==========================================================
  // OPEN BOOK
  // ==========================================================

  const openBook = (
    book
  ) => {
    if (
      !book?.identifier
    ) {
      return;
    }

    navigate(
      `/BookDetail/${book.identifier}`
    );
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/* ======================================================
          TOP AREA
      ====================================================== */}

      <section
        className="
          mx-auto
          max-w-[1600px]
          px-4
          pt-4
          sm:px-8
          sm:pt-10
          md:px-12
          md:pt-8
          lg:px-20
        "
      >
        {!token || !user ? (
          loginOpen && (
            <Login
              login={setLoginOpen}
            />
          )
        ) : null}

        {/* ==================================================
            DYNAMIC GREETING
        ================================================== */}

        <h1
          className="
            font-sans
            text-2xl
            font-semibold
            tracking-tight
            text-text-primary
            sm:text-3xl
            md:text-4xl
          "
        >
          {greeting}
        </h1>

        <p
          className="
            pb-6
            pt-1
            text-sm
            text-text-secondary
            sm:text-base
            md:pb-10
            md:text-lg
          "
        >
          Pick a book, follow a thread,
          and see where it takes you.
        </p>

        {/* ====================================================
            HERO / PROGRESS
        ==================================================== */}

        {progressLoading ? (
          <HomeHeroSkeleton />
        ) : userProgress?.recentReadBooks
            ?.length === 0 ? (
          <HomeHero />
        ) : (
          <div
            className="
              grid
              grid-cols-1
              gap-6
              lg:grid-cols-3
              lg:gap-8
            "
          >
            {/* ==================================================
                CONTINUE READING
            ================================================== */}

            <div
              className="
                relative
                flex
                min-h-[360px]
                flex-col
                justify-between
                overflow-hidden
                rounded-2xl
                border
                border-border-light
                bg-background-card
                p-5
                shadow-sm
                sm:p-8
                lg:col-span-2
              "
            >
              <div className="relative z-10 w-full">
                <div
                  className="
                    pb-4
                    text-lg
                    font-semibold
                    text-text-primary
                    sm:pb-6
                    sm:text-xl
                  "
                >
                  Continue Reading
                </div>

                <div
                  className="
                    flex
                    flex-col
                    items-center
                    gap-5
                    sm:flex-row
                    sm:items-start
                    sm:gap-8
                  "
                >
                  <div
                    className="
                      aspect-[2/3]
                      w-28
                      shrink-0
                      overflow-hidden
                      rounded-xl
                      border
                      border-border-light
                      shadow-md
                      sm:w-36
                    "
                  >
                    <img
                      loading="lazy"
                      src={getCoverUrl(
                        userProgress
                          ?.recentReadBooks?.[0]
                          ?.book
                          ?.identifier
                      )}
                      alt={
                        userProgress
                          ?.recentReadBooks?.[0]
                          ?.book?.title ||
                        "Book Cover"
                      }
                      className="
                        h-full
                        w-full
                        object-cover
                      "
                    />
                  </div>

                  <div
                    className="
                      flex
                      w-full
                      flex-col
                      gap-3.5
                    "
                  >
                    <div
                      className="
                        relative
                        rounded-xl
                        border
                        border-white/60
                        bg-white/40
                        px-4
                        py-3
                        shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_6px_16px_rgba(124,58,237,0.08)]
                        backdrop-blur-xl
                      "
                    >
                      <span
                        className="
                          pointer-events-none
                          absolute
                          inset-x-3
                          top-0
                          h-px
                          bg-white/80
                        "
                      />

                      <div
                        className="
                          truncate
                          text-base
                          font-semibold
                          text-text-primary
                          sm:text-lg
                        "
                      >
                        {
                          userProgress
                            ?.recentReadBooks?.[0]
                            ?.book?.title
                        }
                      </div>

                      <div
                        className="
                          mt-0.5
                          truncate
                          text-xs
                          text-text-secondary
                          sm:text-sm
                        "
                      >
                        {
                          userProgress
                            ?.recentReadBooks?.[0]
                            ?.book?.author
                        }
                      </div>
                    </div>

                    <div
                      className="
                        relative
                        rounded-xl
                        border
                        border-white/60
                        bg-white/40
                        px-4
                        py-3
                        shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_6px_16px_rgba(124,58,237,0.08)]
                        backdrop-blur-xl
                      "
                    >
                      <span
                        className="
                          pointer-events-none
                          absolute
                          inset-x-3
                          top-0
                          h-px
                          bg-white/80
                        "
                      />

                      <div
                        className="
                          text-base
                          font-semibold
                          text-brand
                          sm:text-lg
                        "
                      >
                        {
                          recentReadPercent
                        }
                        %
                      </div>

                      <div
                        className="
                          mt-0.5
                          text-xs
                          text-text-secondary
                          sm:text-sm
                        "
                      >
                        {`${
                          userProgress
                            ?.recentReadBooks?.[0]
                            ?.pagesRead ||
                          0
                        } out of ${
                          userProgress
                            ?.recentReadBooks?.[0]
                            ?.totalPages ||
                          0
                        } pages`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  navigate(
                    `/reader/${userProgress?.recentReadBooks?.[0]?.book?.identifier}`
                  )
                }
                className="
                  group
                  relative
                  z-10
                  mt-6
                  flex
                  w-full
                  cursor-pointer
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-full
                  border
                  border-white/50
                  bg-brand/15
                  px-6
                  py-3
                  font-semibold
                  text-brand
                  backdrop-blur-xl
                  transition-all
                  duration-300
                  hover:-translate-y-0.5
                  hover:bg-brand/25
                  hover:shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_10px_24px_rgba(124,58,237,0.25)]
                  active:translate-y-0
                  sm:w-auto
                  sm:self-start
                "
              >
                <span
                  className="
                    pointer-events-none
                    absolute
                    inset-x-6
                    top-0
                    h-px
                    bg-white/70
                  "
                />

                Continue Reading
              </button>
            </div>

            {/* ==================================================
                YOUR PROGRESS
            ================================================== */}

            <div
              className="
                relative
                flex
                min-h-[360px]
                flex-col
                justify-between
                overflow-hidden
                rounded-2xl
                border
                border-border-light
                bg-background-card
                p-5
                shadow-sm
                sm:p-8
              "
            >
              <div className="relative z-10 w-full">
                <div
                  className="
                    text-lg
                    font-semibold
                    text-text-primary
                    sm:text-xl
                  "
                >
                  Your Progress
                </div>

                <div
                  className="
                    my-4
                    grid
                    grid-cols-2
                    gap-3
                    sm:my-6
                  "
                >
                  <div
                    className="
                      relative
                      flex
                      flex-col
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-gray-200
                      bg-white/40
                      px-2
                      py-3
                      shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_6px_16px_rgba(124,58,237,0.04)]
                      backdrop-blur-xl
                    "
                  >
                    <span
                      className="
                        pointer-events-none
                        absolute
                        inset-x-3
                        top-0
                        h-px
                        bg-white/80
                      "
                    />

                    <span
                      className="
                        text-lg
                        font-bold
                        text-brand
                        sm:text-2xl
                      "
                    >
                      {
                        userProgress?.totalReadBooks ??
                        0
                      }
                    </span>

                    <span
                      className="
                        mt-0.5
                        text-[11px]
                        font-normal
                        text-text-secondary
                        sm:text-xs
                      "
                    >
                      Books Read
                    </span>
                  </div>

                  <div
                    className="
                      relative
                      flex
                      flex-col
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-gray-200
                      bg-white/40
                      px-2
                      py-3
                      shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_6px_16px_rgba(124,58,237,0.04)]
                      backdrop-blur-xl
                    "
                  >
                    <span
                      className="
                        pointer-events-none
                        absolute
                        inset-x-3
                        top-0
                        h-px
                        bg-white/80
                      "
                    />

                    <span
                      className="
                        text-lg
                        font-bold
                        text-brand
                        sm:text-2xl
                      "
                    >
                      {userGoal ?? 0}
                    </span>

                    <span
                      className="
                        mt-0.5
                        text-[11px]
                        font-normal
                        text-text-secondary
                        sm:text-xs
                      "
                    >
                      Yearly Goal
                    </span>
                  </div>
                </div>

                <div
                  className="
                    mx-auto
                    my-4
                    h-24
                    w-24
                    sm:h-28
                    sm:w-28
                  "
                >
                  <CircularProgressbar
                    value={
                      goalPercentage
                    }
                    text={`${goalPercentage}%`}
                    styles={buildStyles(
                      {
                        pathColor:
                          "#7C3AED",
                        trailColor:
                          "#E2E8F0",
                        textColor:
                          "#0F172A",
                      }
                    )}
                  />
                </div>

                {userGoal > 0 && (
                  <p
                    className="
                      mt-4
                      text-center
                      text-xs
                      font-medium
                      text-text-primary
                      sm:text-sm
                    "
                  >
                    {booksLeft > 0
                      ? `${booksLeft} ${
                          booksLeft ===
                          1
                            ? "book"
                            : "books"
                        } left to reach your goal`
                      : "Goal reached — keep going."}
                  </p>
                )}
              </div>

              <p
                className="
                  mt-2
                  text-center
                  text-xs
                  font-normal
                  text-text-secondary
                  sm:text-sm
                "
              >
                Read today, grow every day.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ======================================================
          RECOMMENDED FOR YOU
      ====================================================== */}

      <section
        className="
          mx-auto
          mb-16
          mt-12
          max-w-[1600px]
          px-4
          sm:px-8
          md:mt-16
          md:px-12
          lg:px-20
        "
      >
        <div
          className="
            mb-4
            flex
            items-center
            justify-between
            sm:mb-6
          "
        >
          <div>
            <div
              className="
                text-lg
                font-semibold
                text-text-primary
                sm:text-xl
                md:text-2xl
              "
            >
              {userProgress
                ?.recentReadBooks
                ?.length
                ? "Recommended For You"
                : "Good Places To Start"}
            </div>

            <p
              className="
                mt-1
                text-xs
                text-text-secondary
                sm:text-sm
              "
            >
              {userProgress
                ?.recentReadBooks
                ?.length
                ? "Books that connect with what you've been reading."
                : "A few strong starting points from the collection."}
            </p>
          </div>

          <button
            onClick={
              handleViewAll
            }
            className="
              flex
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
            <LuArrowRight className="text-base" />
          </button>
        </div>

        <div
          ref={
            recommendationsRef
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
          {bookLoading
            ? Array.from({
                length: 6,
              }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="shrink-0"
                  >
                    <CardoneSkeleton />
                  </div>
                )
              )
            : recommendedBooks.map(
                (book) => (
                  <div
                    key={
                      book.identifier
                    }
                    className="shrink-0"
                  >
                    <Cardone
                      book={book}
                    />
                  </div>
                )
              )}
        </div>
      </section>

      {/* ======================================================
          FEATURED READ
      ====================================================== */}

      {!bookLoading &&
        featuredBook && (
          <section
            className="
              mx-auto
              mb-16
              max-w-[1600px]
              px-4
              sm:px-8
              md:px-12
              lg:px-20
            "
          >
            <div
              className="
                relative
                overflow-hidden
                rounded-3xl
                border
                border-border-light
                bg-background-card
                shadow-sm
              "
            >
              <div
                className="
                  grid
                  grid-cols-1
                  lg:grid-cols-[260px_1fr]
                "
              >
                {/* COVER */}

                <div
                  className="
                    flex
                    min-h-[320px]
                    items-center
                    justify-center
                    bg-gray-50
                    p-8
                    lg:min-h-[390px]
                  "
                >
                  <img
                    src={getCoverUrl(
                      featuredBook.identifier
                    )}
                    alt={
                      featuredBook.title
                    }
                    loading="lazy"
                    className="
                      h-[270px]
                      w-auto
                      max-w-[190px]
                      rounded-xl
                      object-cover
                      shadow-xl
                      sm:h-[310px]
                    "
                  />
                </div>

                {/* CONTENT */}

                <div
                  className="
                    flex
                    flex-col
                    justify-center
                    px-6
                    py-8
                    sm:px-10
                    lg:px-14
                  "
                >
                  <div
                    className="
                      mb-3
                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-[0.18em]
                      text-brand
                    "
                  >
                    A Read Worth Exploring
                  </div>

                  <h2
                    className="
                      max-w-2xl
                      text-2xl
                      font-semibold
                      tracking-tight
                      text-text-primary
                      sm:text-3xl
                      md:text-4xl
                    "
                  >
                    {
                      featuredBook.title
                    }
                  </h2>

                  <div
                    className="
                      mt-2
                      text-sm
                      text-text-secondary
                      sm:text-base
                    "
                  >
                    {featuredBook.author}
                  </div>

                  {featuredBook.description && (
                    <p
                      className="
                        mt-5
                        max-w-2xl
                        line-clamp-4
                        text-sm
                        leading-7
                        text-text-secondary
                        sm:text-base
                      "
                    >
                      {
                        featuredBook.description
                      }
                    </p>
                  )}

                  <div
                    className="
                      mt-5
                      flex
                      flex-wrap
                      gap-2
                    "
                  >
                    {featuredBook.category && (
                      <button
                        onClick={() =>
                          handleCategoryClick(
                            featuredBook.category
                          )
                        }
                        className="
                          rounded-full
                          border
                          border-border-light
                          bg-white/60
                          px-3
                          py-1.5
                          text-xs
                          text-text-secondary
                          transition-colors
                          hover:text-text-primary
                        "
                      >
                        {
                          featuredBook.category
                        }
                      </button>
                    )}

                    {toArray(
                      featuredBook.subjects
                    )
                      .slice(0, 3)
                      .map(
                        (subject) => (
                          <span
                            key={
                              subject
                            }
                            className="
                              rounded-full
                              border
                              border-border-light
                              bg-white/60
                              px-3
                              py-1.5
                              text-xs
                              text-text-secondary
                            "
                          >
                            {subject}
                          </span>
                        )
                      )}
                  </div>

                  <button
                    onClick={() =>
                      openBook(
                        featuredBook
                      )
                    }
                    className="
                      mt-7
                      flex
                      w-fit
                      items-center
                      gap-2
                      rounded-full
                      bg-brand
                      px-6
                      py-3
                      text-sm
                      font-semibold
                      text-white
                      transition-all
                      duration-300
                      hover:-translate-y-0.5
                      hover:shadow-lg
                      active:translate-y-0
                    "
                  >
                    <LuBookOpen
                      size={16}
                    />

                    Read Now
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

      {/* ======================================================
          BECAUSE YOU READ
      ====================================================== */}

      {!bookLoading &&
        topInterest &&
        interestBooks.length > 0 && (
          <section
            className="
              mx-auto
              mb-16
              max-w-[1600px]
              px-4
              sm:px-8
              md:px-12
              lg:px-20
            "
          >
            <div
              className="
                mb-4
                sm:mb-6
              "
            >
              <div
                className="
                  text-lg
                  font-semibold
                  text-text-primary
                  sm:text-xl
                  md:text-2xl
                "
              >
                Because You Read{" "}
                <span className="text-brand">
                  {topInterest.category ||
                    topInterest.subject}
                </span>
              </div>

              <p
                className="
                  mt-1
                  text-xs
                  text-text-secondary
                  sm:text-sm
                "
              >
                Explore more books around
                your recent interests.
              </p>
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
              {interestBooks.map(
                (book) => (
                  <div
                    key={
                      book.identifier
                    }
                    className="shrink-0"
                  >
                    <Cardone
                      book={book}
                    />
                  </div>
                )
              )}
            </div>
          </section>
        )}

      {/* ======================================================
          EXPLORE BY INTEREST
      ====================================================== */}

      {!bookLoading &&
        categories.length > 0 && (
          <section
            className="
              mx-auto
              mb-20
              max-w-[1600px]
              px-4
              sm:px-8
              md:px-12
              lg:px-20
            "
          >
            <div
              className="
                text-lg
                font-semibold
                text-text-primary
                sm:text-xl
                md:text-2xl
              "
            >
              Explore by Interest
            </div>

            <p
              className="
                mt-1
                text-xs
                text-text-secondary
                sm:text-sm
              "
            >
              Follow a subject and see where
              it takes you.
            </p>

            <div
              className="
                mt-5
                flex
                flex-wrap
                gap-3
              "
            >
              {categories.map(
                (category) => (
                  <button
                    key={category}
                    onClick={() =>
                      handleCategoryClick(
                        category
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
                      font-medium
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
                    {category}
                  </button>
                )
              )}
            </div>
          </section>
        )}
    </>
  );
};

export default Home;