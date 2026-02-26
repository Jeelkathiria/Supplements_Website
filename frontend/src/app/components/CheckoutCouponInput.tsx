import React, { useState } from "react";
import { Check, AlertCircle, X, Gift } from "lucide-react";
import { toast } from "sonner";
import * as couponService from "../../services/couponService";

/**
 * COUPON INPUT COMPONENT FOR CHECKOUT
 * 
 * Features:
 * - Validate coupon codes in real-time
 * - Display discount amount after validation
 * - Show error messages for invalid codes
 * - Show success message when coupon is applied
 * - Allow removing applied coupon
 */

interface CouponInputProps {
  cartTotal: number;
  onCouponApplied: (couponData: {
    code: string;
    trainerName: string;
    discountAmount: number;
    discountPercent: number;
  }) => void;
  onCouponRemoved: () => void;
  disabled?: boolean;
}

interface AppliedCoupon {
  code: string;
  trainerName: string;
  discountPercent: number;
  discountAmount: number;
}

export const CheckoutCouponInput: React.FC<CouponInputProps> = ({
  cartTotal,
  onCouponApplied,
  onCouponRemoved,
  disabled = false,
}) => {
  // ==================== STATE ====================
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(!appliedCoupon);

  // ==================== HANDLERS ====================

  /**
   * Validate coupon code when user clicks validate or presses Enter
   */
  const handleValidateCoupon = async () => {
    try {
      // ✅ Validation
      if (!code.trim()) {
        setValidationError("Please enter a coupon code");
        return;
      }

      if (cartTotal <= 0) {
        setValidationError("Cart is empty");
        return;
      }

      setIsValidating(true);
      setValidationError(null);

      // ✅ Validate coupon using service
      const response = await couponService.validateCoupon(code.trim());

      // ✅ Check if coupon is valid
      if (!response.isValid) {
        setValidationError(response.error || "Invalid coupon code");
        return;
      }

      // ✅ Calculate discount
      const coupon = response.coupon;
      const discountAmount = (cartTotal * coupon.discountPercent) / 100;

      // ✅ Set applied coupon
      const appliedCoupon = {
        code: coupon.code,
        trainerName: coupon.trainerName,
        discountPercent: coupon.discountPercent,
        discountAmount,
      };

      setAppliedCoupon(appliedCoupon);
      setShowInput(false);
      setCode("");

      // ✅ Notify parent component
      onCouponApplied(appliedCoupon);

      // ✅ Show success message
      toast.success(
        `✅ Coupon applied! ${coupon.discountPercent}% off (₹${discountAmount.toFixed(2)} saved)`
      );
    } catch (error) {
      console.error("Error validating coupon:", error);
      const message = error instanceof Error ? error.message : "Failed to validate coupon";
      setValidationError(message);
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Handle Enter key press
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleValidateCoupon();
    }
  };

  /**
   * Remove applied coupon
   */
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCode("");
    setShowInput(true);
    setValidationError(null);
    onCouponRemoved();
    toast.success("Coupon removed");
  };

  /**
   * Edit coupon code
   */
  const handleEditCoupon = () => {
    setAppliedCoupon(null);
    setShowInput(true);
    onCouponRemoved();
  };

  // ==================== RENDER ====================

  return (
    <div className="w-full">
      {/* Applied Coupon Display */}
      {appliedCoupon && !showInput && (
        <div className="bg-gradient-to-right from-green-50 to-emerald-50 border-l-4 border-green-600 p-4 rounded-lg mb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Check className="text-green-600 mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-green-900">
                  ✅ Coupon Applied: {appliedCoupon.code}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  <span className="font-medium">{appliedCoupon.trainerName}</span> |{" "}
                  <span className="font-medium">{appliedCoupon.discountPercent}% off</span>
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Discount: <span className="font-bold text-lg">₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleEditCoupon}
                className="text-green-600 hover:text-green-800 transition text-sm underline"
              >
                Change
              </button>
              <button
                onClick={handleRemoveCoupon}
                className="text-red-600 hover:text-red-800 transition"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Input Form */}
      {showInput && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Gift size={20} className="text-blue-600" />
            <h3 className="font-semibold text-gray-800">Apply Coupon Code</h3>
          </div>

          {/* Input Field */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setValidationError(null);
              }}
              onKeyPress={handleKeyPress}
              placeholder="Enter coupon code"
              disabled={disabled || isValidating}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase disabled:bg-gray-200 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleValidateCoupon}
              disabled={disabled || isValidating || !code.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isValidating ? "Validating..." : "Apply"}
            </button>
          </div>

          {/* Error Message */}
          {validationError && (
            <div className="flex items-start gap-2 mt-3 bg-red-50 border border-red-200 p-3 rounded-lg">
              <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <p className="text-sm font-medium text-red-800">{validationError}</p>
                <p className="text-xs text-red-600 mt-1">
                  💡 Check the coupon code spelling and ensure it's not expired
                </p>
              </div>
            </div>
          )}

          {/* Helper Text */}
          <p className="text-xs text-gray-600 mt-3">
            💡 Have a trainer/influencer code? Enter it here to get an instant discount on your order.
          </p>
        </div>
      )}
    </div>
  );
};

export default CheckoutCouponInput;
