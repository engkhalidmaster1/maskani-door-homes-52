import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { numberToArabicText, formatNumberWithCommas, removeCommas, isValidNumber } from "@/utils/numberFormatter";

interface PriceAndLocationSectionProps {
  formData: {
    price: string;
  };
  onChange: (field: string, value: string) => void;
}

export const PriceAndLocationSection = React.memo(({
  formData,
  onChange
}: PriceAndLocationSectionProps) => {
  const [displayPrice, setDisplayPrice] = useState(formData.price);
  const [priceInWords, setPriceInWords] = useState('');

  // تحديث العرض عند تغيير السعر
  useEffect(() => {
    if (formData.price) {
      const formatted = formatNumberWithCommas(formData.price);
      setDisplayPrice(formatted);

      const numValue = parseFloat(removeCommas(formData.price));
      if (!isNaN(numValue) && numValue > 0) {
        setPriceInWords(numberToArabicText(numValue) + ' دينار عراقي');
      } else {
        setPriceInWords('');
      }
    } else {
      setDisplayPrice('');
      setPriceInWords('');
    }
  }, [formData.price]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // التحقق من صحة الإدخال
    if (inputValue === '' || isValidNumber(inputValue)) {
      const cleanValue = removeCommas(inputValue);
      onChange('price', cleanValue);
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl shadow-lg border-2 border-amber-200 p-6 mb-6 hover:shadow-xl transition-shadow duration-300">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 text-white rounded-lg shadow-md">
          <span className="text-lg">💰</span>
        </div>
        <span className="bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
          السعر
        </span>
      </h2>

      <div className="grid grid-cols-1 gap-6">
        {/* السعر */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-amber-100 hover:border-amber-300 transition-colors">
          <Label htmlFor="price" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
            <span className="text-amber-500">💵</span>
            السعر (دينار عراقي) <span className="text-red-500 text-base">*</span>
          </Label>
          <Input
            id="price"
            type="text"
            value={displayPrice}
            onChange={handlePriceChange}
            placeholder="أدخل السعر بالدينار العراقي"
            className="h-12 border-2 border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 rounded-lg text-base font-semibold"
            required
            dir="ltr"
          />
          {priceInWords && (
            <div className="mt-3 p-3 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-900 font-medium text-center">
                <span className="text-amber-600">💰</span> {priceInWords}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});