import { Tables } from "@/integrations/supabase/types";

export type ConversationRow = Tables<"conversations">;
export type MessageRow = Tables<"messages">;

export type MessageType = "text" | "image" | "file";

export interface ConversationParticipant {
  userId: string;
  fullName?: string | null;
  avatarUrl?: string | null;
}

export interface ConversationPropertySummary {
  id: string | null;
  title: string | null;
  price: number | null;
  images: string[] | null;
}

export interface ChatMessage extends MessageRow {
  message_type: MessageType | null;
  senderProfile?: ConversationParticipant;
  attachmentUrl?: string | null;
}

export interface ConversationListItem extends ConversationRow {
  buyerProfile?: ConversationParticipant;
  sellerProfile?: ConversationParticipant;
  propertySummary?: ConversationPropertySummary | null;
  lastMessage?: ChatMessage | null;
  unreadCount: number;
}
