import Book from "../models/Books.js";
import axios from "axios";

/* =========================================================
   GET BOOKS
   GET /api/book/getBooks
   GET /api/book/getBooks?search=elf
========================================================= */

export const getBooks = async (req, res) => {
  try {
    const { search } = req.query;

    console.log("\n========== BOOK SEARCH ==========");
    console.log("Query Params:", req.query);

    // No search -> latest books
    if (!search || !search.trim()) {
      const books = await Book.find()
        .sort({ createdAt: -1 })
        .limit(20);

      console.log("No search query. Returning latest books.");
      console.log("=================================\n");

      return res.status(200).json(books);
    }

    // Split into words
    const words = search
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map(word =>
        word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      );

    // Every word must match somewhere
    const matchStage = {
      $and: words.map(word => ({
        $or: [
          { title: { $regex: `\\b${word}`, $options: "i" } },
          { author: { $regex: `\\b${word}`, $options: "i" } },
          { category: { $regex: `\\b${word}`, $options: "i" } },
          { subjects: { $regex: `\\b${word}`, $options: "i" } }
        ]
      }))
    };

    const escapedQuery = search
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const books = await Book.aggregate([
      {
        $match: matchStage
      },

      {
        $addFields: {
          score: {
            $add: [

              // Title starts with query
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$title",
                      regex: `^${escapedQuery}`,
                      options: "i"
                    }
                  },
                  100,
                  0
                ]
              },

              // Title contains query
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$title",
                      regex: escapedQuery,
                      options: "i"
                    }
                  },
                  80,
                  0
                ]
              },

              // Author
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$author",
                      regex: escapedQuery,
                      options: "i"
                    }
                  },
                  60,
                  0
                ]
              },

              // Category
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$category",
                      regex: escapedQuery,
                      options: "i"
                    }
                  },
                  40,
                  0
                ]
              },

              // Subjects
              {
                $cond: [
                  {
                    $anyElementTrue: {
                      $map: {
                        input: "$subjects",
                        as: "subject",
                        in: {
                          $regexMatch: {
                            input: "$$subject",
                            regex: escapedQuery,
                            options: "i"
                          }
                        }
                      }
                    }
                  },
                  20,
                  0
                ]
              }
            ]
          }
        }
      },

      {
        $sort: {
          score: -1,
          title: 1
        }
      },

      {
        $limit: 20
      }
    ]);

    console.log(`Search: ${search}`);
    console.log(`Books Found: ${books.length}`);

    books.forEach(book => {
      console.log(
        `[${book.score}] ${book.title} | ${book.author} | ${book.category}`
      );
    });

    console.log("=================================\n");

    return res.status(200).json(books);

  } catch (error) {
    console.error("Error fetching books:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/* =========================================================
   FIND BOOK
========================================================= */

export const findBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    console.log("Searching:", bookId);

    const book = await Book.findOne({
      identifier: bookId,
    });

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    return res.status(200).json(book);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/* =========================================================
   READ BOOK
========================================================= */

export const getBookForReading = async (req, res) => {
  try {
    const { bookId } = req.params;

    const book = await Book.findOne({
      identifier: bookId,
    });

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    if (book.files?.pdf) {
      return res.status(200).json({
        title: book.title,
        identifier: book.identifier,
        fileUrl: book.files.pdf,
        fileType: "pdf",
        ObjectId: book._id,
      });
    }

    if (book.files?.epub) {
      return res.status(200).json({
        title: book.title,
        identifier: book.identifier,
        fileUrl: book.files.epub,
        fileType: "epub",
        ObjectId: book._id,
      });
    }

    return res.status(404).json({
      message: "No readable file available",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/* =========================================================
   STREAM BOOK
========================================================= */

export const streamBookFile = async (req, res) => {
  try {
    const { bookId } = req.params;

    const book = await Book.findOne({
      identifier: bookId,
    });

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    let fileUrl = null;
    let contentType = null;

    if (book.files?.pdf?.url) {
      fileUrl = book.files.pdf.url;
      contentType = "application/pdf";
    } else if (book.files?.epub?.url) {
      fileUrl = book.files.epub.url;
      contentType = "application/epub+zip";
    }

    if (!fileUrl) {
      return res.status(404).json({
        message: "No readable file available",
      });
    }

    const response = await axios.get(fileUrl, {
      responseType: "stream",
    });

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", "inline");

    response.data.pipe(res);
  } catch (error) {
    console.error(error);

    if (!res.headersSent) {
      return res.status(500).json({
        message: "Unable to stream book",
      });
    }
  }
};