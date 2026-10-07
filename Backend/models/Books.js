import mongoose from "mongoose";

// ============================================================
// FILE SCHEMA
// ============================================================

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      default: null,
    },

    contentType: {
      type: String,
      default: null,
    },
  },
  {
    _id: false,
  }
);

// ============================================================
// BOOK SCHEMA
// ============================================================

const bookSchema = new mongoose.Schema(
  {
    // ========================================================
    // IDENTITY
    // ========================================================

    identifier: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    author: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // ========================================================
    // DESCRIPTION / DISCOVERY METADATA
    // ========================================================

    description: {
      type: String,
      default: null,
    },

    coverUrl: {
      type: String,
      default: null,
    },

    category: {
      type: String,
      required: true,
      index: true,
    },

    subjects: {
      type: [String],
      default: [],
      index: true,
    },

    genres: {
      type: [String],
      default: [],
      index: true,
    },

    language: {
      type: String,
      default: null,
      index: true,
    },

    // Original publication year is not currently
    // extracted by the Standard Ebooks seed script.
    year: {
      type: Number,
      default: null,
      index: true,
    },

    // ========================================================
    // STANDARD EBOOKS RELEASE / CATALOG DATA
    // ========================================================

    // First release date of the Standard Ebooks edition.
    releaseDate: {
      type: Date,
      default: null,
      index: true,
    },

    // Popularity position captured when the dataset
    // was generated.
    catalogRank: {
      type: Number,
      default: null,
      index: true,
    },

    // When the popularity rank was captured.
    catalogRankedAt: {
      type: Date,
      default: null,
      index: true,
    },

    // ========================================================
    // BOOK FILES
    // ========================================================

    files: {
      pdf: {
        type: fileSchema,
        default: null,
      },

      epub: {
        type: fileSchema,
        default: null,
      },
    },

    // ========================================================
    // SOURCE
    // ========================================================

    source: {
      name: {
        type: String,
        default: null,
      },

      itemUrl: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// MODEL
// ============================================================

const Book = mongoose.model(
  "Book",
  bookSchema
);

export default Book;