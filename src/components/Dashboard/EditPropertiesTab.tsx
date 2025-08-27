import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit3, Search, Eye, EyeOff, Trash2 } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useProperties } from "@/hooks/useProperties";
import { toast } from "@/hooks/use-toast";

interface EditPropertiesTabProps {
  onEditProperty: (propertyId: string) => void;
}

export const EditPropertiesTab = ({ onEditProperty }: EditPropertiesTabProps) => {
  const { userProperties } = useDashboardData();
  const { togglePropertyPublication, deleteProperty } = useProperties();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProperties = userProperties.filter(property => 
    property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.property_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTogglePublication = async (propertyId: string, currentStatus: boolean) => {
    await togglePropertyPublication(propertyId, currentStatus);
    toast({
      title: currentStatus ? "تم إخفاء العقار" : "تم نشر العقار",
      description: currentStatus ? "العقار غير مرئي للعملاء الآن" : "العقار مرئي للعملاء الآن",
    });
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (confirm("هل أنت متأكد من حذف هذا العقار؟")) {
      await deleteProperty(propertyId);
      toast({
        title: "تم حذف العقار",
        description: "تم حذف العقار بنجاح",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            تعديل العقارات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في العقارات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العنوان</TableHead>
                  <TableHead>المالك</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>الموقع</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.title}</TableCell>
                    <TableCell>{property.owner_name || "غير محدد"}</TableCell>
                    <TableCell>{property.price.toLocaleString()} ر.س</TableCell>
                    <TableCell>{property.location}</TableCell>
                    <TableCell>{property.property_type}</TableCell>
                    <TableCell>
                      <Badge variant={property.is_published ? "default" : "secondary"}>
                        {property.is_published ? "منشور" : "مخفي"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditProperty(property.id)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePublication(property.id, property.is_published)}
                        >
                          {property.is_published ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteProperty(property.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredProperties.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "لا توجد عقارات تطابق البحث" : "لا توجد عقارات"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};