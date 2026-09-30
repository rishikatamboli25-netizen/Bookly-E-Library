import React from "react";

const CardoneSkeleton = () => {
  return (
    <div
      className="relative flex w-36 sm:w-44 md:w-48 h-64 sm:h-72 md:h-80 mt-2 sm:mt-4 shrink-0 flex-col overflow-hidden rounded-2xl
        border border-white/60 bg-white/50 backdrop-blur-xl
        shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_8px_20px_rgba(124,58,237,0.08)]
        animate-pulse"
    >
      {/* top sheen */}
      <span className="pointer-events-none absolute inset-x-4 top-0 z-10 h-px bg-white/80" />

      {/* Cover */}
      <div className="relative h-[60%] overflow-hidden border-b border-white/50 bg-gray-200/70">
        <div className="absolute inset-0 bg-gray-300/60" />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-2.5 sm:p-3.5">
        <div className="space-y-2">
          <div className="h-3.5 w-[85%] rounded-md bg-gray-300/70 sm:h-4" />
          <div className="h-3.5 w-[65%] rounded-md bg-gray-300/60 sm:h-4" />
        </div>

        <div className="h-3 w-[55%] rounded-md bg-gray-300/60 sm:h-3.5" />
      </div>
    </div>
  );
};

export default CardoneSkeleton;



