import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setEmailSent(true);
      setIsLoading(false);
      toast.success('Password reset link sent to your email');
    }, 1000);
  };

  const handleResend = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Email resent successfully');
    }, 1000);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center px-16 py-48">
        <div className="w-full max-w-md">
          <div className="bg-white border border-neutral-200 rounded-3xl px-32 py-40 shadow-lg text-center">
            
            {/* Success Icon */}
            <div className="inline-flex items-center justify-center w-80 h-80 bg-green-100 rounded-full mb-24">
              <CheckCircle className="w-40 h-40 text-green-600" />
            </div>

            {/* Header */}
            <h1 className="mb-12">Check Your Email</h1>
            <p className="text-neutral-600 mb-32">
              We've sent a password reset link to<br />
              <span className="font-medium text-neutral-900">{email}</span>
            </p>

            {/* Instructions */}
            <div className="bg-neutral-50 rounded-xl p-20 mb-32 text-left">
              <p className="font-medium mb-12">Next steps:</p>
              <ol className="space-y-8 text-neutral-600">
                <li className="flex gap-8">
                  <span className="font-medium text-neutral-900">1.</span>
                  Check your email inbox
                </li>
                <li className="flex gap-8">
                  <span className="font-medium text-neutral-900">2.</span>
                  Click the reset link (valid for 1 hour)
                </li>
                <li className="flex gap-8">
                  <span className="font-medium text-neutral-900">3.</span>
                  Create a new password
                </li>
              </ol>
            </div>

            {/* Actions */}
            <div className="space-y-12">
              <button
                onClick={() => navigate('/login')}
                className="w-full h-48 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors"
              >
                Back to Login
              </button>
              <button
                onClick={handleResend}
                disabled={isLoading}
                className="w-full h-48 border border-neutral-300 rounded-xl font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Resend Email'}
              </button>
            </div>

            {/* Help */}
            <p className="mt-24 text-neutral-500">
              Didn't receive the email? Check your spam folder or{' '}
              <Link to="/support" className="text-neutral-900 hover:underline">
                contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center px-16 py-48">
      <div className="w-full max-w-md">
        
        {/* Main Card */}
        <div className="bg-white border border-neutral-200 rounded-3xl px-32 py-40 shadow-lg">
          
          {/* Back Button */}
          <Link
            to="/login"
            className="inline-flex items-center gap-8 text-neutral-600 hover:text-neutral-900 mb-24 transition-colors"
          >
            <ArrowLeft className="w-20 h-20" />
            Back to login
          </Link>

          {/* Header */}
          <div className="mb-32">
            <div className="inline-flex items-center justify-center w-64 h-64 bg-neutral-900 rounded-2xl mb-16">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="mb-8">Reset Password</h1>
            <p className="text-neutral-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-24">
            
            {/* Email Field */}
            <div className="space-y-8">
              <label htmlFor="email" className="block font-medium">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-16 top-1/2 -translate-y-1/2 w-20 h-20 text-neutral-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-48 pl-48 pr-16 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-transparent focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-52 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center justify-center gap-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-20 h-20 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-24 p-16 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-blue-900 flex items-start gap-8">
              <svg className="w-20 h-20 flex-shrink-0 mt-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">
                For security reasons, we'll send the reset link only if an account exists with this email.
              </span>
            </p>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="mt-24 text-center">
          <p className="text-neutral-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-neutral-900 font-medium hover:underline"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
