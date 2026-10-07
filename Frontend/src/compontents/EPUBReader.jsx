import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import ePub from "epubjs";

import { IoChevronBack } from "react-icons/io5";

import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCollection,
  HiOutlineMinus,
  HiOutlinePlus,
  HiOutlinePencilAlt,
  HiOutlineX,
} from "react-icons/hi";

import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_BASE_URL ||
  "http://localhost:5000";

const DEFAULT_FONT_SIZE = 100;
const MIN_FONT_SIZE = 70;
const MAX_FONT_SIZE = 150;

const LOCATION_CHARS = 1000;

/*
  Backend progress autosave.
  A short debounce saves after the user stops turning pages.
  The interval is an additional safety net.
*/
const PROGRESS_DEBOUNCE = 1500;
const PROGRESS_AUTOSAVE_INTERVAL = 10000;

// ============================================================
// HELPERS
// ============================================================

const normalizeHref = (href = "") =>
  String(href)
    .split("#")[0]
    .replace(/\\/g, "/")
    .trim();

const flattenToc = (
  items = [],
  result = [],
  depth = 0
) => {
  items.forEach((item) => {
    if (!item) return;

    if (item.href && item.label) {
      result.push({
        href: item.href,
        label: item.label,
        depth,
      });
    }

    if (
      Array.isArray(item.subitems) &&
      item.subitems.length
    ) {
      flattenToc(
        item.subitems,
        result,
        depth + 1
      );
    }
  });

  return result;
};

// ============================================================
// COMPONENT
// ============================================================

