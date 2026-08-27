import { useEffect, useRef } from "react";
import ePub from "epubjs";

const EPUBReader = ({ fileUrl }) => {

  const viewerRef = useRef(null);

  useEffect(() => {

    if (!fileUrl || !viewerRef.current) {
      return;
    }

    const book = ePub(fileUrl);

    const rendition = book.renderTo(
      viewerRef.current,
      {
        width: "100%",
        height: "100%",
        spread: "none",
      }
    );

    rendition.display();

    return () => {
      rendition.destroy();
    };

  }, [fileUrl]);


  return (
    <div className="w-full h-full bg-background-card">

      <div
        ref={viewerRef}
        className="w-full h-full"
      />

    </div>
  );
};

export default EPUBReader;