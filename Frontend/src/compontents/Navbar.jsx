import React, { useEffect, useState } from "react";
import { LuSearch, LuX } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Navbar = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);

  /* =========================================================
     SEARCH BOOKS
  ========================================================= */

  useEffect(() => {
    const trimmedQuery = search.trim();

    // Clear results when search is empty
    if (!trimmedQuery) {
      setBooks([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const response = await axios.get(
          "http://localhost:5000/api/book/getBooks",
          {
            params: {
              search: trimmedQuery,
            },
          }
        );

        setBooks(response.data);
      } catch (error) {
        console.error("Error searching books:", error);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);


  /* =========================================================
     CLEAR SEARCH
  ========================================================= */

  const clearSearch = () => {
    setSearch("");
    setBooks([]);
  };


  /* =========================================================
     OPEN BOOK
  ========================================================= */

  const handleBookClick = (book) => {
    clearSearch();

    navigate(`/book/${book.identifier}`);
  };


  return (
    <nav
      className="
        absolute
        inset-x-0
        top-0
        z-40
        h-[10vh]
        bg-brand/10
        backdrop-blur-lg
      "
    >
      <div className="flex h-full items-center justify-center px-20">

        {/* =====================================================
            SEARCH WRAPPER
        ===================================================== */}

        <div className="relative w-[55%]">

          {/* ===================================================
              SEARCH BAR
          =================================================== */}

          <div
            className="
              flex
              h-[5vh]
              w-full
              items-center
              gap-3
              rounded-xl
              border
              border-border-light
              bg-background-card
              px-5
              shadow-md
              transition-all
              duration-300

              focus-within:border-brand/40
              focus-within:shadow-[0_4px_20px_rgba(124,58,237,0.12)]
            "
          >

            {/* Search Icon */}

            <LuSearch
              size={20}
              className="shrink-0 text-text-secondary"
            />


            {/* Input */}
<input
  type="text"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder="Search books, authors, categories..."
  autoComplete="off"
  className="
    h-[5vh]
    min-w-0
    flex-1
    appearance-none
    bg-transparent
    text-sm
    text-text-primary
    outline-none
    placeholder:text-text-secondary
  "
/>


            {/* Single Clear Button */}

            {search.length > 0 && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  text-text-secondary
                  transition-all
                  duration-200
                  hover:bg-brand-light
                  hover:text-brand
                "
              >
                <LuX size={17} />
              </button>
            )}

          </div>


          {/* ===================================================
              SEARCH RESULTS
          =================================================== */}

          {search.trim() && (
            <div
              className="
                absolute
                left-0
                right-0
                top-[calc(100%+10px)]
                z-50
                max-h-[60vh]
                overflow-y-auto
                rounded-xl
                border
                border-border-light
                bg-background-card
                shadow-[0_12px_40px_rgba(0,0,0,0.12)]
              "
            >

              {/* Loading */}

              {loading && (
                <div className="flex items-center gap-3 px-5 py-4">

                  <LuSearch
                    size={17}
                    className="animate-pulse text-brand"
                  />

                  <span className="text-sm text-text-secondary">
                    Searching...
                  </span>

                </div>
              )}


              {/* No Results */}

              {!loading && books.length === 0 && (
                <div className="px-5 py-7 text-center">

                  <div
                    className="
                      mx-auto
                      mb-2
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-full
                      bg-brand-light
                    "
                  >
                    <LuSearch
                      size={18}
                      className="text-brand"
                    />
                  </div>

                  <p className="text-sm font-medium text-text-primary">
                    No books found
                  </p>

                  <p className="mt-1 text-xs text-text-secondary">
                    Try searching by title, author or category.
                  </p>

                </div>
              )}


              {/* Results */}

              {!loading &&
                books.map((book) => (
                  <button
                    key={book._id}
                    type="button"
                    onClick={() => handleBookClick(book)}
                    className="
                      flex
                      w-full
                      items-center
                      gap-4
                      border-b
                      border-border-light
                      px-5
                      py-3
                      text-left
                      transition-all
                      duration-200
                      last:border-b-0
                      hover:bg-brand-light/40
                    "
                  >

                    {/* Book Cover */}

                    <img
                      src={`https://archive.org/services/img/${book.identifier}`}
                      alt={book.title}
                      className="
                        h-16
                        w-11
                        shrink-0
                        rounded-md
                        bg-gray-100
                        object-cover
                        shadow-sm
                      "
                    />


                    {/* Book Information */}

                    <div className="min-w-0 flex-1">

                      <p
                        className="
                          truncate
                          text-sm
                          font-semibold
                          text-text-primary
                        "
                      >
                        {book.title}
                      </p>


                      <p
                        className="
                          mt-1
                          truncate
                          text-xs
                          text-text-secondary
                        "
                      >
                        {book.author || "Unknown author"}
                      </p>


                      <div className="mt-1 flex items-center gap-2">

                        {book.category && (
                          <span
                            className="
                              rounded-full
                              bg-brand-light
                              px-2
                              py-0.5
                              text-[10px]
                              font-medium
                              text-brand
                            "
                          >
                            {book.category}
                          </span>
                        )}

                      </div>

                    </div>

                  </button>
                ))}

            </div>
          )}

        </div>

      </div>
    </nav>
  );
};

export default Navbar;