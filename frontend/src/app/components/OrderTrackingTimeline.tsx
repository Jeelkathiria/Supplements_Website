import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface OrderTrackingTimelineProps {
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  shippedAt?: string | null;
  deliveredAt?: string | null;
}

export const OrderTrackingTimeline: React.FC<OrderTrackingTimelineProps> = ({ 
  status, 
  createdAt,
  shippedAt,
  deliveredAt
}) => {
  const orderPlacedDate = new Date(createdAt);
  const shippedDate = shippedAt ? new Date(shippedAt) : null;
  const deliveredDate = deliveredAt ? new Date(deliveredAt) : null;

  const stages = [
    {
      label: 'Order Placed',
      description: 'Your order has been confirmed',
      date: orderPlacedDate,
      isCompleted: true,
    },
    {
      label: 'Order Shipped',
      description: 'Package is on the way to you',
      date: shippedDate,
      isCompleted: ['SHIPPED', 'DELIVERED'].includes(status),
    },
    {
      label: 'Order Delivered',
      description: 'Package has been delivered',
      date: deliveredDate,
      isCompleted: status === 'DELIVERED',
    },
  ];

  const formatDate = (date: Date | null) => {
    if (!date) return 'In progress';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (status === 'CANCELLED') {
    return null; // Don't show timeline for cancelled orders
  }

  return (
    <div className="bg-white border rounded p-6 mb-6">
      <h3 className="font-semibold text-lg mb-6">Order Tracking</h3>
      
      <div className="space-y-0">
        {stages.map((stage, index) => (
          <div key={index} className="flex gap-4 pb-6 last:pb-0">
            {/* Timeline Icon */}
            <div className="flex flex-col items-center">
              {stage.isCompleted ? (
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              ) : (
                <Circle className="w-8 h-8 text-gray-300" />
              )}
              
              {index < stages.length - 1 && (
                <div className={`w-0.5 h-12 mt-2 ${stage.isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
              )}
            </div>

            {/* Timeline Content */}
            <div className="flex-1 pt-1">
              <p className={`font-semibold ${stage.isCompleted ? 'text-green-700' : 'text-gray-600'}`}>
                {stage.label}
              </p>
              
              <p className="text-sm text-gray-600 mt-1">
                {stage.description}
              </p>
              
              {stage.date && (
                <p className="text-xs text-gray-500 mt-2">
                  {formatDate(stage.date)} at {formatTime(stage.date)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
