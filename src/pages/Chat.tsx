import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Loader2, MessageCircle } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { useChat } from "@/hooks/useChat";

import { ChatHeader } from "@/components/Chat/ChatHeader";
import { MessageBubble } from "@/components/Chat/MessageBubble";
import { MessageInput } from "@/components/Chat/MessageInput";

export const ChatPage = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const [messageDraft, setMessageDraft] = useState("");

  const { user } = useAuth();
  const {
    conversations,
    isLoading: isConversationsLoading,
    refresh: refreshConversations,
    markAsRead: markConversationAsRead,
  } = useConversations();

  const {
    messages,
    isLoading: isChatLoading,
    isUploading,
    sendMessage,
    sendImage,
    markAsRead,
    refresh: refreshMessages,
  } = useChat({ conversationId: conversationId ?? null });

  useEffect(() => {
    if (conversationId) {
      markConversationAsRead(conversationId);
      markAsRead();
    }
  }, [conversationId, markAsRead, markConversationAsRead]);

  const conversation = useMemo(
    () => conversations.find((item) => item.id === conversationId) ?? null,
    [conversationId, conversations],
  );

  const handleSendMessage = useCallback(async () => {
    if (!conversationId || !messageDraft.trim()) {
      return;
    }

    await sendMessage(messageDraft.trim());
    setMessageDraft("");
    await Promise.all([refreshMessages(), refreshConversations()]);
  }, [conversationId, messageDraft, refreshConversations, refreshMessages, sendMessage]);

  const handleSendImage = useCallback(
    async (file: File) => {
      if (!conversationId) {
        return;
      }

      await sendImage(file);
      await Promise.all([refreshMessages(), refreshConversations()]);
    },
    [conversationId, refreshConversations, refreshMessages, sendImage],
  );

  const handleBack = () => {
    navigate(-1);
  };

  const isLoading = isConversationsLoading || (conversationId !== undefined && isChatLoading);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <Card className="mx-auto max-w-4xl">
          <CardHeader className="flex flex-col gap-4 border-b">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={handleBack} className="flex items-center gap-1">
                <ArrowRight className="h-4 w-4" />
                رجوع
              </Button>
              <div className="flex-1" />
            </div>
            <ChatHeader conversation={conversation} currentUserId={user?.id} />
          </CardHeader>

          <CardContent className="flex h-[70vh] flex-col justify-between p-0">
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>جاري تحميل المحادثة...</span>
              </div>
            ) : !conversationId ? (
              <div className="flex flex-1 items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>المحادثة غير محددة</p>
                </div>
              </div>
            ) : !conversation ? (
              <div className="flex flex-1 items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>تعذر العثور على المحادثة</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
                      <p>ابدأ المحادثة بإرسال رسالة</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={message.sender_id === user?.id}
                      />
                    ))
                  )}
                </div>

                <div className="border-t bg-muted/40 p-4">
                  <MessageInput
                    value={messageDraft}
                    onValueChange={setMessageDraft}
                    onSend={handleSendMessage}
                    onSendImage={handleSendImage}
                    disabled={!conversationId}
                    isUploading={isUploading}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
