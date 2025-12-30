import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface QuickOption {
    value: string;
    label: string;
    icon?: string;
}

interface NumberSelectorProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    quickOptions: QuickOption[];
    customLabel?: string;
    customPlaceholder?: string;
    maxValue?: number;
    minValue?: number;
    required?: boolean;
    icon?: string;
    colorScheme?: 'rose' | 'cyan' | 'blue' | 'indigo' | 'violet';
    className?: string;
}

const colorSchemes = {
    rose: {
        bg: 'from-rose-500 to-rose-600',
        bgHover: 'hover:from-rose-600 hover:to-rose-700',
        border: 'border-rose-100 hover:border-rose-300',
        text: 'text-rose-500',
        lightBg: 'hover:bg-rose-50 hover:border-rose-400',
    },
    cyan: {
        bg: 'from-cyan-500 to-cyan-600',
        bgHover: 'hover:from-cyan-600 hover:to-cyan-700',
        border: 'border-cyan-100 hover:border-cyan-300',
        text: 'text-cyan-500',
        lightBg: 'hover:bg-cyan-50 hover:border-cyan-400',
    },
    blue: {
        bg: 'from-blue-500 to-blue-600',
        bgHover: 'hover:from-blue-600 hover:to-blue-700',
        border: 'border-blue-100 hover:border-blue-300',
        text: 'text-blue-500',
        lightBg: 'hover:bg-blue-50 hover:border-blue-400',
    },
    indigo: {
        bg: 'from-indigo-500 to-indigo-600',
        bgHover: 'hover:from-indigo-600 hover:to-indigo-700',
        border: 'border-indigo-100 hover:border-indigo-300',
        text: 'text-indigo-500',
        lightBg: 'hover:bg-indigo-50 hover:border-indigo-400',
    },
    violet: {
        bg: 'from-violet-500 to-violet-600',
        bgHover: 'hover:from-violet-600 hover:to-violet-700',
        border: 'border-violet-100 hover:border-violet-300',
        text: 'text-violet-500',
        lightBg: 'hover:bg-violet-50 hover:border-violet-400',
    },
};

