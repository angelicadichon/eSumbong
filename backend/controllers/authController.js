import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { findUserByEmail, createUser } from "../models/User.js";

const SECRET_KEY = "supersecretkey"; // use .env in production

export async function register(req, res) {
  const { name, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);
  try {
    await createUser(name, email, hashed);
    res.json({ message: "Registration successful!" });
  } catch {
    res.status(400).json({ message: "Email already exists!" });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);

  if (!user) return res.status(401).json({ message: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: "Incorrect password" });

  const token = jwt.sign({ id: user.id, name: user.name }, SECRET_KEY, {
    expiresIn: "1h",
  });

  res.json({ token });
}

export async function getUser(req, res) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Unauthorized" });

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    res.json({ name: decoded.name, reportCount: 3 });
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}
