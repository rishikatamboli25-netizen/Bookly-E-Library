import User from "../models/User.js";
import Book from "../models/Books.js";
import axios from "axios";

export const updateUserGoal = async (req, res) => {
  console.log("Got the request");
  try {
    const userId = req.userId;
    const { goal } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    if (goal === undefined || goal === null) {
      return res.status(400).json({
        message: "Goal is required",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        goal: Number(goal),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "Goal updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating goal: ", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET USER PROFILE
// ==========================================
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    const user = await User.findById(userId).select(
      "username email goal"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user: {
        username: user.username,
        email: user.email,
        goal: user.goal,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


// ==========================================
// UPDATE USER PROFILE
// ==========================================
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const { username, goal } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    // -----------------------------
    // Validate username
    // -----------------------------
    if (
      username === undefined ||
      username === null ||
      !username.trim()
    ) {
      return res.status(400).json({
        message: "Username is required",
      });
    }

    // -----------------------------
    // Validate goal
    // -----------------------------
    if (
      goal === undefined ||
      goal === null ||
      goal === ""
    ) {
      return res.status(400).json({
        message: "Goal is required",
      });
    }

    const numericGoal = Number(goal);

    if (
      Number.isNaN(numericGoal) ||
      numericGoal < 1 ||
      !Number.isInteger(numericGoal)
    ) {
      return res.status(400).json({
        message: "Goal must be a positive whole number",
      });
    }

    // -----------------------------
    // Find user
    // -----------------------------
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // -----------------------------
    // Update user
    // -----------------------------
    user.username = username.trim();
    user.goal = numericGoal;

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",

      user: {
        username: user.username,
        email: user.email,
        goal: user.goal,
      },
    });

  } catch (error) {
    console.error("Error updating user profile:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const addRecentBook = async (req, res) => {
  try {
    const userId = req.userId;
    const { bookId, totalPages, pagesRead } = req.body;

    if (!userId) return res.status(401).json({ message: "User not authenticated" });
    if (!bookId) return res.status(400).json({ message: "Book Id is Required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.progress) {
      user.progress = { recentReadBooks: [] };
    }
    if (!user.progress.recentReadBooks) {
      user.progress.recentReadBooks = [];
    }

    let recentBooks = user.progress.recentReadBooks;
    const incomingBookIdStr = bookId.toString();

    // Find existing subdocument using Mongoose-safe string comparisons
    const existingBook = recentBooks.find((item) => {
      const itemBookIdStr = item.book?._id ? item.book._id.toString() : item.book?.toString();
      return itemBookIdStr === incomingBookIdStr;
    });

    const incomingProgress = Number(pagesRead) || 0;
    const incomingTotalPages = Number(totalPages) || 1;

    if (existingBook) {
      // ==========================================
      // THE ONE-WAY VALVE (Subdocument Update)
      // ==========================================
      const currentSavedProgress = Number(existingBook.pagesRead) || 0;
      
      // Keep absolute highest
      existingBook.pagesRead = Math.max(incomingProgress, currentSavedProgress);
      existingBook.totalPages = incomingTotalPages > 1 ? incomingTotalPages : existingBook.totalPages;
      existingBook.lastReadAt = new Date();

      // Re-order array to bring this book to the front
      user.progress.recentReadBooks = [
        existingBook,
        ...recentBooks.filter((item) => {
          const itemBookIdStr = item.book?._id ? item.book._id.toString() : item.book?.toString();
          return itemBookIdStr !== incomingBookIdStr;
        })
      ];
    } else {
      // New book entry at the top
      user.progress.recentReadBooks.unshift({
        book: bookId,
        pagesRead: incomingProgress,
        totalPages: incomingTotalPages,
        lastReadAt: new Date(),
      });
    }

    // Slice to keep only top 5
    user.progress.recentReadBooks = user.progress.recentReadBooks.slice(0, 5);

    // Save directly through Mongoose
    await user.save();

    res.status(200).json({
      message: "Progress safely updated",
      recentReadBooks: user.progress.recentReadBooks,
    });
  } catch (error) {
    console.error("Error adding book to recent list: ", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getRecentBooks = async (req, res) => {
  console.log("Received request for recent books");

  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    const user = await User.findById(userId).populate(
      "progress.recentReadBooks.book"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const recentBooks = user.progress?.recentReadBooks || [];

    return res.status(200).json({
      recentBooks,
    });
  } catch (error) {
    console.error("Error fetching recent books:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const getUserCollections = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    const user = await User.findById(userId).populate("collections.books");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      collections: user.collections,
    });
  } catch (error) {
    console.error("Error fetching collections:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const createCollection = async (req, res) => {
  try {
    const userId = req.userId;
    const { name } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Collection name is required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const newCollection = {
      name: name.trim(),
      books: [],
    };

    user.collections.push(newCollection);

    await user.save();

    const createdCollection = user.collections[user.collections.length - 1];

    return res.status(201).json({
      message: "Collection created successfully",
      collection: createdCollection,
    });
  } catch (error) {
    console.error("Error creating collection:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const addBookToCollection = async (req, res) => {
  try {
    const userId = req.userId;
    const { collectionId } = req.params;
    const { bookId } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    if (!collectionId || !bookId) {
      return res.status(400).json({
        message: "Collection ID and Book ID are required",
      });
    }

    // Check if book exists
    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Find collection
    const collection = user.collections.id(collectionId);

    if (!collection) {
      return res.status(404).json({
        message: "Collection not found",
      });
    }

    // Prevent duplicate book
    const alreadyExists = collection.books.some(
      (id) => id.toString() === bookId.toString()
    );

    if (alreadyExists) {
      return res.status(400).json({
        message: "Book already exists in this collection",
      });
    }

    // Add book
    collection.books.push(bookId);

    await user.save();

    // Populate books so frontend gets complete book data
    await user.populate({
      path: "collections.books",
      model: "Book",
    });

    const updatedCollection = user.collections.id(collectionId);

    return res.status(200).json({
      message: "Book added to collection successfully",
      collection: updatedCollection,
    });
  } catch (error) {
    console.error("Error adding book to collection:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const createNote = async (req, res) => {
  try {
    console.log("Request :", req.body)
    const { book, page, text, date } = req.body;

    console.log(book);


    // Check required fields
    if (!book || !page || !text) {
      return res.status(400).json({
        message: "Book, page and note text are required",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Add note to user's notes array
    user.notes.push({
      book,
      page,
      text,
      date: date || new Date(),
    });

    await user.save();

    return res.status(201).json({
      message: "Note created successfully",
      note: user.notes[user.notes.length - 1],
    });
  } catch (error) {
    console.error("Create note error:", error);

    return res.status(500).json({
      message: "Failed to create note",
      error: error.message,
    });
  }
};

export const getNotes = async (req, res) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId);

    const notes = user.notes;
    console.log(notes);
    return res.status(200).json(notes);
  } catch (error) {
    console.error("error geting notes: ", error);

    return res.status(500).json({
      message: "internal server error",
    });
  }
};


// ==========================================
// UPDATE NOTE
// ==========================================
export const updateNote = async (req, res) => {
  try {
    const userId = req.userId;
    const { noteId } = req.params;
    const { text, page } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    if (!noteId) {
      return res.status(400).json({
        message: "Note ID is required",
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Note text is required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Find the note inside this user's notes array
    const note = user.notes.id(noteId);

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    // Update note
    note.text = text.trim();

    if (page !== undefined && page !== null && page !== "") {
      note.page = Number(page);
    }

    await user.save();

    return res.status(200).json({
      message: "Note updated successfully",
      note,
    });
  } catch (error) {
    console.error("Error updating note:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


// ==========================================
// DELETE NOTE
// ==========================================
export const deleteNote = async (req, res) => {
  try {
    const userId = req.userId;
    const { noteId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    if (!noteId) {
      return res.status(400).json({
        message: "Note ID is required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Find note
    const note = user.notes.id(noteId);

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    // Remove note
    note.deleteOne();

    await user.save();

    return res.status(200).json({
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting note:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


export const MarkAsRead = async (req, res) => {
  const userId = req.userId;
  const { bookId } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check if book is already marked as read
    const alreadyRead = user.progress.readBooks.includes(bookId);

    if (alreadyRead) {
      return res.status(200).json({
        message: "Book is already marked as read",
      });
    }

    // Increase total read books count
    user.progress.totalReadBooks += 1;

    // Add book identifier to readBooks
    user.progress.readBooks.push(bookId);

    // Save changes to database
    await user.save();

    return res.status(200).json({
      message: "Book marked as read successfully",
      totalReadBooks: user.progress.totalReadBooks,
      readBooks: user.progress.readBooks,
    });
  } catch (error) {
    console.error("Error Marking Read:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const checkReadBooks = async (req, res) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const readBooks = user.progress.readBooks;

    return res.status(200).json({
      data: readBooks,
      message: "Fetched Read Books Successfully",
    });
  } catch (error) {
    console.error("Error Fetching Read Books:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const getUserProgress = async (req, res) => {
  const userId = req.userId;

  console.log(userId);

  try {
    const user = await User.findById(userId).populate(
      "progress.recentReadBooks.book"
    );
    const userProgress = user?.progress;
    const goal = user?.goal;

    console.log(userProgress);

    return res.status(200).json({
      progress: userProgress,
      goal,
    });
  } catch (err) {
    console.error("Error Fetching Progress, Internel Server Error: ", err);
    return res.status(500).json({
      message: "Server Failed to Fetch Progress Data",
    });
  }
};