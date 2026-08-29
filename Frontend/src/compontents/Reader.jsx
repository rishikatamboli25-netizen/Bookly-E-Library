import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import PDFReader from "./PDFReader";
import EPUBReader from "./EPUBReader";

const API_BASE = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

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
            err.response?.data?.message || "Unable to load this book."
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

  const fileType = book?.fileType?.toLowerCase();
  const readerFileUrl = book ? `${API_BASE}/api/book/${book.identifier}/file` : "";

  // ==========================================
  // LOADING STATE
  // ==========================================
  if (loading) {
    return (
      <main className="fixed inset-0 h-dvh w-full bg-background-dark flex items-center justify-center px-4 sm:px-6 z-50">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-4 border-text-white/20 border-t-brand rounded-full animate-spin" />
          <p className="text-sm sm:text-base text-text-secondary font-medium">
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
      <main className="fixed inset-0 h-dvh w-full bg-background-main flex items-center justify-center px-4 sm:px-6 z-50">
        <div className="max-w-md w-full bg-background-card border border-border-light rounded-2xl p-6 sm:p-8 text-center shadow-sm">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-2.5">
            Unable to open book
          </h1>

          <p className="text-sm sm:text-base text-text-secondary mb-6 leading-relaxed">
            {error}
          </p>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-6 py-3 min-h-[44px] bg-brand text-text-white rounded-full font-medium hover:bg-brand-hover transition active:scale-[0.98]"
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
    <main className="fixed inset-0 h-dvh w-full bg-background-main flex flex-col overflow-hidden overscroll-none select-none z-50">
      {/* READING VIEW */}
      <section className="flex-1 min-w-0 min-h-0 flex flex-col relative overflow-hidden">
        {fileType === "pdf" && (
          <PDFReader
            fileUrl={readerFileUrl}
            bookName={book.title}
            book={book}
          />
        )}

        {fileType === "epub" && (
          <EPUBReader
            fileUrl={readerFileUrl}
            bookName={book.title}
            book={book}
          />
        )}

        {fileType !== "pdf" && fileType !== "epub" && (
          <div className="h-full flex items-center justify-center px-4 sm:px-6">
            <div className="max-w-md text-center bg-background-card border border-border-light rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg sm:text-xl font-semibold text-text-primary mb-2">
                Unsupported file format
              </h2>

              <p className="text-sm text-text-secondary mb-6">
                This book format (.{book.fileType || "unknown"}) cannot be opened in the web reader.
              </p>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 text-sm font-medium bg-background-main border border-border-light text-text-primary rounded-full hover:bg-border-light/20 transition"
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