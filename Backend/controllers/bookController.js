import Book from "../models/Books.js";
import axios from "axios";
import { pipeline } from "node:stream/promises";

// ============================================================
// HELPERS
// ============================================================

const escapeRegex = (value) =>
  value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

const cleanQueryString = (
  value,
  maxLength = 250
) => {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
};

// ------------------------------------------------------------
// Normalize a file record.
//
// Current schema:
//
// {
//   name,
//   url,
//   size,
//   contentType
// }
//
// Also supports an older string URL just in case.
// ------------------------------------------------------------

const getFileDescriptor = (file) => {
  if (!file) {
    return null;
  }

  if (typeof file === "string") {
    return {
      name: null,
      url: file,
      size: null,
      contentType: null,
    };
  }

  if (typeof file === "object") {
    return {
      name: file.name || null,
      url: file.url || null,
      size: Number.isFinite(file.size)
        ? file.size
        : null,
      contentType:
        file.contentType || null,
    };
  }

  return null;
};

// ------------------------------------------------------------
// Validate external source URL
// ------------------------------------------------------------

const isHttpUrl = (value) => {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return false;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
};

// ------------------------------------------------------------
// Safe filename for Content-Disposition
// ------------------------------------------------------------

const sanitizeFilename = (value) =>
  String(value || "book")
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    )
    .slice(0, 180);

// ------------------------------------------------------------
// Shared error response helper
// ------------------------------------------------------------

const sendInternalError = (
  res,
  message = "Internal server error"
) => {
  if (res.headersSent) {
    return res.destroy();
  }

  return res
    .status(500)
    .json({
      message,
    });
};

// ============================================================
// GET BOOKS
//
// GET /api/book/getBooks
//
// Supported query params:
//
// search
// category
// subject
// sort
// limit
// page
// ============================================================

