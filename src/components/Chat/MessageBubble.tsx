import { memo } from "react";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/messaging";

import { formatMessageTime } from "./utils";

export interface MessageBubbleProps {
  message: ChatMessage;
  isOwn?: boolean;
}

const MessageBubbleComponent = ({ message, isOwn = false }: MessageBubbleProps) => {
  const timestamp = formatMessageTime(message.created_at);

  return (
    <div
      className={cn("flex", {
        "justify-end": isOwn,
        "justify-start": !isOwn,
      })}
    >
      <div
        className={cn(
          "max-w-xs space-y-2 rounded-lg px-3 py-2 text-sm shadow-sm lg:max-w-md",
          isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        {message.message_type === "image" ? (
          <img
            src={message.content}
            alt="مرفق المحادثة"
            className="max-h-60 rounded-md object-cover"
            loading="lazy"
          />
        ) : (
          <p className="leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        )}

        <div
          className={cn("text-[11px]", isOwn ? "text-primary-foreground/80" : "text-muted-foreground")}
        >
          {timestamp}
        </div>
      </div>
    </div>
  );
};

export const MessageBubble = memo(MessageBubbleComponent);
