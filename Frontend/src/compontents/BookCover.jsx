import React, { useEffect, useState } from "react";

const getInitials = (title = "Book") => {
  const words = String(title)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "B";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");
};

const BookCover = ({
  book,
  alt,
  className = "h-full w-full object-cover",
  containerClassName = "",
  loading = "lazy",
  sizes,
  priority = false,
}) => {
  const coverUrl = book?.coverUrl || "";
  const [failed, setFailed] = useState(!coverUrl);

  useEffect(() => {
    setFailed(!coverUrl);
  }, [coverUrl]);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-brand-light/60 ${className} ${containerClassName}`}
        aria-label={alt || book?.title || "Book cover"}
      >
        <span className="select-none text-lg font-semibold tracking-tight text-text-secondary/70 sm:text-xl">
          {getInitials(book?.title)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={coverUrl}
      alt={alt || book?.title || "Book Cover"}
      loading={loading}
      decoding="async"
      fetchPriority={priority ? "high" : "low"}
      sizes={sizes}
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export default BookCover;
