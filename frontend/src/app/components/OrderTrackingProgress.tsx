import React from 'react';

interface OrderTrackingProgressProps {
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
}

export const OrderTrackingProgress: React.FC<OrderTrackingProgressProps> = ({ status }) => {
  const stages = ['Ordered', 'Shipped', 'Delivered'];
  
  const getCurrentStageIndex = () => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'SHIPPED':
        return 1;
      case 'DELIVERED':
        return 2;
      default:
        return 0;
    }
  };

  const currentStage = getCurrentStageIndex();

  // Don't show tracking if order is delivered or cancelled
  if (status === 'DELIVERED' || status === 'CANCELLED') {
    return null;
  }

  return (
    <div className="w-full mt-3">
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            {/* Circle and line */}
            <div className="flex items-center w-full justify-center">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  index <= currentStage
                    ? 'bg-teal-600 border-teal-600'
                    : 'bg-white border-gray-300'
                }`}
              >
                {index <= currentStage && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </div>
              
              {index < stages.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ml-1 transition-all ${
                    index < currentStage ? 'bg-teal-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>

            {/* Label */}
            <p
              className={`text-xs mt-2 text-center font-medium transition-colors ${
                index <= currentStage ? 'text-teal-600' : 'text-gray-500'
              }`}
            >
              {stage}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
