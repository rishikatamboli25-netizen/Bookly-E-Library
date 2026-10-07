import sharp from "sharp";

export const getCoverImage = async (req, res) => {
  try {
    const { identifier } = req.params;

    // Standard Ebooks repository identifiers use:
    // letters, numbers, hyphens and underscores
    if (
      !identifier ||
      !/^[a-zA-Z0-9._-]+$/.test(identifier)
    ) {
      return res.status(400).json({
        message: "Invalid book identifier",
      });
    }

    // ========================================================
    // STANDARD EBOOKS COVER
    // ========================================================

    const imageUrl =
      `https://raw.githubusercontent.com/standardebooks/` +
      `${identifier}/master/src/epub/images/cover.svg`;

    // ========================================================
    // FETCH ORIGINAL SVG
    // ========================================================

    const response = await fetch(imageUrl);

    if (!response.ok) {
      return res.status(response.status).json({
        message: "Failed to fetch cover image",
      });
    }

    // Convert response to Buffer
    const imageBuffer = Buffer.from(
      await response.arrayBuffer()
    );

    // ========================================================
    // CHECK BROWSER SUPPORT
    // ========================================================

    const acceptHeader =
      req.get("Accept") || "";

    const acceptsAvif =
      acceptHeader.includes("image/avif");

    let outputBuffer;
    let contentType;

    // ========================================================
    // AVIF
    // ========================================================

    if (acceptsAvif) {
      outputBuffer = await sharp(imageBuffer)
        .avif({
          quality: 55,
          effort: 4,
        })
        .toBuffer();

      contentType = "image/avif";
    }

    // ========================================================
    // WEBP FALLBACK
    // ========================================================

    else {
      outputBuffer = await sharp(imageBuffer)
        .webp({
          quality: 80,
        })
        .toBuffer();

      contentType = "image/webp";
    }

    // ========================================================
    // CACHE
    // ========================================================

    res.set({
      "Content-Type": contentType,

      "Cache-Control":
        "public, max-age=604800, stale-while-revalidate=86400",

      Vary: "Accept",
    });

    // ========================================================
    // SEND
    // ========================================================

    return res.send(outputBuffer);

  } catch (error) {
    console.error(
      "Cover processing error:",
      error
    );

    return res.status(500).json({
      message: "Failed to process cover image",
    });
  }
};