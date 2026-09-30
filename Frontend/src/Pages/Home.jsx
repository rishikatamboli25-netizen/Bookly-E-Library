import React, { useEffect, useRef, useState } from "react";
import Cardone from "../compontents/Cardone";
import {
  buildStyles,
  CircularProgressbar,
} from "react-circular-progressbar";
import { LuArrowRight } from "react-icons/lu";
import Login from "../compontents/Login";
import axios from "axios";
import HomeHero from "../compontents/HomeHero";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_BASE_URL || "http://localhost:5000";

const Home = () => {
  const [loginOpen, setLoginOpen] = useState(true);
  const [bookData, setBookData] = useState([]);

  const [userProgress, setUserProgress] = useState(null);
  const [userGoal, setUserGoal] = useState(0);

  const [recentReadPercent, setRecentReadPercent] = useState(0);
  const [goalPercentage, setGoalPercentage] = useState(0);

  const navigate = useNavigate();

  const topPicksRef = useRef(null);

  const token = localStorage.getItem("token");

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (error) {
    console.error(
      "❌ Error parsing user from localStorage:",
      error
    );
  }

  // ============================================================
  // BOOKS
  // ============================================================

  const getBook = async () => {
    console.warn("📚 [BOOKS] getBook() started");

    try {
      const response = await axios.get(
        `${API_BASE}/api/book/getBooks`
      );

      console.warn(
        "📚 [BOOKS] API RESPONSE:",
        response
      );

      console.warn(
        "📚 [BOOKS] BOOK DATA:",
        response.data
      );

      setBookData(response.data);

      console.log("Books Recieved");

      console.warn(
        "📚 [BOOKS] setBookData completed"
      );
    } catch (err) {
      console.error(
        "❌ [BOOKS] Error fetching books:",
        err
      );
    }
  };

  useEffect(() => {
    console.warn(
      "📚 [BOOKS] useEffect running"
    );

    getBook();
  }, []);

  // ============================================================
  // USER PROGRESS
  // ============================================================

  useEffect(() => {
    console.warn(
      "🔥🔥🔥 [PROGRESS] USE EFFECT STARTED 🔥🔥🔥"
    );

    const getUserProgress = async () => {
      console.warn(
        "🚀 [PROGRESS] getUserProgress() STARTED"
      );

      const storedToken =
        localStorage.getItem("token");

      console.warn(
        "🔑 [PROGRESS] Token exists:",
        !!storedToken
      );

      if (!storedToken) {
        console.warn(
          "⚠️ [PROGRESS] No token found"
        );

        setUserProgress({
          recentReadBooks: [],
          totalReadBooks: 0,
        });

        setUserGoal(0);

        return;
      }

      try {
        console.warn(
          "🌐 [PROGRESS] Sending request..."
        );

        const response = await axios.get(
          `${API_BASE}/api/users/get-user-progress`,
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },

            validateStatus: (status) =>
              status >= 200 && status < 400,
          }
        );

        console.warn(
          "✅✅✅ [PROGRESS] AXIOS REQUEST SUCCESS ✅✅✅"
        );

        console.warn(
          "📡 [PROGRESS] STATUS:",
          response.status
        );

        console.warn(
          "📦 [PROGRESS] RESPONSE DATA:",
          response.data
        );

        // ========================================================
        // NORMAL RESPONSE
        // ========================================================

        if (
          response.data &&
          response.data.progress
        ) {
          const progress =
            response.data.progress || {};

          const recentReadBooks =
            Array.isArray(
              progress.recentReadBooks
            )
              ? progress.recentReadBooks
              : [];

          const totalReadBooks =
            progress.totalReadBooks ?? 0;

          setUserProgress({
            ...progress,
            recentReadBooks,
            totalReadBooks,
          });

          setUserGoal(
            response.data.goal ?? 0
          );

          console.warn(
            "📚 [PROGRESS] recentReadBooks:",
            recentReadBooks
          );

          console.warn(
            "🎯 [PROGRESS] goal:",
            response.data.goal
          );

          return;
        }

        // ========================================================
        // EMPTY / 304 RESPONSE
        // ========================================================

        console.warn(
          "⚠️ [PROGRESS] Empty cached response detected"
        );

        setUserProgress({
          recentReadBooks: [],
          totalReadBooks: 0,
        });

        setUserGoal(0);
      } catch (err) {
        console.error(
          "❌❌❌ [PROGRESS] REQUEST FAILED ❌❌❌"
        );

        console.error(
          "Error:",
          err
        );

        console.error(
          "Response:",
          err?.response
        );

        console.error(
          "Response data:",
          err?.response?.data
        );

        setUserProgress({
          recentReadBooks: [],
          totalReadBooks: 0,
        });

        setUserGoal(0);
      }
    };

    getUserProgress();

    return () => {
      console.warn(
        "🧹 [PROGRESS] useEffect cleanup"
      );
    };
  }, []);

  // ============================================================
  // LOG USER PROGRESS
  // ============================================================

  useEffect(() => {
    console.warn(
      "🔄 [STATE] userProgress changed:",
      userProgress
    );

    console.warn(
      "📖 [STATE] recentReadBooks:",
      userProgress?.recentReadBooks
    );

    console.warn(
      "📖 [STATE] first book:",
      userProgress?.recentReadBooks?.[0]
    );
  }, [userProgress]);

  // ============================================================
  // LOG USER GOAL
  // ============================================================

  useEffect(() => {
    console.warn(
      "🎯 [STATE] userGoal changed:",
      userGoal
    );
  }, [userGoal]);

  // ============================================================
  // CALCULATE PROGRESS
  // ============================================================

  useEffect(() => {
    console.warn(
      "🧮 [CALCULATION] Progress calculation started"
    );

    const recentBooks =
      userProgress?.recentReadBooks;

    // ==========================================================
    // CONTINUE READING PERCENTAGE
    // ==========================================================

    if (
      recentBooks &&
      recentBooks.length > 0
    ) {
      const firstBook =
        recentBooks[0];

      console.warn(
        "📖 [CALCULATION] First book:",
        firstBook
      );

      if (
        firstBook.pagesRead === 0 ||
        !firstBook.totalPages
      ) {
        console.warn(
          "📊 [CALCULATION] No pages / total pages → 0%"
        );

        setRecentReadPercent(0);
      } else {
        const bookPercentage =
          Math.floor(
            (firstBook.pagesRead /
              firstBook.totalPages) *
              100
          );

        const finalPercentage =
          Math.min(
            bookPercentage,
            100
          );

        console.warn(
          "📊 [CALCULATION] Recent read percentage:",
          finalPercentage
        );

        setRecentReadPercent(
          finalPercentage
        );
      }
    } else {
      console.warn(
        "📖 [CALCULATION] No recent books"
      );

      setRecentReadPercent(0);
    }

    // ==========================================================
    // GOAL PERCENTAGE
    // ==========================================================

    if (
      userProgress?.totalReadBooks != null &&
      userGoal > 0
    ) {
      const calculatedGoalPercentage =
        Math.floor(
          (userProgress.totalReadBooks /
            userGoal) *
            100
        );

      const finalGoalPercentage =
        Math.min(
          calculatedGoalPercentage,
          100
        );

      console.warn(
        "🎯 [CALCULATION] Goal percentage:",
        finalGoalPercentage
      );

      setGoalPercentage(
        finalGoalPercentage
      );
    } else {
      console.warn(
        "🎯 [CALCULATION] Cannot calculate goal percentage"
      );

      setGoalPercentage(0);
    }
  }, [userProgress, userGoal]);

  // ============================================================
  // LOG CALCULATED VALUES
  // ============================================================

  useEffect(() => {
    console.warn(
      "📊 [FINAL] RecentReadPercent:",
      recentReadPercent
    );
  }, [recentReadPercent]);

  useEffect(() => {
    console.warn(
      "🎯 [FINAL] GoalPercentage:",
      goalPercentage
    );
  }, [goalPercentage]);

  // ============================================================
  // TOP PICKS SCROLL
  // ============================================================

  const handleViewAll = () => {
    if (topPicksRef.current) {
      topPicksRef.current.scrollBy({
        left: 500,
        behavior: "smooth",
      });
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <section className="mx-auto max-w-[1600px] px-4 pt-4 sm:px-8 sm:pt-10 md:px-12 md:pt-8 lg:px-20">
        {!token || !user ? (
          loginOpen && (
            <Login login={setLoginOpen} />
          )
        ) : null}

        <h1 className="font-sans text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl md:text-4xl">
          Good morning, {user?.username}
        </h1>

        <p className="pb-6 pt-1 text-sm text-text-secondary sm:text-base md:pb-10 md:text-lg">
          Let's pick up where you left off.
        </p>

        {/* ======================================================
            HOME HERO
        ====================================================== */}

        {userProgress?.recentReadBooks?.length ===
          0 && <HomeHero />}

        {/* ======================================================
            USER PROGRESS
        ====================================================== */}

        {userProgress?.recentReadBooks?.length >
          0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">

            {/* CONTINUE READING */}

            <div className="relative flex min-h-[360px] flex-col justify-between overflow-hidden rounded-2xl border border-border-light bg-background-card p-5 shadow-sm sm:p-8 lg:col-span-2">

              <div className="relative z-10 w-full">

                <div className="pb-4 text-lg font-semibold text-text-primary sm:pb-6 sm:text-xl">
                  Continue Reading
                </div>

                <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-8">

                  <div className="aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-xl border border-border-light shadow-md sm:w-36">
                    <img
                      src={`https://archive.org/services/img/${userProgress?.recentReadBooks?.[0]?.book?.identifier}`}
                      alt={
                        userProgress?.recentReadBooks?.[0]?.book?.title ||
                        "Book Cover"
                      }
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex w-full flex-col gap-3.5">

                    <div className="relative rounded-xl border border-white/60 bg-white/40 px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_6px_16px_rgba(124,58,237,0.08)] backdrop-blur-xl">

                      <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/80" />

                      <div className="truncate text-base font-semibold text-text-primary sm:text-lg">
                        {
                          userProgress?.recentReadBooks?.[0]?.book?.title
                        }
                      </div>

                      <div className="mt-0.5 truncate text-xs text-text-secondary sm:text-sm">
                        {
                          userProgress?.recentReadBooks?.[0]?.book?.author
                        }
                      </div>

                    </div>

                    <div className="relative rounded-xl border border-white/60 bg-white/40 px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_6px_16px_rgba(124,58,237,0.08)] backdrop-blur-xl">

                      <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/80" />

                      <div className="text-base font-semibold text-brand sm:text-lg">
                        {recentReadPercent}%
                      </div>

                      <div className="mt-0.5 text-xs text-text-secondary sm:text-sm">
                        {`${userProgress?.recentReadBooks?.[0]?.pagesRead || 0} out of ${
                          userProgress?.recentReadBooks?.[0]?.totalPages || 0
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
                className="group relative z-10 mt-6 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/50 bg-brand/15 px-6 py-3 font-semibold text-brand backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand/25 hover:shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_10px_24px_rgba(124,58,237,0.25)] active:translate-y-0 sm:w-auto sm:self-start"
              >
                <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/70" />
                Continue Reading
              </button>

            </div>

            {/* YOUR PROGRESS */}

            <div className="relative flex min-h-[360px] flex-col justify-between overflow-hidden rounded-2xl border border-border-light bg-background-card p-5 shadow-sm sm:p-8">

              <div className="relative z-10 w-full">

                <div className="text-lg font-semibold text-text-primary sm:text-xl">
                  Your Progress
                </div>

                <div className="my-4 grid grid-cols-2 gap-3 sm:my-6">

                  <div className="relative flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white/40 px-2 py-3 shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_6px_16px_rgba(124,58,237,0.04)] backdrop-blur-xl">

                    <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/80" />

                    <span className="text-lg font-bold text-brand sm:text-2xl">
                      {userProgress?.totalReadBooks ?? 0}
                    </span>

                    <span className="mt-0.5 text-[11px] font-normal text-text-secondary sm:text-xs">
                      Books Read
                    </span>

                  </div>

                  <div className="relative flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white/40 px-2 py-3 shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_6px_16px_rgba(124,58,237,0.04)] backdrop-blur-xl">

                    <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/80" />

                    <span className="text-lg font-bold text-brand sm:text-2xl">
                      {userGoal ?? 0}
                    </span>

                    <span className="mt-0.5 text-[11px] font-normal text-text-secondary sm:text-xs">
                      Yearly Goal
                    </span>

                  </div>

                </div>

                <div className="mx-auto my-4 h-24 w-24 sm:h-28 sm:w-28">
                  <CircularProgressbar
                    value={goalPercentage}
                    text={`${goalPercentage}%`}
                    styles={buildStyles({
                      pathColor: "#7C3AED",
                      trailColor: "#E2E8F0",
                      textColor: "#0F172A",
                    })}
                  />
                </div>

              </div>

              <p className="mt-2 text-center text-xs font-normal text-text-secondary sm:text-sm">
                Read today, grow every day.
              </p>

            </div>

          </div>
        )}
      </section>

      {/* ========================================================
          TOP PICKS
      ======================================================== */}

      <section className="mx-auto mb-16 mt-12 max-w-[1600px] px-4 sm:px-8 md:mt-16 md:px-12 lg:px-20">

        <div className="mb-4 flex items-center justify-between sm:mb-6">

          <div className="text-lg font-semibold text-text-primary sm:text-xl md:text-2xl">
            Top Picks For You
          </div>

          <button
            onClick={handleViewAll}
            className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary sm:text-base"
          >
            Scroll
            <LuArrowRight className="text-base" />
          </button>

        </div>

        <div
          ref={topPicksRef}
          className="scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth py-2 sm:gap-6"
        >
          {bookData?.slice(0, 14).map(
            (item, index) => (
              <div
                key={index}
                className="shrink-0"
              >
                <Cardone book={item} />
              </div>
            )
          )}
        </div>

      </section>
    </>
  );
};

export default Home;