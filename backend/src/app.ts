import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import { requireAuth } from "./middlewares/requireAuth";
import adminProducts from "./routes/adminProducts";
import products from "./routes/products";
import categories from "./routes/categories";
import cartRoutes from "./routes/cartRoutes";
import orderRoutes from "./routes/orderRoutes";
import adminOrders from "./routes/adminOrders";
import userRoutes from "./routes/user";
import imageRoutes from "./routes/imageRoutes";
import paymentRoutes from "./routes/payment";
import orderCancellationRoutes from "./routes/orderCancellationRoutes";
import refundRoutes from "./routes/refundRoutes";
import testRoutes from "./routes/testRoutes";
import { 
  sendOrderConfirmationEmail,
  sendCancellationRequestRaisedEmail,
  sendCancellationApprovedEmail,
  sendCancellationRejectedEmail,
  sendRefundInitiatedEmail,
  sendRefundCompletedEmail,
  sendOrderShippedEmail
} from "./services/emailService";


const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve uploads directory as static files
const uploadsPath = path.resolve(__dirname, "../uploads");
console.log("Serving uploads from:", uploadsPath);
app.use("/uploads", express.static(uploadsPath));

app.get("/", (_req: Request, res: Response) => {
  res.send("Backend running");
});

app.get("/api/protected", requireAuth, (_req, res) => {
  res.json({ message: "You are authenticated" });
});

// Simple test email endpoint (no auth required) - for debugging Brevo
app.post("/api/test-email", async (req: Request, res: Response) => {
  try {
    console.log("🧪 SIMPLE TEST EMAIL ENDPOINT CALLED");
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    console.log("🧪 Sending test email to:", email);

    await sendOrderConfirmationEmail(
      email,
      "TEST-12345",
      name || "Test User",
      1299.99,
      [
        {
          productName: "Test Supplement",
          quantity: 2,
          price: 649.99,
          flavor: "Vanilla",
          size: "500g",
        },
      ]
    );

    res.json({
      success: true,
      message: "Test email sent successfully",
      email,
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

// Test endpoints for all email types
app.post("/api/test-cancellation-email", async (req: Request, res: Response) => {
  try {
    console.log("🧪 TEST CANCELLATION EMAIL ENDPOINT CALLED");
    const { email, name, orderId } = req.body;

    if (!email || !orderId) {
      return res.status(400).json({ error: "Email and orderId are required" });
    }

    await sendCancellationRequestRaisedEmail(
      email,
      orderId || "TEST-ORDER",
      name || "Test User",
      "Test cancellation reason",
      "pre-delivery"
    );

    res.json({
      success: true,
      message: "Cancellation request email sent successfully",
      email,
    });
  } catch (error: any) {
    console.error("🧪 TEST CANCELLATION EMAIL ERROR:", error);
    res.status(500).json({
      error: "Failed to send cancellation email",
      message: error?.message,
    });
  }
});

app.post("/api/test-refund-email", async (req: Request, res: Response) => {
  try {
    console.log("🧪 TEST REFUND EMAIL ENDPOINT CALLED");
    const { email, name, orderId, amount } = req.body;

    if (!email || !orderId || !amount) {
      return res.status(400).json({ error: "Email, orderId, and amount are required" });
    }

    await sendRefundInitiatedEmail(
      email,
      orderId || "TEST-ORDER",
      name || "Test User",
      amount || 500,
      "upi"
    );

    res.json({
      success: true,
      message: "Refund email sent successfully",
      email,
    });
  } catch (error: any) {
    console.error("🧪 TEST REFUND EMAIL ERROR:", error);
    res.status(500).json({
      error: "Failed to send refund email",
      message: error?.message,
    });
  }
});

app.post("/api/test-shipped-email", async (req: Request, res: Response) => {
  try {
    console.log("🧪 TEST SHIPPED EMAIL ENDPOINT CALLED");
    const { email, name, orderId, tracking } = req.body;

    if (!email || !orderId) {
      return res.status(400).json({ error: "Email and orderId are required" });
    }

    await sendOrderShippedEmail(
      email,
      orderId || "TEST-ORDER",
      name || "Test User",
      tracking || "TRACK123456"
    );

    res.json({
      success: true,
      message: "Shipped email sent successfully",
      email,
    });
  } catch (error: any) {
    console.error("🧪 TEST SHIPPED EMAIL ERROR:", error);
    res.status(500).json({
      error: "Failed to send shipped email",
      message: error?.message,
    });
  }
});

//Categories
app.use("/api/categories", categories);

//admin Products
app.use("/api/admin/products", adminProducts);

//products
app.use("/api/products", products);

//cart
app.use("/api/cart", cartRoutes);

//orders
app.use("/api/orders", orderRoutes);

//admin Orders view
app.use("/api/admin", adminOrders);

//Order Cancellation Requests
app.use("/api/order-cancellation-requests", orderCancellationRoutes);

//Refund Management
app.use("/api/refunds", refundRoutes);

//User
app.use("/api/user", userRoutes);

// Image uploads
app.use("/api/images", imageRoutes);

// Payments
app.use("/api/payment", paymentRoutes);

// Test Routes (for debugging - requires auth)
app.use("/api/test", requireAuth, testRoutes);

export default app;
