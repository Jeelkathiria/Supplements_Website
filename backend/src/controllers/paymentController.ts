import { Response } from "express";
import { AuthRequest } from "../middlewares/requireAuth";
import razorpayInstance from "../config/razorpay";
import crypto from "crypto";
import * as orderService from "../services/orderService";
import prisma from "../lib/prisma";
import { $Enums } from "../generated/prisma";

const OrderStatus = $Enums.OrderStatus;

export const createRazorpayOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.dbUser?.id;
    console.log("=== CREATE RAZORPAY ORDER ===");
    console.log("User ID:", userId);
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { amount, orderId } = req.body;

    console.log("Amount:", amount, "Type:", typeof amount);
    console.log("Order ID:", orderId);

    if (!amount || amount <= 0) {
      console.log("Invalid amount check failed. Amount:", amount, "isPNot undefined:", amount !== undefined, "isNotNull:", amount !== null);
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (!orderId) {
      console.log("Order ID missing");
      return res.status(400).json({ message: "Order ID is required" });
    }

    // Amount in paise (smallest unit)
    const amountInPaise = Math.round(amount * 100);
    console.log("Amount in paise:", amountInPaise);

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: orderId,
      notes: {
        userId,
        orderId,
      },
    });

    console.log("Razorpay order created:", razorpayOrder.id);
    console.log("=== CREATE RAZORPAY ORDER SUCCESS ===");

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    console.error("=== CREATE RAZORPAY ORDER ERROR ===");
    console.error("Error type:", error instanceof Error ? "Error" : typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Full error:", error);
    if (error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    res.status(500).json({ message: "Failed to create payment order" });
  }
};

export const verifyRazorpayPayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.dbUser?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    // Verify signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    const isValidSignature = expectedSignature === razorpay_signature;

    if (!isValidSignature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Payment is valid - clear cart now
    console.log("Payment verified successfully. Clearing cart for user:", userId);
    
    try {
      await orderService.clearCartAfterPayment(userId);
      console.log("✅ Cart cleared after payment verification");
    } catch (err) {
      console.error("Error clearing cart after payment:", err);
      // Don't fail the payment verification if cart clearing fails
    }

    // Send order confirmation email after payment is verified (for online payment methods)
    try {
      console.log("📧 Attempting to send order confirmation email after payment verification for order:", orderId);
      const emailResult = await orderService.sendOrderConfirmationEmailForOrder(orderId);
      if (emailResult) {
        console.log("✅ Order confirmation email sent successfully to customer");
      } else {
        console.error("⚠️ Failed to send order confirmation email, but payment was verified");
      }
    } catch (err) {
      console.error("Error sending confirmation email after payment:", err);
      // Don't fail the payment verification if email sending fails
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    res.status(500).json({ message: "Failed to verify payment" });
  }
};
