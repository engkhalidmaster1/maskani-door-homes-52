import React from 'react';

interface PropertyStatusBadgeProps {
  status?: string;
  listingType?: "sale" | "rent";
  className?: string;
}

export const PropertyStatusBadge: React.FC<PropertyStatusBadgeProps> = ({ 
  status, 
  listingType,
  className = '' 
}) => {
  // لا نعرض شيء إذا كان العقار متاح أو لا يوجد status
  if (!status || status === 'available') {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'sold':
        return {
          text: 'تم البيع',
          bgColor: 'bg-red-600/90',
          textColor: 'text-white',
          borderColor: 'border-red-500'
        };
      case 'rented':
        return {
          text: 'تم الإيجار', 
          bgColor: 'bg-orange-600/90',
          textColor: 'text-white',
          borderColor: 'border-orange-500'
        };
      case 'under_negotiation':
        return {
          text: 'قيد التفاوض',
          bgColor: 'bg-yellow-600/90',
          textColor: 'text-white',
          borderColor: 'border-yellow-500'
        };
      // للدعم القديم - حالات باللغة العربية
      case 'مباع':
        return {
          text: 'تم البيع',
          bgColor: 'bg-red-600/90',
          textColor: 'text-white',
          borderColor: 'border-red-500'
        };
      case 'مؤجر':
        return {
          text: 'تم الإيجار', 
          bgColor: 'bg-orange-600/90',
          textColor: 'text-white',
          borderColor: 'border-orange-500'
        };
      case 'قيد التفاوض':
        return {
          text: 'قيد التفاوض',
          bgColor: 'bg-yellow-600/90',
          textColor: 'text-white',
          borderColor: 'border-yellow-500'
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();
  
  if (!statusConfig) {
    return null;
  }

  return (
    <div
      className={`
        absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20
        ${statusConfig.bgColor} ${statusConfig.textColor}
        px-4 py-2 rounded-xl
        border-3 ${statusConfig.borderColor}
        font-black text-lg shadow-2xl
        backdrop-blur-md
        animate-pulse
        ${className}
      `}
      style={{
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}
    >
      {statusConfig.text}
    </div>
  );
};