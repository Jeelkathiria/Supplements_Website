import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Check, X, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

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

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, redirectAfterLogin, setRedirectAfterLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const allRequirementsMet = passwordRequirements.every((req) =>
      req.test(formData.password)
    );
    if (!allRequirementsMet) {
      toast.error('Password does not meet requirements');
      return;
    }

    if (!formData.agreeToTerms) {
      toast.error('Please agree to the Terms and Privacy Policy');
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.name, formData.email, formData.password);
      toast.success('Account created successfully! Welcome to ProFit');
      
      // Redirect to checkout if that's where they came from
      if (redirectAfterLogin) {
        const redirectUrl = redirectAfterLogin;
        setRedirectAfterLogin(null);
        navigate(redirectUrl);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center px-4 py-12">
  <div className="w-full max-w-md">

    {/* Checkout Notification */}
    {isCheckoutRedirect && (
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-3">
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

    <div className="bg-white border border-neutral-200 rounded-2xl px-8 py-10 shadow-lg">

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-neutral-900 rounded-xl mb-4">
          <User className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-semibold mb-1">Create Your Account</h1>
        <p className="text-neutral-600 text-sm">
          Join ProFit and start your fitness journey
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-11 pl-10 pr-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent focus:outline-none transition"
              placeholder="John Doe"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full h-11 pl-10 pr-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent focus:outline-none transition"
              placeholder="you@example.com"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              className="w-full h-11 pl-10 pr-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent focus:outline-none transition"
              placeholder="Create a strong password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Password Rules */}
        {(passwordFocused || formData.password) && (
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-2 text-sm">
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
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full h-11 pl-10 pr-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent focus:outline-none transition"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Terms Agreement */}
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
            className="w-4 h-4 mt-0.5 rounded border-neutral-300 text-neutral-900 focus:ring-2 focus:ring-neutral-900 cursor-pointer"
          />
          <span className="text-sm text-neutral-700">
            I agree to the{' '}
            <Link to="/terms" className="text-neutral-900 hover:underline font-medium">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-neutral-900 hover:underline font-medium">
              Privacy Policy
            </Link>
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create Account
            </>
          )}
        </button>
      </form>
    </div>

    <p className="text-center text-sm text-neutral-600 mt-6">
      Already have an account?{' '}
      <Link 
        to={isCheckoutRedirect ? "/login?redirect=checkout" : "/login"} 
        className="font-medium text-neutral-900 hover:underline"
      >
        Sign in
      </Link>
    </p>
  </div>
</div>

  );
};