import React from "react";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error, info) {
    console.error("Bookly render error:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="flex min-h-dvh w-full items-center justify-center bg-background-main px-4">
        <div className="w-full max-w-md rounded-2xl border border-border-light bg-background-card p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-brand">
            <span className="text-lg font-semibold">!</span>
          </div>

          <h1 className="mt-4 text-xl font-semibold text-text-primary">
            Something went wrong
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            Bookly hit an unexpected problem while displaying this page.
            Reloading usually fixes it.
          </p>

          <button
            type="button"
            onClick={this.handleReload}
            className="mt-6 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            Reload Bookly
          </button>
        </div>
      </main>
    );
  }
}

export default AppErrorBoundary;