export const getBooks = async (
  req,
  res
) => {
  try {
    const rawSearch =
      req.query.search;

    const rawCategory =
      req.query.category;

    const rawSubject =
      req.query.subject;

    const rawSort =
      req.query.sort;

    const requestedLimit =
      Number(req.query.limit);

    const requestedPage =
      Number(req.query.page);

    const limit =
      Number.isFinite(
        requestedLimit
      ) &&
      requestedLimit > 0
        ? Math.min(
            Math.floor(
              requestedLimit
            ),
            100
          )
        : 50;

    const page =
      Number.isFinite(
        requestedPage
      ) &&
      requestedPage > 0
        ? Math.floor(
            requestedPage
          )
        : 1;

    const skip =
      (page - 1) *
      limit;

    const cleanSearch =
      cleanQueryString(
        rawSearch
      );

    const cleanCategory =
      cleanQueryString(
        rawCategory,
        150
      );

    const cleanSubject =
      cleanQueryString(
        rawSubject,
        250
      );

    const cleanSort =
      cleanQueryString(
        rawSort,
        50
      ).toLowerCase() ||
      "recent";

    // ========================================================
    // BASE FILTER
    // ========================================================

    const matchConditions = [];

    // ========================================================
    // CATEGORY
    // ========================================================

    if (
      cleanCategory &&
      cleanCategory.toLowerCase() !==
        "all"
    ) {
      matchConditions.push({
        category: {
          $regex: `^${escapeRegex(
            cleanCategory
          )}$`,
          $options: "i",
        },
      });
    }

    // ========================================================
    // SUBJECT
    // ========================================================

    if (
      cleanSubject &&
      cleanSubject.toLowerCase() !==
        "all"
    ) {
      matchConditions.push({
        subjects: {
          $regex: `^${escapeRegex(
            cleanSubject
          )}$`,
          $options: "i",
        },
      });
    }

    // ========================================================
    // SEARCH
    // ========================================================

    if (cleanSearch) {
      const words =
        cleanSearch
          .toLowerCase()
          .split(/\s+/)
          .map(
            (word) =>
              word.trim()
          )
          .filter(Boolean)
          .map(
            escapeRegex
          );

      // Every search term must exist somewhere
      // in the book metadata.
      matchConditions.push({
        $and: words.map(
          (word) => ({
            $or: [
              {
                title: {
                  $regex: word,
                  $options: "i",
                },
              },

              {
                author: {
                  $regex: word,
                  $options: "i",
                },
              },

              {
                category: {
                  $regex: word,
                  $options: "i",
                },
              },

              {
                subjects: {
                  $regex: word,
                  $options: "i",
                },
              },

              {
                genres: {
                  $regex: word,
                  $options: "i",
                },
              },

              {
                description: {
                  $regex: word,
                  $options: "i",
                },
              },
            ],
          })
        ),
      });
    }

    const matchStage =
      matchConditions.length > 0
        ? {
            $and:
              matchConditions,
          }
        : {};

    // ========================================================
    // SEARCH MODE
    // ========================================================

    if (cleanSearch) {
      const escapedFullQuery =
        escapeRegex(
          cleanSearch
        );

      const pipeline = [
        {
          $match:
            matchStage,
        },

        // ----------------------------------------------------
        // SEARCH RELEVANCE SCORE
        // ----------------------------------------------------

        {
          $addFields: {
            score: {
              $add: [
                // Exact title
                {
                  $cond: [
                    {
                      $regexMatch:
                        {
                          input: {
                            $ifNull:
                              [
                                "$title",
                                "",
                              ],
                          },

                          regex:
                            `^${escapedFullQuery}$`,

                          options:
                            "i",
                        },
                    },

                    150,
                    0,
                  ],
                },

                // Title starts with query
                {
                  $cond: [
                    {
                      $regexMatch:
                        {
                          input: {
                            $ifNull:
                              [
                                "$title",
                                "",
                              ],
                          },

                          regex:
                            `^${escapedFullQuery}`,

                          options:
                            "i",
                        },
                    },

                    100,
                    0,
                  ],
                },

                // Title contains query
                {
                  $cond: [
                    {
                      $regexMatch:
                        {
                          input: {
                            $ifNull:
                              [
                                "$title",
                                "",
                              ],
                          },

                          regex:
                            escapedFullQuery,

                          options:
                            "i",
                        },
                    },

                    70,
                    0,
                  ],
                },

                // Author
                {
                  $cond: [
                    {
                      $regexMatch:
                        {
                          input: {
                            $ifNull:
                              [
                                "$author",
                                "",
                              ],
                          },

                          regex:
                            escapedFullQuery,

                          options:
                            "i",
                        },
                    },

                    55,
                    0,
                  ],
                },

                // Category
                {
                  $cond: [
                    {
                      $regexMatch:
                        {
                          input: {
                            $ifNull:
                              [
                                "$category",
                                "",
                              ],
                          },

                          regex:
                            escapedFullQuery,

                          options:
                            "i",
                        },
                    },

                    35,
                    0,
                  ],
                },

                // Subjects
                {
                  $cond: [
                    {
                      $anyElementTrue:
                        {
                          $map: {
                            input:
                              {
                                $ifNull:
                                  [
                                    "$subjects",
                                    [],
                                  ],
                              },

                            as: "subject",

                            in: {
                              $regexMatch:
                                {
                                  input:
                                    {
                                      $ifNull:
                                        [
                                          "$$subject",
                                          "",
                                        ],
                                    },

                                  regex:
                                    escapedFullQuery,

                                  options:
                                    "i",
                                },
                            },
                          },
                        },
                    },

                    25,
                    0,
                  ],
                },

                // Genres
                {
                  $cond: [
                    {
                      $anyElementTrue:
                        {
                          $map: {
                            input:
                              {
                                $ifNull:
                                  [
                                    "$genres",
                                    [],
                                  ],
                              },

                            as: "genre",

                            in: {
                              $regexMatch:
                                {
                                  input:
                                    {
                                      $ifNull:
                                        [
                                          "$$genre",
                                          "",
                                        ],
                                    },

                                  regex:
                                    escapedFullQuery,

                                  options:
                                    "i",
                                },
                            },
                          },
                        },
                    },

                    20,
                    0,
                  ],
                },

                // Description
                {
                  $cond: [
                    {
                      $regexMatch:
                        {
                          input: {
                            $ifNull:
                              [
                                "$description",
                                "",
                              ],
                          },

                          regex:
                            escapedFullQuery,

                          options:
                            "i",
                        },
                    },

                    10,
                    0,
                  ],
                },
              ],
            },
          },
        },

        // ----------------------------------------------------
        // BEST RESULTS FIRST
        // ----------------------------------------------------

        {
          $sort: {
            score: -1,
            title: 1,
            _id: 1,
          },
        },

        // ----------------------------------------------------
        // PAGINATION
        // ----------------------------------------------------

        {
          $skip: skip,
        },

        {
          $limit: limit,
        },

        // Don't expose internal score
        {
          $project: {
            score: 0,
          },
        },
      ];

      const books =
        await Book.aggregate(
          pipeline
        );

      return res
        .status(200)
        .json(books);
    }

    // ========================================================
    // NON-SEARCH MODE
    // ========================================================

    let sortStage;

    switch (
      cleanSort
    ) {
      // ------------------------------------------------------
      // POPULAR
      // ------------------------------------------------------

      case "popular":
        sortStage = {
          catalogRank: 1,
          title: 1,
          _id: 1,
        };
        break;

      // ------------------------------------------------------
      // NEW / RELEASE
      // ------------------------------------------------------

      case "new":
      case "newest":
      case "recent-release":
        sortStage = {
          releaseDate: -1,
          title: 1,
          _id: 1,
        };
        break;

      // ------------------------------------------------------
      // TITLE
      // ------------------------------------------------------

      case "title":
        sortStage = {
          title: 1,
          _id: 1,
        };
        break;

      // ------------------------------------------------------
      // RECENTLY SEEDED / DEFAULT
      // ------------------------------------------------------

      case "recent":
      default:
        sortStage = {
          createdAt: -1,
          title: 1,
          _id: 1,
        };
        break;
    }

    const books =
      await Book.find(
        matchStage
      )
        .sort(
          sortStage
        )
        .skip(skip)
        .limit(limit)
        .lean();

    return res
      .status(200)
      .json(books);
  } catch (error) {
    console.error(
      "Error fetching books:",
      error
    );

    return sendInternalError(
      res
    );
  }
};

