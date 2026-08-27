import React from 'react'
import { useNavigate } from 'react-router-dom';

const Cardone = ({ book }) => {
  const coverUrl = `https://archive.org/services/img/${book.identifier}`;

  const navigate = useNavigate();
  const handleClick = () => {
    navigate(`/BookDetail/${book.identifier}`);
  }

  return (
    <div
      onClick={handleClick}
      className="group relative flex flex-col w-[clamp(130px,18vw,200px)] h-[clamp(260px,35vh,340px)] mt-4 overflow-hidden shrink-0 rounded-2xl cursor-pointer
        border border-white/60 bg-white/50 backdrop-blur-xl
        shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_8px_20px_rgba(124,58,237,0.08)]
        transition-all duration-300
        hover:-translate-y-1 hover:bg-white/70 hover:border-white/80
        hover:shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_16px_32px_rgba(124,58,237,0.16)]"
    >
      {/* top sheen — glass rim highlight */}
      <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-white/80 z-10" />

      <div
        className="h-[60%] border-b border-white/50 bg-gray-50 bg-contain bg-no-repeat bg-center transition-transform duration-300 group-hover:scale-[1.02]"
        style={{ backgroundImage: `url(${coverUrl})` }}
      ></div>

      <div className="flex flex-col flex-1 p-3 justify-between">
        <div className="text-[clamp(12px,1vw,16px)] font-medium text-text-primary line-clamp-2 leading-tight">
          {book?.title || "Book Name"}
        </div>

        <div className="text-[clamp(10px,0.9vw,14px)] text-text-secondary truncate">
          {book?.author || "Author"}
        </div>
      </div>
    </div>
  )
}

export default Cardone