import React, { useState } from 'react';
import { Phone, Mail, MessageCircle, MapPin, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type RealEstateOffice } from '@/hooks/useRealEstateOfficesDB';
import { useContactRequests } from '@/hooks/useContactRequests';

interface ContactModalProps {
  office: RealEstateOffice;
}

interface ContactModalExtendedProps extends ContactModalProps {
  buttonVariant?: 'default' | 'outline';
  fullWidth?: boolean;
}

export const ContactModal = ({ office, buttonVariant = 'default', fullWidth = false }: ContactModalExtendedProps) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const { toast } = useToast();
  const { sendContactRequest } = useContactRequests();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!senderName.trim() || !senderPhone.trim() || !message.trim()) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    // حفظ طلب التواصل في قاعدة البيانات
    const success = await sendContactRequest(office.id, {
      sender_name: senderName.trim(),
      sender_phone: senderPhone.trim(),
      message: message.trim(),
      contact_method: 'whatsapp'
    });

    if (success) {
      // تحضير رسالة واتساب
      const whatsappMessage = encodeURIComponent(
        `مرحباً، اسمي ${senderName}\n` +
        `رقم هاتفي: ${senderPhone}\n\n` +
        `${message}\n\n` +
        `أريد التواصل معكم بخصوص خدماتكم العقارية.`
      );
      
      const phoneNumber = office.phone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${phoneNumber}?text=${whatsappMessage}`);
      
      toast({
        title: "تم الإرسال",
        description: `تم فتح واتساب للتواصل مع ${office.name}`,
      });

      // إغلاق النافذة وإعادة تعيين النموذج
      setOpen(false);
      setSenderName('');
      setSenderPhone('');
      setMessage('');
    }
  };

  const handleDirectCall = () => {
    window.open(`tel:${office.phone}`);
    toast({
      title: "فتح تطبيق الهاتف",
      description: `جاري الاتصال بـ ${office.name}`,
    });
  };

  const handleDirectEmail = () => {
    if (office.email) {
      window.open(`mailto:${office.email}`);
      toast({
        title: "فتح تطبيق البريد",
        description: `جاري إرسال بريد إلى ${office.name}`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={buttonVariant}
          size={fullWidth ? "default" : "sm"} 
          className={`${fullWidth ? "w-full" : "w-full"} flex items-center gap-2`}
        >
          <MessageCircle className="h-4 w-4" />
          تواصل معنا
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-right">التواصل مع {office.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* خيارات التواصل السريع */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={handleDirectCall}
            >
              <Phone className="h-4 w-4" />
              اتصال مباشر
            </Button>
            {office.email && (
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleDirectEmail}
              >
                <Mail className="h-4 w-4" />
                بريد إلكتروني
              </Button>
            )}
          </div>

          <div className="text-center text-gray-500 text-sm">أو أرسل رسالة مخصصة</div>

          {/* نموذج الرسالة */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senderName">اسمك *</Label>
              <Input
                id="senderName"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="أدخل اسمك"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senderPhone">رقم هاتفك *</Label>
              <Input
                id="senderPhone"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="أدخل رقم هاتفك"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">رسالتك *</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اكتب رسالتك هنا... (مثال: أريد الاستفسار عن شقة للإيجار في منطقة معينة)"
                rows={3}
                required
              />
            </div>

            <Button type="submit" className="w-full flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              إرسال عبر واتساب
            </Button>
          </form>

          {/* معلومات المكتب */}
          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{office.address}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{office.phone}</span>
            </div>
            {office.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{office.email}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};