// ============================================================
// GET FILTER METADATA
//
// GET /api/book/filters
// ============================================================

export const getBookFilters =
  async (
    req,
    res
  ) => {
    try {
      const [
        categories,
        subjects,
        genres,
      ] = await Promise.all([
        // ----------------------------------------------------
        // CATEGORIES
        // ----------------------------------------------------

        Book.aggregate([
          {
            $match: {
              category: {
                $nin: [
                  null,
                  "",
                ],
              },
            },
          },

          {
            $group: {
              _id:
                "$category",

              count: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              count: -1,
              _id: 1,
            },
          },

          {
            $project: {
              _id: 0,
              name: "$_id",
              count: 1,
            },
          },
        ]),

        // ----------------------------------------------------
        // SUBJECTS
        // ----------------------------------------------------

        Book.aggregate([
          {
            $unwind:
              "$subjects",
          },

          {
            $match: {
              subjects: {
                $nin: [
                  null,
                  "",
                ],
              },
            },
          },

          {
            $group: {
              _id:
                "$subjects",

              count: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              count: -1,
              _id: 1,
            },
          },

          {
            $limit: 50,
          },

          {
            $project: {
              _id: 0,
              name: "$_id",
              count: 1,
            },
          },
        ]),

        // ----------------------------------------------------
        // GENRES
        // ----------------------------------------------------

        Book.aggregate([
          {
            $unwind:
              "$genres",
          },

          {
            $match: {
              genres: {
                $nin: [
                  null,
                  "",
                ],
              },
            },
          },

          {
            $group: {
              _id:
                "$genres",

              count: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              count: -1,
              _id: 1,
            },
          },

          {
            $limit: 50,
          },

          {
            $project: {
              _id: 0,
              name: "$_id",
              count: 1,
            },
          },
        ]),
      ]);

      return res
        .status(200)
        .json({
          categories,
          subjects,
          genres,
        });
    } catch (error) {
      console.error(
        "Error fetching book filters:",
        error
      );

      return sendInternalError(
        res
      );
    }
  };

// ============================================================
// FIND BOOK
//
// GET /api/book/:bookId
// ============================================================

export const findBook =
  async (
    req,
    res
  ) => {
    try {
      const {
        bookId,
      } = req.params;

      const book =
        await Book.findOne({
          identifier:
            bookId,
        }).lean();

      if (!book) {
        return res
          .status(404)
          .json({
            message:
              "Book not found",
          });
      }

      return res
        .status(200)
        .json(book);
    } catch (error) {
      console.error(
        "Error finding book:",
        error
      );

      return sendInternalError(
        res
      );
    }
  };

// ============================================================
// GET BOOK FOR READING
//
// GET /api/book/:bookId/read
//
// PDF gets priority when available.
// EPUB is the fallback.
// ============================================================

