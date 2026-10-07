import React from "react";
import { LuRefreshCw, LuWifiOff } from "react-icons/lu";

const RequestError = ({
  message = "We couldn't load this right now.",
  onRetry,
  title = "Couldn't load this",
  compact = false,
}) => {
  return (
    <div
      className={`flex w-full items-center justify-center rounded-2xl border border-border-light bg-background-card text-center shadow-sm ${
        compact
          ? "min-h-[180px] p-5"
          : "min-h-[300px] p-6 sm:p-8"
      }`}
    >
      <div className="flex max-w-md flex-col items-center">
        <div
          className={`mb-4 flex items-center justify-center rounded-full bg-brand-light text-brand ${
            compact ? "h-10 w-10" : "h-12 w-12"
          }`}
        >
          <LuWifiOff
            size={compact ? 17 : 20}
          />
        </div>

        <h2
          className={`font-semibold text-text-primary ${
            compact ? "text-base" : "text-lg sm:text-xl"
          }`}
        >
          {title}
        </h2>

        <p
          className={`mt-2 leading-relaxed text-text-secondary ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {message}
        </p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover active:scale-[0.98]"
          >
            <LuRefreshCw size={15} />
            Try again
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(RequestError);
