import React, { useEffect, useRef, useState } from "react";
import Cardtwo from "../compontents/Cardtwo";
import { LuArrowRight } from "react-icons/lu";
import axios from "axios";
import "../App.css";

// Vite environment variable with localhost fallback
const API_BASE = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

const Discover = () => {
  const [books, setBooks] = useState([]);

  // Refs for both horizontal book sections
  const popularBooksRef = useRef(null);
  const newReleasesRef = useRef(null);

  /*
  ============================================================
  GET BOOKS
  ============================================================
  */

  const getBook = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/book/getBooks`
      );

      setBooks(response.data);
    } catch (error) {
      console.error("error fetching books : ", error);
    }
  };

  useEffect(() => {
    getBook();
  }, []);

  /*
  ============================================================
  VIEW ALL - POPULAR BOOKS
  ============================================================
  */

  const handlePopularBooksScroll = () => {
    if (popularBooksRef.current) {
      popularBooksRef.current.scrollBy({
        left: 500,
        behavior: "smooth",
      });
    }
  };

  /*
  ============================================================
  VIEW ALL - NEW RELEASES
  ============================================================
  */

  const handleNewReleasesScroll = () => {
    if (newReleasesRef.current) {
      newReleasesRef.current.scrollBy({
        left: 500,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      {/* =====================================================
          POPULAR BOOKS
      ===================================================== */}

      <section className="px-20 pt-24">

        <div className="flex justify-between">

          <div className="text-[clamp(10px,5vw,20px)] font-semibold text-text-primary">
            Popular Books
          </div>

          <button
            onClick={handlePopularBooksScroll}
            className="flex items-center gap-2 text-text-secondary cursor-pointer"
          >
            Scroll
            <LuArrowRight />
          </button>

        </div>

        <div
          ref={popularBooksRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
        >
          {books?.map((book, index) => (
            <Cardtwo
              key={index}
              book={book}
            />
          ))}
        </div>

      </section>


      {/* =====================================================
          NEW RELEASES
      ===================================================== */}

      <section className="px-20 pt-9">

        <div className="flex justify-between">

          <div className="text-[clamp(10px,5vw,20px)] font-semibold text-text-primary">
            New Releases
          </div>

          <button
            onClick={handleNewReleasesScroll}
            className="flex items-center gap-2 text-text-secondary cursor-pointer"
          >
            Scroll
            <LuArrowRight />
          </button>

        </div>

        <div
          ref={newReleasesRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
        >
          {books?.map((book, index) => (
            <Cardtwo
              key={index}
              book={book}
            />
          ))}
        </div>

      </section>
    </>
  );
};

export default Discover;