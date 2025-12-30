import type { AppRole } from '@/types/appRoles';
import { Crown, Building2, Award, User } from 'lucide-react';
import type { ComponentType } from 'react';

export type UserRole = AppRole;

export const ROLE_CONFIG: Record<UserRole, {
  label: string;
  labelShort: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  dotColor: string;
  emoji: string;
}> = {
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

export function getRoleConfig(role: UserRole) {
  return ROLE_CONFIG[role];
}
