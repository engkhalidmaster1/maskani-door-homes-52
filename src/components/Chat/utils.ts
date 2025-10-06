import { format } from "date-fns";
import { ar } from "date-fns/locale";

import type { ConversationListItem, ChatMessage, ConversationParticipant } from "@/types/messaging";

export const formatMessageTime = (value?: string | null) => {
  if (!value) {
    return "";
  }

  try {
    return format(new Date(value), "HH:mm", { locale: ar });
  } catch {
    return "";
  }
};

export const getOtherParticipant = (
  conversation: ConversationListItem,
  currentUserId?: string | null,
): ConversationParticipant | undefined => {
  if (!currentUserId) {
    return conversation.sellerProfile ?? conversation.buyerProfile ?? undefined;
  }

  if (conversation.buyer_id === currentUserId) {
    return conversation.sellerProfile ?? conversation.buyerProfile ?? undefined;
  }

  return conversation.buyerProfile ?? conversation.sellerProfile ?? undefined;
};

export const getConversationInitials = (participant?: ConversationParticipant) => {
  if (!participant?.fullName) {
    return "غ";
  }

  return participant.fullName.slice(0, 2).toUpperCase();
};

export const getLastMessagePreview = (message?: ChatMessage | null) => {
  if (!message) {
    return "";
  }

  if (message.message_type === "image") {
    return "📷 صورة";
  }

  return message.content ?? "";
};
