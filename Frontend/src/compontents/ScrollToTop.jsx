import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const resetScroll = () => {
      // Browser/window scroll
      window.scrollTo(0, 0);

      // Bookly's actual page scroll container
      const scrollContainer = document.querySelector(
        "main.overflow-y-auto"
      );

      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: 0,
          left: 0,
          behavior: "instant",
        });
      }
    };

    // Run after the new route has rendered
    requestAnimationFrame(resetScroll);
  }, [pathname]);

  return null;
};

export default ScrollToTop;