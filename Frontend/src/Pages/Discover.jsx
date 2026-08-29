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

      <section className="px-4 sm:px-8 md:px-12 lg:px-20 pt-4 sm:pt-10 md:pt-24 max-w-[1600px] mx-auto">

        <div className="flex items-center justify-between mb-4 sm:mb-6">

          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-text-primary">
            Popular Books
          </h2>

          <button
            onClick={handlePopularBooksScroll}
            className="flex items-center gap-2 text-sm sm:text-base text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            Scroll
            <LuArrowRight className="text-base" />
          </button>

        </div>

        <div
          ref={popularBooksRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide scroll-smooth py-2"
        >
          {books?.map((book, index) => (
            <div key={index} className="shrink-0">
              <Cardtwo book={book} />
            </div>
          ))}
        </div>

      </section>


      {/* =====================================================
          NEW RELEASES
      ===================================================== */}

      {/* Increased top padding/spacing on mobile (pt-16 sm:pt-10 md:pt-16) to push the 2nd container down */}
      <section className="px-4 sm:px-8 md:px-12 lg:px-20 pt-16 sm:pt-10 md:pt-16 mb-20 max-w-[1600px] mx-auto">

        <div className="flex items-center justify-between mb-4 sm:mb-6">

          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-text-primary">
            New Releases
          </h2>

          <button
            onClick={handleNewReleasesScroll}
            className="flex items-center gap-2 text-sm sm:text-base text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            Scroll
            <LuArrowRight className="text-base" />
          </button>

        </div>

        <div
          ref={newReleasesRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide scroll-smooth py-2"
        >
          {books?.map((book, index) => (
            <div key={index} className="shrink-0">
              <Cardtwo book={book} />
            </div>
          ))}
        </div>

      </section>
    </>
  );
};

export default Discover;