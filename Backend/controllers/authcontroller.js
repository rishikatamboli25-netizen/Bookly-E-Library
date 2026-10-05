import mongoose from "mongoose";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import "dotenv/config";

const JWT_SECRET = process.env.JWT_SECRET || process.env.jwt_SECERT;

const generateToken = (userId) => {
  if (!JWT_SECRET) {
    throw new Error("JWT secret is not configured");
  }

  return jwt.sign(
    {
      userId: userId.toString(),
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// =========================
// REGISTER USER
// =========================
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if account already exists
    const existingUser = await User.collection.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user using Mongoose model
    const user = await User.create({
      username: username.trim(),
      email: normalizedEmail,
    });

    // Store password hash directly in MongoDB
    // This works even if password is not currently defined
    // in the Mongoose User schema.
    await User.collection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
        },
      }
    );

    const token = generateToken(user._id);

    return res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// =========================
// LOGIN USER
// =========================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Use collection directly so password field can be accessed
    const user = await User.collection.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Old passwordless account
    if (!user.password) {
      return res.status(409).json({
        message:
          "This account was created before password authentication. Please migrate this account before logging in.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// =========================
// DELETE USER
// =========================
export const deleteUser = (req, res) => {
  return res.status(200).json({
    message: "Deleting User",
  });
};

// =========================
// CHECK USER
// =========================
export const checkUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.collection.findOne({
      email: normalizedEmail,
    });

    return res.status(200).json({
      exists: !!user,
    });
  } catch (error) {
    console.error("checkEmail:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};