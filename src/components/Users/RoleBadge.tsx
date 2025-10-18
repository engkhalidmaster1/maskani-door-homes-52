// مكون موحد لعرض شارة الدور مع الألوان والأيقونات
import { Badge } from "@/components/ui/badge";
import { Crown, Building2, Award, User } from "lucide-react";

type UserRole = 'admin' | 'office' | 'agent' | 'publisher';

interface RoleBadgeProps {
  role: UserRole;
  variant?: 'default' | 'compact' | 'detailed';
  showIcon?: boolean;
}

const ROLE_CONFIG = {
  admin: {
    label: 'مدير النظام',
    labelShort: 'مدير',
    icon: Crown,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0',
    dotColor: 'bg-purple-500',
    emoji: '👑',
  },
  office: {
    label: 'مكتب عقارات',
    labelShort: 'مكتب',
    icon: Building2,
    color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0',
    dotColor: 'bg-blue-500',
    emoji: '🏢',
  },
  agent: {
    label: 'وكيل عقاري',
    labelShort: 'وكيل',
    icon: Award,
    color: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0',
    dotColor: 'bg-green-500',
    emoji: '🏆',
  },
  publisher: {
    label: 'ناشر عادي',
    labelShort: 'ناشر',
    icon: User,
    color: 'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0',
    dotColor: 'bg-gray-500',
    emoji: '👤',
  },
};

export function RoleBadge({ role, variant = 'default', showIcon = true }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role];
  const Icon = config.icon;

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
export function useRoleConfig(role: UserRole) {
  return ROLE_CONFIG[role];
}

// مكون لعرض حد العقارات
interface PropertyLimitBadgeProps {
  current: number;
  limit: number;
  role: UserRole;
}

export function PropertyLimitBadge({ current, limit, role }: PropertyLimitBadgeProps) {
  const isUnlimited = limit === -1 || role === 'admin' || role === 'office';
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

  return (
    <Badge className={`${badgeClass} border font-medium`}>
      {emoji} {current}/{isUnlimited ? '∞' : limit} {!isUnlimited && `• ${status}`}
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
