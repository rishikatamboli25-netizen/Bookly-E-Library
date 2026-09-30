import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  HiArrowLeft,
  HiOutlineBookmark,
  HiOutlineBookOpen,
} from "react-icons/hi";
import { FaStar } from "react-icons/fa";
import { HiOutlineCheckCircle } from "react-icons/hi2";
import axios from "axios";
import BookDetailSkeleton from "../compontents/Loading/BookDetailSkeleton";

// Vite environment variable with localhost fallback
const API_BASE =
  import.meta.env.VITE_BASE_URL || "http://localhost:5000";

function BookDetail() {
  const navigate = useNavigate();
  const { bookId } = useParams();

  const [book, setBook] = useState(null);
  const [readBooks, setReadBooks] = useState([]);
  const [readBooksLoading, setReadBooksLoading] = useState(true);

  // =========================
  // FETCH BOOK
  // =========================
  useEffect(() => {
    const findBook = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/api/book/${bookId}`
        );

        setBook(response.data);
      } catch (error) {
        console.error(
          "Error fetching book:",
          error
        );
      }
    };

    findBook();
  }, [bookId]);

  // =========================
  // FETCH READ BOOKS
  // =========================
  useEffect(() => {
    const checkAsRead = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          console.error(
            "Authentication token not found"
          );
          return;
        }

        const response = await axios.get(
          `${API_BASE}/api/users/checkReadBooks`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setReadBooks(response.data.data);
      } catch (error) {
        console.error(
          "Error fetching read books:",
          error.response?.data ||
            error.message
        );
      } finally {
        setReadBooksLoading(false);
      }
    };

    checkAsRead();
  }, []);

  // =========================
  // MARK AS READ
  // =========================
  const markAsRead = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error(
          "Authentication token not found"
        );
        return;
      }

      await axios.put(
        `${API_BASE}/api/users/mark-as-read`,
        {
          bookId: book?._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Marked as Read ✅");

      setReadBooks((prev) => [
        ...prev,
        book._id,
      ]);
    } catch (error) {
      console.error(
        "Error Marking Read:",
        error.response?.data ||
          error.message
      );
    }
  };

  // =========================
  // READ NOW
  // =========================
  const handleReadNow = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error(
          "Authentication token not found"
        );
        return;
      }

      const response = await axios.put(
        `${API_BASE}/api/users/recent-books`,
        {
          bookId: book._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "Recent book updated:",
        response.data
      );

      navigate(`/reader/${book.identifier}`);
    } catch (error) {
      console.error(
        "Error adding recent book:",
        error.response?.data ||
          error.message
      );
    }
  };

  // =========================
  // ADD TO COLLECTION
  // =========================
  const handleAddToCollection = () => {
    navigate("/collection", {
      state: {
        mode: "add-book",
        bookId: book.identifier,
      },
    });
  };

  // =========================
  // LOADING
  // =========================
  if (!book) {
    return <BookDetailSkeleton />;
  }

  // =========================
  // CHECK IF CURRENT BOOK IS READ
  // =========================
  const isRead =
    !readBooksLoading &&
    readBooks.includes(book._id);

  const coverUrl =
    `https://archive.org/services/img/${book.identifier}`;

  // =========================
  // UI
  // =========================
  return (
    <div className="w-full px-6 py-6 md:px-12 md:py-8 lg:px-20">
      <div className="mx-auto w-full max-w-6xl">

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex w-fit items-center gap-2 text-sm text-text-secondary transition hover:text-text-primary"
        >
          <HiArrowLeft size={18} />
          Back
        </button>

        {/* ========================= */}
        {/* BOOK HERO */}
        {/* ========================= */}
        <section className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[240px_1fr] lg:gap-12">

          {/* Book Cover */}
          <div className="flex justify-center lg:justify-start">
            <div className="flex aspect-[2/3] w-[200px] items-center justify-center rounded-xl bg-background-card p-2 shadow-md lg:w-[240px]">
              <img
                src={coverUrl}
                alt={book.title}
                className="h-full w-full rounded object-contain drop-shadow-sm"
              />
            </div>
          </div>

          {/* Book Information */}
          <div className="flex flex-col justify-start pt-2">

            {/* Category */}
            <span className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand">
              {book.category}
            </span>

            {/* Title */}
            <h1 className="mb-3 text-3xl font-bold leading-tight text-text-primary md:text-4xl">
              {book.title}
            </h1>

            {/* Author */}
            <p className="mb-4 text-base text-text-secondary">
              By{" "}
              <span className="font-semibold text-text-primary">
                {book.author}
              </span>
            </p>

            {/* Rating + Pages */}
            <div className="mb-4 flex items-center gap-4 text-sm">

              <div className="flex items-center gap-1.5">
                <FaStar
                  className="text-warning"
                  size={14}
                />

                <span className="font-semibold text-text-primary">
                  {book.rating}
                </span>

                <span className="text-text-secondary">
                  / 5
                </span>
              </div>

              <span className="text-border-light">
                |
              </span>

              <span className="text-text-secondary">
                {book.totalPages} Pages
              </span>

            </div>

            {/* Description */}
            <p className="mb-6 max-w-3xl line-clamp-4 text-sm leading-relaxed text-text-secondary">
              {book.description ||
                "Discover this fascinating book and explore its ideas, stories, and insights. Start reading and immerse yourself in a world of knowledge and imagination."}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">

              <button
                onClick={handleReadNow}
                className="flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-text-white transition hover:bg-brand-hover"
              >
                <HiOutlineBookOpen size={18} />
                Read Now
              </button>

              <button
                onClick={handleAddToCollection}
                className="flex items-center gap-2 rounded-full border border-border-light bg-background-card px-6 py-2.5 text-sm font-medium text-text-primary transition hover:bg-brand-light"
              >
                <HiOutlineBookmark size={18} />
                Add to Collection
              </button>

              {isRead ? (
                <button
                  disabled
                  className="flex cursor-not-allowed items-center gap-2 rounded-full border border-border-light bg-background-card px-6 py-2.5 text-sm font-medium text-text-primary opacity-70"
                >
                  <HiOutlineCheckCircle size={18} />
                  Read
                </button>
              ) : (
                <button
                  onClick={markAsRead}
                  className="flex items-center gap-2 rounded-full border border-border-light bg-background-card px-6 py-2.5 text-sm font-medium text-text-primary transition hover:bg-brand-light"
                >
                  <HiOutlineCheckCircle size={18} />
                  Mark as Read
                </button>
              )}

            </div>
          </div>
        </section>

        {/* ========================= */}
        {/* BOOK DETAILS GRID */}
        {/* ========================= */}
        <section className="mt-10 w-full">
          <div className="overflow-hidden rounded-xl border border-border-light bg-background-card">
            <div className="grid grid-cols-2 gap-4 p-5 md:grid-cols-4">

              <div>
                <p className="mb-1 text-xs text-text-secondary">
                  Author
                </p>

                <p className="truncate text-sm font-semibold text-text-primary">
                  {book.author}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs text-text-secondary">
                  Category
                </p>

                <p className="truncate text-sm font-semibold text-text-primary">
                  {book.category}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs text-text-secondary">
                  Pages
                </p>

                <p className="text-sm font-semibold text-text-primary">
                  {book.totalPages}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs text-text-secondary">
                  Rating
                </p>

                <p className="text-sm font-semibold text-text-primary">
                  {book.rating} / 5
                </p>
              </div>

            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default BookDetail;