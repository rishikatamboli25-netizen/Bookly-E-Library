import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Document,
  Page,
  pdfjs,
} from "react-pdf";

import {
  IoChevronBack,
} from "react-icons/io5";

import {
  useNavigate,
} from "react-router-dom";

import axios from "axios";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

import {
  HiOutlineMinus,
  HiOutlinePlus,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlinePencilAlt,
  HiOutlineX,
} from "react-icons/hi";

const API_BASE =
  import.meta.env.VITE_BASE_URL ||
  "http://localhost:5000";

pdfjs.GlobalWorkerOptions.workerSrc =
  new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

// =========================================================
// AUTOSAVE CONFIG
// =========================================================

const PROGRESS_DEBOUNCE = 1500;
const PROGRESS_AUTOSAVE_INTERVAL = 10000;

// =========================================================
// COMPONENT
// =========================================================

const PDFReader = ({
  fileUrl,
  bookName,
  book,
}) => {
  const navigate = useNavigate();

  // =======================================================
  // STATE
  // =======================================================

  const [numPages, setNumPages] =
    useState(null);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [scale, setScale] =
    useState(0.5);

  const [showNotes, setShowNotes] =
    useState(false);

  const [noteText, setNoteText] =
    useState("");

  const [isSaving, setIsSaving] =
    useState(false);

  const [pageWidth, setPageWidth] =
    useState(() =>
      Math.min(
        window.innerWidth - 32,
        800
      )
    );

  // =======================================================
  // REFS
  // =======================================================

  const containerRef =
    useRef(null);

  const pageRefs =
    useRef([]);

  /*
    Highest page reached during this reading session.
  */
  const maxPageReached =
    useRef(1);

  /*
    Keep current page outside React state as well,
    so exit handlers always have the latest value.
  */
  const currentPageRef =
    useRef(1);

  /*
    Keep total pages accessible to save handlers.
  */
  const numPagesRef =
    useRef(null);

  /*
    Keep backend book data accessible to callbacks.
  */
  const bookRef =
    useRef(book);

  /*
    Last progress confirmed as saved successfully.
  */
  const lastSavedProgressRef =
    useRef(
      Number(book?.pagesRead) || 0
    );

  /*
    Prevent overlapping normal axios saves.
  */
  const savingRef =
    useRef(false);

  /*
    Current normal save request.
  */
  const activeSavePromiseRef =
    useRef(null);

  /*
    Debounce timer.
  */
  const progressSaveTimerRef =
    useRef(null);

  /*
    Prevent visibilitychange + pagehide from immediately
    creating duplicate emergency requests.
  */
  const lastExitSaveRef =
    useRef(0);

  // =======================================================
  // KEEP REFS UPDATED
  // =======================================================

  useEffect(() => {
    bookRef.current = book;

    const databaseProgress =
      Number(book?.pagesRead) || 0;

    lastSavedProgressRef.current =
      databaseProgress;
  }, [book]);

  useEffect(() => {
    currentPageRef.current =
      Number(currentPage) || 1;

    if (
      currentPage >
      maxPageReached.current
    ) {
      maxPageReached.current =
        currentPage;
    }
  }, [currentPage]);

  // =======================================================
  // DOCUMENT LOAD
  // =======================================================

  const onDocumentLoadSuccess = ({
    numPages: loadedNumPages,
  }) => {
    setNumPages(
      loadedNumPages
    );

    numPagesRef.current =
      loadedNumPages;

    pageRefs.current =
      Array.from(
        {
          length:
            loadedNumPages,
        },
        (_, index) =>
          pageRefs.current[index] ||
          null
      );

    /*
      Start max-page tracking from the page already stored
      in the database when possible.
    */
    const databaseProgress =
      Number(
        bookRef.current?.pagesRead
      ) || 1;

    maxPageReached.current =
      Math.max(
        1,
        databaseProgress
      );
  };

  // =======================================================
  // RESIZE
  // =======================================================

  useEffect(() => {
    let timeoutId;

    const handleResize = () => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        setPageWidth(
          Math.min(
            window.innerWidth - 32,
            800
          )
        );
      }, 100);
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );

      clearTimeout(timeoutId);
    };
  }, []);

  // =======================================================
  // CURRENT PAGE DETECTION
  // =======================================================

  useEffect(() => {
    if (
      !numPages ||
      !containerRef.current
    ) {
      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          entries.forEach(
            (entry) => {
              if (
                !entry.isIntersecting
              ) {
                return;
              }

              const pageIndex =
                Number(
                  entry.target.getAttribute(
                    "data-page"
                  )
                );

              if (!pageIndex) {
                return;
              }

              setCurrentPage(
                pageIndex
              );
            }
          );
        },
        {
          root:
            containerRef.current,
          threshold: 0.3,
        }
      );

    pageRefs.current.forEach(
      (element) => {
        if (element) {
          observer.observe(
            element
          );
        }
      }
    );

    return () =>
      observer.disconnect();
  }, [numPages]);

  // =======================================================
  // BUILD PROGRESS PAYLOAD
  // =======================================================

  const getProgressPayload =
    useCallback(() => {
      const currentBook =
        bookRef.current;

      const token =
        localStorage.getItem(
          "token"
        );

      const bookId =
        currentBook?.ObjectId;

      const totalPages =
        Number(
          numPagesRef.current
        ) || 0;

      if (
        !token ||
        !bookId ||
        !totalPages
      ) {
        return null;
      }

      const current =
        Math.max(
          1,
          Number(
            currentPageRef.current
          ) || 1
        );

      const highestReached =
        Math.max(
          1,
          Number(
            maxPageReached.current
          ) || 1,
          current
        );

      const databaseProgress =
        Number(
          currentBook?.pagesRead
        ) || 0;

      /*
        Never allow reading progress to move backward.
      */
      const pagesToSave =
        Math.min(
          totalPages,
          Math.max(
            databaseProgress,
            highestReached,
            current
          )
        );

      return {
        token,

        payload: {
          bookId,

          pagesRead:
            pagesToSave,

          totalPages,
        },
      };
    }, []);

  // =======================================================
  // NORMAL BACKEND AUTOSAVE
  // =======================================================

  const saveProgressToServer =
    useCallback(
      async ({
        force = false,
      } = {}) => {
        const progress =
          getProgressPayload();

        if (!progress) {
          return false;
        }

        const {
          token,
          payload,
        } = progress;

        /*
          Don't create overlapping axios requests.
        */
        if (
          savingRef.current
        ) {
          return false;
        }

        /*
          Don't send the same or lower progress repeatedly.
        */
        if (
          !force &&
          payload.pagesRead <=
            lastSavedProgressRef.current
        ) {
          return true;
        }

        savingRef.current =
          true;

        setIsSaving(true);

        const requestPromise =
          axios.put(
            `${API_BASE}/api/users/recent-books`,
            payload,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              timeout: 5000,
            }
          );

        activeSavePromiseRef.current =
          requestPromise;

        try {
          await requestPromise;

          lastSavedProgressRef.current =
            Math.max(
              lastSavedProgressRef.current,
              payload.pagesRead
            );

          return true;
        } catch (error) {
          console.error(
            "PDF progress autosave error:",
            error.response?.data ||
              error.message
          );

          return false;
        } finally {
          savingRef.current =
            false;

          setIsSaving(false);

          if (
            activeSavePromiseRef.current ===
            requestPromise
          ) {
            activeSavePromiseRef.current =
              null;
          }
        }
      },
      [getProgressPayload]
    );

  // =======================================================
  // EXIT / BACKGROUND SAVE
  // =======================================================

  const saveProgressForExit =
    useCallback(() => {
      const now =
        Date.now();

      /*
        visibilitychange and pagehide can fire almost together.
        Keep the emergency save from being duplicated.
      */
      if (
        now -
          lastExitSaveRef.current <
        1200
      ) {
        return;
      }

      lastExitSaveRef.current =
        now;

      const progress =
        getProgressPayload();

      if (!progress) {
        return;
      }

      const {
        token,
        payload,
      } = progress;

      /*
        Already successfully saved.
      */
      if (
        payload.pagesRead <=
        lastSavedProgressRef.current
      ) {
        return;
      }

      /*
        IMPORTANT:
        keepalive allows this small request to continue while
        the browser is hiding/unloading the page.
      */
      fetch(
        `${API_BASE}/api/users/recent-books`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify(
            payload
          ),

          keepalive: true,
        }
      ).catch((error) => {
        console.error(
          "PDF exit progress save error:",
          error
        );
      });

      /*
        We intentionally DO NOT mark this as successfully
        saved here. The browser has not confirmed completion.
      */
    }, [getProgressPayload]);

  // =======================================================
  // DEBOUNCED PAGE-CHANGE SAVE
  // =======================================================

  const scheduleProgressSave =
    useCallback(() => {
      if (
        progressSaveTimerRef.current
      ) {
        clearTimeout(
          progressSaveTimerRef.current
        );
      }

      progressSaveTimerRef.current =
        setTimeout(() => {
          saveProgressToServer();
        }, PROGRESS_DEBOUNCE);
    }, [saveProgressToServer]);

  // =======================================================
  // SCHEDULE SAVE WHEN PAGE CHANGES
  // =======================================================

  useEffect(() => {
    if (!numPages) {
      return;
    }

    scheduleProgressSave();
  }, [
    currentPage,
    numPages,
    scheduleProgressSave,
  ]);

  // =======================================================
  // PERIODIC AUTOSAVE
  // =======================================================

  useEffect(() => {
    if (!book?.ObjectId) {
      return;
    }

    const interval =
      setInterval(() => {
        saveProgressToServer();
      }, PROGRESS_AUTOSAVE_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [
    book?.ObjectId,
    saveProgressToServer,
  ]);

  // =======================================================
  // SAVE WHEN APP / TAB BECOMES HIDDEN
  // =======================================================

  useEffect(() => {
    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "hidden"
        ) {
          saveProgressForExit();
        }
      };

    const handlePageHide =
      () => {
        saveProgressForExit();
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener(
      "pagehide",
      handlePageHide
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "pagehide",
        handlePageHide
      );
    };
  }, [
    saveProgressForExit,
  ]);

  // =======================================================
  // SPA UNMOUNT FALLBACK
  // =======================================================

  useEffect(() => {
    return () => {
      /*
        This catches cases where the Reader is removed by
        React because of internal navigation, without a
        full browser page unload.
      */
      saveProgressForExit();
    };
  }, [
    saveProgressForExit,
  ]);

  // =======================================================
  // ZOOM
  // =======================================================

  const zoomIn = () =>
    setScale(
      (previous) =>
        Math.min(
          previous + 0.1,
          2
        )
    );

  const zoomOut = () =>
    setScale(
      (previous) =>
        Math.max(
          previous - 0.1,
          0.3
        )
    );

  const resetZoom = () =>
    setScale(1);

  // =======================================================
  // PAGE NAVIGATION
  // =======================================================

  const goToPage = (
    pageNumber
  ) => {
    const target =
      pageRefs.current[
        pageNumber - 1
      ];

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const goToPrevPage = () => {
    if (
      currentPage > 1
    ) {
      goToPage(
        currentPage - 1
      );
    }
  };

  const goToNextPage = () => {
    if (
      numPages &&
      currentPage <
        numPages
    ) {
      goToPage(
        currentPage + 1
      );
    }
  };

  // =======================================================
  // SAVE NOTE
  // =======================================================

  const handleSaveNote =
    async () => {
      if (
        !noteText.trim()
      ) {
        return;
      }

      try {
        const token =
          localStorage.getItem(
            "token"
          );

        if (
          !token ||
          !book?.ObjectId
        ) {
          return;
        }

        const newNote = {
          book,
          page: currentPage,
          text:
            noteText.trim(),
          date: new Date(),
        };

        await axios.put(
          `${API_BASE}/api/users/createnotes`,
          newNote,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        setNoteText("");
        setShowNotes(false);
      } catch (error) {
        console.error(
          "Error saving note:",
          error.response?.data ||
            error.message
        );
      }
    };

  // =======================================================
  // FINAL SAVE + BACK
  // =======================================================

  const saveReadingProgress =
    async () => {
      if (
        savingRef.current
      ) {
        /*
          If an autosave is already running, wait for it instead
          of starting a duplicate request.
        */
        if (
          activeSavePromiseRef.current
        ) {
          try {
            await activeSavePromiseRef.current;
          } catch {
            // Already handled by saveProgressToServer().
          }
        }

        navigate(-1);
        return;
      }

      /*
        Cancel pending debounce.
      */
      if (
        progressSaveTimerRef.current
      ) {
        clearTimeout(
          progressSaveTimerRef.current
        );

        progressSaveTimerRef.current =
          null;
      }

      /*
        One final explicit save.
      */
      await saveProgressToServer({
        force: true,
      });

      navigate(-1);
    };

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-background-main">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="z-20 flex h-14 shrink-0 items-center border-b border-border-light bg-background-card px-4 shadow-sm sm:h-16 sm:px-6">
        <button
          type="button"
          onClick={
            saveReadingProgress
          }
          disabled={isSaving}
          className="flex items-center gap-2 text-[clamp(16px,2vw,24px)] font-semibold text-text-primary transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Go back"
          title="Back"
        >
          <IoChevronBack />
        </button>

        <p className="ml-2 truncate text-sm font-semibold text-text-primary sm:text-base">
          {bookName}
        </p>

        {isSaving && (
          <span className="ml-auto mr-2 text-[10px] text-text-secondary sm:text-xs">
            Saving...
          </span>
        )}
      </div>

      {/* ===================================================
          READING AREA
      =================================================== */}

      <div className="relative min-h-0 flex-1">
        <div
          ref={containerRef}
          className="absolute inset-0 overflow-auto bg-background-main px-3 pb-28 pt-5 sm:px-6 sm:pt-8 md:px-10"
        >
          <Document
            file={fileUrl}
            onLoadSuccess={
              onDocumentLoadSuccess
            }
            loading={
              <div className="flex min-h-[300px] items-center justify-center text-text-secondary">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />

                  <p>
                    Loading PDF...
                  </p>
                </div>
              </div>
            }
            error={
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="max-w-md rounded-2xl border border-border-light bg-background-card p-8 text-center shadow-sm">
                  <h2 className="mb-2 text-xl font-semibold text-text-primary">
                    Unable to load PDF
                  </h2>

                  <p className="text-sm text-text-secondary">
                    Something went wrong while opening this book.
                  </p>
                </div>
              </div>
            }
          >
            {numPages &&
              Array.from(
                new Array(
                  numPages
                ),
                (_, index) => (
                  <div
                    key={`page_${index + 1}`}
                    data-page={
                      index + 1
                    }
                    ref={(element) => {
                      pageRefs.current[
                        index
                      ] = element;
                    }}
                    className="mb-6 flex justify-center sm:mb-8"
                  >
                    <Page
                      pageNumber={
                        index + 1
                      }
                      width={
                        pageWidth *
                        scale
                      }
                      renderTextLayer={
                        true
                      }
                      renderAnnotationLayer={
                        true
                      }
                      className="bg-white shadow-md"
                    />
                  </div>
                )
              )}
          </Document>
        </div>

        {/* =================================================
            FLOATING CONTROL DOCK
        ================================================== */}

        <div className="absolute bottom-4 left-1/2 z-20 max-w-[95vw] -translate-x-1/2 sm:bottom-7">
          <div className="flex items-center gap-0.5 rounded-full border border-border-light bg-background-card/95 px-1.5 py-1 shadow-lg backdrop-blur sm:gap-1 sm:px-2 sm:py-1.5">
            {/* PREVIOUS PAGE */}

            <button
              type="button"
              onClick={
                goToPrevPage
              }
              disabled={
                currentPage <=
                1
              }
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-primary transition hover:bg-brand-light hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
              aria-label="Previous page"
            >
              <HiOutlineChevronUp className="text-base sm:text-lg" />
            </button>

            {/* PAGE */}

            <div className="min-w-[48px] px-0.5 text-center text-xs font-medium tabular-nums text-text-primary sm:min-w-[64px] sm:px-1 sm:text-sm">
              {numPages
                ? `${currentPage} / ${numPages}`
                : "—"}
            </div>

            {/* NEXT PAGE */}

            <button
              type="button"
              onClick={
                goToNextPage
              }
              disabled={
                !numPages ||
                currentPage >=
                  numPages
              }
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-primary transition hover:bg-brand-light hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
              aria-label="Next page"
            >
              <HiOutlineChevronDown className="text-base sm:text-lg" />
            </button>

            <div className="mx-0.5 h-4 w-px bg-border-light sm:mx-1.5 sm:h-5" />

            {/* ZOOM OUT */}

            <button
              type="button"
              onClick={
                zoomOut
              }
              disabled={
                scale <=
                0.3
              }
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-primary transition hover:bg-brand-light hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
              aria-label="Zoom out"
            >
              <HiOutlineMinus className="text-base sm:text-lg" />
            </button>

            {/* ZOOM RESET */}

            <button
              type="button"
              onClick={
                resetZoom
              }
              className="h-8 min-w-[44px] rounded-full px-1 text-xs font-medium text-text-secondary transition hover:bg-brand-light hover:text-brand sm:h-9 sm:min-w-[56px] sm:px-2 sm:text-sm"
              title="Reset zoom"
            >
              {Math.round(
                scale * 100
              )}
              %
            </button>

            {/* ZOOM IN */}

            <button
              type="button"
              onClick={
                zoomIn
              }
              disabled={
                scale >= 2
              }
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-primary transition hover:bg-brand-light hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
              aria-label="Zoom in"
            >
              <HiOutlinePlus className="text-base sm:text-lg" />
            </button>

            <div className="mx-0.5 h-4 w-px bg-border-light sm:mx-1.5 sm:h-5" />

            {/* CREATE NOTE */}

            <button
              type="button"
              onClick={() =>
                setShowNotes(
                  true
                )
              }
              className="flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-medium text-text-primary transition hover:bg-brand-light hover:text-brand sm:h-9 sm:px-4 sm:text-sm"
              aria-label="Create note"
            >
              <HiOutlinePencilAlt className="text-base sm:text-[17px]" />

              <span className="hidden sm:inline">
                Create Note
              </span>
            </button>
          </div>
        </div>

        {/* =================================================
            NOTES PANEL
        ================================================== */}

        {showNotes && (
          <div className="absolute inset-0 z-30 flex">
            <div className="ml-auto flex h-full w-full flex-col border-l border-border-light bg-background-card shadow-2xl sm:w-[420px]">
              {/* HEADER */}

              <div className="flex h-16 shrink-0 items-center justify-between border-b border-border-light px-5">
                <div>
                  <h2 className="text-base font-semibold text-text-primary">
                    Create Note
                  </h2>

                  <p className="mt-0.5 text-xs text-text-secondary">
                    Page{" "}
                    {currentPage}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowNotes(
                      false
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition hover:bg-brand-light hover:text-brand"
                  aria-label="Close notes"
                >
                  <HiOutlineX size={20} />
                </button>
              </div>

              {/* CONTENT */}

              <div className="flex flex-1 flex-col p-5">
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium text-text-secondary">
                    BOOK
                  </p>

                  <p className="truncate text-sm font-medium text-text-primary">
                    {bookName}
                  </p>
                </div>

                <textarea
                  value={noteText}
                  onChange={(event) =>
                    setNoteText(
                      event.target
                        .value
                    )
                  }
                  placeholder="Write your note here..."
                  className="w-full flex-1 resize-none rounded-xl border border-border-light bg-background-main p-4 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-brand"
                />
              </div>

              {/* FOOTER */}

              <div className="flex shrink-0 justify-end gap-3 border-t border-border-light p-5">
                <button
                  type="button"
                  onClick={() =>
                    setShowNotes(
                      false
                    )
                  }
                  className="h-10 rounded-lg border border-border-light px-4 text-sm font-medium text-text-secondary transition hover:bg-background-main hover:text-text-primary"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleSaveNote
                  }
                  disabled={
                    !noteText.trim()
                  }
                  className="h-10 rounded-lg bg-brand px-5 text-sm font-semibold text-background-main transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFReader;