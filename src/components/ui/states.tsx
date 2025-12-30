import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState = ({
  title,
  description,
  icon,
  action,
  className
}: EmptyStateProps) => {
  return (
    <div className={cn('text-center py-12 px-4', className)}>
      {icon && (
        <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const ErrorState = ({
  title = 'حدث خطأ',
  description = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
  action,
  className
}: ErrorStateProps) => {
  return (
    <div className={cn('text-center py-12 px-4', className)}>
      <XCircle className="mx-auto w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
};

interface SuccessStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SuccessState = ({
  title,
  description,
  action,
  className
}: SuccessStateProps) => {
  return (
    <div className={cn('text-center py-12 px-4', className)}>
      <CheckCircle className="mx-auto w-12 h-12 text-green-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
};

interface InfoStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const InfoState = ({
  title,
  description,
  action,
  className
}: InfoStateProps) => {
  return (
    <div className={cn('text-center py-12 px-4', className)}>
      <Info className="mx-auto w-12 h-12 text-blue-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
};

interface AlertBannerProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  action?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const AlertBanner = ({
  type = 'info',
  title,
  message,
  action,
  onClose,
  className
}: AlertBannerProps) => {
  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const iconStyles = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />
  };

  return (
    <div className={cn('border rounded-md p-4', typeStyles[type], className)}>
      <div className="flex">
        <div className="flex-shrink-0">
          {iconStyles[type]}
        </div>
        <div className="mr-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          <div className="text-sm">
            {message}
          </div>
        </div>
        <div className="flex items-start space-x-2 space-x-reverse">
          {action}
          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 rounded-md hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-600"
            >
              <span className="sr-only">إغلاق</span>
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};