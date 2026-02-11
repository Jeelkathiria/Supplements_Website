import { Router, Response } from "express";
import { AuthRequest } from "../middlewares/requireAuth";
import { sendOrderConfirmationEmail } from "../services/emailService";
import prisma from "../lib/prisma";

const router = Router();

// Diagnostic: Check user record in database
router.get("/user-info", async (req: AuthRequest, res: Response) => {
  try {
    console.log("🔍 USER INFO DIAGNOSTIC");
    console.log("Auth user dbUser:", req.user?.dbUser);

    const userId = req.user?.dbUser?.id;
    const firebaseUid = req.user?.uid;

    if (!userId) {
      return res.status(400).json({ error: "No user ID in auth" });
    }

    console.log("Querying database for userId:", userId);

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    console.log("Database user record:", dbUser);

    res.json({
      authUser: {
        firebaseUid,
        dbUserId: userId,
      },
      databaseUser: dbUser,
      hasEmail: !!dbUser?.email,
      emailLength: dbUser?.email?.length || 0,
    });
  } catch (error: any) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Diagnostic: Check all users in database
router.get("/all-users", async (req: AuthRequest, res: Response) => {
  try {
    console.log("🔍 ALL USERS DIAGNOSTIC");

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        firebaseUid: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    res.json({
      totalUsers: allUsers.length,
      users: allUsers,
    });
  } catch (error: any) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Diagnostic: Check specific order
router.get("/order/:orderId", async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    console.log("🔍 ORDER DIAGNOSTIC for:", orderId);

    const id = Array.isArray(orderId) ? orderId[0] : orderId;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        address: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    console.log("Order userId:", order.userId);

    const user = await prisma.user.findUnique({
      where: { id: order.userId },
    });

    console.log("Order's user record:", user);

    res.json({
      order: {
        id: order.id,
        userId: order.userId,
        status: order.status,
        totalAmount: order.totalAmount,
      },
      user: user,
      hasEmail: !!user?.email,
      emailLength: user?.email?.length || 0,
      emailEmpty: !user?.email || user?.email === "",
    });
  } catch (error: any) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Test email endpoint
router.post("/email", async (req: AuthRequest, res: Response) => {
  try {
    console.log("🧪 TEST EMAIL ENDPOINT CALLED");
    console.log("User:", req.user?.dbUser);
    console.log("Request body:", req.body);

    const userEmail = req.body.email || req.user?.dbUser?.email;
    const userName = req.body.name || req.user?.dbUser?.firebaseUid || "Test User";

    if (!userEmail) {
      return res.status(400).json({
        error: "No email provided",
        dbUserEmail: req.user?.dbUser?.email,
        receivedEmail: req.body.email,
      });
    }

    console.log("🧪 Sending test email to:", userEmail);

    await sendOrderConfirmationEmail(userEmail, "TEST-001", userName, 999.99, [
      { productName: "Test Product", quantity: 1, price: 999.99, flavor: "Vanilla", size: "500g" },
    ]);

    res.json({
      success: true,
      message: "Test email sent successfully",
      email: userEmail,
    });
  } catch (error: any) {
    console.error("🧪 TEST EMAIL ERROR:", error);
    res.status(500).json({
      error: "Failed to send test email",
      message: error?.message,
      details: error?.toString(),
    });
  }
});

export default router;
