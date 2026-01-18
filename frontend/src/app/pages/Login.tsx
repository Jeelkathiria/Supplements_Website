import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShoppingCart } from 'lucide-react';
import { useAuth } from '../components/context/AuthContext';
import heroBg from '../../images/1001380690 (1).jpg';

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loginWithGoogle, redirectAfterLogin, setRedirectAfterLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
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

  const handleEmailChange = (value: string) => {
    setFormData({ ...formData, email: value });
    if (!value.trim()) {
      setErrors({ ...errors, email: 'Please enter your email address' });
    } else if (!validateEmail(value)) {
      setErrors({ ...errors, email: 'Please enter a valid email address' });
    } else {
      setErrors({ ...errors, email: '' });
    }
  };

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value });
    if (value.trim()) {
      setErrors({ ...errors, password: '' });
    } else {
      setErrors({ ...errors, password: 'Please enter your password' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {
      email: !formData.email.trim() ? 'Please enter your email address' : !validateEmail(formData.email) ? 'Please enter a valid email address' : '',
      password: !formData.password.trim() ? 'Please enter your password' : '',
    };

    setErrors(newErrors);

    // Check if there are any errors
    if (Object.values(newErrors).some(err => err)) {
      return;
    }
    
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      
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
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          
          {/* Logo */}
          <div className="mb-10 text-center lg:text-left">
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
                  Please login to continue checkout
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Your cart items are saved and ready
                </p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Log in to continue
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-900 mb-2">
                Email Address <span className="text-xs text-neutral-500">(required)</span>
              </label>
              <input
                id="email"
                type="text"
                value={formData.email}
                onChange={(e) =>
                  handleEmailChange(e.target.value)
                }
                placeholder="your@email.com"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-800 focus:border-transparent focus:outline-none transition ${errors.email ? 'border-red-500' : 'border-neutral-300'}`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-900 mb-2">
                Password <span className="text-xs text-neutral-500">(required)</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) =>
                    handlePasswordChange(e.target.value)
                  }
                  placeholder="Enter your password"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-800 focus:border-transparent focus:outline-none transition pr-10 ${errors.password ? 'border-red-500' : 'border-neutral-300'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-neutral-900 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-teal-800 hover:bg-teal-900 text-white rounded-lg font-semibold transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
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
              onClick={handleGoogleLogin}
              disabled={isLoading || isGoogleLoading}
              className="w-full h-11 border border-neutral-300 hover:bg-neutral-50 text-neutral-900 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                  Signing in...
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

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-sm text-neutral-700">
            New Here?{' '}
            <Link 
              to={isCheckoutRedirect ? "/register?redirect=checkout" : "/register"} 
              className="font-semibold text-neutral-900 hover:underline"
            >
              Sign up today!
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