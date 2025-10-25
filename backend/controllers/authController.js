import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { findUserByEmail, createUser } from "../models/User.js";

// !!! USE A SECURE ENVIRONMENT VARIABLE IN PRODUCTION !!!
const SECRET_KEY = "supersecretkey"; 

export async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please provide name, email, and password." });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    await createUser(name, email, hashed);
    res.json({ message: "Registration successful! You can now log in." });
  } catch (error) {
    if (error.message === "Email already exists!") {
      return res.status(400).json({ message: "Email already exists!" });
    }
    console.error("Registration error:", error);
    res.status(500).json({ message: "An unexpected error occurred." });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Please provide email and password." });
  }

  const user = await findUserByEmail(email);

  if (!user) return res.status(401).json({ message: "Incorrect email or password." });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: "Incorrect email or password." });

  const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, SECRET_KEY, {
    expiresIn: "1h",
  });

  res.json({ token, message: "Login successful!" });
}

export async function getUser(req, res) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Unauthorized" });

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    // You might fetch updated user data here, but for now, we use the token data
    res.json({ name: decoded.name, email: decoded.email, message: "User data retrieved successfully." });
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token. Please log in again." });
  }
}