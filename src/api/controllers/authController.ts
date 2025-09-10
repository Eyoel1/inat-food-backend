import { Request, Response, NextFunction } from "express";
import jwt, { Secret } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User, { IUser, UserRole } from "../models/userModel";

const signToken = (id: string) => {
  const jwtSecret: Secret = process.env.JWT_SECRET!;
  // Ensure the expiration is a number (of seconds) for type safety
  const expiresInSeconds = parseInt(process.env.JWT_EXPIRES_IN_SECONDS!, 10);

  if (!jwtSecret || !expiresInSeconds) {
    throw new Error(
      "FATAL ERROR: JWT_SECRET or JWT_EXPIRES_IN_SECONDS is not defined or invalid in .env file"
    );
  }

  return jwt.sign({ id }, jwtSecret, { expiresIn: expiresInSeconds });
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, pin } = req.body;
    if (!username || !pin) {
      return res
        .status(400)
        .json({ status: "fail", message: "Please provide username and PIN." });
    }
    const user = await User.findOne({ username }).select("+pin");
    if (!user || !(await bcrypt.compare(pin, user.pin))) {
      return res
        .status(401)
        .json({ status: "fail", message: "Incorrect username or PIN." });
    }
    const token = signToken(user.id);
    user.pin = undefined!;
    res.status(200).json({
      status: "success",
      token,
      data: { user },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: (err as Error).message });
  }
};

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ status: "fail", message: "You are not logged in!" });
    }

    const jwtSecret: Secret = process.env.JWT_SECRET!;
    if (!jwtSecret) {
      throw new Error("FATAL ERROR: JWT_SECRET is not defined");
    }

    jwt.verify(token, jwtSecret, async (err, decoded) => {
      if (err) {
        return res
          .status(401)
          .json({
            status: "fail",
            message: "Invalid token. Please log in again.",
          });
      }

      // --- THE DEFINITIVE, MULTI-STEP TYPE GUARD ---

      // 1. First, we verify that 'decoded' is a non-null object.
      if (typeof decoded !== "object" || decoded === null) {
        return res
          .status(401)
          .json({ status: "fail", message: "Invalid token format." });
      }

      // 2. Second, we verify the 'id' property exists on the object.
      if (!("id" in decoded)) {
        return res
          .status(401)
          .json({
            status: "fail",
            message: "Token is missing the ID payload.",
          });
      }

      // 3. Third, we extract the id and verify its type is a string.
      const userId = (decoded as { id: unknown }).id;
      if (typeof userId !== "string") {
        return res
          .status(401)
          .json({
            status: "fail",
            message: "Token ID payload is not a valid format.",
          });
      }

      // After these checks, TypeScript knows with 100% certainty that `userId` is a string.
      const currentUser = await User.findById(userId); // This call is now guaranteed to be type-safe.

      if (!currentUser) {
        return res
          .status(401)
          .json({
            status: "fail",
            message: "The user for this token does no longer exist.",
          });
      }

      req.user = currentUser;
      next();
    });
  } catch (err) {
    res
      .status(500)
      .json({
        status: "error",
        message: "An unexpected server error occurred during authentication.",
      });
  }
};

export const restrictTo = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          status: "fail",
          message: "You do not have permission to perform this action.",
        });
    }
    next();
  };
};
