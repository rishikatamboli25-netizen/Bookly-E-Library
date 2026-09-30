import express from "express";
import { getCoverImage } from "../controllers/imageController.js";

const router = express.Router();

router.get("/cover/:identifier", getCoverImage);

export default router;