import { useEffect, useState, useCallback } from 'react';
import { PullToRefresh } from "@/components/PullToRefresh";
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRealEstateOfficesDB } from '@/hooks/useRealEstateOfficesDB';
import { Building2, Search, ShieldCheck, Phone, Mail, MapPin, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Offices() {
  const { offices, loading, fetchOffices, searchOffices } = useRealEstateOfficesDB();
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  return (
    <PullToRefresh onRefresh={() => fetchOffices()}>
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="gradient-primary text-primary-foreground shadow-elegant sticky top-14 md:top-16 z-40">
        <div className="container mx-auto px-3 md:px-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3 py-3 md:py-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 md:h-6 md:w-6" />
              <h1 className="text-lg md:text-2xl font-bold">المكاتب العقارية</h1>
            </div>
            <div className="flex-1 w-full sm:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث بالاسم أو العنوان..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') searchOffices(q); }}
                  className="pl-10 pr-4 bg-background text-foreground border-2 border-background/70 rounded-xl shadow-md h-9 md:h-10"
                />
              </div>
            </div>
            <Button
              onClick={() => searchOffices(q)}
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-white/20 border border-white/60 md:border-2 md:border-white shrink-0"
            >
              <Search className="h-4 w-4 ml-1" />
              بحث
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12 md:py-16">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 md:h-10 md:w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">جاري تحميل المكاتب...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {offices.map((o) => (
              <Card key={o.id} className="overflow-hidden hover-lift shadow-card group border border-border">
                <CardContent className="p-0">
                  {/* Office Header */}
                  <div className="gradient-primary p-3 md:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="bg-white/20 p-1.5 md:p-2 rounded-lg md:rounded-xl">
                        <Building2 className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-primary-foreground line-clamp-1">{o.name}</h3>
                    </div>
                    {o.verified ? (
                      <Badge className="gap-1 bg-white/20 text-primary-foreground border-0 text-xs">
                        <ShieldCheck className="h-3 w-3" /> موثق
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-white/20 text-primary-foreground border-0 text-xs">
                        قيد المراجعة
                      </Badge>
                    )}
                  </div>

                  {/* Office Details */}
                  <div className="p-3 md:p-4 space-y-2 md:space-y-3">
                    {o.description && (
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{o.description}</p>
                    )}
                    
                    <div className="space-y-1.5 md:space-y-2 text-sm">
                      {o.address && (
                        <div className="flex items-center gap-2 text-foreground">
                          <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary shrink-0" />
                          <span className="line-clamp-1 text-xs md:text-sm">{o.address}</span>
                        </div>
                      )}
                      {o.phone && (
                        <div className="flex items-center gap-2 text-foreground">
                          <Phone className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary shrink-0" />
                          <a href={`tel:${o.phone}`} className="hover:text-primary transition-colors text-xs md:text-sm">{o.phone}</a>
                        </div>
                      )}
                      {o.email && (
                        <div className="flex items-center gap-2 text-foreground">
                          <Mail className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary shrink-0" />
                          <a href={`mailto:${o.email}`} className="hover:text-primary transition-colors line-clamp-1 text-xs md:text-sm">{o.email}</a>
                        </div>
                      )}
                      {o.website && (
                        <div className="flex items-center gap-2 text-foreground">
                          <Globe className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary shrink-0" />
                          <a href={o.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors line-clamp-1 text-xs md:text-sm">{o.website}</a>
                        </div>
                      )}
                    </div>

                    {/* Services */}
                    {o.services && o.services.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2 border-t border-border">
                        {o.services.slice(0, 3).map((s: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[10px] md:text-xs">{s}</Badge>
                        ))}
                        {o.services.length > 3 && (
                          <Badge variant="outline" className="text-[10px] md:text-xs">+{o.services.length - 3}</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {offices.length === 0 && (
              <div className="col-span-full text-center py-12 md:py-16">
                <Building2 className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">لا توجد مكاتب حالياً</h3>
                <p className="text-muted-foreground text-sm">لم يتم تسجيل أي مكاتب عقارية بعد</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
