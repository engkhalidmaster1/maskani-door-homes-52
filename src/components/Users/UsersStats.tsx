// إحصائيات موحدة للمستخدمين
import { Card, CardContent } from "@/components/ui/card";
import { Users, Crown, Building2, Award, User, CheckCircle, Ban } from "lucide-react";

interface UsersStatsProps {
  total: number;
  admins: number;
  offices: number;
  agents: number;
  publishers: number;
  verified?: number;
  banned?: number;
}

export function UsersStats({ 
  total, 
  admins, 
  offices, 
  agents, 
  publishers,
  verified,
  banned 
}: UsersStatsProps) {
  const stats = [
    {
      label: 'إجمالي المستخدمين',
      value: total,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'المدراء',
      value: admins,
      icon: Crown,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      label: 'المكاتب العقارية',
      value: offices,
      icon: Building2,
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'الوكلاء',
      value: agents,
      icon: Award,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      label: 'الناشرون',
      value: publishers,
      icon: User,
      color: 'from-gray-500 to-slate-500',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
    },
  ];

  if (verified !== undefined) {
    stats.push({
      label: 'موثقون',
      value: verified,
      icon: CheckCircle,
      color: 'from-green-500 to-teal-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    });
  }

  if (banned !== undefined) {
    stats.push({
      label: 'محظورون',
      value: banned,
      icon: Ban,
      color: 'from-red-500 to-rose-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className={`h-2 bg-gradient-to-r ${stat.color}`} />
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-5 h-5 ${stat.textColor}`} />
                  </div>
                  <span className={`text-2xl font-bold ${stat.textColor}`}>
                    {stat.value.toLocaleString('ar-SA')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
