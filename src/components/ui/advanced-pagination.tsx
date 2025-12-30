import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { memo, useMemo, useCallback } from "react";

interface AdvancedPaginationProps {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    pageSizeOptions?: number[];
    showPageSizeSelector?: boolean;
    showFirstLast?: boolean;
    maxVisiblePages?: number;
}

/**
 * مكون Pagination محسن ومتقدم
 * 
 * الميزات:
 * - تنقل بين الصفحات مع أزرار متعددة
 * - اختيار حجم الصفحة
 * - عرض معلومات الصفحة الحالية
 * - دعم RTL كامل
 * - محسن بـ React.memo و useMemo و useCallback
 * - تصميم جميل ومتجاوب
 */
export const AdvancedPagination = memo(({
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100],
    showPageSizeSelector = true,
    showFirstLast = true,
    maxVisiblePages = 5
}: AdvancedPaginationProps) => {

    // حساب نطاق العناصر المعروضة
    const itemRange = useMemo(() => {
        const start = (currentPage - 1) * pageSize + 1;
        const end = Math.min(currentPage * pageSize, totalItems);
        return { start, end };
    }, [currentPage, pageSize, totalItems]);

    // حساب أرقام الصفحات المرئية
    const visiblePages = useMemo(() => {
        const pages: number[] = [];
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        // تعديل startPage إذا كنا قريبين من النهاية
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return pages;
    }, [currentPage, totalPages, maxVisiblePages]);

    // Handlers محسنة بـ useCallback
    const handleFirstPage = useCallback(() => {
        onPageChange(1);
    }, [onPageChange]);

    const handlePreviousPage = useCallback(() => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    }, [currentPage, onPageChange]);

    const handleNextPage = useCallback(() => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    }, [currentPage, totalPages, onPageChange]);

    const handleLastPage = useCallback(() => {
        onPageChange(totalPages);
    }, [totalPages, onPageChange]);

    const handlePageClick = useCallback((page: number) => {
        onPageChange(page);
    }, [onPageChange]);

    const handlePageSizeChange = useCallback((value: string) => {
        const newPageSize = parseInt(value);
        onPageSizeChange?.(newPageSize);
        // العودة للصفحة الأولى عند تغيير حجم الصفحة
        onPageChange(1);
    }, [onPageSizeChange, onPageChange]);

    // إذا لم يكن هناك صفحات، لا نعرض شيء
    if (totalPages <= 0) {
        return null;
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border-t border-gray-200 rounded-b-lg" dir="rtl">
            {/* معلومات الصفحة */}
            <div className="text-sm text-gray-700">
                عرض <span className="font-medium text-primary">{itemRange.start}</span> إلى{" "}
                <span className="font-medium text-primary">{itemRange.end}</span> من{" "}
                <span className="font-medium text-primary">{totalItems}</span> نتيجة
            </div>

            {/* أزرار التنقل */}
            <div className="flex items-center gap-2">
                {/* اختيار حجم الصفحة */}
                {showPageSizeSelector && onPageSizeChange && (
                    <div className="flex items-center gap-2 ml-4">
                        <span className="text-sm text-gray-700">عرض:</span>
                        <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                            <SelectTrigger className="w-20 h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {pageSizeOptions.map((size) => (
                                    <SelectItem key={size} value={size.toString()}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* زر الصفحة الأولى */}
                {showFirstLast && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleFirstPage}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0 hover:bg-primary hover:text-white transition-colors"
                        title="الصفحة الأولى"
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                )}

                {/* زر الصفحة السابقة */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 hover:bg-primary hover:text-white transition-colors"
                    title="السابق"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                {/* أرقام الصفحات */}
                <div className="flex items-center gap-1">
                    {visiblePages[0] > 1 && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageClick(1)}
                                className="h-8 w-8 p-0 hover:bg-primary hover:text-white transition-colors"
                            >
                                1
                            </Button>
                            {visiblePages[0] > 2 && (
                                <span className="px-2 text-gray-500">...</span>
                            )}
                        </>
                    )}

                    {visiblePages.map((page) => (
                        <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageClick(page)}
                            className={`h-8 w-8 p-0 transition-colors ${currentPage === page
                                    ? "bg-primary text-white hover:bg-primary/90"
                                    : "hover:bg-primary hover:text-white"
                                }`}
                        >
                            {page}
                        </Button>
                    ))}

                    {visiblePages[visiblePages.length - 1] < totalPages && (
                        <>
                            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                                <span className="px-2 text-gray-500">...</span>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageClick(totalPages)}
                                className="h-8 w-8 p-0 hover:bg-primary hover:text-white transition-colors"
                            >
                                {totalPages}
                            </Button>
                        </>
                    )}
                </div>

                {/* زر الصفحة التالية */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0 hover:bg-primary hover:text-white transition-colors"
                    title="التالي"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* زر الصفحة الأخيرة */}
                {showFirstLast && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLastPage}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0 hover:bg-primary hover:text-white transition-colors"
                        title="الصفحة الأخيرة"
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // دالة مقارنة مخصصة لمنع Re-renders غير الضرورية
    return (
        prevProps.currentPage === nextProps.currentPage &&
        prevProps.totalPages === nextProps.totalPages &&
        prevProps.pageSize === nextProps.pageSize &&
        prevProps.totalItems === nextProps.totalItems &&
        prevProps.onPageChange === nextProps.onPageChange &&
        prevProps.onPageSizeChange === nextProps.onPageSizeChange
    );
});

AdvancedPagination.displayName = "AdvancedPagination";
