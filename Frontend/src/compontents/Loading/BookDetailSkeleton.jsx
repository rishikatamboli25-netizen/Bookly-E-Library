import React from "react";

const BookDetailSkeleton = () => {
  return (
    <div className="w-full px-6 py-6 md:px-12 md:py-8 lg:px-20">
      <div className="mx-auto w-full max-w-6xl animate-pulse">

        {/* Back Button */}
        <div className="mb-6 h-5 w-16 rounded-full bg-gray-200" />

        {/* BOOK HERO */}
        <section className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[240px_1fr] lg:gap-12">

          {/* Book Cover */}
          <div className="flex justify-center lg:justify-start">
            <div className="aspect-[2/3] w-[200px] rounded-xl bg-gray-200 p-2 shadow-md lg:w-[240px]">
              <div className="h-full w-full rounded bg-gray-300" />
            </div>
          </div>

          {/* Book Information */}
          <div className="flex flex-col justify-start pt-2">

            {/* Category */}
            <div className="mb-3 h-3 w-24 rounded-full bg-gray-200" />

            {/* Title */}
            <div className="space-y-3">
              <div className="h-9 w-[85%] rounded-lg bg-gray-200 md:h-10" />
              <div className="h-9 w-[60%] rounded-lg bg-gray-200 md:h-10" />
            </div>

            {/* Author */}
            <div className="mt-5 h-4 w-44 rounded-full bg-gray-200" />

            {/* Rating + Pages */}
            <div className="mt-5 flex items-center gap-4">
              <div className="h-4 w-20 rounded-full bg-gray-200" />
              <div className="h-4 w-px bg-gray-200" />
              <div className="h-4 w-24 rounded-full bg-gray-200" />
            </div>

            {/* Description */}
            <div className="mt-6 max-w-3xl space-y-2">
              <div className="h-3.5 w-full rounded-full bg-gray-200" />
              <div className="h-3.5 w-[95%] rounded-full bg-gray-200" />
              <div className="h-3.5 w-[88%] rounded-full bg-gray-200" />
              <div className="h-3.5 w-[65%] rounded-full bg-gray-200" />
            </div>

            {/* Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="h-11 w-28 rounded-full bg-gray-200" />
              <div className="h-11 w-40 rounded-full bg-gray-200" />
              <div className="h-11 w-32 rounded-full bg-gray-200" />
            </div>
          </div>
        </section>

        {/* BOOK DETAILS */}
        <section className="mt-10 w-full">
          <div className="overflow-hidden rounded-xl border border-border-light bg-background-card">
            <div className="grid grid-cols-2 gap-4 p-5 md:grid-cols-4">

              {/* Author */}
              <div>
                <div className="mb-2 h-3 w-12 rounded-full bg-gray-200" />
                <div className="h-4 w-24 rounded-full bg-gray-200" />
              </div>

              {/* Category */}
              <div>
                <div className="mb-2 h-3 w-16 rounded-full bg-gray-200" />
                <div className="h-4 w-20 rounded-full bg-gray-200" />
              </div>

              {/* Pages */}
              <div>
                <div className="mb-2 h-3 w-12 rounded-full bg-gray-200" />
                <div className="h-4 w-16 rounded-full bg-gray-200" />
              </div>

              {/* Rating */}
              <div>
                <div className="mb-2 h-3 w-14 rounded-full bg-gray-200" />
                <div className="h-4 w-20 rounded-full bg-gray-200" />
              </div>

            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default BookDetailSkeleton;