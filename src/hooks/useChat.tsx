import { useCallback, useEffect, useMemo, useState } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { TablesInsert } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage, ConversationParticipant, MessageType } from "@/types/messaging";

interface UseChatOptions {
  conversationId: string | null;
  autoSubscribe?: boolean;
}

interface UseChatResult {
  messages: ChatMessage[];
  isLoading: boolean;
  isUploading: boolean;
  refresh: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  sendImage: (file: File) => Promise<void>;
  markAsRead: () => Promise<void>;
}

type MessageQueryRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender_profile?: {
    user_id: string;
    full_name: string | null;
  } | null;
};

const CHAT_BUCKET = "chat-attachments";

const toParticipant = (profile?: { user_id: string; full_name: string | null } | null): ConversationParticipant | undefined => {
  if (!profile) {
    return undefined;
  }

  return {
    userId: profile.user_id,
    fullName: profile.full_name,
  };
};

const mapMessage = (row: MessageQueryRow): ChatMessage => ({
  ...row,
  message_type: (row.message_type as MessageType | null) ?? "text",
  senderProfile: toParticipant(row.sender_profile),
});

export const useChat = ({ conversationId, autoSubscribe = true }: UseChatOptions): UseChatResult => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from("messages")
      .select(
        `
        id,
        conversation_id,
        sender_id,
        content,
        message_type,
        is_read,
        created_at,
        updated_at,
        sender_profile:profiles!messages_sender_id_fkey (
          user_id,
          full_name
        )
      `,
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load messages", error);
      toast({
        title: "خطأ في تحميل الرسائل",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const mapped = (data ?? []).map(mapMessage);
    setMessages(mapped);
    setIsLoading(false);
  }, [conversationId, toast]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!conversationId || !autoSubscribe) {
      return;
    }

    let channel: RealtimeChannel | null = null;

    const subscribe = async () => {
      channel = supabase
        .channel(`chat-${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          () => {
            fetchMessages();
          },
        )
        .subscribe();
    };

    subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [autoSubscribe, conversationId, fetchMessages]);

  const refresh = useCallback(async () => {
    await fetchMessages();
  }, [fetchMessages]);

  const markAsRead = useCallback(async () => {
    if (!conversationId || !user?.id) {
      return;
    }

    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .eq("is_read", false)
      .neq("sender_id", user.id);

    if (error) {
      console.error("Failed to mark messages as read", error);
      toast({
        title: "تعذر تحديث حالة الرسائل",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    await fetchMessages();
  }, [conversationId, fetchMessages, toast, user?.id]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !user?.id) {
        toast({
          title: "لا يمكن الإرسال",
          description: "يرجى تسجيل الدخول وفتح محادثة أولاً",
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

      const timestamp = new Date().toISOString();
      await supabase
        .from("conversations")
        .update({ updated_at: timestamp, last_message_at: timestamp })
        .eq("id", conversationId);

      await fetchMessages();
    },
    [conversationId, fetchMessages, toast, user?.id],
  );

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    if (!conversationId) {
      return null;
    }

    const extension = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${extension ?? "jpg"}`;
    const path = `${conversationId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(CHAT_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Failed to upload chat image", uploadError);
      toast({
        title: "تعذر رفع الصورة",
        description: uploadError.message,
        variant: "destructive",
      });
      return null;
    }

    const { data } = supabase.storage.from(CHAT_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }, [conversationId, toast]);

  const sendImage = useCallback(
    async (file: File) => {
      if (!conversationId || !user?.id) {
        toast({
          title: "لا يمكن الإرسال",
          description: "يرجى تسجيل الدخول وفتح محادثة أولاً",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);

      try {
        const publicUrl = await uploadImage(file);

        if (!publicUrl) {
          return;
        }

        const payload: TablesInsert<"messages"> = {
          conversation_id: conversationId,
          sender_id: user.id,
          content: publicUrl,
          message_type: "image",
        };

        const { error } = await supabase.from("messages").insert(payload);

        if (error) {
          console.error("Failed to send image message", error);
          toast({
            title: "تعذر إرسال الصورة",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        const timestamp = new Date().toISOString();
        await supabase
          .from("conversations")
          .update({ updated_at: timestamp, last_message_at: timestamp })
          .eq("id", conversationId);

        await fetchMessages();
      } finally {
        setIsUploading(false);
      }
    },
    [conversationId, fetchMessages, toast, uploadImage, user?.id],
  );

  return useMemo(
    () => ({
      messages,
      isLoading,
      isUploading,
      refresh,
      sendMessage,
      sendImage,
      markAsRead,
    }),
    [isLoading, isUploading, markAsRead, messages, refresh, sendImage, sendMessage],
  );
};
