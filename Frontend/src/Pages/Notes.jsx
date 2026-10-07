import React, { useCallback, useEffect, useState } from "react";
import { IoChevronBack } from "react-icons/io5";
import { LuArrowRight } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

import BookCover from "../compontents/BookCover";
import { api, getFriendlyError } from "../utils/api";
import {
  getCachedUserData,
  clearCachedUserData,
} from "../utils/userData";

const NOTES_RESOURCE = "notes";

const getOriginalCoverBook = (book) => {
  if (!book) {
    return null;
  }

  if (book.coverUrl) {
    return book;
  }

  if (!book.identifier) {
    return book;
  }

  return {
    ...book,
    coverUrl: `https://raw.githubusercontent.com/standardebooks/${book.identifier}/master/src/epub/images/cover.svg`,
  };
};

const Notes = () => {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadNotes = useCallback(async (force = false) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setNotes([]);
      setLoading(false);
      setErrorMessage("Please sign in to view your notes.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const data = await getCachedUserData({
        token,
        resource: NOTES_RESOURCE,
        force,
        ttl: 2 * 60 * 1000,
        fetcher: async () => {
          const response = await api.get("/api/users/getnotes", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          return Array.isArray(response.data) ? response.data : [];
        },
      });

      setNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error?.message === "AUTH_REQUIRED") {
        setNotes([]);
        setErrorMessage("Please sign in to view your notes.");
      } else {
        setNotes([]);
        setErrorMessage(
          getFriendlyError(
            error,
            "We couldn't load your notes right now."
          )
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const retry = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      clearCachedUserData({
        token,
        resource: NOTES_RESOURCE,
      });
    }

    await loadNotes(true);
  };

  const handleClick = (item) => {
    navigate("/Notedetail", {
      state: {
        note: item,
      },
    });
  };

  const formatDate = (date) => {
    if (!date) {
      return "Recently created";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Recently created";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <section className="min-h-[calc(100dvh+2rem)] w-full px-3 py-5 sm:px-5 sm:py-7 lg:px-6">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex w-fit items-center gap-2 text-lg font-semibold text-text-primary transition hover:opacity-75 sm:text-2xl"
        >
          <IoChevronBack className="shrink-0" />
          <span>Your Notes</span>
        </button>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />

              <p className="mt-4 text-sm text-text-secondary sm:text-base">
                Loading your notes...
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && errorMessage && (
          <div className="mt-7 flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-border-light bg-background-card px-5 text-center sm:mt-8 sm:px-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-brand">
              <LuArrowRight size={20} className="rotate-180" />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-text-primary sm:text-xl">
              We couldn't load your notes
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
              {errorMessage}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-full border border-border-light bg-white px-5 py-2.5 text-sm font-medium text-text-primary transition hover:bg-gray-50"
              >
                Go Back
              </button>

              <button
                type="button"
                onClick={retry}
                className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !errorMessage && notes.length === 0 && (
          <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center py-8">
            <div className="w-full max-w-sm text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <span className="text-xl font-semibold text-text-secondary">
                  N
                </span>
              </div>

              <h2 className="mt-5 text-xl font-semibold text-text-primary sm:text-2xl">
                No Notes Found
              </h2>

              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Start reading to create and save notes.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="rounded-full border border-border-light bg-white px-5 py-2.5 text-sm font-medium text-text-primary transition hover:bg-gray-50"
                >
                  Go Back
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/discover")}
                  className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Explore Books
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notes List */}
        {!loading && !errorMessage && notes.length > 0 && (
          <div className="mt-7 flex flex-col gap-3.5 sm:mt-8 sm:gap-4">
            {notes.map((item, index) => {
              const book = item?.book;
              const coverBook = getOriginalCoverBook(book);
              const noteText = item?.text || item?.content || "";

              return (
                <button
                  type="button"
                  key={item?._id || index}
                  onClick={() => handleClick(item)}
                  className="
                    group
                    flex
                    w-full
                    cursor-pointer
                    flex-col
                    gap-4
                    rounded-xl
                    border
                    border-border-light
                    bg-background-card
                    p-3.5
                    text-left
                    transition-all
                    duration-300
                    hover:-translate-y-0.5
                    hover:shadow-md
                    sm:flex-row
                    sm:items-center
                    sm:gap-5
                    sm:p-4
                  "
                >
                  {/* Book + text */}
                  <div className="flex min-w-0 flex-1 items-center gap-3.5 sm:gap-5">
                    <div className="h-24 w-16 shrink-0 overflow-hidden rounded-md bg-gray-100 shadow-sm sm:h-28 sm:w-[76px]">
                      <BookCover
                        book={coverBook}
                        alt={book?.title || "Book cover"}
                        loading="lazy"
                        sizes="76px"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-2 text-base font-semibold leading-tight text-text-primary transition-colors group-hover:text-brand sm:text-lg">
                        {book?.title || "Untitled Book"}
                      </h2>

                      {book?.author && (
                        <p className="mt-1 truncate text-xs text-text-secondary sm:text-sm">
                          {book.author}
                        </p>
                      )}

                      <p className="mt-2 text-xs font-medium text-text-secondary sm:text-sm">
                        Page {item?.page ?? "N/A"}
                      </p>

                      {noteText && (
                        <p className="mt-2 line-clamp-2 text-xs italic leading-5 text-text-secondary sm:text-sm">
                          "{noteText}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Date + arrow */}
                  <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border-light pt-3 sm:min-w-[150px] sm:flex-col sm:items-end sm:justify-center sm:border-t-0 sm:pt-0">
                    <span className="text-[11px] font-medium text-text-secondary sm:text-xs">
                      {formatDate(item?.createdAt)}
                    </span>

                    <LuArrowRight
                      size={18}
                      className="text-text-secondary transition-transform duration-300 group-hover:translate-x-1 group-hover:text-brand"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default Notes;