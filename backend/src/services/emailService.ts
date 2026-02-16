import SibApiV3Sdk from "sib-api-v3-sdk";

// Initialize Brevo API client with proper configuration
let api: SibApiV3Sdk.TransactionalEmailsApi | null = null;

const initializeBrevoApi = () => {
  if (api) return api;

  if (!process.env.BREVO_API_KEY) {
    console.error("❌ BREVO_API_KEY not found in environment variables");
    return null;
  }

  try {
    // Get the default API client instance
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    
    // Set the API key authentication
    defaultClient.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;
    
    console.log("✅ Brevo API client configured successfully");
    console.log("📧 API Key:", process.env.BREVO_API_KEY?.substring(0, 20) + "...");

    // Create the transactional emails API instance
    api = new SibApiV3Sdk.TransactionalEmailsApi();
    
    console.log("✅ Brevo TransactionalEmailsApi initialized");
    
    return api;
  } catch (error: any) {
    console.error("❌ Failed to initialize Brevo API:", error?.message);
    return null;
  }
};

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailPayload) => {
  try {
    console.log("📧 sendEmail called");
    console.log("📧 Recipient:", to);
    console.log("📧 Subject:", subject.substring(0, 50) + "...");

    if (!to || !subject || !html) {
      throw new Error("Missing required email fields: to, subject, html");
    }

    if (!process.env.BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is not configured in environment variables");
    }

    if (!process.env.SENDER_EMAIL) {
      throw new Error("SENDER_EMAIL is not configured in environment variables");
    }

    const emailApi = initializeBrevoApi();
    if (!emailApi) {
      throw new Error("Failed to initialize Brevo API client");
    }

    console.log("📧 Sender email:", process.env.SENDER_EMAIL);
    console.log("📧 About to send email via Brevo API...");

    // Create the email payload
    const sendSmtpEmail = {
      sender: {
        email: process.env.SENDER_EMAIL,
        name: process.env.SENDER_NAME || "SaturnImports",
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    };

    console.log("📧 Email payload prepared");
    console.log("📧 Calling Brevo sendTransacEmail method...");

    // Send the email
    const result = await emailApi.sendTransacEmail(sendSmtpEmail as any);

    console.log(`✅ Email sent successfully to ${to}`);
    console.log("📧 Brevo Response:", result);
    return result;
  } catch (error: any) {
    console.error(`❌ Error sending email to ${to}`);
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error status:", error?.status);
    console.error("Full error:", error);
    throw error;
  }
};

// Email templates


export const sendOrderConfirmationEmail = async (
  userEmail: string,
  orderId: string,
  customerName: string,
  totalAmount: number,
  items: Array<{ productName: string; quantity: number; price: number; flavor?: string; size?: string }>
) => {
  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
          ${item.productName}${item.flavor ? ` <span style='color:#888;'>(Flavour: ${item.flavor})</span>` : ''}${item.size ? ` <span style='color:#888;'>(Size: ${item.size})</span>` : ''}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
    </tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9f9f9; margin-top: 20px; border-radius: 5px; }
          .order-details { margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; }
          th { background-color: #4CAF50; color: white; padding: 10px; text-align: left; }
          .total-row { font-weight: bold; font-size: 18px; margin-top: 20px; padding: 10px; background-color: #e8f5e9; }
          .footer { margin-top: 20px; text-align: center; color: #999; font-size: 12px; }
          .button { display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Placed Successfully! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Thank you for your order! Your order has been confirmed and will be processed soon.</p>
            
            <div class="order-details">
              <h3>Order Details:</h3>
              <p><strong>Order ID:</strong> #${orderId}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <h3>Order Summary:</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="total-row">
              Total Amount: ₹${totalAmount.toFixed(2)}
            </div>

            <p style="margin-top: 20px; color: #666;">
              We'll send you another email with tracking information once your order ships. You can check the status of your order anytime by logging into your account.
            </p>

            <a href="http://localhost:5173/account/order/${orderId}" class="button">Track Your Order</a>
          </div>
          <div class="footer">
            <p>SaturnImports - Your trusted supplement store</p>
            <p>This is an automated email. Please don't reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: userEmail,
    subject: `Order Confirmation - Order #${orderId}`,
    html,
  });
};

export const sendOrderShippedEmail = async (
  userEmail: string,
  orderId: string,
  customerName: string,
  trackingNumber?: string
) => {
  try {
    console.log("📧 sendOrderShippedEmail called:", { userEmail, orderId, trackingNumber });
    
    const trackingInfo = trackingNumber
      ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>`
      : "";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9f9f9; margin-top: 20px; border-radius: 5px; }
          .status-badge { display: inline-block; background-color: #2196F3; color: white; padding: 8px 16px; border-radius: 20px; margin: 10px 0; }
          .footer { margin-top: 20px; text-align: center; color: #999; font-size: 12px; }
          .button { display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Order is On The Way! 🚚</h1>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Great news! Your order has been shipped and is on its way to you.</p>
            
            <div class="status-badge">Status: SHIPPED</div>

            <p><strong>Order ID:</strong> #${orderId}</p>
            ${trackingInfo}

            <p style="margin-top: 20px; color: #666;">
              You can track your package using the above tracking number with your courier. Typically, delivery takes 3-7 business days depending on your location.
            </p>

            <p>If you have any questions about your shipment, feel free to contact us.</p>

            <a href="${process.env.FRONTEND_URL || "https://saturnimports.com"}/orders/${orderId}" class="button">Track Your Shipment</a>
          </div>
          <div class="footer">
            <p>SaturnImports - Your trusted supplement store</p>
            <p>This is an automated email. Please don't reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

    await sendEmail({
      to: userEmail,
      subject: `Your Order is Shipped - Order #${orderId}`,
      html,
    });
    console.log("✅ Order shipped email sent successfully");
  } catch (error: any) {
    console.error("❌ Error in sendOrderShippedEmail:", error?.message || error);
    throw error;
  }
};

