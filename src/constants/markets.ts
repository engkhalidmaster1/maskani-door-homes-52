export type MarketValue =
  | "السوق الاول"
  | "السوق الثاني"
  | "السوق الثالث"
  | "السوق الرابع"
  | "السوق الخامس"
  | "السوق السادس"
  | "الفنادق";

export interface MarketOption {
  value: MarketValue;
  label: string;
  icon?: string;
}

export const MARKET_OPTIONS: MarketOption[] = [
  { value: "السوق الاول", label: "السوق الأول", icon: "🏪" },
  { value: "السوق الثاني", label: "السوق الثاني", icon: "🏪" },
  { value: "السوق الثالث", label: "السوق الثالث", icon: "🏪" },
  { value: "السوق الرابع", label: "السوق الرابع", icon: "🏪" },
  { value: "السوق الخامس", label: "السوق الخامس", icon: "🏪" },
  { value: "السوق السادس", label: "السوق السادس", icon: "🏪" },
  { value: "الفنادق", label: "الفنادق", icon: "🏨" },
];

export const normalizeArabicText = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const MARKET_KEYWORDS: Record<MarketValue, string[]> = {
  "السوق الاول": [
    "السوق الاول",
    "السوق الأول",
    "سوق الاول",
    "سوق الأول",
    "market 1",
    "souq 1",
    "سوق رقم 1",
    "قرب 1",
    "قرب الاول",
    "قرب الأول",
    "الاول",
    "الأول",
    "1",
    "١",
  ],
  "السوق الثاني": [
    "السوق الثاني",
    "السوق الثانى",
    "سوق الثاني",
    "سوق الثانى",
    "market 2",
    "souq 2",
    "سوق رقم 2",
    "قرب 2",
    "قرب الثاني",
    "قرب الثانى",
    "الثاني",
    "الثانى",
    "2",
    "٢",
  ],
  "السوق الثالث": [
    "السوق الثالث",
    "سوق الثالث",
    "market 3",
    "souq 3",
    "سوق رقم 3",
    "قرب 3",
    "قرب الثالث",
    "الثالث",
    "3",
    "٣",
  ],
  "السوق الرابع": [
    "السوق الرابع",
    "سوق الرابع",
    "market 4",
    "souq 4",
    "سوق رقم 4",
    "قرب 4",
    "قرب الرابع",
    "الرابع",
    "4",
    "٤",
  ],
  "السوق الخامس": [
    "السوق الخامس",
    "سوق الخامس",
    "market 5",
    "souq 5",
    "سوق رقم 5",
    "قرب 5",
    "قرب الخامس",
    "الخامس",
    "5",
    "٥",
  ],
  "السوق السادس": [
    "السوق السادس",
    "سوق السادس",
    "market 6",
    "souq 6",
    "سوق رقم 6",
    "قرب 6",
    "قرب السادس",
    "السادس",
    "6",
    "٦",
  ],
  الفنادق: [
    "الفنادق",
    "منطقة الفنادق",
    "hotel area",
    "hotels",
    "قرب الفنادق",
    "الفندق",
  ],
};

const LEGACY_MARKET_MAP: Record<string, MarketValue> = {
  "1": "السوق الاول",
  "2": "السوق الثاني",
  "3": "السوق الثالث",
  "4": "السوق الرابع",
  "5": "السوق الخامس",
  "6": "السوق السادس",
  "7": "الفنادق",
  "السوق الأول": "السوق الاول",
  "السوق الثانى": "السوق الثاني",
};

export const resolveMarketValue = (value: string | null | undefined): MarketValue | null => {
  if (!value) {
    return null;
  }

  const directMatch = LEGACY_MARKET_MAP[value];
  if (directMatch) {
    return directMatch;
  }

  const normalizedValue = normalizeArabicText(value);

  for (const option of MARKET_OPTIONS) {
    const normalizedOption = normalizeArabicText(option.value);
    if (normalizedOption === normalizedValue || normalizedValue.includes(normalizedOption)) {
      return option.value;
    }

    const normalizedLabel = normalizeArabicText(option.label);
    if (normalizedLabel === normalizedValue || normalizedValue.includes(normalizedLabel)) {
      return option.value;
    }

    const keywords = MARKET_KEYWORDS[option.value];
    if (
      keywords.some((keyword) => {
        const normalizedKeyword = normalizeArabicText(keyword);
        return normalizedKeyword === normalizedValue || normalizedValue.includes(normalizedKeyword);
      })
    ) {
      return option.value;
    }
  }

  return null;
};

export const getMarketLabel = (value: MarketValue | ""): string => {
  if (!value) {
    return "";
  }

  const option = MARKET_OPTIONS.find((item) => item.value === value);
  return option?.label ?? value;
};
