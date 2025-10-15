export const Footer = () => {
  return (
    <footer className="bg-card border-t mt-16">
      <div className="container mx-auto px-4 py-12 text-center">
        <h3 className="text-2xl font-bold mb-4 text-card-foreground">
          تطبيق "سكني" - المنصة الأولى في كوردستان لنشر العقارات للبيع والإيجار
        </h3>
        <p className="text-sm text-muted-foreground">
          جميع الحقوق محفوظة &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
};