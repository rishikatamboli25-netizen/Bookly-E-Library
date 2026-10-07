import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import PDFReader from "./PDFReader";
import EPUBReader from "./EPUBReader";

const API_BASE =
  import.meta.env.VITE_BASE_URL ||
  "http://localhost:5000";

const Reader = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // GET BOOK READING INFORMATION
  // ==========================================
  useEffect(() => {
    let isMounted = true;

    const getReadableBook = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `${API_BASE}/api/book/${bookId}/read`
        );

        if (isMounted) {
          setBook(response.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              "Unable to load this book."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (bookId) {
      getReadableBook();
    }

    return () => {
      isMounted = false;
    };
  }, [bookId]);

  const fileType =
    book?.fileType?.toLowerCase();

  // ==========================================
  // READER FILE URL
  // ==========================================
  //
  // EPUB:
  // /api/book/:identifier/file.epub
  //
  // PDF:
  // /api/book/:identifier/file
  //
  const readerFileUrl = book
    ? fileType === "epub"
      ? `${API_BASE}/api/book/${book.identifier}/file.epub`
      : `${API_BASE}/api/book/${book.identifier}/file`
    : "";

  // ==========================================
  // LOADING STATE
  // ==========================================
  if (loading) {
    return (
      <main className="fixed inset-0 z-50 flex h-dvh w-full items-center justify-center bg-background-dark px-4 sm:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-text-white/20 border-t-brand" />

          <p className="text-sm font-medium text-text-secondary sm:text-base">
            Preparing your book...
          </p>
        </div>
      </main>
    );
  }

  // ==========================================
  // ERROR STATE
  // ==========================================
  if (error) {
    return (
      <main className="fixed inset-0 z-50 flex h-dvh w-full items-center justify-center bg-background-main px-4 sm:px-6">
        <div className="w-full max-w-md rounded-2xl border border-border-light bg-background-card p-6 text-center shadow-sm sm:p-8">
          <h1 className="mb-2.5 text-xl font-bold text-text-primary sm:text-2xl">
            Unable to open book
          </h1>

          <p className="mb-6 text-sm leading-relaxed text-text-secondary sm:text-base">
            {error}
          </p>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="min-h-[44px] w-full rounded-full bg-brand px-6 py-3 font-medium text-text-white transition hover:bg-brand-hover active:scale-[0.98] sm:w-auto"
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  if (!book) {
    return null;
  }

  return (
    <main className="fixed inset-0 z-50 flex h-dvh w-full select-none flex-col overflow-hidden overscroll-none bg-background-main">
      {/* ==========================================
          READING VIEW
      ========================================== */}
      <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* ========================================
            PDF
        ======================================== */}
        {fileType === "pdf" && (
          <PDFReader
            fileUrl={readerFileUrl}
            bookName={book.title}
            book={book}
          />
        )}

        {/* ========================================
            EPUB
        ======================================== */}
        {fileType === "epub" && (
          <EPUBReader
            fileUrl={readerFileUrl}
            bookName={book.title}
            book={book}
          />
        )}

        {/* ========================================
            UNSUPPORTED FORMAT
        ======================================== */}
        {fileType !== "pdf" &&
          fileType !== "epub" && (
            <div className="flex h-full items-center justify-center px-4 sm:px-6">
              <div className="w-full max-w-md rounded-2xl border border-border-light bg-background-card p-6 text-center shadow-sm sm:p-8">
                <h2 className="mb-2 text-lg font-semibold text-text-primary sm:text-xl">
                  Unsupported file format
                </h2>

                <p className="mb-6 text-sm text-text-secondary">
                  This book format (.
                  {book.fileType ||
                    "unknown"}) cannot be
                  opened in the web reader.
                </p>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="rounded-full border border-border-light bg-background-main px-5 py-2.5 text-sm font-medium text-text-primary transition hover:bg-border-light/20"
                >
                  Back to Library
                </button>
              </div>
            </div>
          )}
      </section>
    </main>
  );
};

export default Reader;