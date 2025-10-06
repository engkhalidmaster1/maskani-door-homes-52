import { Phone, MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import type { ConversationListItem } from "@/types/messaging";

import { getConversationInitials, getOtherParticipant } from "./utils";

export interface ChatHeaderProps {
  conversation: ConversationListItem | null;
  currentUserId?: string;
  onCallClick?: () => void;
  onMoreClick?: () => void;
}

export const ChatHeader = ({ conversation, currentUserId, onCallClick, onMoreClick }: ChatHeaderProps) => {
  if (!conversation) {
    return null;
  }

  const other = getOtherParticipant(conversation, currentUserId);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar>
          {other?.avatarUrl ? (
            <AvatarImage src={other.avatarUrl} alt={other.fullName ?? ""} />
          ) : (
            <AvatarFallback>{getConversationInitials(other)}</AvatarFallback>
          )}
        </Avatar>
        <div>
          <h3 className="text-lg font-medium">{other?.fullName ?? "مستخدم"}</h3>
          <p className="text-sm text-muted-foreground">
            {conversation.propertySummary?.title ?? "بدون عنوان"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onCallClick} title="اتصال">
          <Phone className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onMoreClick} title="خيارات إضافية">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
