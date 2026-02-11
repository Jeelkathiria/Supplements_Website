import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/context/AuthContext';
import { Mail, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await resetPassword(email);
      setEmailSent(true);
      toast.success('Password reset link sent to your email');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;

    setIsLoading(true);
    try {
      await resetPassword(email);
      toast.success('Email resent successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend email');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center px-6 lg:px-8 py-12 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50" />

        <div className="w-full max-w-md relative z-10">
          <div className="bg-white border border-neutral-100 rounded-3xl p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center animate-in fade-in zoom-in duration-500">

            {/* Success Animation Container */}
            <div className="relative inline-flex items-center justify-center w-24 h-24 bg-green-50 rounded-full mb-8">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-25" />
              <CheckCircle className="w-12 h-12 text-green-600 relative z-10" />
            </div>

            {/* Header */}
            <h1 className="text-3xl font-bold text-neutral-900 mb-4 tracking-tight">Check Your Email</h1>
            <p className="text-neutral-500 mb-8 leading-relaxed">
              We've sent a secure password reset link to<br />
              <span className="font-semibold text-neutral-900 break-all">{email}</span>
            </p>

            {/* Instructions */}
            <div className="bg-neutral-50 rounded-2xl p-6 mb-8 text-left border border-neutral-100">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">What's next?</p>
              <ul className="space-y-4">
                <li className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-teal-700">1</span>
                  </div>
                  <p className="text-sm text-neutral-600">Open your inbox and look for our email.</p>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-teal-700">2</span>
                  </div>
                  <p className="text-sm text-neutral-600">Click the reset link to create a new password safely.</p>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <button
                onClick={() => navigate('/login')}
                className="w-full h-12 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 active:scale-[0.98] transition-all"
              >
                Back to Login
              </button>
              <button
                onClick={handleResend}
                disabled={isLoading}
                className="w-full h-12 bg-white border border-neutral-200 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-50 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
                ) : 'I didn\'t receive the email'}
              </button>
            </div>

            {/* Support */}
            <p className="mt-8 text-sm text-neutral-400">
              Need help? Speak with our{' '}
              <Link to="/support" className="text-teal-700 font-medium hover:underline">
                support team
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE - BRANDED SECTION */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-800 via-teal-900 to-neutral-900 items-center justify-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-600 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-blue-600 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 text-white px-16 max-w-xl animate-in fade-in slide-in-from-left duration-700">
          <div className="mb-12">
            <h2 className="text-6xl font-black mb-2 tracking-tighter">SATURN</h2>
            <p className="text-xl font-light tracking-[0.3em] text-teal-300 opacity-80 uppercase">Imports</p>
          </div>

          <div className="space-y-8">
            <h3 className="text-3xl font-bold leading-tight">Securing your journey to peak performance.</h3>
            <p className="text-teal-100/70 text-lg font-light leading-relaxed">
              We take your security seriously. Follow our simple verification process to regain access to your account and premium supplements.
            </p>

            <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-start gap-4">
              <ShieldCheck className="w-8 h-8 text-teal-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-teal-50">Verified Security</p>
                <p className="text-sm text-teal-100/60 mt-1">Multi-factor encryption ensures your password reset is handled with the highest security standards.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-1/2 bg-[#fcfcfc] flex items-center justify-center px-6 lg:px-24">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right duration-700 delay-150">

          {/* Mobile Back Button */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-neutral-900 mb-12 transition-all hover:-translate-x-1 group"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to login</span>
          </Link>

          {/* Header */}
          <div className="mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-800 rounded-2xl mb-6 shadow-xl shadow-teal-900/10">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-black text-neutral-900 mb-3 tracking-tight">Regain Access</h1>
            <p className="text-neutral-500 leading-relaxed">
              Lost your password? No worries. Tell us your email and we'll send a magic link to get you back in.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-bold text-neutral-700 tracking-wide">
                Email Address
              </label>
              <div className="group relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-300 group-focus-within:text-teal-700 transition-colors" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-14 pl-12 pr-4 bg-white border border-neutral-200 rounded-2xl focus:ring-4 focus:ring-teal-700/5 focus:border-teal-800 focus:outline-none transition-all text-neutral-900 placeholder:text-neutral-300 font-medium"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-teal-800 hover:bg-neutral-900 text-white rounded-2xl font-bold text-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-teal-900/10"
            >
              {isLoading ? (
                <>
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Send Magic Link</span>
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <ArrowLeft className="w-3 h-3 rotate-180" />
                  </div>
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-12 pt-8 border-t border-neutral-100 text-center lg:text-left">
            <p className="text-neutral-500">
              Don't have an account yet?{' '}
              <Link
                to="/register"
                className="text-teal-800 font-bold hover:text-teal-900 hover:underline transition-colors ml-1"
              >
                Join the Saturn community
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
