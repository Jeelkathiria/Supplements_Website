/**
 * COUPON SERVICE - Frontend API calls for coupon management
 * Handles all HTTP requests to coupon endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * CREATE COUPON - Admin only
 * Create a new coupon code for a trainer/influencer
 * 
 * @param couponData - Coupon creation data
 * @param authToken - Firebase auth token
 */
export const createCoupon = async (
  couponData: {
    trainerName: string;
    trainerId?: string;
    discountPercent?: number;
    maxUses?: number | null;
    expiryDate?: string;
  },
  authToken: string
) => {
  const response = await fetch(`${API_BASE_URL}/coupons/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(couponData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create coupon");
  }

  return response.json();
};

/**
 * GET ALL COUPONS - Admin only
 * Fetch all coupons with optional filters
 * 
 * @param options - Filter options
 * @param authToken - Firebase auth token
 */
export const getAllCoupons = async (
  options?: {
    isActive?: boolean;
    trainerName?: string;
  },
  authToken?: string
) => {
  // Build query string
  const params = new URLSearchParams();
  if (options?.isActive !== undefined) {
    params.append("isActive", String(options.isActive));
  }
  if (options?.trainerName) {
    params.append("trainerName", options.trainerName);
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/coupons${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch coupons");
  }

  return response.json();
};

/**
 * GET COUPON BY ID - Admin only
 * Fetch coupon details with usage history
 * 
 * @param couponId - Coupon ID
 * @param authToken - Firebase auth token
 */
export const getCouponById = async (couponId: string, authToken: string) => {
  const response = await fetch(`${API_BASE_URL}/coupons/${couponId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch coupon");
  }

  return response.json();
};

/**
 * VALIDATE COUPON - Customer
 * Check if coupon code is valid before applying
 * 
 * @param couponCode - The coupon code to validate
 */
export const validateCoupon = async (couponCode: string) => {
  const response = await fetch(`${API_BASE_URL}/coupons/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ couponCode }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to validate coupon");
  }

  return response.json();
};

/**
 * APPLY COUPON - Customer
 * Apply validated coupon to order and get discount amount
 * 
 * @param couponCode - The coupon code to apply
 * @param orderId - Order ID
 * @param cartTotal - Total cart amount before discount
 * @param authToken - Firebase auth token
 */
export const applyCoupon = async (
  couponCode: string,
  orderId: string,
  cartTotal: number,
  authToken: string
) => {
  const response = await fetch(`${API_BASE_URL}/coupons/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      couponCode,
      orderId,
      cartTotal,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to apply coupon");
  }

  return response.json();
};

/**
 * DEACTIVATE COUPON - Admin only
 * Deactivate a coupon code (soft delete)
 * 
 * @param couponId - Coupon ID
 * @param authToken - Firebase auth token
 */
export const deactivateCoupon = async (
  couponId: string,
  authToken: string
) => {
  const response = await fetch(`${API_BASE_URL}/coupons/${couponId}/deactivate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to deactivate coupon");
  }

  return response.json();
};

/**
 * REACTIVATE COUPON - Admin only
 * Reactivate a deactivated coupon
 * 
 * @param couponId - Coupon ID
 * @param authToken - Firebase auth token
 */
export const reactivateCoupon = async (
  couponId: string,
  authToken: string
) => {
  const response = await fetch(`${API_BASE_URL}/coupons/${couponId}/reactivate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to reactivate coupon");
  }

  return response.json();
};

/**
 * GET TRAINER COMMISSION REPORT - Admin only
 * Get commission data for a trainer
 * Used for offline commission calculation
 * 
 * @param trainerName - Trainer name
 * @param authToken - Firebase auth token
 */
export const getTrainerCommissionReport = async (
  trainerName: string,
  authToken: string
) => {
  const encodedName = encodeURIComponent(trainerName);
  const response = await fetch(
    `${API_BASE_URL}/coupons/trainer/${encodedName}/commission-report`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch commission report");
  }

  return response.json();
};

/**
 * GET APPLIED COUPONS BY TRAINER - Admin only
 * Get all applied coupons for a trainer with date range filter
 * 
 * @param trainerName - Trainer name
 * @param authToken - Firebase auth token
 * @param dateRange - Optional date range filter
 */
export const getAppliedCouponsByTrainer = async (
  trainerName: string,
  authToken: string,
  dateRange?: {
    fromDate: string; // YYYY-MM-DD
    toDate: string;   // YYYY-MM-DD
  }
) => {
  const encodedName = encodeURIComponent(trainerName);
  const params = new URLSearchParams();
  
  if (dateRange?.fromDate) {
    params.append("fromDate", dateRange.fromDate);
  }
  if (dateRange?.toDate) {
    params.append("toDate", dateRange.toDate);
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/coupons/trainer/${encodedName}/applied${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch applied coupons");
  }

  return response.json();
};
