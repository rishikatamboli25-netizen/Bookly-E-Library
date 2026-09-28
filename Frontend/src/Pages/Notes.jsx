import React, { useEffect, useState } from "react";
import { IoChevronBack } from "react-icons/io5";
import { LuArrowRight } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Vite environment variable with localhost fallback
const API_BASE = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

const Notes = () => {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // --------------------------------
  // GET USER NOTES
  // --------------------------------
  useEffect(() => {
    const getNotes = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE}/api/users/getnotes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setNotes(response.data || []);
      } catch (error) {
        console.error("Failed to fetch notes: ", error);
      } finally {
        setLoading(false);
      }
    };

    getNotes();
  }, []);

  // --------------------------------
  // BOOK COVER HELPER
  // --------------------------------
  const getBookCover = (book) => {
    if (!book) return "";
    if (book.identifier) {
      return `https://archive.org/services/img/${book.identifier}`;
    }
    return book.cover || "";
  };

  const handleClick = (item) => {
    navigate("/Notedetail", {
      state: {
        note: item,
      },
    });
  };

  // --------------------------------
  // LOADING STATE
  // --------------------------------
  if (loading) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-sm sm:text-base text-text-secondary">
          Loading your notes...
        </p>
      </section>
    );
  }

  // --------------------------------
  // EMPTY STATE
  // --------------------------------
  if (notes.length === 0) {
    return (
      <section className="min-h-screen px-4 sm:px-7   py-5 sm:py-7">
        <div className="mx-4 max-w-4xl">
          {/* Top Header Back Button */}
          <div
            onClick={() => navigate(-1)}
            className="flex w-fit cursor-pointer items-center gap-2 text-lg sm:text-2xl font-semibold text-text-primary hover:opacity-80 transition"
          >
            <IoChevronBack className="shrink-0" />
            <span>Your Notes</span>
          </div>

          {/* Empty State Card */}
          <div className="flex min-h-[60vh] w-full items-center justify-center py-8 ">
            <div className="flex w-full max-w-sm flex-col items-center justify-center rounded-2xl bg-gray-100 p-6 sm:p-8 text-center shadow-sm">
              <h2 className="text-xl sm:text-2xl font-semibold text-brand">
                No Notes Found
              </h2>

              <p className="mt-2 text-xs sm:text-sm text-gray-500">
                Start reading to create and save notes.
              </p>

              <div className="mt-5 flex items-center justify-center gap-3 w-full">
                <button
                  type="button"
                  className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-medium text-text-primary transition hover:bg-gray-50"
                  onClick={() => navigate(-1)}
                >
                  Go Back
                </button>

                <button
                  type="button"
                  className="rounded-full bg-brand px-5 py-2.5 text-xs sm:text-sm font-medium text-white transition hover:opacity-90"
                  onClick={() => navigate("/discover")}
                >
                  Explore Books
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // --------------------------------
  // MAIN VIEW
  // --------------------------------
  return (
    <section className="min-h-screen px-4  py-5 sm:py-7">
      <div className="max-w-4xl">
        {/* Header */}
        <div
          onClick={() => navigate(-1)}
          className="flex w-fit cursor-pointer items-center gap-2 text-lg sm:text-2xl font-semibold text-text-primary hover:opacity-80 transition"
        >
          <IoChevronBack className="shrink-0" />
          <span>Your Notes</span>
        </div>

        {/* Notes Cards List */}
        <div className="mt-6 sm:mt-8 flex flex-col gap-4">
          {notes.map((item, index) => (
            <div
              key={item._id || index}
              onClick={() => handleClick(item)}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border-light bg-background-card p-4 transition-all duration-300 hover:shadow-md cursor-pointer"
            >
              {/* Left Side: Book Cover & Details */}
              <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
                <img
                  className="h-24 w-16 sm:h-28 sm:w-20 shrink-0 rounded-md object-cover shadow-sm"
                  src={getBookCover(item.book)}
                  alt={item.book?.title || "Book cover"}
                />

                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base sm:text-lg font-semibold text-text-primary group-hover:text-brand transition-colors">
                    {item.book?.title || "Untitled Book"}
                  </h2>

                  <p className="mt-1 text-xs sm:text-sm text-text-secondary font-medium">
                    Page No: {item.page ?? "N/A"}
                  </p>

                  {item.content && (
                    <p className="mt-2 text-xs sm:text-sm text-text-secondary line-clamp-2 italic">
                      "{item.content}"
                    </p>
                  )}
                </div>
              </div>

              {/* Right Side: Timestamp & Arrow */}
              <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-border-light shrink-0">
                <span className="text-[11px] sm:text-xs text-text-secondary font-medium">
                  {new Date(item.createdAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>

                <LuArrowRight className="text-text-secondary transition-transform group-hover:translate-x-1" size={18} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Notes;