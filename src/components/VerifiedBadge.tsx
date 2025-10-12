import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  verified: boolean;
  className?: string;
  size?: number;
  title?: string;
}

export const VerifiedBadge = ({ verified, className, size = 14, title = 'موثق' }: VerifiedBadgeProps) => {
  if (!verified) return null;
  const px = size + 6;
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-blue-500 border-2 border-white shadow-sm',
        `w-[${px}px] h-[${px}px]`,
        className
      )}
      title={title}
      aria-label="Verified"
    >
      <Check className="text-white" style={{ width: size, height: size }} />
    </span>
  );
};

export default VerifiedBadge;
