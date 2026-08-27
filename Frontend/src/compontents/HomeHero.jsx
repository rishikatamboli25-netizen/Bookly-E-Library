import React from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineArrowRight } from "react-icons/hi";

const HomeHero = () => {
const navigate = useNavigate();

return ( <section className="w-full py-7"> <div className="relative flex min-h-[50vh] w-full overflow-hidden rounded-3xl border border-border-light bg-background-card">
{/* Decorative Background */} <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand/5 blur-3xl" />

    <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-brand/5 blur-3xl" />

    {/* Left Content - 70% */}
    <div className="relative z-10 flex w-full flex-col justify-center px-8 py-12 sm:px-12 lg:w-[70%] lg:px-16">
      {/* Eyebrow */}
      <p className="mb-4 text-xs font-semibold uppercase tracking-[3px] text-brand">
        Your Library Awaits
      </p>

      {/* Heading */}
      <h1 className="max-w-2xl text-[clamp(2rem,4vw,4rem)] font-semibold leading-[1.05] tracking-tight text-text-primary">
        Start building your
        <span className="block text-brand">
          reading journey.
        </span>
      </h1>

      {/* Description */}
      <p className="mt-5 max-w-xl text-sm leading-7 text-text-secondary sm:text-base">
        Discover stories, explore new worlds, and find books that speak
        to you. Your personal library is waiting to be filled with
        something worth reading.
      </p>

      {/* CTA */}
      <button
        onClick={() => navigate("/Discover")}
        className="group mt-7 flex w-fit items-center gap-3 rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-white transition-all hover:gap-4"
      >
        <span>Explore Books</span>

        <HiOutlineArrowRight
          size={19}
          className="transition-transform group-hover:translate-x-1"
        />
      </button>
    </div>

    {/* Right Illustration - 30% */}
    <div className="relative hidden w-[30%] items-center justify-center lg:flex">
      {/* Decorative Circles */}
      <div className="absolute h-52 w-52 rounded-full border border-border-light/70" />

      <div className="absolute h-40 w-40 rounded-full border border-border-light/50" />

      {/* Small Floating Book */}
      <div className="absolute right-[12%] top-[20%] rotate-12">
        <div className="h-14 w-10 rounded-r-md rounded-l-sm border border-border-light bg-background shadow-md">
          <div className="absolute left-1.5 top-3 h-1 w-6 rounded-full bg-brand/40" />
          <div className="absolute left-1.5 top-6 h-1 w-5 rounded-full bg-border-light" />
          <div className="absolute left-1.5 top-9 h-1 w-6 rounded-full bg-border-light" />
        </div>
      </div>

      {/* Book Stack */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Top Book */}
        <div className="relative -mb-1 h-12 w-32 -rotate-6 rounded-md border border-border-light bg-background px-3 shadow-md">
          <div className="flex h-full items-center gap-2">
            <div className="h-7 w-0.5 rounded-full bg-brand" />

            <div>
              <div className="h-1.5 w-16 rounded-full bg-text-primary/20" />
              <div className="mt-1.5 h-1 w-10 rounded-full bg-text-secondary/20" />
            </div>
          </div>
        </div>

        {/* Middle Book */}
        <div className="relative z-10 -mb-1 h-14 w-36 rotate-3 rounded-md border border-border-light bg-background-card px-3 shadow-md">
          <div className="flex h-full items-center gap-2">
            <div className="h-8 w-0.5 rounded-full bg-brand/60" />

            <div>
              <div className="h-1.5 w-20 rounded-full bg-text-primary/20" />
              <div className="mt-1.5 h-1 w-12 rounded-full bg-text-secondary/20" />
            </div>
          </div>
        </div>

        {/* Bottom Book */}
        <div className="relative z-20 h-16 w-40 -rotate-2 rounded-md border border-border-light bg-brand px-4 shadow-lg">
          <div className="flex h-full items-center gap-3">
            <div className="h-9 w-0.5 rounded-full bg-white/50" />

            <div>
              <div className="h-2 w-20 rounded-full bg-white/80" />
              <div className="mt-2 h-1.5 w-12 rounded-full bg-white/40" />
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Dots */}
      <div className="absolute left-[15%] top-[28%] h-2 w-2 rounded-full bg-brand/40" />

      <div className="absolute bottom-[25%] right-[18%] h-1.5 w-1.5 rounded-full bg-brand/60" />

      {/* Decorative Stars */}
      <div className="absolute bottom-[22%] left-[18%] text-lg text-brand/40">
        ✦
      </div>

      <div className="absolute right-[20%] top-[25%] text-sm text-brand/40">
        ✦
      </div>
    </div>
  </div>
</section>

);
};

export default HomeHero;
