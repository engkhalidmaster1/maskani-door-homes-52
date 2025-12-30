import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { memo } from "react";

interface ErrorFallbackProps {
    error?: Error;
    resetError?: () => void;
    title?: string;
    description?: string;
    showHomeButton?: boolean;
}

/**
 * مكون Error Fallback UI
 * 
 * يعرض واجهة جميلة عند حدوث خطأ
 */
export const ErrorFallback = memo(({
    error,
    resetError,
    title = "حدث خطأ غير متوقع",
    description = "نعتذر عن هذا الإزعاج. يرجى المحاولة مرة أخرى.",
    showHomeButton = true
}: ErrorFallbackProps) => {
    return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                {/* أيقونة */}
                <div className="flex justify-center mb-4">
                    <div className="bg-red-100 rounded-full p-4">
                        <AlertTriangle className="h-12 w-12 text-red-600" />
                    </div>
                </div>

                {/* العنوان */}
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {title}
                </h2>

                {/* الوصف */}
                <p className="text-gray-600 mb-6">
                    {description}
                </p>

                {/* رسالة الخطأ (في وضع التطوير) */}
                {process.env.NODE_ENV === 'development' && error && (
                    <div className="mb-6 p-4 bg-gray-100 rounded-lg text-right" dir="rtl">
                        <p className="text-sm text-gray-700 font-mono break-all">
                            {error.message}
                        </p>
                    </div>
                )}

                {/* الأزرار */}
                <div className="flex gap-3 justify-center">
                    {resetError && (
                        <Button
                            onClick={resetError}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            إعادة المحاولة
                        </Button>
                    )}

                    {showHomeButton && (
                        <Button
                            variant="outline"
                            onClick={() => window.location.href = '/'}
                            className="flex items-center gap-2"
                        >
                            <Home className="h-4 w-4" />
                            العودة للرئيسية
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
});

ErrorFallback.displayName = "ErrorFallback";

/**
 * مكون Property Error Fallback
 * 
 * خاص بأخطاء تحميل العقارات
 */
export const PropertyErrorFallback = memo(({ resetError }: { resetError?: () => void }) => {
    return (
        <ErrorFallback
            title="فشل تحميل العقارات"
            description="حدث خطأ أثناء تحميل العقارات. يرجى المحاولة مرة أخرى."
            resetError={resetError}
            showHomeButton={false}
        />
    );
});

PropertyErrorFallback.displayName = "PropertyErrorFallback";

/**
 * مكون Network Error Fallback
 * 
 * خاص بأخطاء الشبكة
 */
export const NetworkErrorFallback = memo(({ resetError }: { resetError?: () => void }) => {
    return (
        <ErrorFallback
            title="مشكلة في الاتصال"
            description="يبدو أن هناك مشكلة في الاتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى."
            resetError={resetError}
        />
    );
});

NetworkErrorFallback.displayName = "NetworkErrorFallback";

/**
 * مكون 404 Not Found
 */
export const NotFoundFallback = memo(() => {
    return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
                <h1 className="text-9xl font-bold text-gray-200 mb-4">404</h1>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    الصفحة غير موجودة
                </h2>
                <p className="text-gray-600 mb-6">
                    عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
                </p>
                <Button
                    onClick={() => window.location.href = '/'}
                    className="flex items-center gap-2 mx-auto"
                >
                    <Home className="h-4 w-4" />
                    العودة للرئيسية
                </Button>
            </div>
        </div>
    );
});

NotFoundFallback.displayName = "NotFoundFallback";
