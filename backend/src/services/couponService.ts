import prisma from "../lib/prisma";

/**
 * COUPON SERVICE - Handles all coupon-related business logic
 * Manages creation, validation, application, and tracking of coupons
 */

// ==================== TYPES ====================

export interface CreateCouponDTO {
  trainerName: string;
  trainerId?: string;
  discountPercent?: number;
  maxUses?: number;
  expiryDate?: Date;
  createdByAdminId: string;
}

export interface CouponValidationResult {
  isValid: boolean;
  error?: string;
  coupon?: {
    id: string;
    code: string;
    discountPercent: number;
    trainerName: string;
  };
}

export interface ApplyCouponResult {
  success: boolean;
  coupon?: {
    id: string;
    code: string;
    trainerName: string;
    discountPercent: number;
  };
  discountAmount?: number;
  error?: string;
}

// ==================== COUPON CREATION ====================

/**
 * Generate unique coupon code based on trainer name
 * Format: TRAINER_NAME_DISCOUNT (e.g., JOHN_10 or TRAINER_SARAH_15)
 * 
 * @param trainerName - Name of the trainer/influencer
 * @param discountPercent - Discount percentage (default 10)
 * @returns Unique coupon code
 */
export const generateCouponCode = (
  trainerName: string,
  discountPercent: number = 10
): string => {
  // Clean trainer name: remove spaces, convert to uppercase
  const cleanName = trainerName.trim().toUpperCase().replace(/\s+/g, "");
  
  // Create base code
  const baseCode = `${cleanName}_${discountPercent}`;
  
  // For uniqueness, we'll add a timestamp suffix if needed
  // This ensures multiple codes for same trainer can exist
  return baseCode;
};

/**
 * Create a new coupon code for a trainer/influencer
 * Only admin can create coupons
 * 
 * @param dto - Coupon creation data
 * @returns Created coupon with code
 * @throws Error if validation fails
 */
export const createCoupon = async (dto: CreateCouponDTO): Promise<any> => {
  const {
    trainerName,
    trainerId,
    discountPercent = 10,
    maxUses,
    expiryDate,
    createdByAdminId,
  } = dto;

  // Validation
  if (!trainerName || trainerName.trim().length === 0) {
    throw new Error("Trainer name is required");
  }

  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error("Discount percent must be between 0 and 100");
  }

  if (maxUses && maxUses <= 0) {
    throw new Error("Max uses must be greater than 0");
  }

  if (expiryDate && expiryDate <= new Date()) {
    throw new Error("Expiry date must be in the future");
  }

  // Generate unique coupon code
  let couponCode = generateCouponCode(trainerName, discountPercent);
  
  // If code already exists, add random suffix
  let existingCoupon = await prisma.coupon.findUnique({
    where: { code: couponCode },
  });

  if (existingCoupon) {
    // Add random suffix to make it unique
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    couponCode = `${couponCode}_${randomSuffix}`;
  }

  // Create coupon in database
  const coupon = await prisma.coupon.create({
    data: {
      code: couponCode,
      trainerName: trainerName.trim(),
      trainerId,
      discountPercent,
      maxUses,
      expiryDate,
      isActive: true,
      usageCount: 0,
      createdBy: createdByAdminId,
    },
  });

  console.log(`✅ Coupon created: ${couponCode} for trainer ${trainerName}`);

  return {
    id: coupon.id,
    code: coupon.code,
    trainerName: coupon.trainerName,
    discountPercent: coupon.discountPercent,
    isActive: coupon.isActive,
    expiryDate: coupon.expiryDate,
    createdAt: coupon.createdAt,
  };
};

// ==================== COUPON VALIDATION ====================

/**
 * Validate if a coupon code is valid and can be used
 * Checks: existence, active status, expiry, max uses, etc.
 * 
 * @param couponCode - The coupon code to validate
 * @returns Validation result with coupon details if valid
 */
