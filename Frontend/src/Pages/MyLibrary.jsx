import React, { useEffect, useState } from "react";
import { IoChevronBack } from "react-icons/io5";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Vite environment variable with localhost fallback
const API_BASE = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

const MyLibrary = () => {
  const [recentBooks, setRecentBooks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const getRecentBooks = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) return;

        const response = await axios.get(
          `${API_BASE}/api/users/get-recent-books`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const books = response.data.recentBooks;
        setRecentBooks(books);
      } catch (error) {
        console.error("Error fetching recent books:", error);
      }
    };
    getRecentBooks();
  }, []);

  return (
    <>
      <section className="w-full max-w-9xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        {/* Header / Back Button */}
        <div
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl font-semibold text-text-primary mb-6 cursor-pointer w-fit hover:opacity-80 transition"
        >
          <IoChevronBack className="text-xl sm:text-2xl" />
          <span>Continue Reading</span>
        </div>

        <div className="flex flex-col gap-4 sm:gap-6">
          {recentBooks?.map((item, index) => {
            // dynamic progress calculation
            const pagesRead = item?.pagesRead || 0;
            const totalPages = item?.totalPages || item?.book?.totalPages || 1;

            const rawPercent = (pagesRead / totalPages) * 100;
            const progressPercent = pagesRead > 0
              ? Math.min(100, Math.max(1, Math.floor(rawPercent)))
              : 0;

            return (
              <div
                key={index}
                className="group relative flex flex-col md:grid md:grid-cols-[auto_2fr_1.5fr_auto] gap-4 items-start md:items-center overflow-hidden rounded-2xl p-4 sm:p-5
                border border-white/60 bg-white/50 backdrop-blur-xl
                shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_8px_20px_rgba(124,58,237,0.08)]
                transition-all duration-300
                hover:bg-white/70 hover:border-white/80
                hover:shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_14px_28px_rgba(124,58,237,0.14)] cursor-pointer"
                onClick={() => navigate(`/reader/${item?.book?.identifier}`)}
              >
                {/* top glass sheen */}
                <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/80 z-10" />

                {/* Mobile Section: Cover + Book Info side-by-side */}
                <div className="flex gap-4 items-center w-full md:w-auto">
                  {/* Fixed aspect ratio prevents cover distortion */}
                  <div className="w-20 sm:w-24 md:w-28 aspect-[2/3] shrink-0 rounded-lg border border-white/50 overflow-hidden shadow-sm bg-gray-100">
                    <img
                      className="w-full h-full object-cover"
                      src={`https://archive.org/services/img/${item?.book?.identifier}`}
                      alt={item?.book?.title || "Book Cover"}
                    />
                  </div>

                  {/* Mobile-Only Info */}
                  <div className="flex flex-col flex-1 min-w-0 md:hidden gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-text-primary font-semibold text-base line-clamp-2 leading-tight">
                        {item?.book?.title}
                      </h3>
                      <span className="text-[10px] text-brand bg-brand-light/50 border border-white/50 backdrop-blur-md rounded-full px-2.5 py-0.5 uppercase tracking-wider font-semibold shrink-0">
                        {progressPercent === 100 ? "Finished" : "Reading"}
                      </span>
                    </div>
                    <p className="text-text-secondary text-xs truncate">
                      {item?.book?.author}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-brand pt-1">
                      ⭐ <span>{item?.book?.rating || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Desktop/Tablet Info */}
                <div className="hidden md:flex flex-col justify-center gap-1 min-w-0">
                  <h3 className="text-text-primary font-semibold text-base lg:text-lg line-clamp-2 leading-tight">
                    {item?.book?.title}
                  </h3>
                  <p className="text-text-secondary text-sm truncate">
                    {item?.book?.author}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-brand pt-1">
                    ⭐ <span>{item?.book?.rating || "N/A"}</span>
                  </div>
                </div>

                {/* Progress Bar (Spans full width on mobile below header) */}
                <div className="w-full flex flex-col justify-center gap-1.5 pt-2 md:pt-0 border-t border-white/40 md:border-none">
                  <div className="flex justify-between items-center text-xs sm:text-sm text-text-secondary">
                    <span>Progress</span>
                    <span className="font-semibold text-text-primary">{progressPercent}%</span>
                  </div>

                  <div className="bg-white/60 border border-gray-200/80 w-full h-2 rounded-full backdrop-blur-md overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-brand to-brand-hover h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="text-xs text-text-secondary">
                    Page {pagesRead} of {totalPages}
                  </div>
                </div>

                {/* Desktop Status Badge */}
                <div className="hidden md:flex items-center justify-end shrink-0">
                  <span className="text-xs text-brand bg-brand-light/50 border border-white/50 backdrop-blur-md rounded-full px-4 py-1 uppercase tracking-wider font-semibold">
                    {progressPercent === 100 ? "Finished" : "Reading"}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Empty State Fallback */}
          {recentBooks?.length === 0 && (
            <div className="mt-12 text-center text-text-secondary">
              <p>You haven't started reading any books yet.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default MyLibrary;