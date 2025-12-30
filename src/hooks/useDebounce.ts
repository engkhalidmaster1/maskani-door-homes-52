import { useState, useEffect } from 'react';

/**
 * Hook useDebounce
 * 
 * يؤخر تحديث القيمة حتى يتوقف المستخدم عن الكتابة
 * مفيد للبحث والفلترة
 * 
 * @param value - القيمة المراد تأخيرها
 * @param delay - وقت التأخير بالميلي ثانية (افتراضي: 500ms)
 * 
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   // سيتم تنفيذ البحث فقط بعد توقف المستخدم عن الكتابة لمدة 500ms
 *   if (debouncedSearchTerm) {
 *     searchProperties(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // إنشاء timer
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // تنظيف timer عند تغيير القيمة أو عند unmount
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook useThrottle
 * 
 * يحد من عدد مرات تنفيذ دالة في فترة زمنية معينة
 * مفيد للأحداث المتكررة مثل scroll و resize
 * 
 * @param value - القيمة المراد تحديدها
 * @param interval - الفترة الزمنية بالميلي ثانية (افتراضي: 500ms)
 * 
 * @example
 * ```tsx
 * const [scrollPosition, setScrollPosition] = useState(0);
 * const throttledScrollPosition = useThrottle(scrollPosition, 200);
 * 
 * useEffect(() => {
 *   const handleScroll = () => {
 *     setScrollPosition(window.scrollY);
 *   };
 *   
 *   window.addEventListener('scroll', handleScroll);
 *   return () => window.removeEventListener('scroll', handleScroll);
 * }, []);
 * ```
 */
export function useThrottle<T>(value: T, interval: number = 500): T {
    const [throttledValue, setThrottledValue] = useState<T>(value);
    const [lastExecuted, setLastExecuted] = useState<number>(Date.now());

    useEffect(() => {
        const now = Date.now();
        const timeSinceLastExecuted = now - lastExecuted;

        if (timeSinceLastExecuted >= interval) {
            setThrottledValue(value);
            setLastExecuted(now);
        } else {
            const timer = setTimeout(() => {
                setThrottledValue(value);
                setLastExecuted(Date.now());
            }, interval - timeSinceLastExecuted);

            return () => {
                clearTimeout(timer);
            };
        }
    }, [value, interval, lastExecuted]);

    return throttledValue;
}
