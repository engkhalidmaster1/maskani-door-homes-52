import { useEffect, useMemo, useState, useCallback } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  ChatMessage,
  ConversationListItem,
  ConversationParticipant,
  ConversationPropertySummary,
  MessageRow,
} from "@/types/messaging";

interface UseConversationsResult {
  conversations: ConversationListItem[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  createConversation: (propertyId: string, sellerId: string) => Promise<string | null>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
}

type ConversationQueryResult = Tables<"conversations"> & {
  property?: {
    id: string | null;
    title: string | null;
    price: number | null;
    images: string[] | null;
  } | null;
  buyer_profile?: {
    user_id: string;
    full_name: string | null;
  } | null;
  seller_profile?: {
    user_id: string;
    full_name: string | null;
  } | null;
  last_message?: MessageRow[];
};

const toParticipant = (profile?: { user_id: string; full_name: string | null } | null): ConversationParticipant | undefined => {
  if (!profile) {
    return undefined;
  }

  return {
    userId: profile.user_id,
    fullName: profile.full_name,
  };
};

const toPropertySummary = (property?: {
  id: string | null;
  title: string | null;
  price: number | null;
  images: string[] | null;
} | null): ConversationPropertySummary | null => {
  if (!property) {
    return null;
  }

  return {
    id: property.id,
    title: property.title,
    price: property.price,
    images: property.images ?? null,
  };
};

const mapConversation = (
  conversation: ConversationQueryResult,
  unreadCount: number,
): ConversationListItem => {
  const lastMessageRow = conversation.last_message?.[0];

  const lastMessage: ChatMessage | null = lastMessageRow
    ? {
        ...lastMessageRow,
        message_type: (lastMessageRow.message_type as ChatMessage["message_type"]) ?? "text",
      }
    : null;

  return {
    ...conversation,
    propertySummary: toPropertySummary(conversation.property),
    buyerProfile: toParticipant(conversation.buyer_profile),
    sellerProfile: toParticipant(conversation.seller_profile),
    lastMessage,
    unreadCount,
  };
};

export const useConversations = (): UseConversationsResult => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [rawConversations, setRawConversations] = useState<ConversationListItem[]>([]);

  const fetchUnreadCount = useCallback(
    async (conversationId: string, currentUserId: string): Promise<number> => {
      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conversationId)
        .eq("is_read", false)
        .neq("sender_id", currentUserId);

      if (error) {
        console.error("Failed to count unread messages", error);
        return 0;
      }

      return count ?? 0;
    },
    [],
  );

  const fetchConversations = useCallback(async () => {
    if (!user?.id) {
      setRawConversations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        id,
        property_id,
        buyer_id,
        seller_id,
        created_at,
        updated_at,
        is_active,
        last_message_at,
        property:properties (
          id,
          title,
          price,
          images
        ),
        buyer_profile:profiles!conversations_buyer_id_fkey (
          user_id,
          full_name
        ),
        seller_profile:profiles!conversations_seller_id_fkey (
          user_id,
          full_name
        ),
        last_message:messages!messages_conversation_id_fkey (
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          is_read,
          created_at,
          updated_at
        )
      `,
      )
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("updated_at", { ascending: false })
      .order("created_at", { foreignTable: "last_message", ascending: false })
      .limit(1, { foreignTable: "last_message" });

    if (error) {
      console.error("Failed to load conversations", error);
      toast({
        title: "خطأ في تحميل المحادثات",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const conversations = data ?? [];

    const unreadCounts = await Promise.all(
      conversations.map(async (conversation) => {
        const count = await fetchUnreadCount(conversation.id, user.id);
        return [conversation.id, count] as const;
      }),
    );

    const unreadMap = new Map<string, number>(unreadCounts);

    setRawConversations(
      conversations.map((conversation) =>
        mapConversation(conversation, unreadMap.get(conversation.id) ?? 0),
      ),
    );
    setIsLoading(false);
  }, [fetchUnreadCount, toast, user?.id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    let channel: RealtimeChannel | null = null;

    const subscribe = async () => {
      channel = supabase
        .channel(`conversations-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `sender_id=neq.${user.id}`,
          },
          () => {
            fetchConversations();
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "conversations",
          },
          () => {
            fetchConversations();
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.debug("Realtime conversations subscribed");
          }
        });
    };

    subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchConversations, user?.id]);

  const refresh = useCallback(async () => {
    await fetchConversations();
  }, [fetchConversations]);

  const createConversation = useCallback(
    async (propertyId: string, sellerId: string): Promise<string | null> => {
      if (!user?.id) {
        toast({
          title: "يجب تسجيل الدخول",
          description: "يرجى تسجيل الدخول لبدء محادثة جديدة",
          variant: "destructive",
        });
        return null;
      }

      const { data: existing, error: existingError } = await supabase
        .from("conversations")
        .select("id")
        .eq("property_id", propertyId)
        .eq("buyer_id", user.id)
        .eq("seller_id", sellerId)
        .maybeSingle();

      if (existingError) {
        console.error("Failed to check existing conversation", existingError);
        toast({
          title: "خطأ في إنشاء المحادثة",
          description: existingError.message,
          variant: "destructive",
        });
        return null;
      }

      if (existing?.id) {
        return existing.id;
      }

      const insertPayload: TablesInsert<"conversations"> = {
        property_id: propertyId,
        buyer_id: user.id,
        seller_id: sellerId,
        is_active: true,
      };

      const { data, error } = await supabase
        .from("conversations")
        .insert(insertPayload)
        .select("id")
        .single();

      if (error) {
        console.error("Failed to create conversation", error);
        toast({
          title: "خطأ في إنشاء المحادثة",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      await fetchConversations();
      return data.id;
    },
    [fetchConversations, toast, user?.id],
  );

  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      if (!user?.id) {
        toast({
          title: "يجب تسجيل الدخول",
          description: "لا يمكن إرسال الرسالة بدون تسجيل الدخول",
          variant: "destructive",
        });
        return;
      }

      const payload: TablesInsert<"messages"> = {
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        message_type: "text",
      };

      const { error } = await supabase.from("messages").insert(payload);

      if (error) {
        console.error("Failed to send message", error);
        toast({
          title: "تعذر إرسال الرسالة",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString(), last_message_at: new Date().toISOString() })
        .eq("id", conversationId);

      await fetchConversations();
    },
    [fetchConversations, toast, user?.id],
  );

  const markAsRead = useCallback(
    async (conversationId: string) => {
      if (!user?.id) {
        return;
      }

      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .eq("is_read", false)
        .neq("sender_id", user.id);

      if (error) {
        console.error("Failed to mark conversation messages as read", error);
        toast({
          title: "تعذر تحديث المحادثة",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      await fetchConversations();
    },
    [fetchConversations, toast, user?.id],
  );

  const conversations = useMemo(() => rawConversations, [rawConversations]);

  return {
    conversations,
    isLoading,
    refresh,
    createConversation,
    sendMessage,
    markAsRead,
  };
};
