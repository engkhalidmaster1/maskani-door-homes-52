import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface HomeCard {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  path: string;
  requires_auth: boolean;
  bg_color: string;
  icon_color: string;
  display_order: number;
}

export const useHomeCards = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب البطاقات النشطة
  const { data: cards = [], isLoading, refetch } = useQuery({
    queryKey: ['home-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_active_home_cards');

      if (error) throw error;
      return data as HomeCard[];
    },
  });

  // تحديث ترتيب البطاقة
  const updateOrderMutation = useMutation({
    mutationFn: async ({ cardId, newOrder }: { cardId: string; newOrder: number }) => {
      const { data, error } = await supabase
        .rpc('update_card_order', {
          p_card_id: cardId,
          p_new_order: newOrder
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-cards'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث ترتيب البطاقات بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل تحديث الترتيب",
        variant: "destructive",
      });
      console.error('Order update error:', error);
    },
  });

  // تحديث بيانات البطاقة
  const updateCardMutation = useMutation({
    mutationFn: async (card: HomeCard) => {
      const { data, error } = await supabase
        .rpc('update_home_card', {
          p_card_id: card.id,
          p_title: card.title,
          p_description: card.description,
          p_icon_name: card.icon_name,
          p_path: card.path,
          p_requires_auth: card.requires_auth,
          p_bg_color: card.bg_color,
          p_icon_color: card.icon_color
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-cards'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات البطاقة بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل تحديث البطاقة",
        variant: "destructive",
      });
      console.error('Card update error:', error);
    },
  });

  // تحديث ترتيب عدة بطاقات دفعة واحدة
  const reorderCards = async (newOrder: HomeCard[]) => {
    try {
      // تحديث الترتيب لكل بطاقة
      await Promise.all(
        newOrder.map((card, index) =>
          updateOrderMutation.mutateAsync({
            cardId: card.id,
            newOrder: index + 1
          })
        )
      );
    } catch (error) {
      console.error('Reorder error:', error);
    }
  };

  return {
    cards,
    isLoading,
    refetch,
    updateOrder: updateOrderMutation.mutate,
    updateCard: updateCardMutation.mutate,
    reorderCards,
    isUpdating: updateOrderMutation.isPending || updateCardMutation.isPending,
  };
};