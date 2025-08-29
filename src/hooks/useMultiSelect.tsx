import React, { useState, useCallback, useMemo } from 'react';

export interface UseMultiSelectOptions<T> {
  items: T[];
  getItemId: (item: T) => string | number;
  onSelectionChange?: (selectedItems: T[]) => void;
}

export const useMultiSelect = <T,>({
  items,
  getItemId,
  onSelectionChange
}: UseMultiSelectOptions<T>) => {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // Get selected items
  const selectedItems = useMemo(() => {
    return items.filter(item => selectedIds.has(getItemId(item)));
  }, [items, selectedIds, getItemId]);

  // Toggle single item selection
  const toggleItem = useCallback((item: T) => {
    const id = getItemId(item);
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, [getItemId]);

  // Check if item is selected
  const isSelected = useCallback((item: T) => {
    return selectedIds.has(getItemId(item));
  }, [selectedIds, getItemId]);

  // Select all items
  const selectAll = useCallback(() => {
    const allIds = new Set(items.map(getItemId));
    setSelectedIds(allIds);
  }, [items, getItemId]);

  // Clear all selections
  const clearAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Toggle all selection
  const toggleAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      clearAll();
    } else {
      selectAll();
    }
  }, [selectedIds.size, items.length, selectAll, clearAll]);

  // Check if all items are selected
  const isAllSelected = useMemo(() => {
    return items.length > 0 && selectedIds.size === items.length;
  }, [selectedIds.size, items.length]);

  // Check if some items are selected (for indeterminate state)
  const isSomeSelected = useMemo(() => {
    return selectedIds.size > 0 && selectedIds.size < items.length;
  }, [selectedIds.size, items.length]);

  // Get selection stats
  const selectionStats = useMemo(() => ({
    selectedCount: selectedIds.size,
    totalCount: items.length,
    hasSelection: selectedIds.size > 0,
    isAllSelected,
    isSomeSelected
  }), [selectedIds.size, items.length, isAllSelected, isSomeSelected]);

  // Call onSelectionChange when selection changes
  React.useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedItems);
    }
  }, [selectedItems, onSelectionChange]);

  return {
    selectedItems,
    selectedIds,
    toggleItem,
    isSelected,
    selectAll,
    clearAll,
    toggleAll,
    selectionStats,
    setSelectedIds
  };
};