export const validateCoupon = async (
  couponCode: string
): Promise<CouponValidationResult> => {
  // Input validation
  if (!couponCode || couponCode.trim().length === 0) {
    return {
      isValid: false,
      error: "Coupon code is required",
    };
  }

  const trimmedCode = couponCode.trim().toUpperCase();

  // Find coupon in database
  const coupon = await prisma.coupon.findUnique({
    where: { code: trimmedCode },
  });

  // Coupon doesn't exist
  if (!coupon) {
    return {
      isValid: false,
      error: "Invalid coupon code",
    };
  }

  // Check if coupon is active
  if (!coupon.isActive) {
    return {
      isValid: false,
      error: "This coupon code is no longer active",
    };
  }

  // Check expiry date
  if (coupon.expiryDate && coupon.expiryDate < new Date()) {
    return {
      isValid: false,
      error: "This coupon code has expired",
    };
  }

  // Check max uses limit
  if (coupon.maxUses && coupon.usageCount >= coupon.maxUses) {
    return {
      isValid: false,
      error: "This coupon code has reached its usage limit",
    };
  }

  // ✅ Coupon is valid!
  console.log(`✅ Coupon validated: ${trimmedCode}`);

  return {
    isValid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      trainerName: coupon.trainerName,
    },
  };
};

// ==================== COUPON APPLICATION ====================

/**
 * Apply a coupon to an order
 * Validates coupon and calculates discount amount
 * Creates AppliedCoupon record for tracking/reporting
 * 
 * @param couponCode - The coupon code to apply
 * @param orderId - The order ID to apply coupon to
 * @param userId - The user applying the coupon
 * @param cartTotal - The total cart amount before discount
 * @returns Result with discount amount if successful
 */
export const applyCouponToOrder = async (
  couponCode: string,
  orderId: string,
  userId: string,
  cartTotal: number
): Promise<ApplyCouponResult> => {
  // Validate coupon first
  const validationResult = await validateCoupon(couponCode);

  if (!validationResult.isValid) {
    return {
      success: false,
      error: validationResult.error,
    };
  }

  const coupon = validationResult.coupon!;

  try {
    // Calculate discount amount
    const discountAmount = (cartTotal * coupon.discountPercent) / 100;

    // Create AppliedCoupon record (for tracking and reporting)
    const appliedCoupon = await prisma.appliedCoupon.create({
      data: {
        couponId: coupon.id,
        orderId,
        userId,
        discountAmount,
        trainerName: coupon.trainerName,
        commissionNote: `${coupon.discountPercent}% discount = ₹${discountAmount.toFixed(2)} discount given`,
        appliedDate: new Date(),
      },
    });

    // Update coupon usage count
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    console.log(
      `✅ Coupon applied: ${couponCode} to order ${orderId} | Discount: ₹${discountAmount.toFixed(2)}`
    );

    return {
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        trainerName: coupon.trainerName,
        discountPercent: coupon.discountPercent,
      },
      discountAmount,
    };
  } catch (error) {
    console.error("Error applying coupon:", error);
    return {
      success: false,
      error: "Failed to apply coupon. Please try again.",
    };
  }
};

// ==================== COUPON RETRIEVAL & REPORTING ====================

/**
 * Get all coupons with filters
 * Used by admin to view and manage coupons
 * 
 * @param filters - Optional filters (active, trainer name, etc.)
 * @returns List of coupons
 */
export const getAllCoupons = async (filters?: {
  isActive?: boolean;
  trainerName?: string;
}): Promise<any[]> => {
  const coupons = await prisma.coupon.findMany({
    where: {
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters?.trainerName && {
        trainerName: {
          contains: filters.trainerName,
          mode: "insensitive",
        },
      }),
    },
    select: {
      id: true,
      code: true,
      trainerName: true,
      discountPercent: true,
      isActive: true,
      usageCount: true,
      maxUses: true,
      expiryDate: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return coupons;
};

/**
 * Get coupon by ID
 * Includes applied coupons (usage history)
 * 
 * @param couponId - Coupon ID
 * @returns Coupon with usage history
 */
export const getCouponById = async (couponId: string): Promise<any> => {
  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
    include: {
      appliedCoupons: {
        select: {
          id: true,
          orderId: true,
          userId: true,
          discountAmount: true,
          appliedDate: true,
          trainerName: true,
        },
        orderBy: {
          appliedDate: "desc",
        },
        take: 50, // Last 50 usages
      },
    },
  });

  return coupon;
};

