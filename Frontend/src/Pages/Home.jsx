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

// Vite environment variable with localhost fallback
const API_BASE = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

const Home = () => {
  const [loginOpen, setLoginOpen] = useState(true);
  const [bookData, setBookData] = useState([]);

  const [userProgress, setUserProgress] = useState(null);
  const [userGoal, setUserGoal] = useState(0);

  const [recentReadPercent, setRecentReadPercent] = useState(0);
  const [goalPercentage, setGoalPercentage] = useState(0);

  const navigate = useNavigate();

  // Ref for Top Picks horizontal scroll container
  const topPicksRef = useRef(null);

  const token = localStorage.getItem("token");

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (error) {
    console.error("❌ Error parsing user from localStorage:", error);
  }

  /*
  ============================================================
  BOOKS
  ============================================================
  */

  const getBook = async () => {
    console.warn("📚 [BOOKS] getBook() started");

    try {
      const response = await axios.get(`${API_BASE}/api/book/getBooks`);

      console.warn("📚 [BOOKS] API RESPONSE:", response);
      console.warn("📚 [BOOKS] BOOK DATA:", response.data);

      setBookData(response.data);
      console.log("Books Recieved")

      console.warn("📚 [BOOKS] setBookData completed");
    } catch (err) {
      console.error("❌ [BOOKS] Error fetching books:", err);
    }
  };

  

  useEffect(() => {
    console.warn("📚 [BOOKS] useEffect running");
    getBook();
  }, []);

  /*
  ============================================================
  USER PROGRESS
  ============================================================
  */

  useEffect(() => {
    console.warn("🔥🔥🔥 [PROGRESS] USE EFFECT STARTED 🔥🔥🔥");

    const getUserProgress = async () => {
      console.warn("🚀 [PROGRESS] getUserProgress() STARTED");

      const storedToken = localStorage.getItem("token");

      console.warn("🔑 [PROGRESS] Token exists:", !!storedToken);

      if (!storedToken) {
        console.error("❌ [PROGRESS] No token found!");
        return;
      }

      try {
        console.warn("🌐 [PROGRESS] Sending request...");

        const response = await axios.get(
          `${API_BASE}/api/users/get-user-progress`,
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          }
        );

        console.warn("✅✅✅ [PROGRESS] AXIOS REQUEST SUCCESS ✅✅✅");
        console.warn("📦 [PROGRESS] FULL RESPONSE:", response);
        console.warn("📦 [PROGRESS] RESPONSE DATA:", response.data);

        console.warn(
          "📚 [PROGRESS] recentReadBooks:",
          response.data?.progress?.recentReadBooks
        );

        console.warn("🎯 [PROGRESS] goal:", response.data?.goal);

        setUserProgress(response.data.progress);
        setUserGoal(response.data.goal);

        console.warn("💾 [PROGRESS] State setters called");
      } catch (err) {
        console.error("❌❌❌ [PROGRESS] REQUEST FAILED ❌❌❌");
        console.error("Error:", err);
        console.error("Response:", err?.response);
        console.error("Response data:", err?.response?.data);
      }
    };

    getUserProgress();

    return () => {
      console.warn("🧹 [PROGRESS] useEffect cleanup");
    };
  }, []);

  /*
  ============================================================
  LOG USER PROGRESS WHEN STATE CHANGES
  ============================================================
  */

  useEffect(() => {
    console.warn("🔄 [STATE] userProgress changed:", userProgress);

    console.warn(
      "📖 [STATE] recentReadBooks:",
      userProgress?.recentReadBooks
    );

    console.warn(
      "📖 [STATE] first book:",
      userProgress?.recentReadBooks?.[0]
    );
  }, [userProgress]);

  /*
  ============================================================
  LOG USER GOAL
  ============================================================
  */

  useEffect(() => {
    console.warn("🎯 [STATE] userGoal changed:", userGoal);
  }, [userGoal]);

  /*
  ============================================================
  CALCULATE PROGRESS
  ============================================================
  */

  useEffect(() => {
    console.warn("🧮 [CALCULATION] Progress calculation started");

    const recentBooks = userProgress?.recentReadBooks;

    /*
    ------------------------------------------------------------
    Continue Reading Percentage
    ------------------------------------------------------------
    */

    if (recentBooks && recentBooks.length > 0) {
      const firstBook = recentBooks[0];

      console.warn("📖 [CALCULATION] First book:", firstBook);

      if (firstBook.pagesRead === 0 || !firstBook.totalPages) {
        console.warn(
          "📊 [CALCULATION] No pages / total pages → 0%"
        );

        setRecentReadPercent(0);
      } else {
        const bookPercentage = Math.floor(
          (firstBook.pagesRead / firstBook.totalPages) * 100
        );

        const finalPercentage = Math.min(bookPercentage, 100);

        console.warn(
          "📊 [CALCULATION] Recent read percentage:",
          finalPercentage
        );

        setRecentReadPercent(finalPercentage);
      }
    } else {
      console.warn("📖 [CALCULATION] No recent books");

      setRecentReadPercent(0);
    }

    /*
    ------------------------------------------------------------
    Goal Percentage
    ------------------------------------------------------------
    */

    if (
      userProgress?.totalReadBooks != null &&
      userGoal > 0
    ) {
      const calculatedGoalPercentage = Math.floor(
        (userProgress.totalReadBooks / userGoal) * 100
      );

      const finalGoalPercentage = Math.min(
        calculatedGoalPercentage,
        100
      );

      console.warn(
        "🎯 [CALCULATION] Goal percentage:",
        finalGoalPercentage
      );

      setGoalPercentage(finalGoalPercentage);
    } else {
      console.warn(
        "🎯 [CALCULATION] Cannot calculate goal percentage"
      );

      setGoalPercentage(0);
    }
  }, [userProgress, userGoal]);

  /*
  ============================================================
  LOG CALCULATED VALUES
  ============================================================
  */

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

  /*
  ============================================================
  TOP PICKS SCROLL
  ============================================================
  */

  const handleViewAll = () => {
    if (topPicksRef.current) {
      topPicksRef.current.scrollBy({
        left: 500,
        behavior: "smooth",
      });
    }
  };

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <>
      {/* Top padding is now pt-4 on mobile and scales to md:pt-24 on medium/large screens */}
      <section className="px-4 sm:px-8 md:px-12 lg:px-20 pt-4 sm:pt-10 md:pt-8 max-w-[1600px] mx-auto">
        {!token || !user ? (
          loginOpen && <Login login={setLoginOpen} />
        ) : null}

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-sans text-text-primary font-semibold tracking-tight">
          Good morning, {user?.username}
        </h1>

        <p className="text-sm sm:text-base md:text-lg pt-1 text-text-secondary pb-6 md:pb-10">
          Let's pick up where you left off.
        </p>

        {userProgress?.recentReadBooks?.length === 0 && (
          <HomeHero />
        )}

        {userProgress?.recentReadBooks?.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

            {/* CONTINUE READING */}
            <div className="lg:col-span-2 relative overflow-hidden border border-border-light rounded-2xl p-5 sm:p-8 bg-background-card flex flex-col justify-between shadow-sm min-h-[360px]">

              <div className="relative z-10 w-full">
                <div className="text-lg sm:text-xl font-semibold text-text-primary pb-4 sm:pb-6">
                  Continue Reading
                </div>

                <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 items-center sm:items-start">

                  <div className="w-28 sm:w-36 aspect-[2/3] rounded-xl overflow-hidden border border-border-light shrink-0 shadow-md">
                    <img
                      src={`https://archive.org/services/img/${userProgress?.recentReadBooks?.[0]?.book?.identifier}`}
                      alt={userProgress?.recentReadBooks?.[0]?.book?.title || "Book Cover"}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex flex-col gap-3.5 w-full">

                    <div className="relative rounded-xl border border-white/60 bg-white/40 backdrop-blur-xl px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_6px_16px_rgba(124,58,237,0.08)]">
                      <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/80" />

                      <div className="font-semibold text-text-primary text-base sm:text-lg truncate">
                        {userProgress?.recentReadBooks?.[0]?.book?.title}
                      </div>

                      <div className="text-text-secondary text-xs sm:text-sm mt-0.5 truncate">
                        {userProgress?.recentReadBooks?.[0]?.book?.author}
                      </div>
                    </div>

                    <div className="relative rounded-xl border border-white/60 bg-white/40 backdrop-blur-xl px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_6px_16px_rgba(124,58,237,0.08)]">
                      <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/80" />

                      <div className="font-semibold text-brand text-base sm:text-lg">
                        {recentReadPercent}%
                      </div>

                      <div className="text-text-secondary text-xs sm:text-sm mt-0.5">
                        {`${userProgress?.recentReadBooks?.[0]?.pagesRead || 0} out of ${userProgress?.recentReadBooks?.[0]?.totalPages || 0} pages`}
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
                className="relative z-10 group flex items-center justify-center w-full sm:w-auto sm:self-start px-6 py-3 mt-6 rounded-full text-brand font-semibold overflow-hidden bg-brand/15 border border-white/50 backdrop-blur-xl transition-all duration-300 hover:bg-brand/25 hover:-translate-y-0.5 hover:shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_10px_24px_rgba(124,58,237,0.25)] active:translate-y-0 cursor-pointer"
              >
                <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/70" />
                Continue Reading
              </button>

            </div>

            {/* YOUR PROGRESS */}
            <div className="relative overflow-hidden border border-border-light rounded-2xl p-5 sm:p-8 bg-background-card flex flex-col justify-between shadow-sm min-h-[360px]">

              <div className="relative z-10 w-full">
                <div className="text-lg sm:text-xl text-text-primary font-semibold">
                  Your Progress
                </div>

                <div className="grid grid-cols-2 gap-3 my-4 sm:my-6">

                  <div className="relative rounded-xl border border-gray-200 bg-white/40 backdrop-blur-xl py-3 px-2 flex flex-col items-center justify-center shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_6px_16px_rgba(124,58,237,0.04)]">
                    <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/80" />
                    <span className="text-brand font-bold text-lg sm:text-2xl">
                      {userProgress?.totalReadBooks ?? 0}
                    </span>
                    <span className="text-[11px] sm:text-xs font-normal text-text-secondary mt-0.5">
                      Books Read
                    </span>
                  </div>

                  <div className="relative rounded-xl border border-gray-200 bg-white/40 backdrop-blur-xl py-3 px-2 flex flex-col items-center justify-center shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_6px_16px_rgba(124,58,237,0.04)]">
                    <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/80" />
                    <span className="text-brand font-bold text-lg sm:text-2xl">
                      {userGoal ?? 0}
                    </span>
                    <span className="text-[11px] sm:text-xs font-normal text-text-secondary mt-0.5">
                      Yearly Goal
                    </span>
                  </div>

                </div>

                <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto my-4">
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

              <p className="text-xs sm:text-sm text-center font-normal text-text-secondary mt-2">
                Read today, grow every day.
              </p>

            </div>

          </div>
        )}
      </section>

      {/* TOP PICKS */}
      <section className="px-4 sm:px-8 md:px-12 lg:px-20 mt-12 md:mt-16 mb-16 max-w-[1600px] mx-auto">

        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="text-lg sm:text-xl md:text-2xl font-semibold text-text-primary">
            Top Picks For You
          </div>

          <button
            onClick={handleViewAll}
            className="flex items-center gap-2 text-sm sm:text-base text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            Scroll
            <LuArrowRight className="text-base" />
          </button>
        </div>

        <div
          ref={topPicksRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide scroll-smooth py-2"
        >
          {bookData?.slice(0, 14).map((item, index) => (
            <div key={index} className="shrink-0">
              <Cardone book={item} />
            </div>
          ))}
        </div>

      </section>
    </>
  );
};

export default Home;