const EPUBReader = ({
  fileUrl,
  bookName,
  book,
}) => {
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [isSaving, setIsSaving] =
    useState(false);

  const [isNavigating, setIsNavigating] =
    useState(false);

  const [fontSize, setFontSize] =
    useState(DEFAULT_FONT_SIZE);

  const [toc, setToc] =
    useState([]);

  const [showToc, setShowToc] =
    useState(false);

  const [showNotes, setShowNotes] =
    useState(false);

  const [noteText, setNoteText] =
    useState("");

  const [currentChapter, setCurrentChapter] =
    useState("Opening book");

  const [currentLocation, setCurrentLocation] =
    useState(0);

  const [totalLocations, setTotalLocations] =
    useState(0);

  const [percentage, setPercentage] =
    useState(0);

  const [sectionPage, setSectionPage] =
    useState(1);

  const [sectionTotal, setSectionTotal] =
    useState(1);

  // ==========================================================
  // REFS
  // ==========================================================

  const viewerRef =
    useRef(null);

  const bookRef =
    useRef(null);

  const renditionRef =
    useRef(null);

  const tocRef =
    useRef([]);

  const maxLocationReached =
    useRef(0);

  const currentCfiRef =
    useRef("");

  const currentLocationRef =
    useRef(0);

  const totalLocationsRef =
    useRef(0);

  const savingRef =
    useRef(false);

  /*
    Contains the actual API book object.

    This is separate from epubBook because epubBook is the
    epub.js instance, while this ref stores Bookly's metadata.
  */
  const bookDataRef =
    useRef(book);

  /*
    Tracks the highest progress successfully written to backend.
  */
  const lastSavedProgressRef =
    useRef(0);

  /*
    Debounced save timer.
  */
  const progressSaveTimerRef =
    useRef(null);

  /*
    Current normal axios save promise.
    Useful when the user presses Back while a save is already running.
  */
  const activeSavePromiseRef =
    useRef(null);

  /*
    Prevent visibilitychange + pagehide from firing two
    identical emergency saves immediately one after another.
  */
  const lastExitSaveRef =
    useRef(0);

  /*
    Mobile horizontal swipe state.

    EPUB.js renders the actual book content inside an iframe, so
    swipe listeners are attached to the iframe documents as well
    as the reader viewport.
  */
  const swipeRef =
    useRef({
      startX: 0,
      startY: 0,
      startTime: 0,
      isSwiping: false,
      suppressClickUntil: 0,
    });

  // ==========================================================
  // KEEP BOOK DATA REF UPDATED
  // ==========================================================

  useEffect(() => {
    bookDataRef.current = book;

    const databaseProgress =
      Number(book?.pagesRead) || 0;

    lastSavedProgressRef.current =
      databaseProgress;
  }, [book]);

  // ==========================================================
  // RESUME KEY
  // ==========================================================

  const resumeKey = book?.identifier
    ? `bookly:epub-cfi:${book.identifier}`
    : "";

  // ==========================================================
  // FONT SIZE
  // ==========================================================

  useEffect(() => {
    if (!renditionRef.current) {
      return;
    }

    try {
      renditionRef.current.themes.fontSize(
        `${fontSize}%`
      );
    } catch (error) {
      console.error(
        "EPUB font-size update error:",
        error
      );
    }
  }, [fontSize]);

  // ==========================================================
  // THEME
  // ==========================================================

  const applyReaderTheme =
    useCallback((rendition) => {
      try {
        rendition.themes.default({
          body: {
            color:
              "#111827 !important",

            background:
              "#ffffff !important",

            "line-height":
              "1.75 !important",

            "padding-left":
              "6% !important",

            "padding-right":
              "6% !important",
          },

          "p, li": {
            "line-height":
              "1.75 !important",
          },

          "h1, h2, h3, h4, h5, h6": {
            "line-height":
              "1.25 !important",
          },
        });

        rendition.themes.fontSize(
          `${DEFAULT_FONT_SIZE}%`
        );
      } catch (error) {
        console.error(
          "EPUB theme error:",
          error
        );
      }
    }, []);

  // ==========================================================
  // BUILD CURRENT PROGRESS PAYLOAD
  // ==========================================================

  const getProgressPayload =
    useCallback(() => {
      const currentBook =
        bookDataRef.current;

      const token =
        localStorage.getItem("token");

      const bookId =
        currentBook?.ObjectId;

      if (
        !token ||
        !bookId
      ) {
        return null;
      }

      const total =
        totalLocationsRef.current ||
        0;

      const currentLocation =
        Number(
          currentLocationRef.current
        ) || 0;

      const current =
        Math.max(
          1,
          currentLocation + 1
        );

      const maxReached =
        Math.max(
          1,
          Number(
            maxLocationReached.current
          ) + 1,
          current
        );

      const databaseProgress =
        Number(
          currentBook?.pagesRead
        ) || 0;

      /*
        Never send backwards progress.
      */
      const pagesToSave =
        Math.max(
          databaseProgress,
          maxReached,
          current
        );

      const safeTotal =
        Math.max(
          1,
          Number(total) || current
        );

      return {
        token,
        payload: {
          bookId,
          pagesRead:
            Math.min(
              pagesToSave,
              safeTotal
            ),
          totalPages:
            safeTotal,
        },
      };
    }, []);

  // ==========================================================
  // SAVE PROGRESS TO BACKEND
  //
  // NORMAL MODE
  //
  // Used while user is actively reading.
  // ==========================================================

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
          Do not start another normal request while one
          is already in progress.
        */
        if (
          savingRef.current
        ) {
          return false;
        }

        /*
          No need to send the same progress repeatedly.
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
            "EPUB progress autosave error:",
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

  // ==========================================================
  // EMERGENCY SAVE
  //
  // Used when the page becomes hidden / is leaving.
  //
  // fetch(... keepalive: true) is used instead of waiting for
  // axios because the document may be shutting down.
  // ==========================================================

  const saveProgressForExit =
    useCallback(() => {
      const now =
        Date.now();

      /*
        visibilitychange + pagehide can arrive almost together.
        Avoid duplicate emergency requests.
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
        Don't send the emergency request if we already
        know this exact progress was successfully saved.
      */
      if (
        payload.pagesRead <=
        lastSavedProgressRef.current
      ) {
        return;
      }

      /*
        We intentionally do not await this request.

        keepalive tells the browser that this small request
        should be allowed to finish while the page is being
        hidden/unloaded.
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
        /*
          At this stage the browser may already be shutting
          down, so there is nothing useful to do with the error.
        */
        console.error(
          "EPUB exit progress save error:",
          error
        );
      });

      /*
        Optimistically mark it as attempted so visibilitychange
        and pagehide do not immediately duplicate it.
      */
      lastSavedProgressRef.current =
        Math.max(
          lastSavedProgressRef.current,
          payload.pagesRead
        );
    }, [getProgressPayload]);

  // ==========================================================
  // SCHEDULE AUTOSAVE
  // ==========================================================

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

  // ==========================================================
  // RELOCATION
  // ==========================================================

  const handleRelocated =
    useCallback(
      (location) => {
        if (!location?.start) {
          return;
        }

        const start =
          location.start;

        const cfi =
          start.cfi || "";

        const href =
          start.href || "";

        currentCfiRef.current =
          cfi;

        // ------------------------------------------------------
        // SAVE EXACT EPUB POSITION LOCALLY
        // ------------------------------------------------------

        if (
          resumeKey &&
          cfi
        ) {
          try {
            localStorage.setItem(
              resumeKey,
              cfi
            );
          } catch (error) {
            console.error(
              "EPUB resume save error:",
              error
            );
          }
        }

        // ------------------------------------------------------
        // LOCATION
        // ------------------------------------------------------

        const epubBook =
          bookRef.current;

        let locationIndex =
          -1;

        let total =
          totalLocationsRef.current ||
          0;

        try {
          if (
            epubBook?.locations
          ) {
            locationIndex =
              epubBook.locations.locationFromCfi(
                cfi
              );

            total =
              epubBook.locations.total ||
              total;
          }
        } catch (error) {
          console.error(
            "EPUB location calculation error:",
            error
          );
        }

        if (
          locationIndex < 0
        ) {
          locationIndex = 0;
        }

        // ------------------------------------------------------
        // OVERALL PROGRESS
        // ------------------------------------------------------

        const progress =
          total > 0
            ? Math.min(
                100,
                Math.max(
                  0,
                  (locationIndex /
                    total) *
                    100
                )
              )
            : 0;

        // ------------------------------------------------------
        // CURRENT SECTION PAGE
        // ------------------------------------------------------

        const page =
          Number(
            start.displayed?.page
          ) || 1;

        const pageTotal =
          Number(
            start.displayed?.total
          ) || 1;

        currentLocationRef.current =
          locationIndex;

        totalLocationsRef.current =
          total;

        setCurrentLocation(
          locationIndex
        );

        setTotalLocations(
          total
        );

        setPercentage(
          progress
        );

        setSectionPage(
          page
        );

        setSectionTotal(
          pageTotal
        );

        maxLocationReached.current =
          Math.max(
            maxLocationReached.current,
            locationIndex
          );

        // ------------------------------------------------------
        // CURRENT CHAPTER
        // ------------------------------------------------------

        const currentToc =
          tocRef.current;

        if (
          currentToc.length
        ) {
          const normalizedCurrent =
            normalizeHref(
              href
            );

          const matchingChapter =
            currentToc.find(
              (item) =>
                normalizeHref(
                  item.href
                ) ===
                normalizedCurrent
            );

          if (
            matchingChapter?.label
          ) {
            setCurrentChapter(
              matchingChapter.label
            );
          }
        } else {
          setCurrentChapter(
            (previous) =>
              previous ===
              "Opening book"
                ? "Reading"
                : previous
          );
        }

        // ------------------------------------------------------
        // IMPORTANT:
        // BACKEND AUTOSAVE
        //
        // Every relocation schedules a save.
        // It waits briefly so rapid page turns don't fire
        // one API call per click.
        // ------------------------------------------------------

        scheduleProgressSave();
      },
      [
        resumeKey,
        scheduleProgressSave,
      ]
    );

  // ==========================================================
  // INITIALIZE EPUB
  // ==========================================================

  useEffect(() => {
    if (
      !fileUrl ||
      !viewerRef.current
    ) {
      return undefined;
    }

    let cancelled = false;

    const loadBook =
      async () => {
        try {
          setLoading(true);
          setError("");

          setShowToc(false);
          setToc([]);
          tocRef.current = [];

          setCurrentChapter(
            "Opening book"
          );

          setCurrentLocation(0);
          setTotalLocations(0);
          setPercentage(0);

          setSectionPage(1);
          setSectionTotal(1);

          maxLocationReached.current =
            0;

          currentCfiRef.current =
            "";

          currentLocationRef.current =
            0;

          totalLocationsRef.current =
            0;

          lastSavedProgressRef.current =
            Number(book?.pagesRead) || 0;

          if (
            progressSaveTimerRef.current
          ) {
            clearTimeout(
              progressSaveTimerRef.current
            );

            progressSaveTimerRef.current =
              null;
          }

          if (
            viewerRef.current
          ) {
            viewerRef.current.innerHTML =
              "";
          }

          console.log(
            "EPUB URL:",
            fileUrl
          );

          // ----------------------------------------------------
          // OPEN BOOK
          // ----------------------------------------------------

          const epubBook =
            ePub(fileUrl, {
              openAs: "epub",
            });

          bookRef.current =
            epubBook;

          await epubBook.ready;

          if (cancelled) {
            return;
          }

          // ----------------------------------------------------
          // NAVIGATION
          // ----------------------------------------------------

          const navigation =
            await epubBook.loaded.navigation;

          if (cancelled) {
            return;
          }

          const flattenedToc =
            flattenToc(
              navigation?.toc || []
            );

          tocRef.current =
            flattenedToc;

          setToc(
            flattenedToc
          );

          // ----------------------------------------------------
          // RENDITION
          // ----------------------------------------------------

          const rendition =
            epubBook.renderTo(
              viewerRef.current,
              {
                width: "100%",
                height: "100%",
                spread: "none",
                manager: "default",
                flow: "paginated",
              }
            );

          renditionRef.current =
            rendition;

          applyReaderTheme(
            rendition
          );

          rendition.on(
            "relocated",
            handleRelocated
          );

          // ----------------------------------------------------
          // GENERATE LOCATIONS
          // ----------------------------------------------------

          try {
            await epubBook.locations.generate(
              LOCATION_CHARS
            );
          } catch (locationError) {
            console.error(
              "EPUB locations generation error:",
              locationError
            );
          }

          if (cancelled) {
            return;
          }

          const generatedTotal =
            epubBook.locations
              ?.total || 0;

          totalLocationsRef.current =
            generatedTotal;

          setTotalLocations(
            generatedTotal
          );

          // ----------------------------------------------------
          // RESUME
          // ----------------------------------------------------

          let savedCfi =
            "";

          if (resumeKey) {
            try {
              savedCfi =
                localStorage.getItem(
                  resumeKey
                ) || "";
            } catch (error) {
              console.error(
                "EPUB resume read error:",
                error
              );
            }
          }

          // ----------------------------------------------------
          // FIRST READABLE SPINE ITEM
          // ----------------------------------------------------

          const spineItems =
            epubBook.spine
              ?.spineItems || [];

          const firstReadable =
            spineItems.find(
              (item) =>
                item.linear ===
                "yes"
            ) ||
            spineItems[0] ||
            null;

          const target =
            savedCfi ||
            firstReadable?.href ||
            undefined;

          if (!target) {
            throw new Error(
              "This EPUB does not contain a readable chapter."
            );
          }

          // ----------------------------------------------------
          // DISPLAY
          // ----------------------------------------------------

          await rendition.display(
            target
          );

          if (cancelled) {
            return;
          }

          setLoading(false);

          /*
            The initial display normally triggers "relocated",
            so the current position will already be available.
          */
        } catch (err) {
          if (cancelled) {
            return;
          }

          console.error(
            "EPUB Reader Error:",
            err
          );

          setError(
            err?.message ||
              "Unable to open this EPUB book."
          );

          setLoading(false);
        }
      };

    loadBook();

    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {
      cancelled = true;

      if (
        progressSaveTimerRef.current
      ) {
        clearTimeout(
          progressSaveTimerRef.current
        );

        progressSaveTimerRef.current =
          null;
      }

      try {
        renditionRef.current?.off?.(
          "relocated",
          handleRelocated
        );
      } catch (error) {
        console.error(
          "EPUB event cleanup error:",
          error
        );
      }

      try {
        renditionRef.current?.destroy();
      } catch (error) {
        console.error(
          "EPUB rendition cleanup error:",
          error
        );
      }

      try {
        bookRef.current?.destroy();
      } catch (error) {
        console.error(
          "EPUB book cleanup error:",
          error
        );
      }

      renditionRef.current =
        null;

      bookRef.current =
        null;

      if (
        viewerRef.current
      ) {
        viewerRef.current.innerHTML =
          "";
      }
    };
  }, [
    fileUrl,
    resumeKey,
    applyReaderTheme,
    handleRelocated,
    book?.pagesRead,
  ]);

  // ==========================================================
  // PERIODIC BACKEND AUTOSAVE
  // ==========================================================

  useEffect(() => {
    if (!book?.ObjectId) {
      return undefined;
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

  // ==========================================================
  // SAVE WHEN PAGE / APP BECOMES HIDDEN
  // ==========================================================

  useEffect(() => {
    /*
      We deliberately use both:
        - visibilitychange
        - pagehide

      visibilitychange catches tab/app backgrounding.

      pagehide catches actual page navigation/unloading.
    */

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

  // ==========================================================
  // PREVIOUS PAGE
  // ==========================================================

  const goPrevious =
    async () => {
      if (
        !renditionRef.current ||
        isNavigating
      ) {
        return;
      }

      try {
        setIsNavigating(true);

        await renditionRef.current.prev();
      } catch (error) {
        console.error(
          "EPUB previous navigation error:",
          error
        );
      } finally {
        setIsNavigating(false);
      }
    };

  // ==========================================================
  // NEXT PAGE
  // ==========================================================

  const goNext =
    async () => {
      if (
        !renditionRef.current ||
        isNavigating
      ) {
        return;
      }

      try {
        setIsNavigating(true);

        await renditionRef.current.next();
      } catch (error) {
        console.error(
          "EPUB next navigation error:",
          error
        );
      } finally {
        setIsNavigating(false);
      }
    };

  // ==========================================================
  // MOBILE SWIPE NAVIGATION
  // ==========================================================

  useEffect(() => {
    /*
      epub.js renders the actual book content inside an iframe.
      Because touch events inside an iframe do not bubble to the
      React parent, listeners are attached to both the reader
      viewport and the current EPUB iframe document.

      Finger movement:
        Right -> Previous page
        Left  -> Next page
    */

    const swipe = swipeRef.current;
    const attachedDocuments = new Set();

    const resetSwipe = () => {
      swipe.startX = 0;
      swipe.startY = 0;
      swipe.startTime = 0;
      swipe.isSwiping = false;
      swipe.lastX = 0;
      swipe.lastY = 0;
    };

    const handleTouchStart = (event) => {
      if (
        loading ||
        error ||
        showNotes ||
        showToc
      ) {
        return;
      }

      const touch = event.touches?.[0];

      if (!touch) {
        return;
      }

      swipe.startX = touch.clientX;
      swipe.startY = touch.clientY;
      swipe.lastX = touch.clientX;
      swipe.lastY = touch.clientY;
      swipe.startTime = Date.now();
      swipe.isSwiping = false;
    };

    const handleTouchMove = (event) => {
      if (!swipe.startTime) {
        return;
      }

      const touch = event.touches?.[0];

      if (!touch) {
        return;
      }

      swipe.lastX = touch.clientX;
      swipe.lastY = touch.clientY;

      const deltaX =
        touch.clientX - swipe.startX;
      const deltaY =
        touch.clientY - swipe.startY;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      /*
        Require a clearly horizontal gesture so normal vertical
        movement is never mistaken for a page turn.
      */
      if (
        absX >= 12 &&
        absX > absY * 1.2
      ) {
        swipe.isSwiping = true;
        event.preventDefault();
      }
    };

    const handleTouchEnd = (event) => {
      if (!swipe.startTime) {
        return;
      }

      const touch =
        event.changedTouches?.[0];

      const endX =
        touch?.clientX ?? swipe.lastX;

      const endY =
        touch?.clientY ?? swipe.lastY;

      const deltaX = endX - swipe.startX;
      const deltaY = endY - swipe.startY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      const duration =
        Date.now() - swipe.startTime;

      const isValidSwipe =
        swipe.isSwiping &&
        absX >= 50 &&
        absX > absY * 1.2 &&
        duration <= 800 &&
        !isNavigating &&
        !loading &&
        !error &&
        !showNotes &&
        !showToc;

      if (isValidSwipe) {
        /*
          Stop the synthetic click/tap that some mobile browsers
          may fire after a swipe.
        */
        swipe.suppressClickUntil =
          Date.now() + 500;

        /*
          Finger moved right -> previous page
          Finger moved left  -> next page
        */
        if (deltaX > 0) {
          goPrevious();
        } else {
          goNext();
        }

        event.preventDefault();
      }

      resetSwipe();
    };

    const handleTouchCancel = () => {
      resetSwipe();
    };

    const handleClick = (event) => {
      if (
        Date.now() <
        swipe.suppressClickUntil
      ) {
        event.preventDefault();
        event.stopPropagation();
        swipe.suppressClickUntil = 0;
      }
    };

    const attachToDocument = (contentDocument) => {
      if (
        !contentDocument ||
        attachedDocuments.has(contentDocument)
      ) {
        return;
      }

      attachedDocuments.add(contentDocument);

      contentDocument.addEventListener(
        "touchstart",
        handleTouchStart,
        { passive: true }
      );

      contentDocument.addEventListener(
        "touchmove",
        handleTouchMove,
        { passive: false }
      );

      contentDocument.addEventListener(
        "touchend",
        handleTouchEnd,
        { passive: false }
      );

      contentDocument.addEventListener(
        "touchcancel",
        handleTouchCancel,
        { passive: true }
      );

      contentDocument.addEventListener(
        "click",
        handleClick,
        true
      );

      try {
        contentDocument.documentElement.style.touchAction =
          "pan-y";

        if (contentDocument.body) {
          contentDocument.body.style.touchAction =
            "pan-y";
        }
      } catch (touchActionError) {
        console.error(
          "EPUB swipe touch-action setup error:",
          touchActionError
        );
      }
    };

    const detachFromDocument = (contentDocument) => {
      if (!contentDocument) {
        return;
      }

      contentDocument.removeEventListener(
        "touchstart",
        handleTouchStart
      );

      contentDocument.removeEventListener(
        "touchmove",
        handleTouchMove
      );

      contentDocument.removeEventListener(
        "touchend",
        handleTouchEnd
      );

      contentDocument.removeEventListener(
        "touchcancel",
        handleTouchCancel
      );

      contentDocument.removeEventListener(
        "click",
        handleClick,
        true
      );

      attachedDocuments.delete(contentDocument);
    };

    const attachToContent = () => {
      const rendition =
        renditionRef.current;

      if (!rendition) {
        return;
      }

      try {
        const contents =
          rendition.getContents?.() || [];

        contents.forEach((content) => {
          const contentDocument =
            content?.document ||
            content?.window?.document ||
            content?.contents?.document;

          attachToDocument(contentDocument);
        });
      } catch (contentError) {
        console.error(
          "EPUB swipe listener setup error:",
          contentError
        );
      }
    };

    const viewport =
      viewerRef.current?.parentElement ||
      viewerRef.current;

    if (viewport) {
      viewport.style.touchAction =
        "pan-y";

      viewport.addEventListener(
        "touchstart",
        handleTouchStart,
        { passive: true }
      );

      viewport.addEventListener(
        "touchmove",
        handleTouchMove,
        { passive: false }
      );

      viewport.addEventListener(
        "touchend",
        handleTouchEnd,
        { passive: false }
      );

      viewport.addEventListener(
        "touchcancel",
        handleTouchCancel,
        { passive: true }
      );

      viewport.addEventListener(
        "click",
        handleClick,
        true
      );
    }

    /*
      Attach to the current EPUB iframe immediately, then repeat
      whenever epub.js renders a new chapter/content document.
    */
    attachToContent();

    const rendition =
      renditionRef.current;

    rendition?.on?.(
      "rendered",
      attachToContent
    );

    return () => {
      rendition?.off?.(
        "rendered",
        attachToContent
      );

      attachedDocuments.forEach(
        (contentDocument) => {
          detachFromDocument(
            contentDocument
          );
        }
      );

      if (viewport) {
        viewport.removeEventListener(
          "touchstart",
          handleTouchStart
        );

        viewport.removeEventListener(
          "touchmove",
          handleTouchMove
        );

        viewport.removeEventListener(
          "touchend",
          handleTouchEnd
        );

        viewport.removeEventListener(
          "touchcancel",
          handleTouchCancel
        );

        viewport.removeEventListener(
          "click",
          handleClick,
          true
        );
      }

      resetSwipe();
      swipe.suppressClickUntil = 0;
    };
  }, [
    error,
    goNext,
    goPrevious,
    isNavigating,
    loading,
    showNotes,
    showToc,
  ]);

  // ==========================================================
  // CHAPTER
  // ==========================================================

  const goToChapter =
    async (href) => {
      if (
        !renditionRef.current ||
        !href
      ) {
        return;
      }

      try {
        setShowToc(false);
        setIsNavigating(true);

        await renditionRef.current.display(
          href
        );
      } catch (error) {
        console.error(
          "EPUB chapter navigation error:",
          error
        );

        setError(
          "Unable to open that chapter."
        );
      } finally {
        setIsNavigating(false);
      }
    };

  // ==========================================================
  // KEYBOARD
  // ==========================================================

  useEffect(() => {
    const handleKeyDown =
      (event) => {
        if (showNotes) {
          return;
        }

        if (
          event.key === "ArrowLeft" ||
          event.key === "PageUp"
        ) {
          event.preventDefault();
          goPrevious();
        }

        if (
          event.key === "ArrowRight" ||
          event.key === "PageDown"
        ) {
          event.preventDefault();
          goNext();
        }

        if (
          event.key === "Escape"
        ) {
          setShowToc(false);
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    showNotes,
    isNavigating,
  ]);

  // ==========================================================
  // FONT CONTROLS
  // ==========================================================

  const decreaseFontSize =
    () => {
      setFontSize(
        (previous) =>
          Math.max(
            MIN_FONT_SIZE,
            previous - 10
          )
      );
    };

  const increaseFontSize =
    () => {
      setFontSize(
        (previous) =>
          Math.min(
            MAX_FONT_SIZE,
            previous + 10
          )
      );
    };

  const resetFontSize =
    () => {
      setFontSize(
        DEFAULT_FONT_SIZE
      );
    };

  // ==========================================================
  // SAVE NOTE
  // ==========================================================

  const handleSaveNote =
    async () => {
      if (!noteText.trim()) {
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

        const notePosition =
          Math.max(
            1,
            currentLocationRef.current +
              1
          );

        await axios.put(
          `${API_BASE}/api/users/createnotes`,
          {
            book,
            page: notePosition,
            text: noteText.trim(),
            date: new Date(),
          },
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
          "Error saving EPUB note:",
          error.response?.data ||
            error.message
        );
      }
    };

  // ==========================================================
  // BACK BUTTON
  //
  // This is now just a graceful final save.
  // Progress has already been autosaved independently.
  // ==========================================================

  const handleReaderBack =
    async () => {
      /*
        Stop the pending debounce.
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
        If a normal autosave is already in flight,
        wait for it first.
      */
      if (
        activeSavePromiseRef.current
      ) {
        try {
          await activeSavePromiseRef.current;
        } catch {
          // The normal save function already handles the error.
        }
      }

      /*
        Do one final awaited save.
      */
      await saveProgressToServer({
        force: true,
      });

      navigate(-1);
    };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background-main">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="z-30 flex h-14 shrink-0 items-center border-b border-border-light bg-background-card px-3 shadow-sm sm:h-16 sm:px-6">
        <button
          type="button"
          onClick={handleReaderBack}
          disabled={isSaving}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-primary transition hover:bg-brand-light hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Go back"
          title="Back"
        >
          <IoChevronBack className="text-xl" />
        </button>

        <div className="ml-1 min-w-0 flex-1 sm:ml-2">
          <p className="truncate text-sm font-semibold text-text-primary sm:text-base">
            {bookName}
          </p>

          <p className="truncate text-[11px] text-text-secondary sm:text-xs">
            {currentChapter}
          </p>
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="hidden rounded-full border border-border-light bg-background-main px-3 py-1.5 text-xs font-medium text-text-secondary sm:block">
            {Math.round(percentage)}%
          </div>

          <button
            type="button"
            onClick={() =>
              setShowToc(
                (previous) => !previous
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-primary transition hover:bg-brand-light hover:text-brand"
            aria-label="Open table of contents"
            title="Table of contents"
          >
            <HiOutlineCollection className="text-lg" />
          </button>
        </div>
      </header>

      {/* ======================================================
          MAIN READER + CONTROLS
      ====================================================== */}

      <div className="flex min-h-0 flex-1 flex-col">
        {/* ====================================================
            EPUB VIEWPORT
        ==================================================== */}

        <main className="relative min-h-0 flex-1 overflow-hidden bg-background-main">
          <div
            ref={viewerRef}
            className="absolute inset-0 overflow-hidden bg-background-main"
          />

          {/* LEFT TAP AREA */}
          {!loading && !error && (
            <button
              type="button"
              onClick={goPrevious}
              disabled={isNavigating}
              className="absolute inset-y-0 left-0 z-10 w-[16%] bg-transparent opacity-0 transition hover:bg-black/[0.02] disabled:cursor-default"
              aria-label="Previous EPUB page"
            />
          )}

          {/* RIGHT TAP AREA */}
          {!loading && !error && (
            <button
              type="button"
              onClick={goNext}
              disabled={isNavigating}
              className="absolute inset-y-0 right-0 z-10 w-[16%] bg-transparent opacity-0 transition hover:bg-black/[0.02] disabled:cursor-default"
              aria-label="Next EPUB page"
            />
          )}

          {/* LOADING */}
          {loading && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-background-main px-6">
              <div className="flex flex-col items-center text-center">
                <div className="mb-5 h-10 w-10 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />

                <p className="text-sm font-medium text-text-primary sm:text-base">
                  Opening your book...
                </p>

                <p className="mt-2 max-w-sm text-xs leading-relaxed text-text-secondary sm:text-sm">
                  Preparing chapters and reading positions.
                </p>
              </div>
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-background-main px-4 sm:px-6">
              <div className="w-full max-w-md rounded-2xl border border-border-light bg-background-card p-6 text-center shadow-sm sm:p-8">
                <h2 className="mb-2 text-lg font-semibold text-text-primary sm:text-xl">
                  Unable to open EPUB
                </h2>

                <p className="text-sm leading-relaxed text-text-secondary">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="mt-6 min-h-10 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-background-main transition hover:opacity-90"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}

          {/* TABLE OF CONTENTS */}
          {showToc && (
            <div className="absolute inset-0 z-50 flex">
              <div className="flex h-full w-full flex-col border-r border-border-light bg-background-card shadow-2xl sm:max-w-[390px]">
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-border-light px-5">
                  <div>
                    <h2 className="text-base font-semibold text-text-primary">
                      Contents
                    </h2>

                    <p className="mt-0.5 text-xs text-text-secondary">
                      {toc.length
                        ? `${toc.length} sections`
                        : "No table of contents"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowToc(false)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition hover:bg-brand-light hover:text-brand"
                    aria-label="Close contents"
                  >
                    <HiOutlineX size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                  {toc.length ? (
                    toc.map(
                      (item, index) => (
                        <button
                          key={`${item.href}-${index}`}
                          type="button"
                          onClick={() =>
                            goToChapter(
                              item.href
                            )
                          }
                          className={`mb-1 block w-full rounded-xl px-3 py-2.5 text-left text-sm text-text-primary transition hover:bg-brand-light hover:text-brand ${
                            item.depth
                              ? "pl-7 text-text-secondary"
                              : "font-medium"
                          }`}
                        >
                          {item.label}
                        </button>
                      )
                    )
                  ) : (
                    <div className="p-4 text-sm leading-relaxed text-text-secondary">
                      This EPUB does not expose a table of contents.
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                aria-label="Close contents"
                onClick={() =>
                  setShowToc(false)
                }
                className="hidden flex-1 bg-black/10 sm:block"
              />
            </div>
          )}

          {/* NOTES */}
          {showNotes && (
            <div className="absolute inset-0 z-[60] flex">
              <div className="ml-auto flex h-full w-full flex-col border-l border-border-light bg-background-card shadow-2xl sm:max-w-[420px]">
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-border-light px-5">
                  <div>
                    <h2 className="text-base font-semibold text-text-primary">
                      Create Note
                    </h2>

                    <p className="mt-0.5 text-xs text-text-secondary">
                      Reading position{" "}
                      {currentLocation + 1}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowNotes(false)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition hover:bg-brand-light hover:text-brand"
                    aria-label="Close notes"
                  >
                    <HiOutlineX size={20} />
                  </button>
                </div>

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
                        event.target.value
                      )
                    }
                    placeholder="Write your note here..."
                    className="w-full flex-1 resize-none rounded-xl border border-border-light bg-background-main p-4 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-brand"
                  />
                </div>

                <div className="flex shrink-0 justify-end gap-3 border-t border-border-light p-5">
                  <button
                    type="button"
                    onClick={() =>
                      setShowNotes(false)
                    }
                    className="h-10 rounded-lg border border-border-light px-4 text-sm font-medium text-text-secondary transition hover:bg-background-main hover:text-text-primary"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveNote}
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
        </main>

        {/* ====================================================
            CONTROL AREA
        ==================================================== */}

        {!loading && !error && (
          <section className="z-30 flex shrink-0 flex-col items-center justify-center border-t border-border-light bg-background-card px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.04)] sm:px-4 sm:py-3 sm:pb-3">
            <div className="flex max-w-full items-center justify-center gap-0.5 rounded-full border border-border-light bg-background-card px-1.5 py-1 sm:gap-1 sm:px-2 sm:py-1.5">
              {/* PREVIOUS */}
              <button
                type="button"
                onClick={goPrevious}
                disabled={isNavigating}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-primary transition hover:bg-brand-light hover:text-brand disabled:cursor-not-allowed disabled:opacity-35 sm:h-9 sm:w-9"
                aria-label="Previous page"
                title="Previous page"
              >
                <HiOutlineChevronLeft className="text-base sm:text-lg" />
              </button>

              {/* LOCATION */}
              <div className="min-w-[68px] px-1 text-center text-xs font-medium tabular-nums text-text-primary sm:min-w-[108px] sm:px-2">
                <span>
                  {totalLocations
                    ? `${currentLocation + 1} / ${totalLocations}`
                    : "—"}
                </span>

                <span className="ml-1 text-[10px] font-normal text-text-secondary sm:text-[11px]">
                  loc.
                </span>
              </div>

              {/* NEXT */}
              <button
                type="button"
                onClick={goNext}
                disabled={isNavigating}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-primary transition hover:bg-brand-light hover:text-brand disabled:cursor-not-allowed disabled:opacity-35 sm:h-9 sm:w-9"
                aria-label="Next page"
                title="Next page"
              >
                <HiOutlineChevronRight className="text-base sm:text-lg" />
              </button>

              <div className="mx-0.5 h-4 w-px bg-border-light sm:mx-1.5 sm:h-5" />

              {/* FONT DOWN */}
              <button
                type="button"
                onClick={
                  decreaseFontSize
                }
                disabled={
                  fontSize <=
                  MIN_FONT_SIZE
                }
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-primary transition hover:bg-brand-light hover:text-brand disabled:cursor-not-allowed disabled:opacity-35 sm:h-9 sm:w-9"
                aria-label="Decrease text size"
                title="Decrease text size"
              >
                <HiOutlineMinus className="text-base sm:text-lg" />
              </button>

              {/* FONT RESET */}
              <button
                type="button"
                onClick={
                  resetFontSize
                }
                className="flex h-8 min-w-[46px] items-center justify-center rounded-full px-1 text-[11px] font-medium text-text-secondary transition hover:bg-brand-light hover:text-brand sm:h-9 sm:min-w-[58px] sm:text-sm"
                title="Reset text size"
              >
                A {fontSize}%
              </button>

              {/* FONT UP */}
              <button
                type="button"
                onClick={
                  increaseFontSize
                }
                disabled={
                  fontSize >=
                  MAX_FONT_SIZE
                }
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-primary transition hover:bg-brand-light hover:text-brand disabled:cursor-not-allowed disabled:opacity-35 sm:h-9 sm:w-9"
                aria-label="Increase text size"
                title="Increase text size"
              >
                <HiOutlinePlus className="text-base sm:text-lg" />
              </button>

              <div className="mx-0.5 h-4 w-px bg-border-light sm:mx-1.5 sm:h-5" />

              {/* NOTE */}
              <button
                type="button"
                onClick={() =>
                  setShowNotes(true)
                }
                className="flex h-8 items-center justify-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-text-primary transition hover:bg-brand-light hover:text-brand sm:h-9 sm:px-4 sm:text-sm"
                aria-label="Create note"
                title="Create note"
              >
                <HiOutlinePencilAlt className="text-base sm:text-[17px]" />

                <span className="hidden sm:inline">
                  Create Note
                </span>
              </button>
            </div>

            {/* PROGRESS INFORMATION */}
            <div className="mt-1.5 text-center text-[10px] text-text-secondary sm:mt-2 sm:text-[11px]">
              {sectionPage} /{" "}
              {sectionTotal} in section

              <span className="mx-1">
                ·
              </span>

              {Math.round(percentage)}
              % overall
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default EPUBReader;