import React, { createContext, useContext, useState, useCallback } from 'react';

export interface CompareProperty {
  id: string;
  title: string;
  property_type: string;
  listing_type: 'sale' | 'rent';
  price: number;
  area?: number | null;
  bedrooms: number;
  bathrooms: number;
  location?: string | null;
  address?: string | null;
  images?: string[] | null;
  furnished?: string | null;
  amenities?: string[] | null;
  market?: string | null;
  status?: string;
  created_at: string;
}

interface CompareContextType {
  items: CompareProperty[];
  add: (property: CompareProperty) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  toggle: (property: CompareProperty) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CompareContext = createContext<CompareContextType | null>(null);

const MAX_COMPARE = 4;

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareProperty[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const add = useCallback((property: CompareProperty) => {
    setItems(prev => {
      if (prev.length >= MAX_COMPARE || prev.some(p => p.id === property.id)) return prev;
      return [...prev, property];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(p => p.id !== id));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setIsOpen(false);
  }, []);

  const has = useCallback((id: string) => items.some(p => p.id === id), [items]);

  const toggle = useCallback((property: CompareProperty) => {
    setItems(prev => {
      if (prev.some(p => p.id === property.id)) {
        return prev.filter(p => p.id !== property.id);
      }
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, property];
    });
  }, []);

  return (
    <CompareContext.Provider value={{ items, add, remove, clear, has, toggle, isOpen, setIsOpen }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}
