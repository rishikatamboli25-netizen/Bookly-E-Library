import express from "express";

import {
  getBooks,
  getBookFilters,
  findBook,
  getBookForReading,
  streamBookFile,
} from "../controllers/bookController.js";

const router = express.Router();

// ============================================================
// BOOK DISCOVERY
// ============================================================

router.get(
  "/getBooks",
  getBooks
);

router.get(
  "/filters",
  getBookFilters
);

// ============================================================
// READING
// ============================================================

// Get readable book information
router.get(
  "/:bookId/read",
  getBookForReading
);

// EPUB endpoint
router.get(
  "/:bookId/file.epub",
  streamBookFile
);

// Generic file endpoint
// Used by PDFReader
router.get(
  "/:bookId/file",
  streamBookFile
);

// ============================================================
// BOOK DETAIL
// ============================================================

router.get(
  "/:bookId",
  findBook
);

export default router;