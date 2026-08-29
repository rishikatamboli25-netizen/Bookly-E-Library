import React, { useState, useEffect } from "react";
import { IoChevronBack } from "react-icons/io5";
import { BiPlus } from "react-icons/bi";
import { FiSearch } from "react-icons/fi";
import { LuMoveVertical, LuArrowRight } from "react-icons/lu";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

// Vite environment variable with localhost fallback
const API_BASE = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

const Collection = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // --------------------------------
  // ADD BOOK MODE
  // --------------------------------
  const isAddBookMode = location.state?.mode === "add-book";
  const bookId = location.state?.bookId;

  // --------------------------------
  // STATES
  // --------------------------------
  const [search, setSearch] = useState("");
  const [collections, setCollections] = useState([]);
  const [bookToAdd, setBookToAdd] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [savingBook, setSavingBook] = useState(false);

  // --------------------------------
  // GET USER TOKEN
  // --------------------------------
  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // --------------------------------
  // BOOK COVER HELPER
  // --------------------------------
  const getBookCover = (book) => {
    if (!book) return "";

    if (book.identifier) {
      return `https://archive.org/services/img/${book.identifier}`;
    }

    return book.cover || "";
  };

  // --------------------------------
  // GET USER COLLECTIONS
  // --------------------------------
  const getCollections = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/users/collections`,
        authConfig
      );

      setCollections(response.data.collections || []);
    } catch (error) {
      console.error(
        "Error fetching collections:",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCollections();
  }, []);

  // --------------------------------
  // GET BOOK TO ADD
  // --------------------------------
  useEffect(() => {
    if (!isAddBookMode || !bookId) {
      return;
    }

    const getBook = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/api/book/${bookId}`
        );

        setBookToAdd(response.data);
      } catch (error) {
        console.error(
          "Error fetching book:",
          error.response?.data || error.message
        );
      }
    };

    getBook();
  }, [isAddBookMode, bookId]);

  // --------------------------------
  // FILTER COLLECTIONS
  // --------------------------------
  const filteredCollections = collections.filter((collection) =>
    collection.name.toLowerCase().includes(search.toLowerCase())
  );

  // --------------------------------
  // CREATE NEW COLLECTION
  // --------------------------------
  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      return;
    }

    try {
      setCreatingCollection(true);

      const response = await axios.post(
        `${API_BASE}/api/users/collections`,
        {
          name: newCollectionName.trim(),
        },
        authConfig
      );

      const newCollection = response.data.collection;

      // Add new collection to state
      setCollections((prev) => [...prev, newCollection]);

      // Close create modal
      setShowCreateCollection(false);

      // Clear input
      setNewCollectionName("");

      // If we are adding a book, automatically open the newly created collection
      if (isAddBookMode) {
        setSelectedCollection(newCollection);
      }
    } catch (error) {
      console.error(
        "Error creating collection:",
        error.response?.data || error.message
      );

      alert(error.response?.data?.message || "Failed to create collection");
    } finally {
      setCreatingCollection(false);
    }
  };

  // --------------------------------
  // SELECT EXISTING COLLECTION
  // --------------------------------
  const handleSelectCollection = (collection) => {
    setSelectedCollection(collection);
  };

  // --------------------------------
  // SAVE BOOK TO SELECTED COLLECTION
  // --------------------------------
  const handleSaveBook = async () => {
    if (!selectedCollection || !bookToAdd) {
      return;
    }

    try {
      setSavingBook(true);

      const response = await axios.put(
        `${API_BASE}/api/users/collections/${selectedCollection._id}/books`,
        {
          bookId: bookToAdd._id,
        },
        authConfig
      );

      // Get updated collection from backend
      const updatedCollection = response.data.collection;

      // Update selected collection
      setSelectedCollection(updatedCollection);

      // Update collection in main state
      setCollections((prev) =>
        prev.map((collection) =>
          collection._id === updatedCollection._id
            ? updatedCollection
            : collection
        )
      );

      // Book successfully saved
      alert("Book added to collection successfully!");

      // Go back to normal collection page
      navigate("/collection", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Error adding book to collection:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message || "Failed to add book to collection"
      );
    } finally {
      setSavingBook(false);
    }
  };

  // Reusable Create Collection Modal
  const renderCreateModal = () => {
    if (!showCreateCollection) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
        <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border-light bg-background-card p-5 sm:p-6 shadow-xl">
          {/* Modal Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-text-primary">
              Create New Collection
            </h2>

            <button
              onClick={() => {
                setShowCreateCollection(false);
                setNewCollectionName("");
              }}
              className="text-2xl text-text-secondary hover:text-text-primary"
            >
              ×
            </button>
          </div>

          {/* Input */}
          <input
            type="text"
            placeholder="Enter collection name"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCreateCollection();
              }
            }}
            autoFocus
            className="mt-6 w-full rounded-lg border border-border-light bg-white px-4 py-3 text-sm text-text-primary outline-none focus:border-[#7C3AED]"
          />

          {/* Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              onClick={() => {
                setShowCreateCollection(false);
                setNewCollectionName("");
              }}
              className="w-full sm:w-auto rounded-lg border border-border-light px-5 py-2.5 text-sm font-medium text-text-primary hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              onClick={handleCreateCollection}
              disabled={creatingCollection || !newCollectionName.trim()}
              className="w-full sm:w-auto rounded-lg bg-[#7C3AED] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingCollection ? "Creating..." : "Create Collection"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --------------------------------
  // ADD BOOK MODE - SELECT / CREATE COLLECTION
  // --------------------------------
  if (isAddBookMode && !selectedCollection) {
    return (
      <>
        <section className="min-h-screen px-4 sm:px-7 py-5 sm:py-7">
          {/* Header */}
          <div className="flex items-center gap-2 text-lg sm:text-2xl font-semibold text-text-primary">
            <IoChevronBack
              className="cursor-pointer"
              onClick={() => navigate(-1)}
            />
            <span>Add to Collection</span>
          </div>

          {/* Book Information */}
          {bookToAdd && (
            <div className="mt-6 sm:mt-10 flex items-center gap-4 sm:gap-5 rounded-xl border border-border-light bg-background-card p-4 sm:p-5">
              <img
                src={getBookCover(bookToAdd)}
                alt={bookToAdd.title}
                className="h-20 w-14 sm:h-24 sm:w-16 rounded-md object-cover shrink-0"
              />

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base sm:text-lg font-semibold text-text-primary">
                  {bookToAdd.title}
                </h2>

                <p className="mt-1 truncate text-xs sm:text-sm text-text-secondary">
                  {bookToAdd.author}
                </p>
              </div>
            </div>
          )}

          {/* Heading */}
          <div className="mt-8 sm:mt-10">
            <h2 className="text-lg sm:text-xl font-semibold text-text-primary">
              Choose a collection
            </h2>

            <p className="mt-1 text-xs sm:text-sm text-text-secondary">
              Select where you want to save this book.
            </p>
          </div>

          {/* Collections Grid */}
          <div className="mt-6 sm:mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {loading ? (
              <p className="text-sm text-text-secondary">
                Loading collections...
              </p>
            ) : collections.length > 0 ? (
              collections.map((collection) => (
                <div
                  key={collection._id}
                  onClick={() => handleSelectCollection(collection)}
                  className="cursor-pointer rounded-xl border border-border-light bg-background-card p-4 sm:p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                      <h3 className="truncate font-semibold text-text-primary">
                        {collection.name}
                      </h3>

                      <p className="mt-1 text-xs sm:text-sm text-text-secondary">
                        {collection.books.length}{" "}
                        {collection.books.length === 1 ? "Book" : "Books"}
                      </p>
                    </div>

                    <LuArrowRight className="text-text-secondary shrink-0" size={20} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-secondary col-span-full">
                You don't have any collections yet.
              </p>
            )}
          </div>

          {/* Create New Collection Button */}
          <button
            onClick={() => setShowCreateCollection(true)}
            className="mt-6 sm:mt-8 flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-border-light px-5 py-3 text-sm font-medium text-text-primary transition hover:bg-brand-light"
          >
            <BiPlus size={20} />
            Create New Collection
          </button>
        </section>

        {renderCreateModal()}
      </>
    );
  }

  // --------------------------------
  // COLLECTION DETAIL VIEW
  // --------------------------------
  if (selectedCollection) {
    return (
      <section className="relative min-h-screen px-4 sm:px-7 py-5 sm:py-7 pb-36 sm:pb-32">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div
            onClick={() => setSelectedCollection(null)}
            className="flex cursor-pointer items-center gap-2 text-lg sm:text-2xl font-semibold text-text-primary truncate"
          >
            <IoChevronBack className="shrink-0" />
            <span className="truncate">{selectedCollection.name}</span>
          </div>

          <span className="shrink-0 text-xs sm:text-sm text-text-secondary">
            {selectedCollection.books.length}{" "}
            {selectedCollection.books.length === 1 ? "Book" : "Books"}
          </span>
        </div>

        {/* Books List */}
        <div className="mt-6 sm:mt-10 flex flex-col gap-4">
          {selectedCollection.books.length > 0 ? (
            selectedCollection.books.map((book) => (
              <div
                key={book._id}
                className="flex items-center gap-3 sm:gap-5 rounded-xl border border-border-light bg-white p-3 sm:p-4 transition-all duration-300 hover:shadow-md"
              >
                {/* Book Cover */}
                <div className="h-20 w-14 sm:h-24 sm:w-16 shrink-0 overflow-hidden rounded-md">
                  <img
                    src={getBookCover(book)}
                    alt={book.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Book Information */}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm sm:text-base font-semibold text-text-primary">
                    {book.title}
                  </h3>

                  <p className="mt-1 truncate text-xs sm:text-sm text-text-secondary">
                    {book.author}
                  </p>
                </div>

                {/* Read Button */}
                <button className="flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-lg bg-[#7C3AED] px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white transition hover:bg-[#6D28D9]">
                  Read
                  <LuArrowRight size={16} />
                </button>
              </div>
            ))
          ) : (
            <div className="flex min-h-[250px] items-center justify-center text-sm text-text-secondary">
              No books in this collection yet.
            </div>
          )}
        </div>

        {/* -------------------------------- */}
        {/* ADD BOOK SAVE STRIP */}
        {/* -------------------------------- */}
        {isAddBookMode && bookToAdd && (
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-light bg-background-card px-4 sm:px-7 py-3 sm:py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            <div className="mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-5 max-w-5xl">
              {/* Book Preview */}
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <img
                  src={getBookCover(bookToAdd)}
                  alt={bookToAdd.title}
                  className="h-12 w-9 sm:h-14 sm:w-10 shrink-0 rounded-md object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] sm:text-xs text-text-secondary">
                    Save this book to
                  </p>

                  <h3 className="truncate text-xs sm:text-sm font-semibold text-text-primary">
                    {selectedCollection.name}
                  </h3>

                  <p className="truncate text-[11px] sm:text-xs text-text-secondary">
                    {bookToAdd.title}
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveBook}
                disabled={savingBook}
                className="w-full sm:w-auto shrink-0 rounded-lg bg-[#7C3AED] px-6 py-2.5 sm:py-3 text-sm font-semibold text-white transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingBook ? "Saving..." : "Save Here"}
              </button>
            </div>
          </div>
        )}
      </section>
    );
  }

  // --------------------------------
  // MAIN COLLECTION OVERVIEW
  // --------------------------------
  return (
    <section className="min-h-screen px-4 sm:px-7 py-5 sm:py-7">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-lg sm:text-2xl font-semibold text-text-primary">
          <IoChevronBack
            className="cursor-pointer shrink-0"
            onClick={() => navigate(-1)}
          />
          <span>Collection</span>
        </div>

        <button
          onClick={() => setShowCreateCollection(true)}
          className="flex shrink-0 items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-[#7C3AED] px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white transition hover:bg-[#6D28D9]"
        >
          <BiPlus className="text-base sm:text-xl" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="mt-6 sm:mt-8 flex w-full max-w-md items-center gap-3 rounded-lg border border-border-light bg-white px-4 py-3">
        <FiSearch className="text-text-secondary shrink-0" />

        <input
          type="text"
          placeholder="Search collections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
        />
      </div>

      {/* Collection Grid */}
      <div className="mt-8 sm:mt-10">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center text-text-secondary">
            Loading collections...
          </div>
        ) : filteredCollections.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredCollections.map((collection) => (
              <div
                key={collection._id}
                onClick={() => setSelectedCollection(collection)}
                className="group cursor-pointer overflow-hidden rounded-xl border border-border-light bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between"
              >
                {/* Book Preview */}
                <div className="relative flex h-44 sm:h-52 items-end justify-center overflow-hidden bg-[#F3F4F6] px-4 pt-4">
                  {collection.books.length > 0 ? (
                    <div className="flex h-full items-end justify-center">
                      {collection.books.slice(0, 4).map((book, index) => (
                        <img
                          key={book._id}
                          src={getBookCover(book)}
                          alt={book.title}
                          className="h-32 w-20 sm:h-40 sm:w-24 rounded-md object-cover shadow-md transition-transform duration-300 group-hover:-translate-y-2"
                          style={{
                            marginLeft: index === 0 ? "0px" : "-24px",
                            zIndex: index,
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-text-secondary">
                      No books yet
                    </div>
                  )}
                </div>

                {/* Collection Info */}
                <div className="flex items-start justify-between p-4 sm:p-5">
                  <div className="min-w-0 flex-1 pr-2">
                    <h3 className="truncate text-base font-semibold text-text-primary">
                      {collection.name}
                    </h3>

                    <p className="mt-1 text-xs sm:text-sm text-text-secondary">
                      {collection.books.length}{" "}
                      {collection.books.length === 1 ? "Book" : "Books"}
                    </p>
                  </div>

                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-full p-2 text-text-secondary transition hover:bg-[#F3F4F6]"
                  >
                    <LuMoveVertical />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center text-center p-4">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F3F4F6]">
              <BiPlus
                size={28}
                className="text-text-secondary cursor-pointer"
                onClick={() => setShowCreateCollection(true)}
              />
            </div>

            <h3 className="text-base sm:text-lg font-semibold text-text-primary">
              No collections found
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-text-secondary">
              Try searching for another collection.
            </p>
          </div>
        )}
      </div>

      {renderCreateModal()}
    </section>
  );
};

export default Collection;