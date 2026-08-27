import mongoose from "mongoose";

const Userschema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    goal: {
      type: Number,
      default: null,
    },

    // Reading Progress
    progress: {
      totalReadBooks: {
        type: Number,
        default: 0,
      },

      readBooks: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Book",
        },
      ],

      // Maximum 5 recently read books
      recentReadBooks: [
        {
          book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            required: true,
          },

          pagesRead: {
            type: Number,
            default: 0,
          },

          totalPages: {
            type: Number,
            default: 0,
          },

          lastReadAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },

    // User-created Collections
    collections: [
      {
        name: {
          type: String,
          required: true,
        },

        books: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
          },
        ],
      },
    ],

    // Notes created by user
    notes: [
      {
        book: {
          type: Object,
          ref: "Book",
          required: true,
        },

        page: {
          type: Number,
          required: true,
        },

        text: {
          type: String,
          required: true,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", Userschema);

export default User;