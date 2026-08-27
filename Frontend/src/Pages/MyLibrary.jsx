import React from "react";
import { useState, useEffect } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
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
          },
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
      <section className="w-[70vw] justify-self-center py-7">
        {/* Header / Back Button */}
        <div 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[clamp(16px,2vw,24px)] font-semibold text-text-primary mb-6 cursor-pointer w-fit hover:opacity-80 transition"
        >
          <IoChevronBack />
          <span>Continue Reading</span>
        </div>

        {recentBooks?.map((item, index) => {
          // ==========================================
          // DYNAMIC PROGRESS CALCULATION
          // ==========================================
          const pagesRead = item?.pagesRead || 0;
          const totalPages = item?.totalPages || item?.book?.totalPages || 1; // Fallback to 1 to prevent division by zero
          
          const rawPercent = (pagesRead / totalPages) * 100;
          const progressPercent = pagesRead > 0 
            ? Math.min(100, Math.max(1, Math.floor(rawPercent))) 
            : 0;

          return (
            <div
              key={index}
              className="group grid grid-cols-[1.3fr_4fr_2.5fr_3fr] gap-3 items-center mt-8 justify-between overflow-hidden rounded-2xl p-5
              border border-white/60 bg-white/50 backdrop-blur-xl
              shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_8px_20px_rgba(124,58,237,0.08)]
              transition-all duration-300
              hover:bg-white/70 hover:border-white/80
              hover:shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_14px_28px_rgba(124,58,237,0.14)] cursor-pointer"
              onClick={() => navigate(`/reader/${item?.book?.identifier}`)}
            >
              {/* top sheen */}
              <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/80" />

              {/* Left Section (Cover) */}
              <div>
                <img
                  className="h-[22vh] rounded-lg border border-white/50 object-cover"
                  src={`https://archive.org/services/img/${item?.book?.identifier}`}
                  alt={item?.book?.title || "Book Cover"}
                />
              </div>

              {/* Title & Author */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <div className="text-text-primary font-semibold text-[1.2rem] line-clamp-2">
                    {item?.book?.title}
                  </div>
                  <p className="text-text-secondary text-[1rem]">
                    {item?.book?.author}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[0.95rem] text-brand pt-3">
                  ⭐<span>{item?.book?.rating || "N/A"}</span>
                </div>
              </div>

              {/* Middle Section (Progress Bar) */}
              <div className="">
                <p className="text-text-secondary text-[0.8rem] leading-0">
                  Progress
                  <span className="text-[0.8rem] ml-1">{progressPercent}%</span>
                </p>

                <div className="flex items-center gap-3 text-text-primary font-semibold mt-1 mb-1">
                  <div className="bg-white/60 border border-gray-200 w-full h-[1vh] rounded-full backdrop-blur-md overflow-hidden">
                    {/* Dynamic Width applied here via inline style */}
                    <div 
                      className="bg-gradient-to-r from-brand to-brand-hover h-full rounded-full transition-all duration-500" 
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <span className="text-text-secondary text-[0.8rem] leading-0">
                    Page {pagesRead} of {totalPages}
                  </span>
                </div>
              </div>

              {/* Right Section (Status Tag) */}
              <div className="h-full relative">
                <div className="w-fit absolute right-6 text-[0.8rem] text-brand bg-brand-light/50 border border-white/50 backdrop-blur-md rounded-full px-4 py-1 uppercase tracking-wider font-semibold">
                  {progressPercent === 100 ? "Finished" : "Reading"}
                </div>
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
      </section>
    </>
  );
};

export default MyLibrary;