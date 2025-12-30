import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  id: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose: (id: string) => void;
}

export const Toast = ({
  id,
  type = 'info',
  title,
  message,
  duration = 5000,
  action,
  onClose
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration === 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        setIsVisible(false);
        setTimeout(() => onClose(id), 300);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, id, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  const typeStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <CheckCircle className="w-5 h-5 text-green-400" />
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <XCircle className="w-5 h-5 text-red-400" />
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: <AlertCircle className="w-5 h-5 text-yellow-400" />
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-400" />
    }
  };

  return (
    <div
      className={cn(
        'relative max-w-md w-full shadow-lg rounded-lg border pointer-events-auto transition-all duration-300',
        typeStyles[type].bg,
        typeStyles[type].border,
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {typeStyles[type].icon}
          </div>
          <div className="mr-3 flex-1">
            {title && (
              <p className={cn('text-sm font-medium', typeStyles[type].text)}>
                {title}
              </p>
            )}
            <p className={cn('text-sm', typeStyles[type].text)}>
              {message}
            </p>
            {action && (
              <div className="mt-3">
                <button
                  onClick={action.onClick}
                  className={cn(
                    'text-sm font-medium underline hover:no-underline',
                    typeStyles[type].text
                  )}
                >
                  {action.label}
                </button>
              </div>
            )}
          </div>
          <div className="flex-shrink-0 flex">
            <button
              onClick={handleClose}
              className={cn(
                'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                typeStyles[type].text,
                'hover:bg-black hover:bg-opacity-10'
              )}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-50 ease-linear',
              type === 'success' ? 'bg-green-400' :
              type === 'error' ? 'bg-red-400' :
              type === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

interface ToastContainerProps {
  toasts: Array<Omit<ToastProps, 'onClose'>>;
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

export const ToastContainer = ({
  toasts,
  onRemove,
  position = 'top-right'
}: ToastContainerProps) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2'
  };

  return (
    <div className={cn('fixed z-50 w-full max-w-sm', positionClasses[position])}>
      <div className="space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={onRemove}
          />
        ))}
      </div>
    </div>
  );
};