export const sendOrderDeliveredEmail = async (
  userEmail: string,
  orderId: string,
  customerName: string
) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9f9f9; margin-top: 20px; border-radius: 5px; }
          .status-badge { display: inline-block; background-color: #4CAF50; color: white; padding: 8px 16px; border-radius: 20px; margin: 10px 0; }
          .footer { margin-top: 20px; text-align: center; color: #999; font-size: 12px; }
          .button { display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Order Delivered! ✅</h1>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Excellent! Your order has been successfully delivered.</p>
            
            <div class="status-badge">Status: DELIVERED</div>

            <p><strong>Order ID:</strong> #${orderId}</p>

            <p style="margin-top: 20px; color: #666;">
              We hope you enjoy your purchase! Please inspect the items carefully and let us know if you have any concerns.
            </p>

            <p style="margin-top: 20px;">
              <strong>Questions or Issues?</strong> If you're not satisfied with your order or received any damaged items, please don't hesitate to contact us for a replacement or refund.
            </p>

            <a href="${process.env.FRONTEND_URL || "https://saturnimports.com"}/orders/${orderId}" class="button">View Order</a>
            <a href="${process.env.FRONTEND_URL || "https://saturnimports.com"}/contact" class="button">Contact Support</a>
          </div>
          <div class="footer">
            <p>SaturnImports - Your trusted supplement store</p>
            <p>This is an automated email. Please don't reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: userEmail,
    subject: `Order Delivered - Order #${orderId}`,
    html,
  });
};

