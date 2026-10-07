import React, { useCallback, useEffect, useMemo, useState } from "react";
import { IoChevronBack } from "react-icons/io5";
import { BiPlus } from "react-icons/bi";
import { FiSearch } from "react-icons/fi";
import { LuMoveVertical, LuArrowRight, LuX } from "react-icons/lu";
import { useLocation, useNavigate } from "react-router-dom";

import BookCover from "../compontents/BookCover";
import {
  api,
  getFriendlyError,
} from "../utils/api";
import {
  getCachedUserData,
  updateCachedUserData,
  clearCachedUserData,
} from "../utils/userData";

const COLLECTION_RESOURCE = "collections";

const Collection = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isAddBookMode =
    location.state?.mode === "add-book";
  const bookId = location.state?.bookId;

  const [search, setSearch] = useState("");
  const [collections, setCollections] = useState([]);
  const [bookToAdd, setBookToAdd] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [savingBook, setSavingBook] = useState(false);
  const [bookLoading, setBookLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [bookErrorMessage, setBookErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const token = localStorage.getItem("token");

  const loadCollections = useCallback(
    async (force = false) => {
      const currentToken = localStorage.getItem("token");

      if (!currentToken) {
        setCollections([]);
        setLoading(false);
        setErrorMessage("Please sign in to manage your collections.");
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        const data = await getCachedUserData({
          token: currentToken,
          resource: COLLECTION_RESOURCE,
          force,
          ttl: 2 * 60 * 1000,
          fetcher: async () => {
            const response = await api.get(
              "/api/users/collections",
              {
                headers: {
                  Authorization: `Bearer ${currentToken}`,
                },
              }
            );

            return Array.isArray(response.data?.collections)
              ? response.data.collections
              : [];
          },
        });

        setCollections(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error?.message === "AUTH_REQUIRED") {
          setCollections([]);
          setErrorMessage("Please sign in to manage your collections.");
        } else {
          setCollections([]);
          setErrorMessage(
            getFriendlyError(
              error,
              "We couldn't load your collections right now."
            )
          );
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  useEffect(() => {
    let cancelled = false;

    const loadBookToAdd = async () => {
      if (!isAddBookMode || !bookId) {
        setBookToAdd(null);
        setBookErrorMessage("");
        return;
      }

      setBookLoading(true);
      setBookErrorMessage("");

      try {
        const response = await api.get(
          `/api/book/${encodeURIComponent(bookId)}`
        );

        if (!cancelled) {
          setBookToAdd(response.data || null);
        }
      } catch (error) {
        if (!cancelled) {
          setBookToAdd(null);
          setBookErrorMessage(
            getFriendlyError(
              error,
              "We couldn't load that book right now."
            )
          );
        }
      } finally {
        if (!cancelled) {
          setBookLoading(false);
        }
      }
    };

    loadBookToAdd();

    return () => {
      cancelled = true;
    };
  }, [isAddBookMode, bookId]);

  const filteredCollections = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return collections;
    }

    return collections.filter((collection) =>
      String(collection?.name || "")
        .toLowerCase()
        .includes(query)
    );
  }, [collections, search]);

  const handleCreateCollection = async () => {
    const name = newCollectionName.trim();

    if (!name || creatingCollection) {
      return;
    }

    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
      setActionMessage("Please sign in to create a collection.");
      return;
    }

    setCreatingCollection(true);
    setActionMessage("");

    try {
      const response = await api.post(
        "/api/users/collections",
        { name },
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      const newCollection = response.data?.collection;

      if (!newCollection) {
        throw new Error("COLLECTION_CREATE_FAILED");
      }

      setCollections((previous) => {
        const next = [...previous, newCollection];
        updateCachedUserData({
          token: currentToken,
          resource: COLLECTION_RESOURCE,
          data: next,
        });
        return next;
      });

      setShowCreateCollection(false);
      setNewCollectionName("");
      setActionMessage("Collection created successfully.");

      if (isAddBookMode) {
        setSelectedCollection(newCollection);
      }
    } catch (error) {
      setActionMessage(
        error?.message === "COLLECTION_CREATE_FAILED"
          ? "We couldn't create that collection. Please try again."
          : getFriendlyError(
              error,
              "We couldn't create that collection. Please try again."
            )
      );
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleSelectCollection = (collection) => {
    setSelectedCollection(collection);
    setActionMessage("");
  };

  const handleSaveBook = async () => {
    if (!selectedCollection || !bookToAdd || savingBook) {
      return;
    }

    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
      setActionMessage("Please sign in to save books to collections.");
      return;
    }

    setSavingBook(true);
    setActionMessage("");

    try {
      const response = await api.put(
        `/api/users/collections/${selectedCollection._id}/books`,
        {
          bookId: bookToAdd._id,
        },
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      const updatedCollection = response.data?.collection;

      if (!updatedCollection) {
        throw new Error("COLLECTION_UPDATE_FAILED");
      }

      setSelectedCollection(updatedCollection);

      setCollections((previous) => {
        const next = previous.map((collection) =>
          collection._id === updatedCollection._id
            ? updatedCollection
            : collection
        );

        updateCachedUserData({
          token: currentToken,
          resource: COLLECTION_RESOURCE,
          data: next,
        });

        return next;
      });

      setActionMessage("Book added to collection successfully.");

      navigate("/collection", { replace: true });
    } catch (error) {
      setActionMessage(
        error?.message === "COLLECTION_UPDATE_FAILED"
          ? "We couldn't save the book to that collection. Please try again."
          : getFriendlyError(
              error,
              "We couldn't save the book to that collection."
            )
      );
    } finally {
      setSavingBook(false);
    }
  };

  const retryCollections = async () => {
    const currentToken = localStorage.getItem("token");

    if (currentToken) {
      clearCachedUserData({
        token: currentToken,
        resource: COLLECTION_RESOURCE,
      });
    }

    await loadCollections(true);
  };

  const renderCreateModal = () => {
    if (!showCreateCollection) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
        <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border-light bg-background-card p-5 shadow-xl sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary sm:text-xl">
              Create New Collection
            </h2>

            <button
              type="button"
              onClick={() => {
                setShowCreateCollection(false);
                setNewCollectionName("");
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition hover:bg-brand-light hover:text-text-primary"
              aria-label="Close"
            >
              <LuX size={20} />
            </button>
          </div>

          <input
            type="text"
            placeholder="Enter collection name"
            value={newCollectionName}
            onChange={(event) =>
              setNewCollectionName(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleCreateCollection();
              }
            }}
            autoFocus
            className="mt-6 w-full rounded-lg border border-border-light bg-white px-4 py-3 text-sm text-text-primary outline-none focus:border-brand"
          />

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setShowCreateCollection(false);
                setNewCollectionName("");
              }}
              className="w-full rounded-lg border border-border-light px-5 py-2.5 text-sm font-medium text-text-primary transition hover:bg-gray-50 sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleCreateCollection}
              disabled={
                creatingCollection || !newCollectionName.trim()
              }
              className="w-full rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {creatingCollection ? "Creating..." : "Create Collection"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isAddBookMode && !selectedCollection) {
    return (
      <>
        <section className="min-h-screen px-4 py-5 sm:px-7 sm:py-7">
          <div className="flex items-center gap-2 text-lg font-semibold text-text-primary sm:text-2xl">
            <IoChevronBack
              className="cursor-pointer"
              onClick={() => navigate(-1)}
            />
            <span>Add to Collection</span>
          </div>

          {bookLoading ? (
            <div className="mt-6 flex min-h-[120px] items-center justify-center rounded-xl border border-border-light bg-background-card text-sm text-text-secondary sm:mt-10">
              Loading book details...
            </div>
          ) : bookErrorMessage ? (
            <div className="mt-6 rounded-xl border border-border-light bg-background-card p-5 sm:mt-10">
              <p className="text-sm leading-6 text-text-secondary">
                {bookErrorMessage}
              </p>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mt-4 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white"
              >
                Go Back
              </button>
            </div>
          ) : (
            <>
              {bookToAdd && (
                <div className="mt-6 flex items-center gap-4 rounded-xl border border-border-light bg-background-card p-4 sm:mt-10 sm:gap-5 sm:p-5">
                  <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md sm:h-24 sm:w-16">
                    <BookCover
                      book={bookToAdd}
                      alt={bookToAdd.title}
                      loading="eager"
                      priority
                      sizes="64px"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold text-text-primary sm:text-lg">
                      {bookToAdd.title}
                    </h2>
                    <p className="mt-1 truncate text-xs text-text-secondary sm:text-sm">
                      {bookToAdd.author}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-8 sm:mt-10">
                <h2 className="text-lg font-semibold text-text-primary sm:text-xl">
                  Choose a collection
                </h2>
                <p className="mt-1 text-xs text-text-secondary sm:text-sm">
                  Select where you want to save this book.
                </p>
              </div>

              {errorMessage ? (
                <div className="mt-5 rounded-xl border border-border-light bg-background-card p-5">
                  <p className="text-sm leading-6 text-text-secondary">
                    {errorMessage}
                  </p>
                  <button
                    type="button"
                    onClick={retryCollections}
                    className="mt-4 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-7 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                  {loading ? (
                    <div className="col-span-full flex min-h-[180px] items-center justify-center text-sm text-text-secondary">
                      Loading collections...
                    </div>
                  ) : collections.length > 0 ? (
                    collections.map((collection) => (
                      <button
                        type="button"
                        key={collection._id}
                        onClick={() => handleSelectCollection(collection)}
                        className="rounded-xl border border-border-light bg-background-card p-4 text-left transition-all hover:-translate-y-1 hover:shadow-lg sm:p-5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1 pr-2">
                            <h3 className="truncate font-semibold text-text-primary">
                              {collection.name}
                            </h3>
                            <p className="mt-1 text-xs text-text-secondary sm:text-sm">
                              {collection.books?.length || 0}{" "}
                              {(collection.books?.length || 0) === 1
                                ? "Book"
                                : "Books"}
                            </p>
                          </div>
                          <LuArrowRight
                            className="shrink-0 text-text-secondary"
                            size={20}
                          />
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="col-span-full text-sm text-text-secondary">
                      You don't have any collections yet.
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowCreateCollection(true)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-border-light px-5 py-3 text-sm font-medium text-text-primary transition hover:bg-brand-light sm:mt-8 sm:w-auto"
              >
                <BiPlus size={20} />
                Create New Collection
              </button>

              {actionMessage && (
                <p className="mt-4 text-sm text-text-secondary">
                  {actionMessage}
                </p>
              )}
            </>
          )}
        </section>
        {renderCreateModal()}
      </>
    );
  }

  if (selectedCollection) {
    const selectedBooks = Array.isArray(selectedCollection.books)
      ? selectedCollection.books
      : [];

    return (
      <section className="relative min-h-screen px-4 py-5 pb-36 sm:px-7 sm:py-7 sm:pb-32">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedCollection(null)}
            className="flex min-w-0 items-center gap-2 text-left text-lg font-semibold text-text-primary sm:text-2xl"
          >
            <IoChevronBack className="shrink-0" />
            <span className="truncate">{selectedCollection.name}</span>
          </button>

          <span className="shrink-0 text-xs text-text-secondary sm:text-sm">
            {selectedBooks.length}{" "}
            {selectedBooks.length === 1 ? "Book" : "Books"}
          </span>
        </div>

        {actionMessage && (
          <div className="mt-4 rounded-xl border border-border-light bg-background-card px-4 py-3 text-sm text-text-secondary">
            {actionMessage}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-4 sm:mt-10">
          {selectedBooks.length > 0 ? (
            selectedBooks.map((book) => (
              <div
                key={book._id || book.identifier}
                className="flex items-center gap-3 rounded-xl border border-border-light bg-white p-3 transition-all duration-300 hover:shadow-md sm:gap-5 sm:p-4"
              >
                <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md sm:h-24 sm:w-16">
                  <BookCover
                    book={book}
                    alt={book.title}
                    loading="lazy"
                    sizes="64px"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-text-primary sm:text-base">
                    {book.title}
                  </h3>
                  <p className="mt-1 truncate text-xs text-text-secondary sm:text-sm">
                    {book.author}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(`/reader/${book.identifier}`)
                  }
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
                >
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

        {isAddBookMode && bookToAdd && (
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-light bg-background-card px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:left-64 sm:px-7 sm:py-4">
            <div className="mx-auto flex max-w-5xl flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center sm:gap-5">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <div className="h-12 w-9 shrink-0 overflow-hidden rounded-md sm:h-14 sm:w-10">
                  <BookCover
                    book={bookToAdd}
                    alt={bookToAdd.title}
                    loading="eager"
                    priority
                    sizes="40px"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-text-secondary sm:text-xs">
                    Save this book to
                  </p>
                  <h3 className="truncate text-xs font-semibold text-text-primary sm:text-sm">
                    {selectedCollection.name}
                  </h3>
                  <p className="truncate text-[11px] text-text-secondary sm:text-xs">
                    {bookToAdd.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveBook}
                disabled={savingBook}
                className="w-full shrink-0 rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-3"
              >
                {savingBook ? "Saving..." : "Save Here"}
              </button>
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="min-h-screen px-4 py-5 sm:px-7 sm:py-7">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-lg font-semibold text-text-primary sm:text-2xl">
          <IoChevronBack
            className="shrink-0 cursor-pointer"
            onClick={() => navigate(-1)}
          />
          <span>Collection</span>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateCollection(true)}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-xs font-medium text-white transition hover:opacity-90 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
        >
          <BiPlus className="text-base sm:text-xl" />
          <span>New Collection</span>
        </button>
      </div>

      <div className="mt-6 flex w-full max-w-md items-center gap-3 rounded-lg border border-border-light bg-white px-4 py-3 sm:mt-8">
        <FiSearch className="shrink-0 text-text-secondary" />
        <input
          type="text"
          placeholder="Search collections..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
        />
      </div>

      {actionMessage && (
        <div className="mt-4 max-w-2xl rounded-xl border border-border-light bg-background-card px-4 py-3 text-sm text-text-secondary">
          {actionMessage}
        </div>
      )}

      <div className="mt-8 sm:mt-10">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-border-light bg-background-card text-text-secondary">
            Loading collections...
          </div>
        ) : errorMessage ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-border-light bg-background-card px-6 text-center">
            <h2 className="text-lg font-semibold text-text-primary">
              We couldn't load your collections
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={retryCollections}
              className="mt-5 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Try Again
            </button>
          </div>
        ) : filteredCollections.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCollections.map((collection) => {
              const books = Array.isArray(collection.books)
                ? collection.books
                : [];

              return (
                <div
                  key={collection._id}
                  onClick={() => handleSelectCollection(collection)}
                  className="group flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-border-light bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative flex h-44 items-end justify-center overflow-hidden bg-[#F3F4F6] px-4 pt-4 sm:h-52">
                    {books.length > 0 ? (
                      <div className="flex h-full items-end justify-center">
                        {books.slice(0, 4).map((book, index) => (
                          <div
                            key={book._id || book.identifier || index}
                            className="h-32 w-20 overflow-hidden rounded-md shadow-md transition-transform duration-300 group-hover:-translate-y-2 sm:h-40 sm:w-24"
                            style={{
                              marginLeft:
                                index === 0 ? "0px" : "-24px",
                              zIndex: index,
                            }}
                          >
                            <BookCover
                              book={book}
                              alt={book.title}
                              loading="lazy"
                              sizes="96px"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-text-secondary">
                        No books yet
                      </div>
                    )}
                  </div>

                  <div className="flex items-start justify-between p-4 sm:p-5">
                    <div className="min-w-0 flex-1 pr-2">
                      <h3 className="truncate text-base font-semibold text-text-primary">
                        {collection.name}
                      </h3>
                      <p className="mt-1 text-xs text-text-secondary sm:text-sm">
                        {books.length} {books.length === 1 ? "Book" : "Books"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(event) => event.stopPropagation()}
                      className="rounded-full p-2 text-text-secondary transition hover:bg-[#F3F4F6]"
                      aria-label="Collection options"
                    >
                      <LuMoveVertical />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center p-4 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F3F4F6]">
              <BiPlus
                size={28}
                className="cursor-pointer text-text-secondary"
                onClick={() => setShowCreateCollection(true)}
              />
            </div>

            <h3 className="text-base font-semibold text-text-primary sm:text-lg">
              No collections found
            </h3>
            <p className="mt-2 text-xs text-text-secondary sm:text-sm">
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
