import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { IoChevronBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
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

const API_BASE = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const PDFReader = ({ fileUrl, bookName, book }) => {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(0.5);
  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pageWidth, setPageWidth] = useState(
    Math.min(window.innerWidth - 32, 800)
  );

  // =========================================================
  // REFS
  // =========================================================
  const containerRef = useRef(null);
  const pageRefs = useRef([]);
  const maxPageReached = useRef(1);

  // Track max page reached during session
  useEffect(() => {
    const page = Number(currentPage) || 1;
    if (page > maxPageReached.current) {
      maxPageReached.current = page;
    }
  }, [currentPage]);

  // Handle window resize for responsive page width
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setPageWidth(Math.min(window.innerWidth - 32, 800));
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // High-performance page detection using IntersectionObserver
  useEffect(() => {
    if (!numPages || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageIndex = Number(entry.target.getAttribute("data-page"));
            if (pageIndex) {
              setCurrentPage(pageIndex);
            }
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.3,
      }
    );

    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [numPages]);

  // =========================================================
  // HANDLERS
  // =========================================================
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    pageRefs.current = Array.from(
      { length: numPages },
      (_, index) => pageRefs.current[index] || null
    );
  };

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.1, 2));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.3));
  const resetZoom = () => setScale(1);

  const goToPage = (pageNumber) => {
    const target = pageRefs.current[pageNumber - 1];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const goToPrevPage = () => currentPage > 1 && goToPage(currentPage - 1);
  const goToNextPage = () =>
    numPages && currentPage < numPages && goToPage(currentPage + 1);

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;

    try {
      const token = localStorage.getItem("token");
      if (!token || !book?.ObjectId) return;

      const newNote = {
        bookId: book.ObjectId,
        page: currentPage,
        text: noteText,
        date: new Date(),
      };

      await axios.put(`${API_BASE}/api/users/createnotes`, newNote, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNoteText("");
      setShowNotes(false);
    } catch (error) {
      console.error("Error saving note:", error.response?.data || error.message);
    }
  };

  const SaveReadingProgress = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const token = localStorage.getItem("token");
      const bookId = book?.ObjectId;

      if (!token || !bookId || !numPages) {
        navigate(-1);
        return;
      }

      const currentProgress = Number(currentPage) || 1;
      const sessionProgress = Number(maxPageReached.current) || 1;
      const databaseProgress = Number(book.pagesRead) || 0;

      const pagesToSave = Math.max(
        databaseProgress,
        sessionProgress,
        currentProgress
      );

      await axios.put(
        `${API_BASE}/api/users/recent-books`,
        {
          bookId,
          pagesRead: pagesToSave,
          totalPages: numPages,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      navigate(-1);
    } catch (error) {
      console.error("Error saving progress:", error.response?.data || error.message);
      navigate(-1);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full h-full bg-background-main flex flex-col relative overflow-hidden">
      {/* HEADER */}
      <div className="shrink-0 bg-background-card border-b border-border-light flex items-center px-4 sm:px-6 shadow-sm z-20 h-14 sm:h-16">
        <button
          type="button"
          onClick={SaveReadingProgress}
          disabled={isSaving}
          className="flex items-center gap-2 text-[clamp(16px,2vw,24px)] font-semibold text-text-primary hover:opacity-80 transition disabled:opacity-50"
          aria-label="Go back"
        >
          <IoChevronBack className="cursor-pointer" />
        </button>

        <p className="text-sm sm:text-base font-semibold text-text-primary truncate ml-2">
          {bookName}
        </p>
      </div>

      {/* READING AREA */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={containerRef}
          className="absolute inset-0 overflow-auto bg-background-main px-3 sm:px-6 md:px-10 pt-5 sm:pt-8 pb-28"
        >
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="min-h-[300px] flex items-center justify-center text-text-secondary">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
                  <p>Loading PDF...</p>
                </div>
              </div>
            }
            error={
              <div className="min-h-[300px] flex items-center justify-center">
                <div className="max-w-md text-center bg-background-card border border-border-light rounded-2xl p-8 shadow-sm">
                  <h2 className="text-xl font-semibold text-text-primary mb-2">
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
              Array.from(new Array(numPages), (_, index) => (
                <div
                  key={`page_${index + 1}`}
                  data-page={index + 1}
                  ref={(el) => {
                    pageRefs.current[index] = el;
                  }}
                  className="flex justify-center mb-6 sm:mb-8"
                >
                  <Page
                    pageNumber={index + 1}
                    width={pageWidth * scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="shadow-md bg-white"
                  />
                </div>
              ))}
          </Document>
        </div>

        {/* FLOATING CONTROL DOCK */}
        <div className="absolute bottom-4 sm:bottom-7 left-1/2 -translate-x-1/2 z-20 max-w-[95vw]">
          <div className="flex items-center gap-0.5 sm:gap-1 bg-background-card/95 backdrop-blur border border-border-light rounded-full shadow-lg px-1.5 sm:px-2 py-1 sm:py-1.5">
            <button
              type="button"
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-text-primary hover:bg-brand-light hover:text-brand disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Previous page"
            >
              <HiOutlineChevronUp className="text-base sm:text-lg" />
            </button>

            <div className="min-w-[48px] sm:min-w-[64px] text-center text-xs sm:text-sm font-medium text-text-primary tabular-nums px-0.5 sm:px-1">
              {numPages ? `${currentPage} / ${numPages}` : "—"}
            </div>

            <button
              type="button"
              onClick={goToNextPage}
              disabled={!numPages || currentPage >= numPages}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-text-primary hover:bg-brand-light hover:text-brand disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Next page"
            >
              <HiOutlineChevronDown className="text-base sm:text-lg" />
            </button>

            <div className="w-px h-4 sm:h-5 bg-border-light mx-0.5 sm:mx-1.5" />

            <button
              type="button"
              onClick={zoomOut}
              disabled={scale <= 0.3}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-text-primary hover:bg-brand-light hover:text-brand disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Zoom out"
            >
              <HiOutlineMinus className="text-base sm:text-lg" />
            </button>

            <button
              type="button"
              onClick={resetZoom}
              className="min-w-[44px] sm:min-w-[56px] h-8 sm:h-9 px-1 sm:px-2 rounded-full text-xs sm:text-sm font-medium text-text-secondary hover:bg-brand-light hover:text-brand transition"
              title="Reset zoom"
            >
              {Math.round(scale * 100)}%
            </button>

            <button
              type="button"
              onClick={zoomIn}
              disabled={scale >= 2}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-text-primary hover:bg-brand-light hover:text-brand disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Zoom in"
            >
              <HiOutlinePlus className="text-base sm:text-lg" />
            </button>

            <div className="w-px h-4 sm:h-5 bg-border-light mx-0.5 sm:mx-1.5" />

            <button
              type="button"
              onClick={() => setShowNotes(true)}
              className="h-8 sm:h-9 px-2.5 sm:px-4 rounded-full flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium text-text-primary hover:bg-brand-light hover:text-brand transition whitespace-nowrap"
              aria-label="Create note"
            >
              <HiOutlinePencilAlt className="text-base sm:text-[17px]" />
              <span className="hidden sm:inline">Create Note</span>
            </button>
          </div>
        </div>

        {/* NOTES PANEL */}
        {showNotes && (
          <div className="absolute top-0 right-0 h-full w-full sm:w-[420px] bg-background-card border-l border-border-light shadow-2xl z-30 flex flex-col">
            <div className="shrink-0 h-16 px-5 flex items-center justify-between border-b border-border-light">
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Create Note
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Page {currentPage}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowNotes(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:bg-brand-light hover:text-brand transition"
                aria-label="Close notes"
              >
                <HiOutlineX size={20} />
              </button>
            </div>

            <div className="flex-1 p-5 flex flex-col">
              <div className="mb-4">
                <p className="text-xs font-medium text-text-secondary mb-2">
                  BOOK
                </p>
                <p className="text-sm font-medium text-text-primary truncate">
                  {bookName}
                </p>
              </div>

              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your note here..."
                className="flex-1 w-full resize-none rounded-xl border border-border-light bg-background-main p-4 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:border-brand transition"
              />
            </div>

            <div className="shrink-0 p-5 border-t border-border-light flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowNotes(false)}
                className="h-10 px-4 rounded-lg border border-border-light text-sm font-medium text-text-secondary hover:bg-background-main hover:text-text-primary transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveNote}
                disabled={!noteText.trim()}
                className="h-10 px-5 rounded-lg bg-brand text-background-main text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
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