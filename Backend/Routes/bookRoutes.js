import express from "express";

import {
  getBooks,
  findBook,
  getBookForReading,
  streamBookFile,
} from "../controllers/bookController.js";

const router = express.Router();


router.get("/getBooks", getBooks);

router.get("/:bookId/read", getBookForReading);

router.get("/:bookId/file", streamBookFile);

router.get("/:bookId", findBook);

export default router;