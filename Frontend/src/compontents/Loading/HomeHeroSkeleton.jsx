import React from "react";

const HomeHeroSkeleton = () => {
  return (
    <section className="w-full py-7">
      <div className="relative flex min-h-[50vh] w-full overflow-hidden rounded-3xl border border-border-light bg-background-card animate-pulse">
        {/* Decorative Background */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gray-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gray-200/40 blur-3xl" />

        {/* Left Content */}
        <div className="relative z-10 flex w-full flex-col justify-center px-8 py-12 sm:px-12 lg:w-[70%] lg:px-16">
          {/* Eyebrow */}
          <div className="mb-5 h-3 w-36 rounded-full bg-gray-200" />

          {/* Heading */}
          <div className="max-w-2xl space-y-3">
            <div className="h-10 w-[80%] rounded-lg bg-gray-200 sm:h-12 md:h-14" />
            <div className="h-10 w-[55%] rounded-lg bg-gray-200 sm:h-12 md:h-14" />
          </div>

          {/* Description */}
          <div className="mt-6 max-w-xl space-y-2.5">
            <div className="h-3.5 w-full rounded-full bg-gray-200" />
            <div className="h-3.5 w-[92%] rounded-full bg-gray-200" />
            <div className="h-3.5 w-[70%] rounded-full bg-gray-200" />
          </div>

          {/* CTA */}
          <div className="mt-7 h-12 w-40 rounded-xl bg-gray-200" />
        </div>

        {/* Right Illustration */}
        <div className="relative hidden w-[30%] items-center justify-center lg:flex">
          {/* Decorative Circles */}
          <div className="absolute h-52 w-52 rounded-full border border-gray-200" />
          <div className="absolute h-40 w-40 rounded-full border border-gray-200" />

          {/* Small Floating Book */}
          <div className="absolute right-[12%] top-[20%] rotate-12">
            <div className="h-14 w-10 rounded-r-md rounded-l-sm bg-gray-200 shadow-md" />
          </div>

          {/* Book Stack */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative -mb-1 h-12 w-32 -rotate-6 rounded-md bg-gray-200 shadow-md" />
            <div className="relative z-10 -mb-1 h-14 w-36 rotate-3 rounded-md bg-gray-200 shadow-md" />
            <div className="relative z-20 h-16 w-40 -rotate-2 rounded-md bg-gray-200 shadow-lg" />
          </div>

          {/* Dots */}
          <div className="absolute left-[15%] top-[28%] h-2 w-2 rounded-full bg-gray-200" />
          <div className="absolute bottom-[25%] right-[18%] h-1.5 w-1.5 rounded-full bg-gray-200" />

          {/* Stars */}
          <div className="absolute bottom-[22%] left-[18%] h-4 w-4 rounded bg-gray-200" />
          <div className="absolute right-[20%] top-[25%] h-3 w-3 rounded bg-gray-200" />
        </div>
      </div>
    </section>
  );
};

export default HomeHeroSkeleton;