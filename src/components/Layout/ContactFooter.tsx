import { Phone, MessageSquare } from "lucide-react";

export function ContactFooter() {
  const handleWhatsAppClick = () => {
    window.open('https://api.whatsapp.com/send?phone=905013196750', '_blank');
  };

  return (
    <footer className="bg-background border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-6">تواصل معنا</h3>
          <p className="text-muted-foreground mb-4">للاستفسارات والدعم الفني:</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleWhatsAppClick}
              className="flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors shadow-md hover:shadow-lg"
            >
              <MessageSquare className="h-5 w-5" />
              تواصل معنا عبر واتساب
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
