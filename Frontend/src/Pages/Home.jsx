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
      const response = await axios.get(
        "http://localhost:5000/api/book/getBooks"
      );

      console.warn("📚 [BOOKS] API RESPONSE:", response);
      console.warn("📚 [BOOKS] BOOK DATA:", response.data);

      setBookData(response.data);

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
          "http://localhost:5000/api/users/get-user-progress",
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
      <section className="px-20 pt-24">
        {!token || !user ? (
          loginOpen && <Login login={setLoginOpen} />
        ) : null}

        <div className="text-[clamp(20px,4vw,35px)] font-sans text-text-primary font-semibold">
          Good morning, {user?.username}
        </div>

        <div className="text-[clamp(9px,5vw,18px)] py-1 text-text-secondary pb-10">
          Let's pick up where you left off.
        </div>

        {userProgress?.recentReadBooks?.length === 0 && (
          <HomeHero />
        )}

        {userProgress?.recentReadBooks?.length > 0 && (
          <div className="grid grid-cols-[2fr_1fr] gap-16">

            {/* CONTINUE READING */}

            <div className="relative overflow-hidden border border-border-light h-[50vh] rounded-2xl px-8 bg-background-card">

              <div className="relative z-10 text-[clamp(10px,5vw,20px)] font-semibold text-text-primary py-5">
                Continue Reading
              </div>

              <div className="relative z-10 flex gap-10 h-[60%] pb-5">

                <div className="rounded-xl overflow-hidden border border-border-light shrink-0">
                  <img
                    src={`https://archive.org/services/img/${userProgress?.recentReadBooks?.[0]?.book?.identifier}`}
                    alt=""
                    className="h-full object-cover"
                  />
                </div>

                <div className="grid grid-rows-2 gap-4 w-full">

                  <div className="relative rounded-xl border border-white/60 bg-white/40 backdrop-blur-xl px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_6px_16px_rgba(124,58,237,0.08)]">

                    <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/80" />

                    <div className="font-semibold text-text-primary text-[clamp(12px,2vw,15px)] truncate">
                      {userProgress?.recentReadBooks?.[0]?.book?.title}
                    </div>

                    <div className="text-text-secondary text-[clamp(11px,1.6vw,13px)] mt-1">
                      {userProgress?.recentReadBooks?.[0]?.book?.author}
                    </div>

                  </div>

                  <div className="relative rounded-xl border border-white/60 bg-white/40 backdrop-blur-xl px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_6px_16px_rgba(124,58,237,0.08)]">

                    <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/80" />

                    <div className="font-semibold text-brand text-[clamp(14px,2vw,16px)]">
                      {recentReadPercent}%
                    </div>

                    <div className="text-text-secondary text-[clamp(11px,1.6vw,13px)] mt-1">
                      {`${userProgress?.recentReadBooks?.[0]?.pagesRead} out of ${userProgress?.recentReadBooks?.[0]?.totalPages}`}
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
                className="relative z-10 group flex items-center justify-center w-[40vw] py-2.5 rounded-full text-brand font-semibold overflow-hidden bg-brand/15 border border-white/50 backdrop-blur-xl transition-all duration-300 hover:bg-brand/25 hover:-translate-y-0.5 hover:shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_10px_24px_rgba(124,58,237,0.25)] active:translate-y-0"
              >
                <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/70" />

                Continue Reading
              </button>

            </div>

            {/* YOUR PROGRESS */}

            <div className="relative overflow-hidden border border-border-light h-[50vh] rounded-2xl bg-background-card">

              <div className="relative z-10 py-5 px-8 text-[clamp(10px,5vw,20px)] text-text-primary font-semibold">

                Your Progress

                <div className="grid grid-cols-2 gap-3 h-[15vh] pt-5">

                  <span className="relative rounded-xl border border-gray-200 bg-white/40 backdrop-blur-xl flex items-center justify-center text-brand font-bold shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_6px_16px_rgba(124,58,237,0.04)]">

                    <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/80" />

                    {userProgress?.totalReadBooks ?? 0}

                  </span>

                  <span className="relative rounded-xl border border-gray-200 bg-white/40 backdrop-blur-xl flex items-center justify-center text-brand font-bold shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_6px_16px_rgba(124,58,237,0.04)]">

                    <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/80" />

                    {userGoal ?? 0}

                  </span>

                </div>

                <div className="w-[8vw] mx-auto py-5">

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

                <p className="text-[clamp(14px,2vw,16px)] text-center font-thin text-text-secondary">
                  Read today, grow every day.
                </p>

              </div>
            </div>

          </div>
        )}
      </section>

      {/* TOP PICKS */}

      <section className="px-20 mt-16 mb-16">

        <div className="flex justify-between">

          <div className="text-[clamp(10px,5vw,20px)] font-semibold text-text-primary">
            Top Picks For You
          </div>

          <button
            onClick={handleViewAll}
            className="flex items-center gap-2 text-text-secondary cursor-pointer"
          >
            Scroll
            <LuArrowRight />
          </button>

        </div>

        <div
          ref={topPicksRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
        >

          {bookData?.slice(0, 14).map((item, index) => (
            <Cardone
              key={index}
              book={item}
            />
          ))}

        </div>

      </section>
    </>
  );
};

export default Home;