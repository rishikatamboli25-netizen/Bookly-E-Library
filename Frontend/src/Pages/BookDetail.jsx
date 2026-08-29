import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  HiArrowLeft,
  HiOutlineBookmark,
  HiOutlineBookOpen,
} from "react-icons/hi";
import { FaStar } from "react-icons/fa";
import { HiOutlineCheckCircle } from "react-icons/hi2";
import axios from "axios";

// Vite environment variable with localhost fallback
const API_BASE = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

function BookDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookId } = useParams();

  const [book, setBook] = useState(null);
  const [readBooks, setReadBooks] = useState([]);

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
        console.error("Error fetching book:", error);
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
          console.error("Authentication token not found");
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
          error.response?.data || error.message
        );
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
        console.error("Authentication token not found");
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
      setReadBooks((prev) => [...prev, book._id]);
    } catch (error) {
      console.error(
        "Error Marking Read:",
        error.response?.data || error.message
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
        console.error("Authentication token not found");
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

      console.log("Recent book updated:", response.data);
      navigate(`/reader/${book.identifier}`);
    } catch (error) {
      console.error(
        "Error adding recent book:",
        error.response?.data || error.message
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
    return (
      <div className="h-64 w-full flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // =========================
  // CHECK IF CURRENT BOOK IS READ
  // =========================
  const isRead = readBooks.includes(book._id);
  const coverUrl = `https://archive.org/services/img/${book.identifier}`;

  // =========================
  // UI
  // =========================
  return (
    <div className="w-full px-6 md:px-12 lg:px-20 py-6 md:py-8">
      <div className="w-full max-w-6xl mx-auto">
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition mb-6 w-fit"
        >
          <HiArrowLeft size={18} />
          Back
        </button>

        {/* ========================= */}
        {/* SCALED DOWN BOOK HERO */}
        {/* ========================= */}
        <section className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 lg:gap-12 items-start">
          
          {/* Book Cover Container (Strict Aspect Ratio) */}
          <div className="flex justify-center lg:justify-start">
            <div className="w-[200px] lg:w-[240px] aspect-[2/3] flex items-center justify-center bg-background-card rounded-xl shadow-md p-2">
              <img
                src={coverUrl}
                alt={book.title}
                className="w-full h-full object-contain drop-shadow-sm rounded"
              />
            </div>
          </div>

          {/* Scaled Down Information */}
          <div className="flex flex-col justify-start pt-2">
            {/* Category */}
            <span className="text-xs uppercase tracking-widest text-brand font-semibold mb-2">
              {book.category}
            </span>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary leading-tight mb-3">
              {book.title}
            </h1>

            {/* Author */}
            <p className="text-base text-text-secondary mb-4">
              By{" "}
              <span className="font-semibold text-text-primary">
                {book.author}
              </span>
            </p>

            {/* Rating + Pages */}
            <div className="flex items-center gap-4 mb-4 text-sm">
              <div className="flex items-center gap-1.5">
                <FaStar className="text-warning" size={14} />
                <span className="font-semibold text-text-primary">
                  {book.rating}
                </span>
                <span className="text-text-secondary">/ 5</span>
              </div>
              <span className="text-border-light">|</span>
              <span className="text-text-secondary">
                {book.totalPages} Pages
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-text-secondary leading-relaxed max-w-3xl mb-6 line-clamp-4">
              {book.description ||
                "Discover this fascinating book and explore its ideas, stories, and insights. Start reading and immerse yourself in a world of knowledge and imagination."}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleReadNow}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand text-text-white text-sm rounded-full font-medium hover:bg-brand-hover transition"
              >
                <HiOutlineBookOpen size={18} />
                Read Now
              </button>

              <button
                onClick={handleAddToCollection}
                className="flex items-center gap-2 px-6 py-2.5 bg-background-card border border-border-light text-text-primary text-sm rounded-full font-medium hover:bg-brand-light transition"
              >
                <HiOutlineBookmark size={18} />
                Add to Collection
              </button>

              {isRead ? (
                <button
                  disabled
                  className="flex items-center gap-2 px-6 py-2.5 bg-background-card border border-border-light text-text-primary text-sm rounded-full font-medium opacity-70 cursor-not-allowed"
                >
                  <HiOutlineCheckCircle size={18} />
                  Read
                </button>
              ) : (
                <button
                  onClick={markAsRead}
                  className="flex items-center gap-2 px-6 py-2.5 bg-background-card border border-border-light text-text-primary text-sm rounded-full font-medium hover:bg-brand-light transition"
                >
                  <HiOutlineCheckCircle size={18} />
                  Mark as Read
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ========================= */}
        {/* COMPACT BOOK DETAILS GRID */}
        {/* ========================= */}
        <section className="w-full mt-10">
          <div className="bg-background-card border border-border-light rounded-xl overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
              <div>
                <p className="text-xs text-text-secondary mb-1">Author</p>
                <p className="text-sm font-semibold text-text-primary truncate">
                  {book.author}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary mb-1">Category</p>
                <p className="text-sm font-semibold text-text-primary truncate">
                  {book.category}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary mb-1">Pages</p>
                <p className="text-sm font-semibold text-text-primary">
                  {book.totalPages}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary mb-1">Rating</p>
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