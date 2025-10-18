// فلاتر موحدة للبحث والتصفية
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { RoleBadge } from "./RoleBadge";

interface UsersFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  showStatusFilter?: boolean;
}

export function UsersFilters({
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  showStatusFilter = true,
}: UsersFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* البحث */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="ابحث بالاسم أو البريد أو الهاتف..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* فلتر الدور */}
      <Select value={roleFilter} onValueChange={onRoleFilterChange}>
        <SelectTrigger>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <SelectValue placeholder="جميع الأدوار" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <span className="font-medium">جميع الأدوار</span>
          </SelectItem>
          <SelectItem value="admin">
            <div className="flex items-center gap-2">
              <span className="text-lg">👑</span>
              <span>مدير النظام</span>
            </div>
          </SelectItem>
          <SelectItem value="office">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏢</span>
              <span>مكتب عقارات</span>
            </div>
          </SelectItem>
          <SelectItem value="agent">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <span>وكيل عقاري</span>
            </div>
          </SelectItem>
          <SelectItem value="publisher">
            <div className="flex items-center gap-2">
              <span className="text-lg">👤</span>
              <span>ناشر عادي</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* فلتر الحالة */}
      {showStatusFilter && onStatusFilterChange && (
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <SelectValue placeholder="جميع الحالات" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="font-medium">جميع الحالات</span>
            </SelectItem>
            <SelectItem value="active">
              <div className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                <span>نشط</span>
              </div>
            </SelectItem>
            <SelectItem value="banned">
              <div className="flex items-center gap-2">
                <span className="text-lg">🚫</span>
                <span>محظور</span>
              </div>
            </SelectItem>
            <SelectItem value="verified">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔰</span>
                <span>موثق فقط</span>
              </div>
            </SelectItem>
            <SelectItem value="unverified">
              <div className="flex items-center gap-2">
                <span className="text-lg">⏳</span>
                <span>غير موثق</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
