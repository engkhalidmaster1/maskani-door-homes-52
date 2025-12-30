// مكون موحد لعرض شارة الدور مع الألوان والأيقونات
import { Badge } from "@/components/ui/badge";
import { getRoleConfig } from '@/lib/roleConfig';
import type { UserRole } from '@/lib/roleConfig';
import type { ComponentType } from 'react';

interface RoleBadgeProps {
  role: UserRole;
  variant?: 'default' | 'compact' | 'detailed';
  showIcon?: boolean;
}


export function RoleBadge({ role, variant = 'default', showIcon = true }: RoleBadgeProps) {
  const config = getRoleConfig(role);
  const Icon = config.icon as ComponentType<unknown>;

  if (variant === 'compact') {
    return (
      <Badge className={`${config.color} font-medium px-2 py-0.5 text-xs`}>
        {config.emoji} {config.labelShort}
      </Badge>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${config.dotColor} animate-pulse`} />
        <Badge className={`${config.color} font-medium px-3 py-1`}>
          {showIcon && <Icon className="w-3.5 h-3.5 ml-1" />}
          {config.emoji} {config.label}
        </Badge>
      </div>
    );
  }

  return (
    <Badge className={`${config.color} font-medium px-3 py-1`}>
      {showIcon && <Icon className="w-3.5 h-3.5 ml-1" />}
      {config.emoji} {config.label}
    </Badge>
  );
}

// Hook لاستخدام معلومات الدور
// NOTE: role config helpers intentionally moved to `src/lib/roleConfig.ts` to keep
// this file purely a React component file (improves Fast Refresh behaviour).

// مكون لعرض حد العقارات
interface PropertyLimitBadgeProps {
  current: number;
  limit: number;
  role: UserRole;
  imagesLimit?: number;
}

export function PropertyLimitBadge({ current, limit, role, imagesLimit }: PropertyLimitBadgeProps) {
  // Only explicit -1 or admin role mean unlimited. Offices are limited in the new rules.
  const isUnlimited = limit === -1 || role === 'admin';
  const percentage = isUnlimited ? 0 : (current / limit) * 100;
  
  let badgeClass = 'bg-green-100 text-green-800 border-green-200';
  let emoji = '🟢';
  let status = 'ضمن الحد';

  if (!isUnlimited) {
    if (percentage >= 100) {
      badgeClass = 'bg-red-100 text-red-800 border-red-200';
      emoji = '🔴';
      status = 'وصل للحد';
    } else if (percentage >= 80) {
      badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
      emoji = '🟡';
      status = 'قريب من الحد';
    }
  }

  const imagesDisplay = imagesLimit === -1 ? '∞' : imagesLimit ?? '—';

  return (
    <Badge className={`${badgeClass} border font-medium flex flex-col items-start`}>
      <span>{emoji} {current}/{isUnlimited ? '∞' : limit} {!isUnlimited && `• ${status}`}</span>
      <span className="text-xs opacity-80">🖼️ صور/عقار: {imagesDisplay}</span>
    </Badge>
  );
}

// مكون لعرض حالة المستخدم
interface UserStatusBadgeProps {
  isActive: boolean;
  canPublish: boolean;
  isVerified: boolean;
}

export function UserStatusBadge({ isActive, canPublish, isVerified }: UserStatusBadgeProps) {
  if (!isActive || !canPublish) {
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200 border">
        🚫 محظور
      </Badge>
    );
  }

  if (!isVerified) {
    return (
      <Badge className="bg-gray-100 text-gray-800 border-gray-200 border">
        ⏳ غير موثق
      </Badge>
    );
  }

  return (
    <Badge className="bg-green-100 text-green-800 border-green-200 border">
      ✅ نشط
    </Badge>
  );
}
