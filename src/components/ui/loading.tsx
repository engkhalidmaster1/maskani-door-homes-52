import { useState } from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner = ({ size = 'md', className }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-blue-600', sizeClasses[size], className)} />
  );
};

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const LoadingButton = ({
  loading = false,
  loadingText = 'جاري التحميل...',
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) => {
  return (
    <button
      {...props}
      disabled={loading || disabled}
      className={cn(
        'relative inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {loading && (
        <LoadingSpinner size="sm" className="mr-2" />
      )}
      {loading ? loadingText : children}
    </button>
  );
};

interface LoadingCardProps {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const LoadingCard = ({ loading = false, children, className }: LoadingCardProps) => {
  if (loading) {
    return (
      <div className={cn('bg-white rounded-lg shadow p-6 animate-pulse', className)}>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg shadow p-6', className)}>
      {children}
    </div>
  );
};

interface LoadingOverlayProps {
  loading?: boolean;
  children: React.ReactNode;
  message?: string;
}

export const LoadingOverlay = ({ loading = false, children, message = 'جاري التحميل...' }: LoadingOverlayProps) => {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-2" />
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

interface LoadingListProps {
  loading?: boolean;
  count?: number;
  children: React.ReactNode;
}

export const LoadingList = ({ loading = false, count = 3, children }: LoadingListProps) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <LoadingCard key={index} loading />
        ))}
      </div>
    );
  }

  return <>{children}</>;
};