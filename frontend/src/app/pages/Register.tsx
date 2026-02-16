import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Check, X, ShoppingCart } from 'lucide-react';
import { useAuth } from '../components/context/AuthContext';


interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
];

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  // Only allow 10 digits
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone);
};

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, loginWithGoogle, redirectAfterLogin, setRedirectAfterLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [emailCheckTimeoutId, setEmailCheckTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [phoneCheckTimeoutId, setPhoneCheckTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    terms: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  // Check if redirecting from checkout
  const isCheckoutRedirect = searchParams.get('redirect') === 'checkout';

  useEffect(() => {
    // Prevent back navigation when coming from checkout
    if (isCheckoutRedirect) {
      window.history.pushState(null, '', window.location.href);
      const handlePopState = () => {
        window.history.pushState(null, '', window.location.href);
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isCheckoutRedirect]);

  const handleNameChange = (value: string) => {
    setFormData({ ...formData, name: value });
    if (value.trim()) {
      setErrors({ ...errors, name: '' });
    } else {
      setErrors({ ...errors, name: 'Please enter your full name' });
    }
  };

  const handleEmailChange = (value: string) => {
    setFormData({ ...formData, email: value });
    
    // Clear previous timeout
    if (emailCheckTimeoutId) {
      clearTimeout(emailCheckTimeoutId);
    }
    
    if (!value.trim()) {
      setErrors({ ...errors, email: 'Please enter your email address' });
      setCheckingEmail(false);
    } else if (!validateEmail(value)) {
      setErrors({ ...errors, email: 'Please enter a valid email address' });
      setCheckingEmail(false);
    } else {
      // Check if email already exists after debouncing
      setCheckingEmail(true);
      const timeoutId = setTimeout(async () => {
        try {
          const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
          const response = await fetch(`${API_BASE_URL}/user/check-email?email=${encodeURIComponent(value)}`);
          const data = await response.json();
          
          if (data.exists) {
            setErrors({ ...errors, email: 'This email is already registered. Please login instead.' });
          } else {
            setErrors({ ...errors, email: '' });
          }
        } catch (error) {
          console.error('Error checking email:', error);
          setErrors({ ...errors, email: '' });
        } finally {
          setCheckingEmail(false);
        }
      }, 500);
      
      setEmailCheckTimeoutId(timeoutId);
    }
  };

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, phone: value });
    
    // Clear previous timeout
    if (phoneCheckTimeoutId) {
      clearTimeout(phoneCheckTimeoutId);
    }
    
    if (!value.trim()) {
      setErrors({ ...errors, phone: 'Please enter your phone number' });
      setCheckingPhone(false);
    } else if (!validatePhone(value)) {
      setErrors({ ...errors, phone: 'Phone must be 10 digits' });
      setCheckingPhone(false);
    } else {
      // Check if phone already exists after debouncing
      setCheckingPhone(true);
      const timeoutId = setTimeout(async () => {
        try {
          const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
          const response = await fetch(`${API_BASE_URL}/user/check-phone?phone=${encodeURIComponent(value)}`);
          const data = await response.json();
          
          if (data.exists) {
            setErrors({ ...errors, phone: 'This phone number is already registered.' });
          } else {
            setErrors({ ...errors, phone: '' });
          }
        } catch (error) {
          console.error('Error checking phone:', error);
          setErrors({ ...errors, phone: '' });
        } finally {
          setCheckingPhone(false);
        }
      }, 500);
      
      setPhoneCheckTimeoutId(timeoutId);
    }
  };

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value });
    if (!value) {
      setErrors({ ...errors, password: '' });
    } else {
      const allRequirementsMet = passwordRequirements.every((req) => req.test(value));
      if (!allRequirementsMet) {
        setErrors({ ...errors, password: 'Password does not meet all requirements' });
      } else {
        setErrors({ ...errors, password: '' });
      }
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setFormData({ ...formData, confirmPassword: value });
    if (value && value !== formData.password) {
      setErrors({ ...errors, confirmPassword: 'Passwords do not match' });
    } else {
      setErrors({ ...errors, confirmPassword: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't submit if currently checking email or phone
    if (checkingEmail || checkingPhone) {
      return;
    }
    
    // Don't submit if there are existing errors (from duplicate checks)
    if (Object.values(errors).some(err => err)) {
      return;
    }
    
    // Validate all fields
    const newErrors = {
      name: !formData.name.trim() ? 'Please enter your full name' : '',
      email: !formData.email.trim() ? 'Please enter your email address' : !validateEmail(formData.email) ? 'Please enter a valid email address' : '',
      phone: !formData.phone.trim() ? 'Please enter your phone number' : !validatePhone(formData.phone) ? 'Phone must be 10 digits' : '',
      password: !formData.password ? 'Please enter a password' : passwordRequirements.every((req) => req.test(formData.password)) ? '' : 'Password does not meet all requirements',
      confirmPassword: !formData.confirmPassword ? 'Please confirm your password' : formData.password !== formData.confirmPassword ? 'Passwords do not match' : '',
      terms: !formData.agreeToTerms ? 'Please agree to the Terms and Privacy Policy' : '',
    };

    setErrors(newErrors);

    // Check if there are any errors
    if (Object.values(newErrors).some(err => err)) {
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.name, formData.email, formData.password, formData.phone);
      
      // Wait for auth state to be fully updated and user data to load before redirecting
      setTimeout(() => {
        if (redirectAfterLogin) {
          const redirectUrl = redirectAfterLogin;
          setRedirectAfterLogin(null);
          navigate(redirectUrl);
        } else {
          navigate('/account');
        }
      }, 1000);
    } catch (error: any) {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      
      // Wait a bit for auth state to update before redirecting
      setTimeout(() => {
        if (redirectAfterLogin) {
          const redirectUrl = redirectAfterLogin;
          setRedirectAfterLogin(null);
          navigate(redirectUrl);
        } else {
          navigate('/account');
        }
      }, 500);
    } catch (error: any) {
      setIsGoogleLoading(false);
    }
  };

  return (
  <div className="min-h-screen flex">
    {/* LEFT SIDE - FORM */}
    <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-white overflow-y-auto">
      <div className="w-full max-w-md">
        
        {/* Logo */}
        <div className="mb-8 text-center lg:text-left">
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
            SATURNIMPORTS
          </h2>
          <p className="text-xs text-neutral-500 mt-1 tracking-widest">PREMIUM SUPPLEMENTS</p>
        </div>

        {/* Checkout Notification */}
        {isCheckoutRedirect && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 flex items-start gap-3">
            <ShoppingCart className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Please create an account to continue checkout
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                Your cart items are saved and ready
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-1">
            Create Account
          </h1>
          <p className="text-sm text-neutral-600">
            Join SATURNIMPORTS and start your fitness journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">Full Name <span className="text-xs text-neutral-500">(required)</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-800 focus:border-transparent focus:outline-none transition ${errors.name ? 'border-red-500' : 'border-neutral-300'}`}
              placeholder="John Doe"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">Email Address <span className="text-xs text-neutral-500">(required)</span></label>
            <div className="relative">
              <input
                type="text"
                value={formData.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-800 focus:border-transparent focus:outline-none transition ${errors.email ? 'border-red-500' : 'border-neutral-300'}`}
                placeholder="you@email.com"
              />
              {checkingEmail && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">Checking...</span>}
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">Phone Number <span className="text-xs text-neutral-500">(10 digits)</span></label>
            <div className="relative">
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-800 focus:border-transparent focus:outline-none transition ${errors.phone ? 'border-red-500' : 'border-neutral-300'}`}
                placeholder="9876543210"
              />
              {checkingPhone && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">Checking...</span>}
            </div>
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">Password <span className="text-xs text-neutral-500">(required)</span></label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-800 focus:border-transparent focus:outline-none transition pr-10 ${errors.password ? 'border-red-500' : 'border-neutral-300'}`}
                placeholder="Create a strong password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
          </div>

          {/* Password Rules */}
          {(passwordFocused || formData.password) && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-2 text-xs">
              {passwordRequirements.map(req => {
                const met = req.test(formData.password);
                return (
                  <div key={req.label} className="flex items-center gap-2">
                    {met ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-neutral-400" />}
                    <span className={met ? 'text-green-600' : 'text-neutral-600'}>
                      {req.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">Confirm Password <span className="text-xs text-neutral-500">(required)</span></label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-800 focus:border-transparent focus:outline-none transition pr-10 ${errors.confirmPassword ? 'border-red-500' : 'border-neutral-300'}`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 transition-colors"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
          </div>

          {/* Terms Agreement */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={(e) => {
                setFormData({ ...formData, agreeToTerms: e.target.checked });
                if (e.target.checked) {
                  setErrors({ ...errors, terms: '' });
                }
              }}
              className="w-4 h-4 mt-1 rounded border-neutral-300 text-teal-800 focus:ring-2 focus:ring-teal-800 cursor-pointer"
            />
            <span className="text-xs text-neutral-700">
              I agree to the{' '}
              <Link to="/terms" className="text-teal-800 hover:underline font-semibold">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-teal-800 hover:underline font-semibold">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.terms && <p className="text-xs text-red-500">{errors.terms}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || isGoogleLoading || checkingEmail || checkingPhone || Object.values(errors).some(err => err)}
            className="w-full h-12 bg-teal-800 hover:bg-teal-900 text-white rounded-lg font-semibold transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating account...
              </div>
            ) : checkingEmail || checkingPhone ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </div>
            ) : (
              'Create Account'
            )}
          </button>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-neutral-600 text-sm">Continue with</span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="space-y-3">
            
            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isLoading || isGoogleLoading}
              className="w-full h-11 border border-neutral-300 hover:bg-neutral-50 text-neutral-900 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                  Signing up...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </>
              )}
            </button>
          </div>
        </form>

        {/* Sign In Link */}
        <p className="mt-8 text-center text-sm text-neutral-700">
          Already have an account?{' '}
          <Link 
            to={isCheckoutRedirect ? "/login?redirect=checkout" : "/login"} 
            className="font-semibold text-neutral-900 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>

    {/* RIGHT SIDE - BRANDED SECTION */}
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-800 via-teal-900 to-neutral-900 flex items-center justify-center relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-teal-700/20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-neutral-800/30 rounded-full blur-3xl" />
      
      {/* Content */}
      <div className="relative z-10 text-white text-center px-12 max-w-md">
        <div className="mb-8">
          <h2 className="text-5xl font-bold mb-3 tracking-tight">
            SATURN
          </h2>
          <h3 className="text-2xl font-light tracking-widest text-teal-200">
            IMPORTS
          </h3>
          <div className="w-16 h-1 bg-gradient-to-r from-teal-400 to-transparent mx-auto mt-6" />
        </div>

        <div className="space-y-6 mt-12">
          <p className="text-lg font-light text-teal-100">
            Premium Supplements for Elite Performance
          </p>
          
          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-teal-400 rounded-full" />
              <p className="text-sm text-teal-100">100% Authentic Products</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-teal-400 rounded-full" />
              <p className="text-sm text-teal-100">Fast & Reliable Shipping</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-teal-400 rounded-full" />
              <p className="text-sm text-teal-100">Expert Customer Support</p>
            </div>
          </div>

          <p className="text-xs text-teal-200 pt-6 italic">
            Your trusted partner in achieving your fitness goals
          </p>
        </div>
      </div>
    </div>
  </div>
  );
};