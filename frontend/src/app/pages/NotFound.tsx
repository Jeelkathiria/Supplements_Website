import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ShoppingCart, Search } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex flex-col items-center justify-center px-4 py-8">
      {/* Protein Molecule SVG Illustration */}
      <svg 
        width="200" 
        height="200" 
        viewBox="0 0 200 200" 
        className="mb-8 opacity-80"
      >
        {/* Protein strand structure */}
        <defs>
          <linearGradient id="proteinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>

        {/* Decorative helix strands */}
        <path
          d="M 60 40 Q 80 60, 100 80 T 140 120"
          stroke="url(#proteinGradient)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 140 40 Q 120 60, 100 80 T 60 120"
          stroke="#f97316"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Amino acid atoms - circles */}
        {/* Left helix atoms */}
        <circle cx="60" cy="40" r="8" fill="#14b8a6" />
        <circle cx="75" cy="58" r="7" fill="#0d9488" />
        <circle cx="100" cy="80" r="8" fill="#14b8a6" />
        <circle cx="125" cy="100" r="7" fill="#0d9488" />
        <circle cx="140" cy="120" r="8" fill="#14b8a6" />

        {/* Right helix atoms */}
        <circle cx="140" cy="40" r="8" fill="#f97316" />
        <circle cx="125" cy="58" r="7" fill="#ea580c" />
        <circle cx="100" cy="80" r="8" fill="#f97316" />
        <circle cx="75" cy="100" r="7" fill="#ea580c" />
        <circle cx="60" cy="120" r="8" fill="#f97316" />

        {/* Central connecting bonds */}
        <line x1="100" y1="80" x2="100" y2="140" stroke="#14b8a6" strokeWidth="2" />
        <circle cx="100" cy="140" r="6" fill="#14b8a6" />

        {/* Additional molecular detail */}
        <circle cx="100" cy="80" r="12" fill="none" stroke="#14b8a6" strokeWidth="1.5" opacity="0.5" />
      </svg>

      {/* Main Content */}
      <div className="text-center max-w-md">
        <h1 className="text-7xl md:text-8xl font-bold text-neutral-800 mb-2">
          404
        </h1>
        <h2 className="text-3xl md:text-4xl font-bold text-neutral-700 mb-4">
          Page Not Found
        </h2>
        <p className="text-neutral-600 text-lg mb-4">
          Oops! The page you're looking for is missing in action—like amino acids without a protein structure!
        </p>
        <p className="text-neutral-500 text-sm mb-8">
          It seems you've reached a page that doesn't exist or you don't have access to it. Let's get you back on track.
        </p>

        {/* Action Buttons */}
<div className="flex flex-col sm:flex-row gap-3 justify-center">
  <button
    onClick={() => navigate('/')}
    className="flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800
               text-white text-sm font-medium py-2 px-4 rounded-md
               transition duration-200"
  >
    <Home className="w-4 h-4" />
    Home
  </button>

  <button
    onClick={() => navigate('/products')}
    className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600
               text-white text-sm font-medium py-2 px-4 rounded-md
               transition duration-200"
  >
    <Search className="w-4 h-4" />
    Products
  </button>

  <button
    onClick={() => navigate('/cart')}
    className="flex items-center justify-center gap-2 bg-neutral-700 hover:bg-neutral-800
               text-white text-sm font-medium py-2 px-4 rounded-md
               transition duration-200"
  >
    <ShoppingCart className="w-4 h-4" />
    Cart
  </button>
</div>

      </div>

      {/* Footer Message */}
      <div className="mt-12 text-center text-neutral-500 text-sm">
        <p>Need help? <button onClick={() => navigate('/contact')} className="text-teal-700 hover:text-teal-800 font-semibold cursor-pointer hover:underline">Contact us</button></p>
      </div>
    </div>
  );
};
