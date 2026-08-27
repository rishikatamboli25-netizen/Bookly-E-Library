import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import PDFReader from "./PDFReader";
import EPUBReader from "./EPUBReader";

// Vite environment variable with localhost fallback
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
    const getReadableBook = async () => {
      try {
        setLoading(true);
        setError("");

        console.log("📖 Requesting readable book:", bookId);

        const response = await axios.get(
          `${API_BASE}/api/book/${bookId}/read`
        );

        console.log("✅ Book reading data received:", response.data);

        setBook(response.data);

      } catch (error) {
        console.error("❌ Error loading book:", error);

        setError(
          error.response?.data?.message ||
            "Unable to load this book."
        );

      } finally {
        setLoading(false);
      }
    };

    if (bookId) {
      getReadableBook();
    }

  }, [bookId]);

  console.log(book)


  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-background-dark flex items-center justify-center px-6">

        <div className="flex flex-col items-center gap-4 text-text-white">

          <div className="w-10 h-10 border-4 border-text-white/20 border-t-brand rounded-full animate-spin" />

          <p className="text-text-secondary">
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
      <main className="min-h-screen bg-background-main flex items-center justify-center px-6">

        <div className="max-w-md w-full bg-background-card border border-border-light rounded-2xl p-8 text-center shadow-sm">

          <h1 className="text-2xl font-bold text-text-primary mb-3">
            Unable to open book
          </h1>

          <p className="text-text-secondary mb-7">
            {error}
          </p>

          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-brand text-text-white rounded-full font-medium hover:bg-brand-hover transition"
          >
            Go Back
          </button>

        </div>

      </main>
    );
  }


  // ==========================================
  // SAFETY CHECK
  // ==========================================

  if (!book) {
    return null;
  }


  // ==========================================
  // BACKEND FILE URL
  // ==========================================
  //
  // IMPORTANT:
  //
  // We DO NOT use:
  //
  // book.fileUrl
  //
  // because book.fileUrl points directly to
  // Internet Archive.
  //
  // Instead:
  //
  // React
  //   ↓
  // Backend /file endpoint
  //   ↓
  // Internet Archive
  //
  // This avoids the browser CORS problem.
  //

  const readerFileUrl =
    `${API_BASE}/api/book/${book.identifier}/file`;


  return (
    <main className="h-screen w-full bg-background-main flex flex-col overflow-hidden">


      {/* ========================================= */}
      {/* READING VIEW — fills the whole screen */}
      {/* ========================================= */}

      <section className="flex-1 min-w-0 min-h-0 flex flex-col">


        {/* ============================== */}
        {/* PDF */}
        {/* ============================== */}

        {book.fileType === "pdf" && (

          <PDFReader
            fileUrl={readerFileUrl}
            bookName={book.title}
            book={book}
          />

        )}


        {/* ============================== */}
        {/* EPUB */}
        {/* ============================== */}

        {book.fileType === "epub" && (

          <EPUBReader
            fileUrl={readerFileUrl}
            bookName={book.title}
          />

        )}


        {/* ============================== */}
        {/* UNKNOWN FILE TYPE */}
        {/* ============================== */}

        {book.fileType !== "pdf" &&
          book.fileType !== "epub" && (

            <div className="h-full flex items-center justify-center px-6">

              <div className="text-center">

                <h2 className="text-xl font-semibold text-text-primary mb-2">
                  Unsupported file format
                </h2>

                <p className="text-text-secondary">
                  This book cannot be opened in the reader.
                </p>

              </div>

            </div>

          )}

      </section>

    </main>
  );
};

export default Reader;