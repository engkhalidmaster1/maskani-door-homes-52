# Map Price Filter Implementation

## Objective
Add a price filter to the map page similar to Zillow, allowing users to filter properties by a minimum and maximum price range.

## Changes Implemented

### `src/pages/MapPage.tsx`

1.  **Imports**:
    - Imported `Popover`, `PopoverContent`, `PopoverTrigger` from `@/components/ui/popover`.
    - Imported `Label` from `@/components/ui/label`.

2.  **State Management**:
    - Added `minPrice` and `maxPrice` state variables (number | '').
    - Updated `hasActiveFilters` to check for price filters.
    - Updated `clearAllFilters` to reset price filters.

3.  **URL Synchronization**:
    - Updated initialization logic to read `minPrice` and `maxPrice` from URL search params.
    - Updated synchronization logic to write `minPrice` and `maxPrice` to URL search params.

4.  **Filtering Logic**:
    - Updated `filteredMapProperties` to filter the property list based on the selected price range.

5.  **User Interface**:
    - Added a "Price" button with a money bag icon (💰) to the filter bar.
    - Implemented a Popover that opens when the button is clicked.
    - **Updated UI**: Replaced min/max input fields with a **Dual-Range Slider**.
        - **Instant Filtering**: Map markers update immediately while dragging.
        - **Optimized Performance**: URL updates are debounced to prevent lag.
        - **New Limits**:
            - Sale: Max 10 Billion (10,000,000,000).
            - Rent: Max 20 Million (20,000,000).
        - Formatted price labels (e.g., "1.5 مليار").
        - Instant visual feedback.
    - Added a badge to the button to indicate active filters (1 or 2 active price limits).
    - Styled the button to match the existing filter bar aesthetics (glassmorphism effect).

## Bug Fixes
- **Filter Visibility**: Fixed an issue where the filter bar and popover were appearing behind the map by increasing their z-indices.
    - `MapPage.tsx`: Increased filter bar z-index to `z-[1002]`.
    - `popover.tsx`: Increased PopoverContent z-index to `z-[2000]`.
- **Slider Implementation**: Updated `slider.tsx` to support multiple thumbs for range selection.

## Verification
- Verified that the code structure is correct.
- Verified that `Slider` component is correctly used and renders two thumbs.
- Verified that the filtering logic handles the slider values correctly.
- Verified that the filtering logic correctly handles numeric comparisons.
- Verified that URL params are correctly synced.
