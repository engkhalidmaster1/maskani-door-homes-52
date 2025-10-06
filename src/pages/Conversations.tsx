import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { useChat } from "@/hooks/useChat";

import { ConversationList } from "@/components/Chat/ConversationList";
import { ChatHeader } from "@/components/Chat/ChatHeader";
import { MessageBubble } from "@/components/Chat/MessageBubble";
import { MessageInput } from "@/components/Chat/MessageInput";

import type { ConversationListItem } from "@/types/messaging";

export const ConversationsPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState("");

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
  } = useChat({ conversationId: selectedConversationId, autoSubscribe: true });

  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  useEffect(() => {
    if (selectedConversationId) {
      markConversationAsRead(selectedConversationId);
      markAsRead();
    }
  }, [markAsRead, markConversationAsRead, selectedConversationId]);

  const handleSelectConversation = useCallback(
    async (conversation: ConversationListItem) => {
      setSelectedConversationId(conversation.id);
      await markConversationAsRead(conversation.id);
      await markAsRead();
    },
    [markAsRead, markConversationAsRead],
  );

  const handleSendMessage = useCallback(async () => {
    if (!messageDraft.trim() || !selectedConversationId) {
      return;
    }

    await sendMessage(messageDraft.trim());
    setMessageDraft("");
    await Promise.all([refreshMessages(), refreshConversations()]);
  }, [messageDraft, refreshConversations, refreshMessages, selectedConversationId, sendMessage]);

  const handleSendImage = useCallback(
    async (file: File) => {
      if (!selectedConversationId) {
        return;
      }

      await sendImage(file);
      await Promise.all([refreshMessages(), refreshConversations()]);
    },
    [refreshConversations, refreshMessages, selectedConversationId, sendImage],
  );

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <MessageCircle className="h-5 w-5" />
                المحادثات ({conversations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[32rem] p-0">
              <ConversationList
                conversations={conversations}
                selectedConversationId={selectedConversationId}
                onSelect={handleSelectConversation}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                isLoading={isConversationsLoading}
                currentUserId={user?.id}
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            {selectedConversation && selectedConversationId ? (
              <>
                <CardHeader className="border-b">
                  <ChatHeader conversation={selectedConversation} currentUserId={user?.id} />
                </CardHeader>

                <CardContent className="flex h-[32rem] flex-col justify-between p-0">
                  <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
                    {isChatLoading ? (
                      <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>جاري تحميل الرسائل...</span>
                      </div>
                    ) : messages.length === 0 ? (
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
                      disabled={!selectedConversationId}
                      isUploading={isUploading}
                    />
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex h-[32rem] items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="mx-auto mb-4 h-16 w-16 opacity-50" />
                  <h3 className="mb-2 text-lg font-medium">اختر محادثة للبدء</h3>
                  <p>حدد محادثة من القائمة لبدء التواصل</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
