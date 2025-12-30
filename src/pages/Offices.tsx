import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRealEstateOfficesDB } from '@/hooks/useRealEstateOfficesDB';
import { Building2, Search, ShieldCheck } from 'lucide-react';

export default function Offices() {
  const { offices, loading, fetchOffices, searchOffices } = useRealEstateOfficesDB();
  const [q, setQ] = useState('');

  useEffect(() => {
    // Ensures initial load (hook already does this, but safe if route cached)
    fetchOffices();
  }, [fetchOffices]);

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-xl sm:text-2xl font-bold">المكاتب العقارية</h2>
        </div>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم أو العنوان أو الوصف"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') searchOffices(q); }}
              />
            </div>
            <Button onClick={() => searchOffices(q)}>بحث</Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offices.map((o) => (
            <Card key={o.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{o.name}</CardTitle>
                  {o.verified ? (
                    <Badge className="gap-1"><ShieldCheck className="h-3 w-3" /> موثق</Badge>
                  ) : (
                    <Badge variant="secondary">قيد المراجعة</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {o.address && <div>العنوان: {o.address}</div>}
                {o.phone && <div>الهاتف: {o.phone}</div>}
                {o.email && <div>البريد: {o.email}</div>}
                {o.description && <div className="text-foreground/90">{o.description}</div>}
              </CardContent>
            </Card>
          ))}
          {offices.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="p-6 text-center text-muted-foreground">لا توجد مكاتب حالياً</CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
