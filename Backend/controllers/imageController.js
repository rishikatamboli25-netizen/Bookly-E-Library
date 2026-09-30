import sharp from "sharp";

export const getCoverImage = async(req, res) =>{
    try{
        const { identifier } = req.params;

        if (!identifier || !/^[a-zA-Z0-9._-]+$/.test(identifier)) {
            return res.status(400).json({
                message: "Invalid book identifier",
            });
        }

        // Original cover URL from Internet Archive
        const imageUrl = `https://archive.org/services/img/${identifier}`;

        // Fetch original image
        const response = await fetch(imageUrl);

        if(!response.ok){
            returnres.status(response.status).json({
                message: "Failed to fetch cover image",
            });
        }

         // Convert response into a Buffer
         const imageBuffer = Buffer.from(await response.arrayBuffer());

         // Check whether browser supports AVIF
         const acceptsAvif = req.header.accept?.includes("image/avif");

         let outputBuffer;
         let contentType;

         if (acceptsAvif) {
            //convert to AVIF
            outputBuffer = await sharp(imageBuffer)
            .avif({
                quality: 55,
                effort: 4,
            })
            .toBuffer();

            contentType = "image/avif";
         }else{
            // Fallback to WebP
            outputBuffer = await sharp(imageBuffer)
            .webp({
                quality: 80,
            })
            .toBuffer();

            contentType = "image/web";
         }
         // Tell browser how to cache the image
         res.set({
            "Content-type": contentType,
            "Cache-Control":
            "public, max-age=604800, stale-while-revalidate=86400",
           Vary: "Accept",
         });

         //send processed image
         return res.send(outputBuffer);
    }catch (error) {
        console.error("Cover processing error:", error);

    return res.status(500).json({
      message: "Failed to process cover image",
    });
    }
}

