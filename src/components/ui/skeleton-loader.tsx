import { memo } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
    variant?: "default" | "circular" | "rectangular" | "text";
    animation?: "pulse" | "wave" | "none";
}

/**
 * مكون Skeleton Loader أساسي
 * 
 * الميزات:
 * - أشكال متعددة (default, circular, rectangular, text)
 * - رسوم متحركة (pulse, wave, none)
 * - قابل للتخصيص بالكامل
 * - محسن بـ React.memo
 */
export const Skeleton = memo(({
    className,
    variant = "default",
    animation = "pulse"
}: SkeletonProps) => {
    const baseClasses = "bg-gray-200";

    const variantClasses = {
        default: "rounded-md",
        circular: "rounded-full",
        rectangular: "rounded-none",
        text: "rounded h-4"
    };

    const animationClasses = {
        pulse: "animate-pulse",
        wave: "animate-shimmer",
        none: ""
    };

    return (
        <div
            className={cn(
                baseClasses,
                variantClasses[variant],
                animationClasses[animation],
                className
            )}
        />
    );
});

Skeleton.displayName = "Skeleton";

/**
 * مكون PropertyCard Skeleton Loader
 * 
 * يعرض هيكل بطاقة العقار أثناء التحميل
 */
export const PropertyCardSkeleton = memo(() => {
    return (
        <div className="overflow-hidden shadow-md border-2 border-gray-100 rounded-lg bg-white">
            {/* صورة العقار */}
            <Skeleton className="h-48 w-full rounded-t-lg rounded-b-none" />

            {/* محتوى البطاقة */}
            <div className="p-4">
                {/* العنوان والسعر */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-8 w-24" />
                </div>

                {/* الموقع */}
                <div className="space-y-2 mb-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>

                {/* المميزات */}
                <div className="flex items-center gap-3 justify-end pt-3 border-t border-gray-200">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                </div>
            </div>
        </div>
    );
});

PropertyCardSkeleton.displayName = "PropertyCardSkeleton";

/**
 * مكون PropertyList Skeleton Loader
 * 
 * يعرض عدة بطاقات هيكلية
 */
export const PropertyListSkeleton = memo(({ count = 6 }: { count?: number }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, index) => (
                <PropertyCardSkeleton key={index} />
            ))}
        </div>
    );
});

PropertyListSkeleton.displayName = "PropertyListSkeleton";

/**
 * مكون Table Skeleton Loader
 */
export const TableSkeleton = memo(({
    rows = 5,
    columns = 4
}: {
    rows?: number;
    columns?: number;
}) => {
    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex gap-4 mb-4 pb-4 border-b">
                {Array.from({ length: columns }).map((_, index) => (
                    <Skeleton key={`header-${index}`} className="h-6 flex-1" />
                ))}
            </div>

            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={`row-${rowIndex}`} className="flex gap-4 mb-3">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-8 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
});

TableSkeleton.displayName = "TableSkeleton";

/**
 * مكون Dashboard Skeleton Loader
 */
export const DashboardSkeleton = memo(() => {
    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-8 w-32 mb-2" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-64 w-full" />
            </div>

            {/* Table */}
            <div className="bg-white p-6 rounded-lg shadow">
                <Skeleton className="h-6 w-48 mb-4" />
                <TableSkeleton rows={5} columns={5} />
            </div>
        </div>
    );
});

DashboardSkeleton.displayName = "DashboardSkeleton";
