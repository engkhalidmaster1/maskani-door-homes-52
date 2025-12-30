import { useState, useMemo, useCallback } from 'react';

interface UsePaginationProps<T> {
    data: T[];
    initialPageSize?: number;
    initialPage?: number;
}

interface UsePaginationReturn<T> {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    paginatedData: T[];
    goToPage: (page: number) => void;
    nextPage: () => void;
    previousPage: () => void;
    setPageSize: (size: number) => void;
    canGoNext: boolean;
    canGoPrevious: boolean;
}

/**
 * Hook مخصص لإدارة Pagination
 * 
 * الميزات:
 * - إدارة الصفحة الحالية
 * - إدارة حجم الصفحة
 * - حساب البيانات المقسمة تلقائياً
 * - دوال مساعدة للتنقل
 * - محسن بـ useMemo و useCallback
 * 
 * @example
 * ```tsx
 * const { 
 *   paginatedData, 
 *   currentPage, 
 *   totalPages, 
 *   goToPage 
 * } = usePagination({ data: properties, initialPageSize: 20 });
 * ```
 */
export function usePagination<T>({
    data,
    initialPageSize = 10,
    initialPage = 1
}: UsePaginationProps<T>): UsePaginationReturn<T> {
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [pageSize, setPageSizeState] = useState(initialPageSize);

    // حساب إجمالي الصفحات
    const totalPages = useMemo(() => {
        return Math.ceil(data.length / pageSize);
    }, [data.length, pageSize]);

    // حساب البيانات المقسمة للصفحة الحالية
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return data.slice(startIndex, endIndex);
    }, [data, currentPage, pageSize]);

    // التحقق من إمكانية التنقل
    const canGoNext = useMemo(() => currentPage < totalPages, [currentPage, totalPages]);
    const canGoPrevious = useMemo(() => currentPage > 1, [currentPage]);

    // دالة الانتقال لصفحة محددة
    const goToPage = useCallback((page: number) => {
        const validPage = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(validPage);
    }, [totalPages]);

    // دالة الانتقال للصفحة التالية
    const nextPage = useCallback(() => {
        if (canGoNext) {
            setCurrentPage(prev => prev + 1);
        }
    }, [canGoNext]);

    // دالة الانتقال للصفحة السابقة
    const previousPage = useCallback(() => {
        if (canGoPrevious) {
            setCurrentPage(prev => prev - 1);
        }
    }, [canGoPrevious]);

    // دالة تغيير حجم الصفحة
    const setPageSize = useCallback((size: number) => {
        setPageSizeState(size);
        // العودة للصفحة الأولى عند تغيير حجم الصفحة
        setCurrentPage(1);
    }, []);

    return {
        currentPage,
        pageSize,
        totalPages,
        totalItems: data.length,
        paginatedData,
        goToPage,
        nextPage,
        previousPage,
        setPageSize,
        canGoNext,
        canGoPrevious
    };
}

/**
 * Hook مخصص لإدارة Pagination مع Server-side
 * 
 * للاستخدام مع البيانات من الخادم
 * 
 * @example
 * ```tsx
 * const { 
 *   currentPage, 
 *   pageSize, 
 *   goToPage 
 * } = useServerPagination({ 
 *   totalItems: 1000, 
 *   initialPageSize: 20 
 * });
 * ```
 */
export function useServerPagination({
    totalItems,
    initialPageSize = 10,
    initialPage = 1
}: {
    totalItems: number;
    initialPageSize?: number;
    initialPage?: number;
}) {
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [pageSize, setPageSizeState] = useState(initialPageSize);

    // حساب إجمالي الصفحات
    const totalPages = useMemo(() => {
        return Math.ceil(totalItems / pageSize);
    }, [totalItems, pageSize]);

    // التحقق من إمكانية التنقل
    const canGoNext = useMemo(() => currentPage < totalPages, [currentPage, totalPages]);
    const canGoPrevious = useMemo(() => currentPage > 1, [currentPage]);

    // دالة الانتقال لصفحة محددة
    const goToPage = useCallback((page: number) => {
        const validPage = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(validPage);
    }, [totalPages]);

    // دالة الانتقال للصفحة التالية
    const nextPage = useCallback(() => {
        if (canGoNext) {
            setCurrentPage(prev => prev + 1);
        }
    }, [canGoNext]);

    // دالة الانتقال للصفحة السابقة
    const previousPage = useCallback(() => {
        if (canGoPrevious) {
            setCurrentPage(prev => prev - 1);
        }
    }, [canGoPrevious]);

    // دالة تغيير حجم الصفحة
    const setPageSize = useCallback((size: number) => {
        setPageSizeState(size);
        // العودة للصفحة الأولى عند تغيير حجم الصفحة
        setCurrentPage(1);
    }, []);

    // حساب نطاق البيانات للصفحة الحالية (للاستخدام في API calls)
    const offset = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize]);
    const limit = pageSize;

    return {
        currentPage,
        pageSize,
        totalPages,
        totalItems,
        goToPage,
        nextPage,
        previousPage,
        setPageSize,
        canGoNext,
        canGoPrevious,
        offset,
        limit
    };
}
