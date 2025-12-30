import React from 'react';

interface PropertyStatusBadgeEnhancedProps {
  status?: string;
  listingType?: "sale" | "rent";
  className?: string;
}

export const PropertyStatusBadgeEnhanced: React.FC<PropertyStatusBadgeEnhancedProps> = ({ 
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
          bgColor: 'bg-black',
          textColor: 'text-red-500'
        };
      case 'rented':
        return {
          text: 'تم الإيجار', 
          bgColor: 'bg-black',
          textColor: 'text-green-500'
        };
      // للدعم القديم - حالات باللغة العربية
      case 'مباع':
        return {
          text: 'تم البيع',
          bgColor: 'bg-black',
          textColor: 'text-red-500'
        };
      case 'مؤجر':
        return {
          text: 'تم الإيجار', 
          bgColor: 'bg-black',
          textColor: 'text-green-500'
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
        absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30
        ${statusConfig.bgColor} ${statusConfig.textColor}
        px-3 py-1 rounded-lg
        font-semibold text-sm
        select-none pointer-events-none
        ${className}
      `}
    >
      <div className="flex items-center justify-center">
        <span className="font-semibold tracking-normal text-sm whitespace-nowrap">
          {statusConfig.text}
        </span>
      </div>
    </div>
  );
};