export const NumberSelector: React.FC<NumberSelectorProps> = ({
    label,
    value,
    onChange,
    quickOptions,
    customLabel = 'أخرى',
    customPlaceholder = 'أدخل الرقم',
    maxValue = 100,
    minValue = 0,
    required = false,
    icon,
    colorScheme = 'rose',
    className,
}) => {
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customValue, setCustomValue] = useState('');
    const colors = colorSchemes[colorScheme];

    // التحقق من أن القيمة الحالية موجودة في الخيارات السريعة
    const isQuickOption = quickOptions.some(opt => opt.value === value);

    // إذا كانت القيمة الحالية غير موجودة في الخيارات، نعرض الـ custom input
    React.useEffect(() => {
        if (value && !isQuickOption) {
            setShowCustomInput(true);
            setCustomValue(value);
        }
    }, [value, isQuickOption]);

    const handleQuickSelect = (selectedValue: string) => {
        setShowCustomInput(false);
        setCustomValue('');
        onChange(selectedValue);
    };

    const handleCustomClick = () => {
        setShowCustomInput(true);
        if (customValue) {
            onChange(customValue);
        }
    };

    const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // السماح فقط بالأرقام
        if (inputValue === '' || /^\d+$/.test(inputValue)) {
            const numValue = inputValue === '' ? 0 : parseInt(inputValue);

            // التحقق من الحد الأقصى والأدنى
            if (numValue >= minValue && numValue <= maxValue) {
                setCustomValue(inputValue);
                onChange(inputValue);
            } else if (inputValue === '') {
                setCustomValue('');
                onChange('');
            }
        }
    };

    return (
        <div className={cn('bg-white rounded-lg p-4 shadow-sm border transition-colors', colors.border, className)}>
            <Label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                {icon && <span className={colors.text}>{icon}</span>}
                {label}
                {required && <span className="text-red-500 text-base">*</span>}
            </Label>

            <div className="space-y-3">
                {/* الخيارات السريعة */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {quickOptions.map((option) => {
                        const isSelected = value === option.value && !showCustomInput;
                        return (
                            <Button
                                key={option.value}
                                type="button"
                                variant={isSelected ? 'default' : 'outline'}
                                className={cn(
                                    'h-11 text-sm font-semibold shadow-sm transition-all duration-200',
                                    isSelected
                                        ? `bg-gradient-to-r ${colors.bg} ${colors.bgHover} text-white border-0 shadow-md scale-105`
                                        : `border-2 border-gray-300 text-gray-700 ${colors.lightBg}`
                                )}
                                onClick={() => handleQuickSelect(option.value)}
                            >
                                {option.icon && <span className="ml-1">{option.icon}</span>}
                                {option.label}
                            </Button>
                        );
                    })}

                    {/* زر Custom */}
                    <Button
                        type="button"
                        variant={showCustomInput ? 'default' : 'outline'}
                        className={cn(
                            'h-11 text-sm font-semibold shadow-sm transition-all duration-200',
                            showCustomInput
                                ? `bg-gradient-to-r ${colors.bg} ${colors.bgHover} text-white border-0 shadow-md scale-105`
                                : `border-2 border-gray-300 text-gray-700 ${colors.lightBg}`
                        )}
                        onClick={handleCustomClick}
                    >
                        ✏️ {customLabel}
                    </Button>
                </div>

                {/* Custom Input - يظهر عند اختيار "أخرى" */}
                {showCustomInput && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={customValue}
                                onChange={handleCustomInputChange}
                                placeholder={customPlaceholder}
                                min={minValue}
                                max={maxValue}
                                className={cn(
                                    'text-center font-semibold text-lg h-12',
                                    'border-2 focus:ring-2',
                                    `focus:border-${colorScheme}-500 focus:ring-${colorScheme}-500/20`
                                )}
                                autoFocus
                            />
                            {customValue && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-500 hover:text-gray-700"
                                    onClick={() => {
                                        setShowCustomInput(false);
                                        setCustomValue('');
                                        onChange('');
                                    }}
                                >
                                    ✕
                                </Button>
                            )}
                        </div>
                        {customValue && (
                            <p className="text-xs text-gray-500 mt-1 text-center">
                                القيمة المختارة: <span className="font-bold text-gray-700">{customValue}</span>
                                {maxValue && ` (الحد الأقصى: ${maxValue})`}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// مكون مساعد لإنشاء خيارات سريعة للأرقام
export const createNumberOptions = (
    start: number,
    end: number,
    labelPattern?: (n: number) => string
): QuickOption[] => {
    return Array.from({ length: end - start + 1 }, (_, i) => {
        const num = start + i;
        return {
            value: num.toString(),
            label: labelPattern ? labelPattern(num) : num.toString(),
        };
    });
};

// خيارات الطوابق المحددة مسبقاً
export const FLOOR_QUICK_OPTIONS: QuickOption[] = [
    { value: 'الأرضي', label: 'الأرضي', icon: '🏢' },
    { value: '1', label: '1', icon: '1️⃣' },
    { value: '2', label: '2', icon: '2️⃣' },
    { value: '3', label: '3', icon: '3️⃣' },
    { value: '4', label: '4', icon: '4️⃣' },
];

// خيارات غرف النوم المحددة مسبقاً
export const BEDROOM_QUICK_OPTIONS: QuickOption[] = [
    { value: '1', label: '1', icon: '🛏️' },
    { value: '2', label: '2', icon: '🛏️' },
    { value: '3', label: '3', icon: '🛏️' },
    { value: '4', label: '4', icon: '🛏️' },
    { value: '5', label: '5', icon: '🛏️' },
];