export const getBookForReading =
  async (
    req,
    res
  ) => {
    try {
      const {
        bookId,
      } = req.params;

      const book =
        await Book.findOne({
          identifier:
            bookId,
        }).lean();

      if (!book) {
        return res
          .status(404)
          .json({
            message:
              "Book not found",
          });
      }

      const pdf =
        getFileDescriptor(
          book.files?.pdf
        );

      const epub =
        getFileDescriptor(
          book.files?.epub
        );

      // ======================================================
      // PDF FIRST
      // ======================================================

      if (
        pdf?.url &&
        isHttpUrl(pdf.url)
      ) {
        return res
          .status(200)
          .json({
            title:
              book.title,

            identifier:
              book.identifier,

            fileUrl:
              pdf.url,

            fileType:
              "pdf",

            ObjectId:
              book._id,
          });
      }

      // ======================================================
      // EPUB FALLBACK
      // ======================================================

      if (
        epub?.url &&
        isHttpUrl(epub.url)
      ) {
        return res
          .status(200)
          .json({
            title:
              book.title,

            identifier:
              book.identifier,

            fileUrl:
              epub.url,

            fileType:
              "epub",

            ObjectId:
              book._id,
          });
      }

      return res
        .status(404)
        .json({
          message:
            "No readable file available",
        });
    } catch (error) {
      console.error(
        "Error getting readable book:",
        error
      );

      return sendInternalError(
        res
      );
    }
  };

// ============================================================
// STREAM BOOK FILE
//
// GET /api/book/:bookId/file
// GET /api/book/:bookId/file.epub
//
// /file:
//   PDF first
//   EPUB fallback
//
// /file.epub:
//   EPUB only
// ============================================================

