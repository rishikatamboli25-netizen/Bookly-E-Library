import express from "express";
import { getRecentBooks, updateUserGoal, getUserCollections, createCollection, addBookToCollection,createNote, getNotes, MarkAsRead, checkReadBooks, getUserProgress } from "../controllers/userController.js";
import authMiddleware from "../middelware/authMiddleware.js";
import { addRecentBook } from "../controllers/userController.js";
import {updateNote,deleteNote,} from "../controllers/userController.js";

import {getUserProfile,updateUserProfile} from "../controllers/userController.js";

const router = express.Router();

router.put("/goal",authMiddleware, updateUserGoal);
router.put("/recent-books",authMiddleware,addRecentBook);
router.get("/get-recent-books",authMiddleware,getRecentBooks);
router.get("/collections",authMiddleware,getUserCollections);
router.post("/collections",authMiddleware,createCollection);
router.put("/collections/:collectionId/books",authMiddleware,addBookToCollection);
router.put("/createnotes",authMiddleware,createNote);
router.get("/getnotes", authMiddleware,getNotes);
router.put("/mark-as-read", authMiddleware,MarkAsRead);
router.put("/checkReadBooks", authMiddleware,checkReadBooks);
router.get("/get-user-progress",authMiddleware, getUserProgress);
router.put("/updatenote/:noteId", authMiddleware, updateNote);
router.delete("/deletenote/:noteId", authMiddleware, deleteNote);
router.get("/profile",authMiddleware,getUserProfile);
router.put("/profile",authMiddleware,updateUserProfile);



export default router;