export const sendCancellationApprovedEmail = async (
  userEmail: string,
  orderId: string,
  customerName: string,
  reason?: string
) => {
  try {
    console.log("📧 sendCancellationApprovedEmail called:", { userEmail, orderId, customerName });
  const reasonText = reason
    ? `<p><strong>Admin Response:</strong> ${reason}</p>`
    : "";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9f9f9; margin-top: 20px; border-radius: 5px; }
          .status-badge { display: inline-block; background-color: #4CAF50; color: white; padding: 8px 16px; border-radius: 20px; margin: 10px 0; }
          .footer { margin-top: 20px; text-align: center; color: #999; font-size: 12px; }
          .button { display: inline-block; background-color: #FF9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Cancellation Approved ✅</h1>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Your cancellation request for order #${orderId} has been <strong>approved</strong>.</p>
            
            <div class="status-badge">Status: APPROVED</div>

            ${reasonText}

            <p style="margin-top: 20px; color: #666;">
              Your order has been cancelled and you will receive a full refund. Please allow 5-7 business days for the refund to reflect in your account.
            </p>

            <p>If you have any questions about the cancellation or refund, please contact us.</p>

            <a href="${process.env.FRONTEND_URL || "https://saturnimports.com"}/orders/${orderId}" class="button">View Order Details</a>
          </div>
          <div class="footer">
            <p>SaturnImports - Your trusted supplement store</p>
            <p>This is an automated email. Please don't reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

    await sendEmail({
      to: userEmail,
      subject: `Cancellation Approved - Order #${orderId}`,
      html,
    });
    console.log("✅ Cancellation approved email sent successfully");
  } catch (error: any) {
    console.error("❌ Error in sendCancellationApprovedEmail:", error?.message || error);
    throw error;
  }
};

export const sendCancellationRejectedEmail = async (
  userEmail: string,
  orderId: string,
  customerName: string,
  reason?: string
) => {
  try {
    console.log("📧 sendCancellationRejectedEmail called:", { userEmail, orderId, customerName });
    
    const reasonText = reason
      ? `<p><strong>Admin Response:</strong> ${reason}</p>`
      : "";

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9f9f9; margin-top: 20px; border-radius: 5px; }
          .status-badge { display: inline-block; background-color: #f44336; color: white; padding: 8px 16px; border-radius: 20px; margin: 10px 0; }
          .footer { margin-top: 20px; text-align: center; color: #999; font-size: 12px; }
          .button { display: inline-block; background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Cancellation Request Rejected ❌</h1>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Your cancellation request for order #${orderId} has been <strong>rejected</strong>.</p>
            
            <div class="status-badge">Status: REJECTED</div>

            ${reasonText}

            <p style="margin-top: 20px; color: #666;">
              Your order will continue to be processed. If you believe this is a mistake or have further concerns, please contact us immediately.
            </p>

            <p>We're here to help if you have any questions!</p>

            <a href="${process.env.FRONTEND_URL || "https://saturnimports.com"}/orders/${orderId}" class="button">Contact Support</a>
          </div>
          <div class="footer">
            <p>SaturnImports - Your trusted supplement store</p>
            <p>This is an automated email. Please don't reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

    await sendEmail({
      to: userEmail,
      subject: `Cancellation Request Update - Order #${orderId}`,
      html,
    });
    console.log("✅ Cancellation rejected email sent successfully");
  } catch (error: any) {
    console.error("❌ Error in sendCancellationRejectedEmail:", error?.message || error);
    throw error;
  }
};

export const sendForgotPasswordEmail = async (
  userEmail: string,
  resetLink: string,
  userName?: string
) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9f9f9; margin-top: 20px; border-radius: 5px; }
          .warning { background-color: #fff3cd; padding: 10px; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 20px; text-align: center; color: #999; font-size: 12px; }
          .button { display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${userName || "User"},</p>
            <p>We received a request to reset your password. Click the link below to set a new password:</p>
            
            <a href="${resetLink}" class="button">Reset Your Password</a>

            <p style="margin-top: 20px; color: #666;">
              This link will expire in 1 hour for security reasons.
            </p>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email or contact us if you have concerns.
            </div>

            <p>Can't click the link? Copy and paste this URL into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 12px;">${resetLink}</p>
          </div>
          <div class="footer">
            <p>SaturnImports - Your trusted supplement store</p>
            <p>This is an automated email. Please don't reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: userEmail,
    subject: "Reset Your Password - SaturnImports",
    html,
  });
};

// ========================
// CANCELLATION EMAILS
// ========================

export const sendCancellationRequestRaisedEmail = async (
  userEmail: string,
  orderId: string,
  customerName: string,
  reason: string,
  cancellationType: "pre-delivery" | "post-delivery"
) => {
  try {
    console.log("📧 sendCancellationRequestRaisedEmail called:", { userEmail, orderId, cancellationType });
    
    const typeLabel = cancellationType === "pre-delivery" ? "Pre-Delivery" : "Post-Delivery";
    const headerColor = cancellationType === "pre-delivery" ? "#2196F3" : "#FF9800";

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${headerColor}; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9f9f9; margin-top: 20px; border-radius: 5px; }
          .status-badge { display: inline-block; background-color: ${headerColor}; color: white; padding: 8px 16px; border-radius: 20px; margin: 10px 0; }
          .footer { margin-top: 20px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Cancellation Request Submitted 📋</h1>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Your ${typeLabel} cancellation request for order <strong>#${orderId}</strong> has been successfully submitted.</p>
            
            <div class="status-badge">Type: ${typeLabel} Cancellation</div>

            <p style="margin-top: 20px; color: #666;">
              <strong>Your Request Details:</strong>
            </p>
            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Order ID:</strong> #${orderId}</p>
              <p><strong>Cancellation Type:</strong> ${typeLabel}</p>
              <p><strong>Reason:</strong> ${reason}</p>
              <p><strong>Status:</strong> <span style="color: #FF9800; font-weight: bold;">PENDING APPROVAL</span></p>
            </div>

            <p style="margin-top: 20px; color: #666;">
              Our team will review your request shortly. You will receive another email notification once your request has been approved or rejected. Typically, this takes 1-2 business days.
            </p>

            <p style="margin-top: 20px; color: #666;">
              <strong>What happens next?</strong>
            </p>
            <ul style="color: #666; line-height: 1.8;">
              <li>We will verify your cancellation request</li>
              <li>You will receive an email with the decision (approved/rejected)</li>
              ${typeLabel === "Pre-Delivery" ? '<li>If approved, your order will be cancelled and you will receive a full refund</li>' : '<li>If approved, we will process your refund after verifying the return</li>'}
            </ul>

            <p style="margin-top: 20px; color: #666;">
              If you have any questions, please don't hesitate to contact us.
            </p>
          </div>
          <div class="footer">
            <p>SaturnImports - Your trusted supplement store</p>
            <p>This is an automated email. Please don't reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

    await sendEmail({
      to: userEmail,
      subject: `${typeLabel} Cancellation Request Submitted - Order #${orderId}`,
      html,
    });
    console.log("✅ Cancellation request email sent successfully");
  } catch (error: any) {
    console.error("❌ Error in sendCancellationRequestRaisedEmail:", error?.message || error);
    throw error;
  }
};

// ========================
// REFUND EMAILS
// ========================

export const sendRefundInitiatedEmail = async (
  userEmail: string,
  orderId: string,
  customerName: string,
  refundAmount: number,
  refundMethod: string
) => {
  try {
    console.log("📧 sendRefundInitiatedEmail called:", { userEmail, orderId, refundAmount, refundMethod });
    
    const methodLabel = refundMethod === "upi" ? "UPI Transfer" : "Original Payment Method";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9f9f9; margin-top: 20px; border-radius: 5px; }
          .status-badge { display: inline-block; background-color: #4CAF50; color: white; padding: 8px 16px; border-radius: 20px; margin: 10px 0; }
          .amount-box { background-color: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { margin-top: 20px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Refund Initiated 💰</h1>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Great news! Your refund for order <strong>#${orderId}</strong> has been initiated.</p>
            
            <div class="status-badge">Status: REFUND INITIATED</div>

            <div class="amount-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Refund Amount</p>
              <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: #4CAF50;">₹${refundAmount.toFixed(2)}</p>
            </div>

            <p style="margin-top: 20px; color: #666;">
              <strong>Refund Details:</strong>
            </p>
            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Order ID:</strong> #${orderId}</p>
              <p><strong>Refund Amount:</strong> ₹${refundAmount.toFixed(2)}</p>
              <p><strong>Refund Method:</strong> ${methodLabel}</p>
              <p><strong>Processing Time:</strong> 5-7 business days</p>
            </div>

            <p style="margin-top: 20px; color: #666;">
              The refund will be credited to your <strong>${methodLabel}</strong> within 5-7 business days. Please note that bank processing times may vary depending on your financial institution.
            </p>

            <p style="margin-top: 20px; color: #666;">
              <strong>Need Help?</strong> If you don't see the refund in your account after 7 business days, please contact us immediately.
            </p>
          </div>
          <div class="footer">
            <p>SaturnImports - Your trusted supplement store</p>
            <p>This is an automated email. Please don't reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: userEmail,
    subject: `Refund Initiated - Order #${orderId}`,
    html,
  });
    console.log("✅ Refund initiated email sent successfully");
  } catch (error: any) {
    console.error("❌ Error in sendRefundInitiatedEmail:", error?.message || error);
    throw error;
  }
};

export const sendRefundCompletedEmail = async (
  userEmail: string,
  orderId: string,
  customerName: string,
  refundAmount: number,
  refundDate: string
) => {
  try {
    console.log("📧 sendRefundCompletedEmail called:", { userEmail, orderId, refundAmount });
    
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9f9f9; margin-top: 20px; border-radius: 5px; }
          .status-badge { display: inline-block; background-color: #4CAF50; color: white; padding: 8px 16px; border-radius: 20px; margin: 10px 0; }
          .amount-box { background-color: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { margin-top: 20px; text-align: center; color: #999; font-size: 12px; }
          .check-icon { font-size: 48px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div className="header">
            <div class="check-icon">✅</div>
            <h1>Refund Completed Successfully!</h1>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Your refund for order <strong>#${orderId}</strong> has been successfully completed!</p>
            
            <div class="status-badge">Status: REFUND COMPLETED</div>

            <div class="amount-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Refund Amount</p>
              <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: #4CAF50;">₹${refundAmount.toFixed(2)}</p>
            </div>

            <p style="margin-top: 20px; color: #666;">
              <strong>Refund Summary:</strong>
            </p>
            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Order ID:</strong> #${orderId}</p>
              <p><strong>Refund Amount:</strong> ₹${refundAmount.toFixed(2)}</p>
              <p><strong>Completion Date:</strong> ${new Date(refundDate).toLocaleDateString('en-IN')}</p>
            </div>

            <p style="margin-top: 20px; color: #666;">
              The refund of <strong>₹${refundAmount.toFixed(2)}</strong> has been successfully credited to your account. Please check your bank account or payment method to confirm the amount.
            </p>

            <p style="margin-top: 20px; color: #666;">
              <strong>Thank you for your business!</strong> We hope to serve you again in the future. If you have any feedback about your experience, please let us know.
            </p>
          </div>
          <div class="footer">
            <p>SaturnImports - Your trusted supplement store</p>
            <p>This is an automated email. Please don't reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: userEmail,
    subject: `Refund Completed - Order #${orderId}`,
    html,
  });
    console.log("✅ Refund completed email sent successfully");
  } catch (error: any) {
    console.error("❌ Error in sendRefundCompletedEmail:", error?.message || error);
    throw error;
  }
};
