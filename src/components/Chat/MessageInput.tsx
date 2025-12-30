import { FormEvent, useCallback, useRef } from "react";
import { Image, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface MessageInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  onSendImage?: (file: File) => void | Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  isUploading?: boolean;
}

export const MessageInput = ({
  value,
  onValueChange,
  onSend,
  onSendImage,
  placeholder = "اكتب رسالتك...",
  disabled = false,
  isUploading = false,
}: MessageInputProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim() || disabled) {
      return;
    }

    await onSend();
  };

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!onSendImage) {
        return;
      }

      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      await onSendImage(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onSendImage],
  );

  return (
    <form className="flex items-center gap-2" onSubmit={handleSubmit}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        aria-label="تحميل صورة للمحادثة"
      />

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading || !onSendImage}
        title="إرسال صورة"
      >
        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
      </Button>

      <Input
        placeholder={placeholder}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={async (event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (value.trim()) {
              await onSend();
            }
          }
        }}
        className="flex-1"
        disabled={disabled}
      />

      <Button type="submit" disabled={!value.trim() || disabled}>
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};
