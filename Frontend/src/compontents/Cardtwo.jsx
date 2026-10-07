import React from "react";
import { useNavigate } from "react-router-dom";
import BookCover from "./BookCover";

const Cardtwo = ({ book }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/BookDetail/${book.identifier}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative flex h-64 w-36 shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/50 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_8px_20px_rgba(124,58,237,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-white/80 hover:bg-white/70 hover:shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_16px_32px_rgba(124,58,237,0.16)] mt-2 sm:mt-4 sm:h-72 sm:w-44 md:h-80 md:w-48"
    >
      <span className="pointer-events-none absolute inset-x-4 top-0 z-10 h-px bg-white/80" />

      <div className="relative h-[60%] border-b border-white/50 bg-gray-50 bg-center bg-contain bg-no-repeat transition-transform duration-300 group-hover:scale-[1.02]">
        <BookCover
          book={book}
          alt={book?.title || "Book Cover"}
          loading="lazy"
          sizes="(max-width: 640px) 144px, (max-width: 768px) 176px, 192px"
          className="absolute left-1/2 top-0 h-full -translate-x-1/2 object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between p-2.5 sm:p-3.5">
        <div>
          <div className="line-clamp-2 text-xs font-medium leading-tight text-text-primary sm:text-sm md:text-base">
            {book?.title || "Book Name"}
          </div>

          <div className="mt-1 truncate text-[11px] text-text-secondary sm:text-xs md:text-sm">
            {book?.author || "Author"}
          </div>
        </div>

        <div className="mt-1 truncate text-xs tracking-wide text-brand sm:text-sm">
          ⭐⭐⭐⭐
        </div>
      </div>
    </div>
  );
};

export default Cardtwo;
