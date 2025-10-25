import express from "express";
import { register, login, getUser } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/user", getUser);

export default router;