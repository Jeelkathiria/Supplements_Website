const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
}

export interface PaymentVerifyRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderId: string; // Add orderId parameter
}

export const createRazorpayOrder = async (
  amount: number,
  orderId: string,
  token: string
): Promise<RazorpayOrderResponse> => {
  const response = await fetch(`${API_BASE_URL}/payment/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount, orderId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create payment order");
  }

  return response.json();
};

export const verifyRazorpayPayment = async (
  paymentData: PaymentVerifyRequest,
  token: string
) => {
  const response = await fetch(`${API_BASE_URL}/payment/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(paymentData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to verify payment");
  }

  return response.json();
};

export const initiateRazorpayPayment = (
  orderId: string,
  amount: number,
  currency: string,
  email: string,
  phone: string,
  customerName: string
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const key = import.meta.env.VITE_RAZORPAY_KEY;
    if (!key) {
      reject(new Error("Razorpay API key not configured. Please set VITE_RAZORPAY_KEY in your .env file."));
      return;
    }

    const options = {
      key: key,
      amount: Math.round(amount * 100), // Amount in paise
      currency: currency || "INR",
      name: "SATURNIMPORTS",
      description: "Order Payment",
      order_id: orderId,
      prefill: {
        name: customerName,
        email: email,
        contact: phone,
      },
      theme: {
        color: "#0f766e", // Teal color matching your theme
      },
      handler: resolve,
      modal: {
        ondismiss: () => {
          reject(new Error("Payment cancelled by user"));
        },
      },
    };

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    };
    script.onerror = () => {
      reject(new Error("Failed to load Razorpay script"));
    };

    document.body.appendChild(script);
  });
};