export const streamBookFile =
  async (
    req,
    res
  ) => {
    let upstreamResponse =
      null;

    try {
      const {
        bookId,
      } = req.params;

      // ======================================================
      // DETERMINE REQUESTED FORMAT
      // ======================================================

      const requestedAsEpub =
        req.path.endsWith(
          ".epub"
        );

      const requestedAsPdf =
        req.path.endsWith(
          ".pdf"
        );

      // ======================================================
      // FIND BOOK
      // ======================================================

      const book =
        await Book.findOne({
          identifier:
            bookId,
        }).lean();

      if (!book) {
        return res
          .status(404)
          .json({
            message:
              "Book not found",
          });
      }

      const pdf =
        getFileDescriptor(
          book.files?.pdf
        );

      const epub =
        getFileDescriptor(
          book.files?.epub
        );

      let file = null;
      let contentType = null;
      let extension = null;

      // ======================================================
      // EXPLICIT EPUB REQUEST
      // ======================================================

      if (
        requestedAsEpub
      ) {
        if (
          !epub?.url
        ) {
          return res
            .status(404)
            .json({
              message:
                "EPUB file not available",
            });
        }

        file = epub;

        contentType =
          "application/epub+zip";

        extension =
          "epub";
      }

      // ======================================================
      // EXPLICIT PDF REQUEST
      // ======================================================

      else if (
        requestedAsPdf
      ) {
        if (
          !pdf?.url
        ) {
          return res
            .status(404)
            .json({
              message:
                "PDF file not available",
            });
        }

        file = pdf;

        contentType =
          "application/pdf";

        extension =
          "pdf";
      }

      // ======================================================
      // GENERIC /file REQUEST
      //
      // Preserve Bookly's existing behavior:
      //
      // PDF → EPUB fallback
      // ======================================================

      else if (
        pdf?.url
      ) {
        file = pdf;

        contentType =
          "application/pdf";

        extension =
          "pdf";
      } else if (
        epub?.url
      ) {
        file = epub;

        contentType =
          "application/epub+zip";

        extension =
          "epub";
      }

      // ======================================================
      // NO FILE
      // ======================================================

      if (!file?.url) {
        return res
          .status(404)
          .json({
            message:
              "No readable file available",
          });
      }

      // ======================================================
      // VALIDATE SOURCE URL
      // ======================================================

      if (
        !isHttpUrl(
          file.url
        )
      ) {
        console.error(
          "Invalid book source URL:",
          file.url
        );

        return res
          .status(502)
          .json({
            message:
              "Book source URL is invalid",
          });
      }

      const fileName =
        `${sanitizeFilename(
          book.identifier
        )}.${extension}`;

      // ======================================================
      // FETCH REMOTE SOURCE AS STREAM
      // ======================================================

      upstreamResponse =
        await axios.get(
          file.url,
          {
            responseType:
              "stream",

            timeout:
              30000,

            maxRedirects:
              10,

            decompress:
              true,

            validateStatus:
              (status) =>
                status >=
                  200 &&
                status < 300,

            headers: {
              "User-Agent":
                "Bookly-E-Library/1.0",

              Accept:
                contentType ===
                "application/epub+zip"
                  ? "application/epub+zip,application/octet-stream;q=0.9,*/*;q=0.1"
                  : "application/pdf,application/octet-stream;q=0.9,*/*;q=0.1",

              "Accept-Encoding":
                "gzip, deflate, br",
            },
          }
        );

      // ======================================================
      // VALIDATE UPSTREAM CONTENT TYPE
      // ======================================================

      const upstreamContentType =
        String(
          upstreamResponse
            .headers[
            "content-type"
          ] || ""
        )
          .split(";")[0]
          .trim()
          .toLowerCase();

      const looksLikeHtml =
        upstreamContentType ===
          "text/html" ||
        upstreamContentType ===
          "application/xhtml+xml";

      const looksLikeJson =
        upstreamContentType ===
          "application/json" ||
        upstreamContentType.endsWith(
          "+json"
        );

      if (
        looksLikeHtml ||
        looksLikeJson
      ) {
        console.error(
          "Book source returned unexpected content type:",
          upstreamContentType
        );

        upstreamResponse.data.destroy();

        return res
          .status(502)
          .json({
            message:
              "Book source did not return a readable book file",
          });
      }

      // ======================================================
      // RESPONSE HEADERS
      // ======================================================

      res.status(200);

      res.setHeader(
        "Content-Type",
        contentType
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${fileName}"`
      );

      res.setHeader(
        "X-Content-Type-Options",
        "nosniff"
      );

      // ======================================================
      // CACHE
      // ======================================================
      //
      // Development:
      // Prevent stale browser disk-cache behavior
      // while debugging the reader.
      //
      // Production:
      // Cache the public book file because the source
      // is immutable/public content.
      // ======================================================

      res.setHeader(
        "Cache-Control",
        process.env.NODE_ENV ===
          "production"
          ? "public, max-age=86400, stale-while-revalidate=604800"
          : "no-store"
      );

      // ======================================================
      // CONTENT LENGTH
      // ======================================================

      const contentLength =
        Number(
          upstreamResponse
            .headers[
            "content-length"
          ]
        );

      if (
        Number.isFinite(
          contentLength
        ) &&
        contentLength >=
          0
      ) {
        res.setHeader(
          "Content-Length",
          String(
            contentLength
          )
        );
      }

      // ======================================================
      // LAST MODIFIED
      // ======================================================

      if (
        upstreamResponse
          .headers[
          "last-modified"
        ]
      ) {
        res.setHeader(
          "Last-Modified",
          upstreamResponse
            .headers[
            "last-modified"
          ]
        );
      }

      // ======================================================
      // SAFE STREAMING
      // ======================================================
      //
      // IMPORTANT:
      //
      // We intentionally do NOT do:
      //
      // req.on("close", () => {
      //   response.data.destroy();
      // });
      //
      // pipeline() manages the source/destination stream
      // lifecycle together and propagates stream errors.
      // ======================================================

      await pipeline(
        upstreamResponse.data,
        res
      );
    } catch (error) {
      console.error(
        "Book streaming error:",
        error.response?.status ||
          error.code ||
          error.message
      );

      // Make sure the remote stream isn't left alive
      if (
        upstreamResponse
          ?.data &&
        !upstreamResponse
          .data
          .destroyed
      ) {
        upstreamResponse.data.destroy();
      }

      // If headers were already sent, the response cannot
      // safely be converted into a JSON error response.
      if (
        res.headersSent
      ) {
        return res.destroy(
          error
        );
      }

      // ------------------------------------------------------
      // TIMEOUT
      // ------------------------------------------------------

      if (
        error.code ===
          "ECONNABORTED" ||
        error.code ===
          "ETIMEDOUT"
      ) {
        return res
          .status(504)
          .json({
            message:
              "Book source took too long to respond",
          });
      }

      // ------------------------------------------------------
      // REMOTE SOURCE ERROR
      // ------------------------------------------------------

      if (
        error.response?.status
      ) {
        return res
          .status(502)
          .json({
            message:
              "Unable to fetch the book from its source",
          });
      }

      // ------------------------------------------------------
      // INTERNAL ERROR
      // ------------------------------------------------------

      return res
        .status(500)
        .json({
          message:
            "Unable to stream book",
        });
    }
  };