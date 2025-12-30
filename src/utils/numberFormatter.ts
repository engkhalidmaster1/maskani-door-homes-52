/**
 * تحويل الأرقام إلى نص عربي
 * يدعم الأرقام حتى التريليونات
 */

const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const hundreds = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

function convertThreeDigits(num: number): string {
    if (num === 0) return '';

    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const o = num % 10;

    let result = '';

    // المئات
    if (h > 0) {
        result += hundreds[h];
    }

    // العشرات والآحاد
    if (t === 0) {
        if (o > 0 && h > 0) result += ' و';
        result += ones[o];
    } else if (t === 1) {
        if (h > 0) result += ' و';
        result += teens[o];
    } else {
        if (h > 0) result += ' و';
        result += tens[t];
        if (o > 0) {
            result += ' و' + ones[o];
        }
    }

    return result;
}

export function numberToArabicText(num: number): string {
    if (!num || num === 0) return 'صفر';
    if (num < 0) return 'سالب ' + numberToArabicText(-num);

    // تقريب للتعامل مع الكسور العشرية
    num = Math.floor(num);

    const trillion = Math.floor(num / 1000000000000);
    const billion = Math.floor((num % 1000000000000) / 1000000000);
    const million = Math.floor((num % 1000000000) / 1000000);
    const thousand = Math.floor((num % 1000000) / 1000);
    const remainder = num % 1000;

    let result = '';

    // التريليونات
    if (trillion > 0) {
        result += convertThreeDigits(trillion);
        if (trillion === 1) {
            result += ' تريليون';
        } else if (trillion === 2) {
            result = 'تريليونان';
        } else {
            result += ' تريليون';
        }
    }

    // المليارات
    if (billion > 0) {
        if (result) result += ' و';
        result += convertThreeDigits(billion);
        if (billion === 1) {
            result += ' مليار';
        } else if (billion === 2) {
            result = result.replace(convertThreeDigits(billion), 'ملياران');
        } else {
            result += ' مليار';
        }
    }

    // الملايين
    if (million > 0) {
        if (result) result += ' و';
        result += convertThreeDigits(million);
        if (million === 1) {
            result += ' مليون';
        } else if (million === 2) {
            result = result.replace(convertThreeDigits(million), 'مليونان');
        } else {
            result += ' مليون';
        }
    }

    // الآلاف
    if (thousand > 0) {
        if (result) result += ' و';
        if (thousand === 1) {
            result += 'ألف';
        } else if (thousand === 2) {
            result += 'ألفان';
        } else if (thousand >= 3 && thousand <= 10) {
            result += convertThreeDigits(thousand) + ' آلاف';
        } else {
            result += convertThreeDigits(thousand) + ' ألف';
        }
    }

    // المئات والعشرات والآحاد
    if (remainder > 0) {
        if (result) result += ' و';
        result += convertThreeDigits(remainder);
    }

    return result.trim() || 'صفر';
}

/**
 * تنسيق الرقم بفواصل كل 3 أرقام
 * @param value - القيمة المراد تنسيقها
 * @returns الرقم منسق مع فواصل
 */
export function formatNumberWithCommas(value: string | number): string {
    if (!value && value !== 0) return '';

    const numStr = value.toString().replace(/,/g, '');
    const parts = numStr.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] ? '.' + parts[1] : '';

    // إضافة فواصل كل 3 أرقام
    const formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return formatted + decimalPart;
}

/**
 * إزالة الفواصل من الرقم
 * @param value - القيمة المنسقة
 * @returns الرقم بدون فواصل
 */
export function removeCommas(value: string): string {
    return value.replace(/,/g, '');
}

/**
 * التحقق من صحة الرقم
 * @param value - القيمة المراد التحقق منها
 * @returns true إذا كان رقم صحيح
 */
export function isValidNumber(value: string): boolean {
    const cleanValue = removeCommas(value);
    return /^\d*\.?\d*$/.test(cleanValue);
}
