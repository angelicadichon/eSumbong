import express from "express";
import { index, login, getUser } from "../controllers/authController.js";

const router = express.Router();

router.post("/index", index);
router.post("/login", login);
router.get("/user", getUser);

export default router;
