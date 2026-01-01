import React from 'react';

export const Loading: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-64 h-64 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-16"></div>
        <p className="text-neutral-600">Loading...</p>
      </div>
    </div>
  );
};
