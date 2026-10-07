import React from "react";

const PageLoading = () => (
  <main className="flex min-h-dvh w-full items-center justify-center bg-background-main px-4">
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
      <p className="text-sm font-medium text-text-secondary">
        Opening Bookly...
      </p>
    </div>
  </main>
);

export default PageLoading;
