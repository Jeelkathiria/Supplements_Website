import { Request, Response, NextFunction } from "express";
import admin from "../config/firebase";
import prisma from "../lib/prisma";

export interface AuthRequest extends Request {
  user?: admin.auth.DecodedIdToken & { dbUser?: { id: string; firebaseUid: string; email: string } };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    
    // Auto-sync user to database
    let dbUser = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid }
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          email: decoded.email || "",
          name: decoded.name || null
        }
      });
    }

    // Attach both decoded token and db user to request
    req.user = {
      ...decoded,
      dbUser: {
        id: dbUser.id,
        firebaseUid: dbUser.firebaseUid,
        email: dbUser.email
      }
    };
    
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};
