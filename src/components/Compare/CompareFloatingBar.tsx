import React from 'react';
import { useCompare } from '@/context/CompareContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, GitCompareArrows, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { getOptimizedImageUrl } from '@/utils/imageOptimization';
import { formatCurrency } from '@/lib/utils';

export function CompareFloatingBar() {
  const { items, remove, clear, setIsOpen } = useCompare();

  if (items.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1100] w-[95vw] max-w-2xl"
      >
        <div className="bg-card border-2 border-primary/30 rounded-2xl shadow-2xl p-3 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <GitCompareArrows className="w-5 h-5 text-primary" />
              <span className="text-sm font-bold">المقارنة</span>
              <Badge variant="secondary" className="text-xs">{items.length}/4</Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                onClick={() => setIsOpen(true)}
                disabled={items.length < 2}
                className="h-8 text-xs gap-1.5"
              >
                <GitCompareArrows className="w-3.5 h-3.5" />
                قارن الآن
              </Button>
              <Button size="sm" variant="ghost" onClick={clear} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="relative flex-shrink-0 w-28 rounded-xl overflow-hidden border bg-muted/50 group"
              >
                <div className="h-16 bg-muted">
                  {item.images?.[0] ? (
                    <img
                      src={getOptimizedImageUrl(item.images[0], 120)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      🏠
                    </div>
                  )}
                </div>
                <div className="p-1.5">
                  <p className="text-[10px] font-medium truncate">{item.title}</p>
                  <p className="text-[10px] text-primary font-bold">{formatCurrency(item.price)}</p>
                </div>
                <button
                  onClick={() => remove(item.id)}
                  className="absolute top-1 right-1 w-5 h-5 bg-destructive/90 text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
