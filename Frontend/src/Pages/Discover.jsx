import React, { useEffect, useRef, useState } from "react";
import Cardtwo from "../compontents/Cardtwo";
import CardtwoSkeleton from "../compontents/Loading/CardtwoSkeleton";
import { LuArrowRight } from "react-icons/lu";
import axios from "axios";
import "../App.css";

// Vite environment variable with localhost fallback
const API_BASE =
  import.meta.env.VITE_BASE_URL || "http://localhost:5000";

const Discover = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

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
      console.error(
        "error fetching books : ",
        error
      );
    } finally {
      setLoading(false);
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

      <section className="mx-auto max-w-[1600px] px-4 pt-4 sm:px-8 sm:pt-10 md:px-12 md:pt-8 lg:px-20">

        <div className="mb-4 flex items-center justify-between sm:mb-6">

          <h2 className="text-lg font-semibold text-text-primary sm:text-xl md:text-2xl">
            Popular Books
          </h2>

          <button
            onClick={handlePopularBooksScroll}
            className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary sm:text-base"
          >
            Scroll
            <LuArrowRight className="text-base" />
          </button>

        </div>

        <div
          ref={popularBooksRef}
          className="scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth py-2 sm:gap-6"
        >
          {loading
            ? Array.from({ length: 6 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="shrink-0"
                  >
                    <CardtwoSkeleton />
                  </div>
                )
              )
            : books?.map((book, index) => (
                <div
                  key={index}
                  className="shrink-0"
                >
                  <Cardtwo book={book} />
                </div>
              ))}
        </div>

      </section>

      {/* =====================================================
          NEW RELEASES
      ===================================================== */}

      <section className="mx-auto mb-20 max-w-[1600px] px-4 pt-16 sm:px-8 sm:pt-10 md:px-12 md:pt-16 lg:px-20">

        <div className="mb-4 flex items-center justify-between sm:mb-6">

          <h2 className="text-lg font-semibold text-text-primary sm:text-xl md:text-2xl">
            New Releases
          </h2>

          <button
            onClick={handleNewReleasesScroll}
            className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary sm:text-base"
          >
            Scroll
            <LuArrowRight className="text-base" />
          </button>

        </div>

        <div
          ref={newReleasesRef}
          className="scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth py-2 sm:gap-6"
        >
          {loading
            ? Array.from({ length: 6 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="shrink-0"
                  >
                    <CardtwoSkeleton />
                  </div>
                )
              )
            : books?.map((book, index) => (
                <div
                  key={index}
                  className="shrink-0"
                >
                  <Cardtwo book={book} />
                </div>
              ))}
        </div>

      </section>
    </>
  );
};

export default Discover;