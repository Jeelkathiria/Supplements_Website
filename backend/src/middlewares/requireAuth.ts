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
    
    console.log("Auth middleware: decoded user", { uid: decoded.uid, email: decoded.email });
    
    // Auto-sync user to database using upsert to avoid race conditions
    const dbUser = await prisma.user.upsert({
      where: { firebaseUid: decoded.uid },
      update: {
        email: decoded.email || undefined
        // Don't update name here - it's managed via the sync endpoint
      },
      create: {
        firebaseUid: decoded.uid,
        email: decoded.email || "",
        name: decoded.name || null
      }
    });

    console.log("Auth middleware: database user", dbUser);

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
