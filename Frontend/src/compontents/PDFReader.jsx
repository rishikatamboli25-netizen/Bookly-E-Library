import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { IoChevronBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

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

import axios from "axios";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const PDFReader = ({ fileUrl, bookName, book }) => {
  const navigate = useNavigate();

  // =========================================================
  // PDF STATE
  // =========================================================

  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Default zoom = 50%
  const [scale, setScale] = useState(0.5);

  // =========================================================
  // REFS
  // =========================================================

  const containerRef = useRef(null);
  const pageRefs = useRef([]);

  // =========================================================
  // HIGHEST PAGE REACHED IN THIS SESSION
  // =========================================================

  /*
    This is ONLY responsible for tracking the highest page
    reached during the current reading session.

    Example:

    User goes:
    1 → 10 → 25 → 2

    maxPageReached.current will remain 25.
  */

  const maxPageReached = useRef(1);

  useEffect(() => {
    const page = Number(currentPage) || 1;

    if (page > maxPageReached.current) {
      maxPageReached.current = page;

      console.log(
        "📈 New session maximum page:",
        maxPageReached.current,
      );
    }
  }, [currentPage]);

  // =========================================================
  // NOTES STATE
  // =========================================================

  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState("");

  // =========================================================
  // DEBUG BOOK
  // =========================================================

  useEffect(() => {
    console.log("📚 PDFReader received book:", book);

    if (book) {
      console.log("🆔 Book ObjectId:", book.ObjectId);
      console.log("📖 Book title:", book.title);
    }
  }, [book]);

  // =========================================================
  // PDF LOAD SUCCESS
  // =========================================================

  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log("📄 PDF loaded successfully");
    console.log("📄 Total pages:", numPages);

    setNumPages(numPages);

    pageRefs.current = Array.from(
      { length: numPages },
      (_, index) => pageRefs.current[index] || null,
    );
  };

  // =========================================================
  // ZOOM IN
  // =========================================================

  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.1, 2));
  };

  // =========================================================
  // ZOOM OUT
  // =========================================================

  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.3));
  };

  // =========================================================
  // RESET ZOOM
  // =========================================================

  const resetZoom = () => {
    setScale(1);
  };

  // =========================================================
  // PAGE NAVIGATION
  // =========================================================

  const goToPage = (pageNumber) => {
    const target = pageRefs.current[pageNumber - 1];

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (numPages && currentPage < numPages) {
      goToPage(currentPage + 1);
    }
  };

  // =========================================================
  // NOTES
  // =========================================================

  const handleCreateNote = () => {
    setShowNotes(true);
  };

  const handleCloseNotes = () => {
    setShowNotes(false);
  };

  // =========================================================
  // SAVE NOTE
  // =========================================================

  const handleSaveNote = async () => {
    if (!noteText.trim()) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.log("❌ No authentication token found");
        return;
      }

      if (!book?.ObjectId) {
        console.error(
          "❌ Cannot save note. Book ObjectId is missing:",
          book,
        );
        return;
      }

      const newNote = {
        book: book,
        page: currentPage,
        text: noteText,
        date: new Date(),
      };

      console.log("📝 Saving note:", newNote);

      const response = await axios.put(
        "http://localhost:5000/api/users/createnotes",
        newNote,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log(
        "✅ Note saved successfully:",
        response.data,
      );

      setNoteText("");
      setShowNotes(false);
    } catch (error) {
      console.error(
        "❌ Error saving note:",
        error.response?.data || error.message,
      );
    }
  };

  // =========================================================
  // SAVE READING PROGRESS
  // =========================================================

  const SaveReadingProgress = async () => {
    console.log("========================================");
    console.log("🔥 SaveReadingProgress CALLED");
    console.log("========================================");

    try {
      // -------------------------------------------------------
      // TOKEN
      // -------------------------------------------------------

      const token = localStorage.getItem("token");

      console.log(
        "🔐 Token:",
        token ? "FOUND" : "NOT FOUND",
      );

      if (!token) {
        console.log("❌ Token not found");
        navigate(-1);
        return;
      }

      // -------------------------------------------------------
      // BOOK CHECK
      // -------------------------------------------------------

      console.log("📚 Book received:", book);

      if (!book) {
        console.error("❌ Book object is missing");
        navigate(-1);
        return;
      }

      // -------------------------------------------------------
      // IMPORTANT:
      // YOUR BOOK OBJECT USES ObjectId, NOT _id
      // -------------------------------------------------------

      const bookId = book.ObjectId;

      console.log("🆔 Resolved Book ObjectId:", bookId);

      if (!bookId) {
        console.error(
          "❌ Could not resolve book ObjectId from:",
          book,
        );

        navigate(-1);
        return;
      }

      // -------------------------------------------------------
      // PDF PAGE CHECK
      // -------------------------------------------------------

      console.log("📄 Total PDF pages:", numPages);

      if (!numPages) {
        console.error("❌ Total PDF pages are not available");
        navigate(-1);
        return;
      }

      // -------------------------------------------------------
      // CURRENT PAGE
      // -------------------------------------------------------

      const currentProgress = Number(currentPage) || 1;

      // -------------------------------------------------------
      // HIGHEST PAGE OF THIS SESSION
      // -------------------------------------------------------

      const sessionProgress =
        Number(maxPageReached.current) || 1;

      // -------------------------------------------------------
      // PREVIOUS DATABASE PROGRESS
      // -------------------------------------------------------

      /*
        If the book object contains pagesRead, use it.

        If it doesn't, this becomes 0.

        The backend is ALSO protecting the value, so even if
        frontend doesn't have the old progress, backend will
        prevent a lower value from overwriting the DB value.
      */

      const databaseProgress =
        Number(book.pagesRead) || 0;

      // -------------------------------------------------------
      // FINAL PROGRESS
      // -------------------------------------------------------

      /*
        We always save the highest value.

        Example:

        DB = 40
        Session max = 10
        Current page = 5

        => 40

        DB = 40
        Session max = 55
        Current page = 20

        => 55
      */

      const pagesToSave = Math.max(
        databaseProgress,
        sessionProgress,
        currentProgress,
      );

      // -------------------------------------------------------
      // DEBUG
      // -------------------------------------------------------

      console.log("📊 PROGRESS CALCULATION");
      console.log({
        bookId,
        databaseProgress,
        sessionProgress,
        currentProgress,
        pagesToSave,
        totalPages: numPages,
      });

      // -------------------------------------------------------
      // PAYLOAD
      // -------------------------------------------------------

      const payload = {
        bookId: bookId,
        pagesRead: pagesToSave,
        totalPages: numPages,
      };

      console.log("🚀 Sending progress to backend:");
      console.log(payload);

      // -------------------------------------------------------
      // API REQUEST
      // -------------------------------------------------------

      const response = await axios.put(
        "http://localhost:5000/api/users/recent-books",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // -------------------------------------------------------
      // SUCCESS
      // -------------------------------------------------------

      console.log(
        "✅ Progress Saved Successfully:",
        response.data,
      );

      console.log("========================================");

      navigate(-1);
    } catch (error) {
      console.error(
        "❌ Error Saving Progress:",
        error.response?.data || error.message,
      );

      console.log("========================================");

      navigate(-1);
    }
  };

  // =========================================================
  // RESPONSIVE PAGE WIDTH
  // =========================================================

  const [pageWidth, setPageWidth] = useState(
    Math.min(window.innerWidth - 32, 800),
  );

  useEffect(() => {
    const handleResize = () => {
      setPageWidth(
        Math.min(window.innerWidth - 32, 800),
      );
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener(
        "resize",
        handleResize,
      );
    };
  }, []);

  // =========================================================
  // TRACK CURRENT PAGE FROM SCROLL
  // =========================================================

  useEffect(() => {
    const scrollEl = containerRef.current;

    if (!scrollEl || !numPages) {
      return;
    }

    const handleScroll = () => {
      const containerTop =
        scrollEl.getBoundingClientRect().top;

      let closestPage = 1;
      let closestDistance = Infinity;

      pageRefs.current.forEach((el, index) => {
        if (!el) {
          return;
        }

        const distance = Math.abs(
          el.getBoundingClientRect().top -
            containerTop,
        );

        if (distance < closestDistance) {
          closestDistance = distance;
          closestPage = index + 1;
        }
      });

      setCurrentPage(closestPage);
    };

    scrollEl.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      },
    );

    handleScroll();

    return () => {
      scrollEl.removeEventListener(
        "scroll",
        handleScroll,
      );
    };
  }, [numPages]);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      className="
        w-full
        h-full
        bg-background-main
        flex
        flex-col
        relative
        overflow-hidden
      "
    >
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div
        className="
          shrink-0
          bg-background-card
          border-b
          border-border-light
          flex
          items-center
          px-4
          sm:px-6
          shadow-sm
          z-20
          mt-16
          h-[7vh]
          pt-3
        "
      >
        <button
          type="button"
          onClick={SaveReadingProgress}
          className="
            flex
            items-center
            gap-2
            text-[clamp(16px,2vw,24px)]
            font-semibold
            text-text-primary
            hover:opacity-80
            transition
          "
          aria-label="Go back"
        >
          <IoChevronBack className="cursor-pointer" />
        </button>

        <p
          className="
            text-sm
            sm:text-base
            font-semibold
            text-text-primary
            truncate
            ml-2
          "
        >
          {bookName}
        </p>
      </div>

      {/* ================================================= */}
      {/* READING AREA */}
      {/* ================================================= */}

      <div
        className="
          relative
          flex-1
          min-h-0
        "
      >
        <div
          ref={containerRef}
          className="
            absolute
            inset-0
            overflow-auto
            bg-background-main
            px-3
            sm:px-6
            md:px-10
            pt-5
            sm:pt-8
            pb-28
          "
        >
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div
                className="
                  min-h-[300px]
                  flex
                  items-center
                  justify-center
                  text-text-secondary
                "
              >
                <div
                  className="
                    flex
                    flex-col
                    items-center
                    gap-4
                  "
                >
                  <div
                    className="
                      w-10
                      h-10
                      border-4
                      border-brand/20
                      border-t-brand
                      rounded-full
                      animate-spin
                    "
                  />

                  <p>Loading PDF...</p>
                </div>
              </div>
            }
            error={
              <div
                className="
                  min-h-[300px]
                  flex
                  items-center
                  justify-center
                "
              >
                <div
                  className="
                    max-w-md
                    text-center
                    bg-background-card
                    border
                    border-border-light
                    rounded-2xl
                    p-8
                    shadow-sm
                  "
                >
                  <h2
                    className="
                      text-xl
                      font-semibold
                      text-text-primary
                      mb-2
                    "
                  >
                    Unable to load PDF
                  </h2>

                  <p
                    className="
                      text-sm
                      text-text-secondary
                    "
                  >
                    Something went wrong while opening
                    this book.
                  </p>
                </div>
              </div>
            }
          >
            {/* ================================================= */}
            {/* ALL PDF PAGES */}
            {/* ================================================= */}

            {numPages &&
              Array.from(
                new Array(numPages),
                (_, index) => (
                  <div
                    key={`page_${index + 1}`}
                    ref={(el) => {
                      pageRefs.current[index] = el;
                    }}
                    className="
                      flex
                      justify-center
                      mb-6
                      sm:mb-8
                    "
                  >
                    <Page
                      pageNumber={index + 1}
                      width={pageWidth * scale}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="
                        shadow-md
                        bg-white
                      "
                    />
                  </div>
                ),
              )}
          </Document>
        </div>

        {/* ================================================= */}
        {/* FLOATING CONTROL DOCK */}
        {/* ================================================= */}

        <div
          className="
            absolute
            bottom-5
            sm:bottom-7
            left-[49%]
            -translate-x-1/2
            z-20
          "
        >
          <div
            className="
              flex
              items-center
              gap-0.5
              bg-background-card/95
              backdrop-blur
              border
              border-border-light
              rounded-full
              shadow-lg
              px-2
              py-1.5
            "
          >
            {/* PREVIOUS */}

            <button
              type="button"
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className="
                w-9
                h-9
                rounded-full
                flex
                items-center
                justify-center
                text-text-primary
                hover:bg-brand-light
                hover:text-brand
                disabled:opacity-40
                disabled:cursor-not-allowed
                transition
              "
              aria-label="Previous page"
            >
              <HiOutlineChevronUp size={18} />
            </button>

            {/* PAGE COUNT */}

            <div
              className="
                min-w-[64px]
                text-center
                text-sm
                font-medium
                text-text-primary
                tabular-nums
                px-1
              "
            >
              {numPages
                ? `${currentPage} / ${numPages}`
                : "—"}
            </div>

            {/* NEXT */}

            <button
              type="button"
              onClick={goToNextPage}
              disabled={
                !numPages ||
                currentPage >= numPages
              }
              className="
                w-9
                h-9
                rounded-full
                flex
                items-center
                justify-center
                text-text-primary
                hover:bg-brand-light
                hover:text-brand
                disabled:opacity-40
                disabled:cursor-not-allowed
                transition
              "
              aria-label="Next page"
            >
              <HiOutlineChevronDown size={18} />
            </button>

            {/* DIVIDER */}

            <div
              className="
                w-px
                h-5
                bg-border-light
                mx-1.5
              "
            />

            {/* ZOOM OUT */}

            <button
              type="button"
              onClick={zoomOut}
              disabled={scale <= 0.3}
              className="
                w-9
                h-9
                rounded-full
                flex
                items-center
                justify-center
                text-text-primary
                hover:bg-brand-light
                hover:text-brand
                disabled:opacity-40
                disabled:cursor-not-allowed
                transition
              "
              aria-label="Zoom out"
            >
              <HiOutlineMinus size={18} />
            </button>

            {/* ZOOM */}

            <button
              type="button"
              onClick={resetZoom}
              className="
                min-w-[56px]
                h-9
                px-2
                rounded-full
                text-sm
                font-medium
                text-text-secondary
                hover:bg-brand-light
                hover:text-brand
                transition
              "
              title="Reset zoom"
            >
              {Math.round(scale * 100)}%
            </button>

            {/* ZOOM IN */}

            <button
              type="button"
              onClick={zoomIn}
              disabled={scale >= 2}
              className="
                w-9
                h-9
                rounded-full
                flex
                items-center
                justify-center
                text-text-primary
                hover:bg-brand-light
                hover:text-brand
                disabled:opacity-40
                disabled:cursor-not-allowed
                transition
              "
              aria-label="Zoom in"
            >
              <HiOutlinePlus size={18} />
            </button>

            {/* DIVIDER */}

            <div
              className="
                w-px
                h-5
                bg-border-light
                mx-1.5
              "
            />

            {/* CREATE NOTE */}

            <button
              type="button"
              onClick={handleCreateNote}
              className="
                h-9
                px-3
                sm:px-4
                rounded-full
                flex
                items-center
                justify-center
                gap-2
                text-sm
                font-medium
                text-text-primary
                hover:bg-brand-light
                hover:text-brand
                transition
                whitespace-nowrap
              "
              aria-label="Create note"
            >
              <HiOutlinePencilAlt size={17} />

              <span>Create Note</span>
            </button>
          </div>
        </div>

        {/* ================================================= */}
        {/* NOTES PANEL */}
        {/* ================================================= */}

        {showNotes && (
          <div
            className="
              absolute
              top-0
              right-0
              h-full
              w-full
              sm:w-[420px]
              bg-background-card
              border-l
              border-border-light
              shadow-2xl
              z-30
              flex
              flex-col
            "
          >
            {/* NOTES HEADER */}

            <div
              className="
                shrink-0
                h-16
                px-5
                flex
                items-center
                justify-between
                border-b
                border-border-light
              "
            >
              <div>
                <h2
                  className="
                    text-base
                    font-semibold
                    text-text-primary
                  "
                >
                  Create Note
                </h2>

                <p
                  className="
                    text-xs
                    text-text-secondary
                    mt-0.5
                  "
                >
                  Page {currentPage}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseNotes}
                className="
                  w-9
                  h-9
                  rounded-full
                  flex
                  items-center
                  justify-center
                  text-text-secondary
                  hover:bg-brand-light
                  hover:text-brand
                  transition
                "
                aria-label="Close notes"
              >
                <HiOutlineX size={20} />
              </button>
            </div>

            {/* NOTE CONTENT */}

            <div
              className="
                flex-1
                p-5
                flex
                flex-col
              "
            >
              <div className="mb-4">
                <p
                  className="
                    text-xs
                    font-medium
                    text-text-secondary
                    mb-2
                  "
                >
                  BOOK
                </p>

                <p
                  className="
                    text-sm
                    font-medium
                    text-text-primary
                    truncate
                  "
                >
                  {bookName}
                </p>
              </div>

              <textarea
                value={noteText}
                onChange={(e) =>
                  setNoteText(e.target.value)
                }
                placeholder="Write your note here..."
                className="
                  flex-1
                  w-full
                  resize-none
                  rounded-xl
                  border
                  border-border-light
                  bg-background-main
                  p-4
                  text-sm
                  text-text-primary
                  placeholder:text-text-secondary
                  outline-none
                  focus:border-brand
                  transition
                "
              />
            </div>

            {/* NOTE FOOTER */}

            <div
              className="
                shrink-0
                p-5
                border-t
                border-border-light
                flex
                justify-end
                gap-3
              "
            >
              <button
                type="button"
                onClick={handleCloseNotes}
                className="
                  h-10
                  px-4
                  rounded-lg
                  border
                  border-border-light
                  text-sm
                  font-medium
                  text-text-secondary
                  hover:bg-background-main
                  hover:text-text-primary
                  transition
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveNote}
                disabled={!noteText.trim()}
                className="
                  h-10
                  px-5
                  rounded-lg
                  bg-brand
                  text-background-main
                  text-sm
                  font-semibold
                  hover:opacity-90
                  disabled:opacity-40
                  disabled:cursor-not-allowed
                  transition
                "
              >
                Save Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFReader;