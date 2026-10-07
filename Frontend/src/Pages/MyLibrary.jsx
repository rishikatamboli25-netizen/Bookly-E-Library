import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import { IoChevronBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

import BookCover from "../compontents/BookCover";

import {
  api,
  getFriendlyError,
} from "../utils/api";

import {
  getCachedUserData,
  clearCachedUserData,
} from "../utils/userData";

const RECENT_RESOURCE =
  "recent-books";

const MyLibrary = () => {
  const navigate = useNavigate();

  const [recentBooks, setRecentBooks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  // ==========================================================
  // LOAD RECENT BOOKS
  // ==========================================================

  const loadRecentBooks =
    useCallback(
      async (force = false) => {
        const token =
          localStorage.getItem(
            "token"
          );

        if (!token) {
          setRecentBooks([]);
          setLoading(false);

          setErrorMessage(
            "Please sign in to see your reading list."
          );

          return;
        }

        setErrorMessage("");
        setLoading(true);

        try {
          const books =
            await getCachedUserData({
              token,

              resource:
                RECENT_RESOURCE,

              force,

              ttl:
                2 *
                60 *
                1000,

              fetcher:
                async () => {
                  const response =
                    await api.get(
                      "/api/users/get-recent-books",
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );

                  return Array.isArray(
                    response.data
                      ?.recentBooks
                  )
                    ? response.data
                        .recentBooks
                    : [];
                },
            });

          setRecentBooks(
            Array.isArray(
              books
            )
              ? books
              : []
          );
        } catch (error) {
          if (
            error?.message ===
            "AUTH_REQUIRED"
          ) {
            setRecentBooks([]);

            setErrorMessage(
              "Please sign in to see your reading list."
            );
          } else {
            setRecentBooks([]);

            setErrorMessage(
              getFriendlyError(
                error,
                "We couldn't load your reading list right now."
              )
            );
          }
        } finally {
          setLoading(false);
        }
      },
      []
    );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadRecentBooks();
  }, [loadRecentBooks]);

  // ==========================================================
  // RETRY
  // ==========================================================

  const retry = async () => {
    const token =
      localStorage.getItem(
        "token"
      );

    if (token) {
      clearCachedUserData({
        token,

        resource:
          RECENT_RESOURCE,
      });
    }

    await loadRecentBooks(
      true
    );
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section
      className="
        min-h-[calc(100dvh-5rem)]
        w-full
        max-w-9xl
        mx-auto
        px-4
        py-6
        sm:px-6
        sm:py-8
        md:px-8
      "
    >
      {/* ====================================================
          PAGE HEADER
      ==================================================== */}

      <div
        onClick={() =>
          navigate(-1)
        }
        className="
          mb-6
          flex
          w-fit
          cursor-pointer
          items-center
          gap-2
          text-lg
          font-semibold
          text-text-primary
          transition
          hover:opacity-80
          sm:text-xl
          md:text-2xl
        "
      >
        <IoChevronBack className="text-xl sm:text-2xl" />

        <span>
          Continue Reading
        </span>
      </div>

      {/* ====================================================
          LOADING
      ==================================================== */}

      {loading ? (
        <div
          className="
            flex
            min-h-[calc(100dvh-11rem)]
            items-center
            justify-center
            rounded-2xl
            border
            border-border-light
            bg-background-card
            px-6
            text-center
          "
        >
          <div>
            <div
              className="
                mx-auto
                h-8
                w-8
                animate-spin
                rounded-full
                border-4
                border-brand/20
                border-t-brand
              "
            />

            <p
              className="
                mt-4
                text-sm
                text-text-secondary
              "
            >
              Loading your reading list...
            </p>
          </div>
        </div>
      ) : errorMessage ? (
        /* ==================================================
           ERROR
        ================================================== */

        <div
          className="
            flex
            min-h-[calc(100dvh-11rem)]
            flex-col
            items-center
            justify-center
            rounded-2xl
            border
            border-border-light
            bg-background-card
            px-6
            text-center
          "
        >
          <div className="max-w-md">
            <h2
              className="
                text-lg
                font-semibold
                text-text-primary
              "
            >
              We couldn't load your library
            </h2>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-text-secondary
              "
            >
              {errorMessage}
            </p>

            <div
              className="
                mt-5
                flex
                flex-wrap
                items-center
                justify-center
                gap-3
              "
            >
              <button
                type="button"
                onClick={() =>
                  navigate(-1)
                }
                className="
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
                Go Back
              </button>

              <button
                type="button"
                onClick={retry}
                className="
                  rounded-full
                  bg-brand
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:opacity-90
                "
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      ) : recentBooks.length === 0 ? (
        /* ==================================================
           EMPTY
        ================================================== */

        <div
          className="
            flex
            min-h-[calc(100dvh-11rem)]
            flex-col
            items-center
            justify-center
            rounded-2xl
            border
            border-border-light
            bg-background-card
            px-6
            text-center
          "
        >
          <h2
            className="
              text-lg
              font-semibold
              text-text-primary
            "
          >
            Nothing in progress yet
          </h2>

          <p
            className="
              mt-2
              max-w-md
              text-sm
              leading-6
              text-text-secondary
            "
          >
            Start a book and it will
            appear here so you can
            continue from where you
            left off.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/Discover")
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
              transition
              hover:opacity-90
            "
          >
            Explore Books
          </button>
        </div>
      ) : (
        /* ==================================================
           RECENT BOOKS
        ================================================== */

        <div
          className="
            flex
            flex-col
            gap-4
            sm:gap-6
          "
        >
          {recentBooks.map(
            (
              item,
              index
            ) => {
              const book =
                item?.book;

              const pagesRead =
                Number(
                  item?.pagesRead
                ) || 0;

              const totalPages =
                Math.max(
                  1,
                  Number(
                    item?.totalPages
                  ) ||
                    Number(
                      book?.totalPages
                    ) ||
                    1
                );

              const rawPercent =
                (pagesRead /
                  totalPages) *
                100;

              const progressPercent =
                pagesRead > 0
                  ? Math.min(
                      100,
                      Math.max(
                        1,
                        Math.floor(
                          rawPercent
                        )
                      )
                    )
                  : 0;

              if (
                !book?.identifier
              ) {
                return null;
              }

              return (
                <div
                  key={
                    item?._id ||
                    book.identifier ||
                    index
                  }
                  className="
                    group
                    relative
                    flex
                    cursor-pointer
                    flex-col
                    items-start
                    gap-4
                    overflow-hidden
                    rounded-2xl
                    border
                    border-white/60
                    bg-white/50
                    p-4
                    backdrop-blur-xl
                    shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_8px_20px_rgba(124,58,237,0.08)]
                    transition-all
                    duration-300
                    hover:border-white/80
                    hover:bg-white/70
                    hover:shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_14px_28px_rgba(124,58,237,0.14)]
                    sm:p-5
                    md:grid
                    md:grid-cols-[auto_2fr_1.5fr_auto]
                    md:items-center
                  "
                  onClick={() =>
                    navigate(
                      `/reader/${book.identifier}`
                    )
                  }
                >
                  {/* TOP SHEEN */}

                  <span
                    className="
                      pointer-events-none
                      absolute
                      inset-x-6
                      top-0
                      z-10
                      h-px
                      bg-white/80
                    "
                  />

                  {/* ==================================================
                      BOOK / MOBILE HEADER
                  ================================================== */}

                  <div
                    className="
                      flex
                      w-full
                      items-center
                      gap-4
                      md:w-auto
                    "
                  >
                    <div
                      className="
                        w-20
                        shrink-0
                        overflow-hidden
                        rounded-lg
                        border
                        border-white/50
                        shadow-sm
                        sm:w-24
                        md:w-28
                      "
                    >
                      <div className="aspect-[2/3]">
                        <BookCover
                          book={book}
                          alt={
                            book.title
                          }
                          loading="lazy"
                          sizes="112px"
                          className="
                            h-full
                            w-full
                            object-cover
                          "
                        />
                      </div>
                    </div>

                    <div
                      className="
                        flex
                        min-w-0
                        flex-1
                        flex-col
                        gap-1
                        md:hidden
                      "
                    >
                      <div
                        className="
                          flex
                          items-start
                          justify-between
                          gap-2
                        "
                      >
                        <h3
                          className="
                            line-clamp-2
                            text-base
                            font-semibold
                            leading-tight
                            text-text-primary
                          "
                        >
                          {book.title ||
                            "Untitled Book"}
                        </h3>

                        <span
                          className="
                            shrink-0
                            rounded-full
                            border
                            border-white/50
                            bg-brand-light/50
                            px-2.5
                            py-0.5
                            text-[10px]
                            font-semibold
                            uppercase
                            tracking-wider
                            text-brand
                            backdrop-blur-md
                          "
                        >
                          {progressPercent ===
                          100
                            ? "Finished"
                            : "Reading"}
                        </span>
                      </div>

                      <p
                        className="
                          truncate
                          text-xs
                          text-text-secondary
                        "
                      >
                        {book.author ||
                          "Unknown author"}
                      </p>
                    </div>
                  </div>

                  {/* ==================================================
                      DESKTOP BOOK INFO
                  ================================================== */}

                  <div
                    className="
                      hidden
                      min-w-0
                      flex-col
                      justify-center
                      gap-1
                      md:flex
                    "
                  >
                    <h3
                      className="
                        line-clamp-2
                        text-base
                        font-semibold
                        leading-tight
                        text-text-primary
                        lg:text-lg
                      "
                    >
                      {book.title ||
                        "Untitled Book"}
                    </h3>

                    <p
                      className="
                        truncate
                        text-sm
                        text-text-secondary
                      "
                    >
                      {book.author ||
                        "Unknown author"}
                    </p>
                  </div>

                  {/* ==================================================
                      PROGRESS
                  ================================================== */}

                  <div
                    className="
                      flex
                      w-full
                      flex-col
                      justify-center
                      gap-1.5
                      border-t
                      border-white/40
                      pt-2
                      md:border-none
                      md:pt-0
                    "
                  >
                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        text-xs
                        text-text-secondary
                        sm:text-sm
                      "
                    >
                      <span>
                        Progress
                      </span>

                      <span
                        className="
                          font-semibold
                          text-text-primary
                        "
                      >
                        {progressPercent}%
                      </span>
                    </div>

                    <div
                      className="
                        h-2
                        w-full
                        overflow-hidden
                        rounded-full
                        border
                        border-gray-200/80
                        bg-white/60
                        backdrop-blur-md
                      "
                    >
                      <div
                        className="
                          h-full
                          rounded-full
                          bg-gradient-to-r
                          from-brand
                          to-brand-hover
                          transition-all
                          duration-500
                        "
                        style={{
                          width: `${progressPercent}%`,
                        }}
                      />
                    </div>

                    <div
                      className="
                        text-xs
                        text-text-secondary
                      "
                    >
                      Page{" "}
                      {pagesRead}{" "}
                      of{" "}
                      {totalPages}
                    </div>
                  </div>

                  {/* ==================================================
                      DESKTOP STATUS
                  ================================================== */}

                  <div
                    className="
                      hidden
                      shrink-0
                      items-center
                      justify-end
                      md:flex
                    "
                  >
                    <span
                      className="
                        rounded-full
                        border
                        border-white/50
                        bg-brand-light/50
                        px-4
                        py-1
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wider
                        text-brand
                        backdrop-blur-md
                      "
                    >
                      {progressPercent ===
                      100
                        ? "Finished"
                        : "Reading"}
                    </span>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </section>
  );
};

export default MyLibrary;