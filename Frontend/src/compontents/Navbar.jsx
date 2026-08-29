import React, { useEffect, useState } from "react";
import { LuSearch, LuX, LuMenu } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_BASE_URL || "http://localhost:5000";

const Navbar = ({ openSidebar }) => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);

  /* =========================================================
      SEARCH BOOKS
  ========================================================= */

  useEffect(() => {
    const query = search.trim();

    if (!query) {
      setBooks([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const response = await axios.get(
          `${API_BASE}/api/book/getBooks`,
          {
            params: {
              search: query,
            },
          }
        );

        setBooks(response.data);
      } catch (error) {
        console.error(error);
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
        fixed
        top-0
        left-0
        right-0
        z-30
        h-20
        border-b
        border-border-light
        bg-background/80
        backdrop-blur-xl
      "
    >
      <div
        className="
          flex
          h-full
          items-center
          gap-4
          px-4
          sm:px-6
          lg:px-8
        "
      >
        {/* Mobile Menu */}

        <button
          onClick={openSidebar}
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-lg
            hover:bg-brand-light
            md:hidden
          "
        >
          <LuMenu size={22} />
        </button>

        {/* Search */}

        <div
          className="
            relative
            mx-auto
            w-full
            max-w-full
            sm:max-w-xl
            lg:max-w-2xl
            xl:max-w-3xl
          "
        >
          {/* Search Bar */}

          <div
            className="
              flex
              h-12
              w-full
              items-center
              gap-3
              rounded-xl
              border
              border-border-light
              bg-background-card
              px-4
              shadow-md
              transition-all
              duration-300
              focus-within:border-brand/40
              focus-within:shadow-lg
            "
          >
            <LuSearch
              size={20}
              className="shrink-0 text-text-secondary"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search books, authors, categories..."
              autoComplete="off"
              className="
                h-full
                min-w-0
                flex-1
                bg-transparent
                text-sm
                outline-none
                placeholder:text-text-secondary
              "
            />

            {search.length > 0 && (
              <button
                onClick={clearSearch}
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-full
                  text-text-secondary
                  transition
                  hover:bg-brand-light
                  hover:text-brand
                "
              >
                <LuX size={18} />
              </button>
            )}
          </div>

          {/* Results */}

          {search.trim() && (
            <div
              className="
                absolute
                left-0
                right-0
                mt-3
                max-h-96
                overflow-y-auto
                rounded-xl
                border
                border-border-light
                bg-background-card
                shadow-xl
                z-50
              "
            >
              {loading && (
                <div className="flex items-center gap-3 px-5 py-4">
                  <LuSearch
                    size={18}
                    className="animate-pulse text-brand"
                  />

                  <span className="text-sm text-text-secondary">
                    Searching...
                  </span>
                </div>
              )}

              {!loading && books.length === 0 && (
                <div className="px-6 py-8 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-light">
                    <LuSearch
                      size={18}
                      className="text-brand"
                    />
                  </div>

                  <p className="text-sm font-medium">
                    No books found
                  </p>

                  <p className="mt-1 text-xs text-text-secondary">
                    Try searching with another keyword.
                  </p>
                </div>
              )}

              {!loading &&
                books.map((book) => (
                  <button
                    key={book._id}
                    onClick={() => handleBookClick(book)}
                    className="
                      flex
                      w-full
                      items-center
                      gap-4
                      border-b
                      border-border-light
                      px-4
                      py-3
                      text-left
                      transition
                      hover:bg-brand-light/40
                      last:border-b-0
                    "
                  >
                    <img
                      src={`https://archive.org/services/img/${book.identifier}`}
                      alt={book.title}
                      className="
                        h-16
                        w-11
                        flex-shrink-0
                        rounded-md
                        object-cover
                        shadow
                      "
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {book.title}
                      </p>

                      <p className="mt-1 truncate text-xs text-text-secondary">
                        {book.author || "Unknown author"}
                      </p>

                      {book.category && (
                        <span
                          className="
                            mt-2
                            inline-block
                            rounded-full
                            bg-brand-light
                            px-2
                            py-1
                            text-[10px]
                            font-medium
                            text-brand
                          "
                        >
                          {book.category}
                        </span>
                      )}
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