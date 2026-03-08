import L from 'leaflet';

/**
 * Formats price for display on map markers (compact format)
 */
const formatMarkerPrice = (price: number): string => {
  if (price >= 1_000_000_000) {
    const val = price / 1_000_000_000;
    return val % 1 === 0 ? `${val}B` : `${val.toFixed(1)}B`;
  }
  if (price >= 1_000_000) {
    const val = price / 1_000_000;
    return val % 1 === 0 ? `${val}M` : `${val.toFixed(1)}M`;
  }
  if (price >= 1_000) {
    const val = price / 1_000;
    return val % 1 === 0 ? `${val}K` : `${val.toFixed(1)}K`;
  }
  return String(price);
};

// Icon cache to prevent recreation on every render
const iconCache = new Map<string, L.DivIcon>();

/**
 * Creates a price chip marker icon (Zillow/Airbnb style)
 * Cached by price + listing type + approximate status
 */
export const createPriceIcon = (
  price: number,
  listingType: 'sale' | 'rent',
  isApproximate: boolean,
  isHovered: boolean = false
): L.DivIcon => {
  const key = `${price}-${listingType}-${isApproximate}-${isHovered}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const bgColor = listingType === 'sale' ? '#dc2626' : '#2563eb';
  const hoverBg = listingType === 'sale' ? '#b91c1c' : '#1d4ed8';
  const bg = isHovered ? hoverBg : bgColor;
  const label = formatMarkerPrice(price);
  const opacity = isApproximate ? '0.85' : '1';
  const border = isApproximate ? '2px dashed rgba(255,255,255,0.7)' : '2px solid white';
  const scale = isHovered ? 'transform: scale(1.15);' : '';
  const shadow = isHovered
    ? 'box-shadow: 0 4px 14px rgba(0,0,0,0.35);'
    : 'box-shadow: 0 2px 8px rgba(0,0,0,0.25);';

  const icon = L.divIcon({
    html: `
      <div style="
        background: ${bg};
        color: white;
        font-size: 11px;
        font-weight: 700;
        font-family: 'Tajawal', sans-serif;
        padding: 4px 8px;
        border-radius: 6px;
        ${border};
        ${shadow}
        white-space: nowrap;
        opacity: ${opacity};
        ${scale}
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        cursor: pointer;
        position: relative;
      ">
        ${label}
        <div style="
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid ${bg};
        "></div>
      </div>
    `,
    className: 'price-marker-icon',
    iconSize: [0, 0],
    iconAnchor: [0, 28],
    popupAnchor: [0, -32],
  });

  iconCache.set(key, icon);
  return icon;
};

/**
 * Creates a cached user location icon with pulse animation
 */
let userLocationIconCache: L.DivIcon | null = null;

export const createUserLocationIcon = (): L.DivIcon => {
  if (userLocationIconCache) return userLocationIconCache;

  userLocationIconCache = L.divIcon({
    html: `
      <div style="position: relative; width: 40px; height: 40px;">
        <div style="
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 40px; height: 40px;
          background-color: rgba(37, 99, 235, 0.3);
          border-radius: 50%;
          animation: userPulse 2s infinite;
        "></div>
        <div style="
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 18px; height: 18px;
          background-color: #2563eb;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(37,99,235,0.6);
          z-index: 10;
        "></div>
      </div>
      <style>
        @keyframes userPulse {
          0% { transform: translate(-50%,-50%) scale(1); opacity: 0.7; }
          100% { transform: translate(-50%,-50%) scale(2.5); opacity: 0; }
        }
      </style>
    `,
    className: 'user-location-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });

  return userLocationIconCache;
};

/**
 * Clear the icon cache (useful if theme changes)
 */
export const clearIconCache = () => {
  iconCache.clear();
  userLocationIconCache = null;
};
