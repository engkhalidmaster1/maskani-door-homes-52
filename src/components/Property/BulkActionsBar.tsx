import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  Eye, 
  EyeOff, 
  X, 
  CheckSquare, 
  Square,
  AlertTriangle 
} from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  onSelectAll: () => void;
  onClearAll: () => void;
  onBulkDelete: () => void;
  onBulkPublish?: () => void;
  onBulkUnpublish?: () => void;
  isVisible: boolean;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  totalCount,
  isAllSelected,
  isSomeSelected,
  onSelectAll,
  onClearAll,
  onBulkDelete,
  onBulkPublish,
  onBulkUnpublish,
  isVisible
}) => {
  if (!isVisible) return null;

  return (
    <Card className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 shadow-2xl border-2 border-primary/20">
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        {/* Selection Info */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={isAllSelected ? onClearAll : onSelectAll}
            className="h-8 w-8 p-0"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-primary" />
            ) : isSomeSelected ? (
              <Square className="w-4 h-4 text-primary opacity-50" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
          </Button>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {selectedCount} محدد
            </Badge>
            <span className="text-sm text-gray-600">
              من {totalCount} عقار
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onBulkPublish && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkPublish}
              className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
            >
              <Eye className="w-4 h-4" />
              نشر
            </Button>
          )}
          
          {onBulkUnpublish && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkUnpublish}
              className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <EyeOff className="w-4 h-4" />
              إلغاء النشر
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkDelete}
            className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            حذف ({selectedCount})
          </Button>
        </div>

        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

// Confirmation Dialog Component
interface BulkDeleteConfirmationProps {
  isOpen: boolean;
  selectedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const BulkDeleteConfirmation: React.FC<BulkDeleteConfirmationProps> = ({
  isOpen,
  selectedCount,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">تأكيد الحذف</h3>
              <p className="text-sm text-gray-600">
                هذا الإجراء لا يمكن التراجع عنه
              </p>
            </div>
          </div>
          
          <p className="text-gray-700 mb-6">
            هل أنت متأكد من حذف <strong>{selectedCount}</strong> عقار؟
            سيتم حذف جميع البيانات والصور المرتبطة بها نهائياً.
          </p>
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              حذف {selectedCount} عقار
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};






