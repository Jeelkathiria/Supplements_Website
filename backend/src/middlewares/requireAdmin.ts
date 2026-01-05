import { Response, NextFunction } from "express";
import { AuthRequest } from "./requireAuth";

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check for admin claim in custom claims
    const isAdmin = req.user?.admin === true;
    
    // For development: allow any authenticated user to be admin
    // In production, check custom claims or database role
    // const isAdmin = true; // Uncomment for testing all users as admin
    
    if (!isAdmin) {
      // For now in dev, log and allow. Uncomment return to enforce admin check
      console.log("Non-admin user attempting admin access:", userId);
      // return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};
