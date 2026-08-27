import express from 'express'
import {registerUser} from "../controllers/authcontroller.js"
import { deleteUser } from '../controllers/authcontroller.js';
import { checkUser } from '../controllers/authcontroller.js';



const router = express.Router();

router.post("/register", registerUser);
router.post("/delete", deleteUser);
router.post("/check-email", checkUser)




export default router;