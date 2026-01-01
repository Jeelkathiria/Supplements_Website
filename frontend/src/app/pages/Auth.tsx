import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

type AuthMode = 'login' | 'register' | 'forgot';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'login') {
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    } else if (mode === 'register') {
      toast.success('Account created successfully!');
      setMode('login');
    } else {
      toast.success('Password reset link sent!');
      setMode('login');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* CARD */}
        <div className="bg-white border border-neutral-200 rounded-2xl px-8 py-10 shadow-sm">

          {/* HEADER */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'register' && 'Create Account'}
              {mode === 'forgot' && 'Reset Password'}
            </h1>
            <p className="text-neutral-600 text-sm">
              {mode === 'login' && 'Sign in to continue'}
              {mode === 'register' && 'Join ProFit today'}
              {mode === 'forgot' && 'We’ll send you a reset link'}
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* NAME */}
            {mode === 'register' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full h-11 pl-11 pr-4 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* EMAIL */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full h-11 pl-11 pr-4 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                />
              </div>
            </div>

            {/* PASSWORD */}
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full h-11 pl-11 pr-11 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-neutral-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-neutral-400" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* OPTIONS */}
            {mode === 'login' && (
              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 rounded" />
                  <span className="text-neutral-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-neutral-900 hover:underline"
                >
                  Forgot?
                </button>
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              className="w-full h-11 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition"
            >
              {mode === 'login' && 'Sign In'}
              {mode === 'register' && 'Create Account'}
              {mode === 'forgot' && 'Send Reset Link'}
            </button>
          </form>

          {/* FOOTER */}
          <div className="mt-6 text-center text-sm">
            {mode === 'login' ? (
              <p className="text-neutral-600">
                Don’t have an account?{' '}
                <button
                  onClick={() => setMode('register')}
                  className="text-neutral-900 font-medium hover:underline"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p className="text-neutral-600">
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-neutral-900 font-medium hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        {/* LEGAL */}
        <p className="mt-6 text-center text-xs text-neutral-500 leading-relaxed">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="text-neutral-900 hover:underline">
            Terms
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-neutral-900 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
};
