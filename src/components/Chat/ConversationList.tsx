import { useMemo } from "react";
import { Loader2, MessageCircle, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import type { ConversationListItem } from "@/types/messaging";

import { cn } from "@/lib/utils";
import {
  formatMessageTime,
  getConversationInitials,
  getLastMessagePreview,
  getOtherParticipant,
} from "./utils";

export interface ConversationListProps {
  conversations: ConversationListItem[];
  selectedConversationId: string | null;
  onSelect: (conversation: ConversationListItem) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  isLoading?: boolean;
  currentUserId?: string;
}

export const ConversationList = ({
  conversations,
  selectedConversationId,
  onSelect,
  searchTerm,
  onSearchTermChange,
  isLoading = false,
  currentUserId,
}: ConversationListProps) => {
  const filteredConversations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const other = getOtherParticipant(conversation, currentUserId);
      const property = conversation.propertySummary;
      return (
        other?.fullName?.toLowerCase().includes(term) ||
        property?.title?.toLowerCase().includes(term)
      );
    });
  }, [conversations, currentUserId, searchTerm]);

  return (
    <div className="flex h-full flex-col">
      <div className="relative p-4 pb-2">
        <Search className="absolute right-7 top-7 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث في المحادثات..."
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className="pr-10"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>جارِ تحميل المحادثات...</span>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <MessageCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>لا توجد محادثات مطابقة</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const other = getOtherParticipant(conversation, currentUserId);
            const preview = getLastMessagePreview(conversation.lastMessage);

            return (
              <button
                type="button"
                key={conversation.id}
                onClick={() => onSelect(conversation)}
                className={cn(
                  "flex w-full items-start gap-3 border-b px-4 py-3 text-right transition-colors hover:bg-muted/60",
                  conversation.id === selectedConversationId ? "bg-muted" : "bg-background",
                )}
              >
                <Avatar className="h-10 w-10">
                  {other?.avatarUrl ? (
                    <AvatarImage src={other.avatarUrl} alt={other.fullName ?? ""} />
                  ) : (
                    <AvatarFallback>{getConversationInitials(other)}</AvatarFallback>
                  )}
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium truncate">{other?.fullName ?? "مستخدم"}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatMessageTime(conversation.last_message_at)}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.propertySummary?.title ?? "بدون عنوان"}
                  </p>

                  {preview && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{preview}</p>
                  )}

                  {conversation.unreadCount > 0 && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {conversation.unreadCount} رسالة جديدة
                    </Badge>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