/**
 * Get applied coupons by trainer (for commission calculation)
 * Used for reporting and offline commission tracking
 * 
 * @param trainerName - Trainer name
 * @param dateRange - Optional: filter by date range
 * @returns Applied coupons for the trainer
 */
export const getAppliedCouponsByTrainer = async (
  trainerName: string,
  dateRange?: {
    fromDate: Date;
    toDate: Date;
  }
): Promise<any> => {
  const appliedCoupons = await prisma.appliedCoupon.findMany({
    where: {
      trainerName: {
        contains: trainerName,
        mode: "insensitive",
      },
      ...(dateRange && {
        appliedDate: {
          gte: dateRange.fromDate,
          lte: dateRange.toDate,
        },
      }),
    },
    include: {
      coupon: {
        select: {
          code: true,
          discountPercent: true,
        },
      },
      order: {
        select: {
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      appliedDate: "desc",
    },
  });

  // Calculate total discount given to this trainer's codes
  const totalDiscount = appliedCoupons.reduce(
    (sum: number, ac: any) => sum + ac.discountAmount,
    0
  );

  return {
    trainer: trainerName,
    appliedCoupons,
    totalDiscount,
    totalUsages: appliedCoupons.length,
  };
};

// ==================== COUPON MANAGEMENT (ADMIN ONLY) ====================

/**
 * Deactivate a coupon (soft delete)
 * Does not remove data, just marks as inactive
 * 
 * @param couponId - Coupon ID
 * @returns Updated coupon
 */
export const deactivateCoupon = async (couponId: string): Promise<any> => {
  const coupon = await prisma.coupon.update({
    where: { id: couponId },
    data: { isActive: false },
  });

  console.log(`❌ Coupon deactivated: ${coupon.code}`);

  return coupon;
};

/**
 * Reactivate a coupon
 * 
 * @param couponId - Coupon ID
 * @returns Updated coupon
 */
export const reactivateCoupon = async (couponId: string): Promise<any> => {
  const coupon = await prisma.coupon.update({
    where: { id: couponId },
    data: { isActive: true },
  });

  console.log(`✅ Coupon reactivated: ${coupon.code}`);

  return coupon;
};

/**
 * Get commission report for a trainer
 * Shows total coupons issued, total discount given, usage count
 * Used for offline commission calculation
 * 
 * @param trainerName - Trainer name
 * @returns Commission report data
 */
export const getTrainerCommissionReport = async (trainerName: string): Promise<any> => {
  const coupons = await prisma.coupon.findMany({
    where: {
      trainerName: {
        contains: trainerName,
        mode: "insensitive",
      },
    },
    include: {
      appliedCoupons: {
        select: {
          id: true,
          discountAmount: true,
          appliedDate: true,
        },
      },
    },
  });

  // Aggregate data
  const totalCouponsIssued = coupons.length;
  const totalUsages = coupons.reduce((sum: number, c: any) => sum + c.appliedCoupons.length, 0);
  const totalDiscountGiven = coupons.reduce(
    (sum: number, c: any) =>
      sum + c.appliedCoupons.reduce((s: number, ac: any) => s + ac.discountAmount, 0),
    0
  );

  const couponDetails = coupons.map((c: any) => ({
    code: c.code,
    discountPercent: c.discountPercent,
    usageCount: c.appliedCoupons.length,
    totalDiscountAmount: c.appliedCoupons.reduce(
      (sum: number, ac: any) => sum + ac.discountAmount,
      0
    ),
    isActive: c.isActive,
  }));

  return {
    trainerName,
    reportDate: new Date(),
    totalCouponsIssued,
    totalUsages,
    totalDiscountGiven,
    couponDetails,
    commissionNote:
      "This data can be used to calculate trainer commission offline",
  };
};
