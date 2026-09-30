import React from "react";
import { useNavigate } from "react-router-dom";

const Cardone = ({ book }) => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const coverUrl = `${BASE_URL}/api/images/cover/${book.identifier}`;

  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/BookDetail/${book.identifier}`);
  };

  const handleImageLoad = (e) => {
    const url = e.currentTarget.currentSrc || e.currentTarget.src;
    const entry = performance.getEntriesByName(url)[0];

    if (entry) {
      const loadTime = entry.responseEnd - entry.startTime;

      console.log(
        `COMPRESSED | ${book.title} | ${loadTime.toFixed(2)} ms | ${(
          entry.transferSize / 1024
        ).toFixed(2)} KB`
      );
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group relative flex flex-col w-36 sm:w-44 md:w-48 h-64 sm:h-72 md:h-80 mt-2 sm:mt-4 overflow-hidden shrink-0 rounded-2xl cursor-pointer
        border border-white/60 bg-white/50 backdrop-blur-xl
        shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_8px_20px_rgba(124,58,237,0.08)]
        transition-all duration-300
        hover:-translate-y-1 hover:bg-white/70 hover:border-white/80
        hover:shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_16px_32px_rgba(124,58,237,0.16)]"
    >
      {/* top sheen — glass rim highlight */}
      <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-white/80 z-10" />

      <div className="h-[60%] relative border-b border-white/50 bg-gray-50 bg-contain bg-no-repeat bg-center transition-transform duration-300 group-hover:scale-[1.02]">
        <img
          loading="lazy"
          onLoad={handleImageLoad}
          src={coverUrl}
          alt={book?.title || "Book Cover"}
          className="absolute h-[100%] left-1/2 -translate-x-1/2 top-0 object-cover"
        />
      </div>

      <div className="flex flex-col flex-1 p-2.5 sm:p-3.5 justify-between">
        <div className="text-xs sm:text-sm md:text-base font-medium text-text-primary line-clamp-2 leading-tight">
          {book?.title || "Book Name"}
        </div>

        <div className="text-[11px] sm:text-xs md:text-sm text-text-secondary truncate mt-1">
          {book?.author || "Author"}
        </div>
      </div>
    </div>
  );
};

export default Cardone;