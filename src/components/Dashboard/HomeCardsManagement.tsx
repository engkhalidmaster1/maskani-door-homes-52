import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useHomeCards, HomeCard } from "@/hooks/useHomeCards";
import { GripVertical, Edit, Save, X, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const HomeCardsManagement = () => {
  const { cards, isLoading, updateCard, reorderCards, isUpdating } = useHomeCards();
  const [editingCard, setEditingCard] = useState<HomeCard | null>(null);
  const [localCards, setLocalCards] = useState<HomeCard[]>([]);

  React.useEffect(() => {
    if (cards) {
      setLocalCards([...cards]);
    }
  }, [cards]);

  const handleEditCard = (card: HomeCard) => {
    setEditingCard({ ...card });
  };

  const handleSaveCard = () => {
    if (editingCard) {
      updateCard(editingCard);
      setEditingCard(null);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newCards = [...localCards];
    [newCards[index], newCards[index - 1]] = [newCards[index - 1], newCards[index]];
    setLocalCards(newCards);
  };

  const handleMoveDown = (index: number) => {
    if (index === localCards.length - 1) return;
    const newCards = [...localCards];
    [newCards[index], newCards[index + 1]] = [newCards[index + 1], newCards[index]];
    setLocalCards(newCards);
  };

  const handleSaveOrder = async () => {
    await reorderCards(localCards);
  };

  const iconOptions = [
    { value: 'Search', label: 'بحث (Search)' },
    { value: 'Building2', label: 'مبنى (Building2)' },
    { value: 'PlusCircle', label: 'إضافة (PlusCircle)' },
    { value: 'User', label: 'مستخدم (User)' },
    { value: 'Home', label: 'منزل (Home)' },
    { value: 'MapPin', label: 'موقع (MapPin)' },
  ];

  const colorOptions = [
    { bg: 'bg-blue-50', icon: 'bg-blue-500', label: 'أزرق' },
    { bg: 'bg-purple-50', icon: 'bg-purple-500', label: 'بنفسجي' },
    { bg: 'bg-green-50', icon: 'bg-green-500', label: 'أخضر' },
    { bg: 'bg-orange-50', icon: 'bg-orange-500', label: 'برتقالي' },
    { bg: 'bg-red-50', icon: 'bg-red-500', label: 'أحمر' },
    { bg: 'bg-yellow-50', icon: 'bg-yellow-500', label: 'أصفر' },
    { bg: 'bg-pink-50', icon: 'bg-pink-500', label: 'وردي' },
    { bg: 'bg-indigo-50', icon: 'bg-indigo-500', label: 'نيلي' },
  ];

  if (isLoading) {
    return <div className="p-4">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>إدارة بطاقات الصفحة الرئيسية</span>
            <Button 
              onClick={handleSaveOrder} 
              disabled={isUpdating}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              حفظ الترتيب
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {localCards.map((card, index) => (
              <Card key={card.id} className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* أزرار الترتيب */}
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === localCards.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* مؤشر الترتيب */}
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold">
                      {index + 1}
                    </div>

                    {/* معاينة البطاقة */}
                    <div className={cn("flex-1 rounded-lg p-4", card.bg_color)}>
                      <div className="flex items-start gap-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", card.icon_color)}>
                          <GripVertical className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 mb-1">{card.title}</h3>
                          <p className="text-sm text-gray-600">{card.description}</p>
                          <div className="mt-2 flex gap-2">
                            <span className="text-xs bg-white px-2 py-1 rounded">
                              {card.path}
                            </span>
                            {card.requires_auth && (
                              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                                يتطلب تسجيل دخول
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* زر التعديل */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCard(card)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>تعديل البطاقة</DialogTitle>
                        </DialogHeader>
                        {editingCard && editingCard.id === card.id && (
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label>العنوان</Label>
                              <Input
                                value={editingCard.title}
                                onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>الوصف</Label>
                              <Input
                                value={editingCard.description}
                                onChange={(e) => setEditingCard({ ...editingCard, description: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>المسار</Label>
                              <Input
                                value={editingCard.path}
                                onChange={(e) => setEditingCard({ ...editingCard, path: e.target.value })}
                                placeholder="/properties"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>الأيقونة</Label>
                              <Select
                                value={editingCard.icon_name}
                                onValueChange={(value) => setEditingCard({ ...editingCard, icon_name: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {iconOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>اللون</Label>
                              <div className="grid grid-cols-4 gap-2">
                                {colorOptions.map((color) => (
                                  <button
                                    key={color.bg}
                                    onClick={() => setEditingCard({
                                      ...editingCard,
                                      bg_color: color.bg,
                                      icon_color: color.icon
                                    })}
                                    className={cn(
                                      "p-3 rounded-lg border-2 transition-all",
                                      color.bg,
                                      editingCard.bg_color === color.bg && "ring-2 ring-primary"
                                    )}
                                  >
                                    <div className={cn("w-6 h-6 rounded mx-auto", color.icon)} />
                                    <p className="text-xs mt-1">{color.label}</p>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 space-x-reverse">
                              <Switch
                                checked={editingCard.requires_auth}
                                onCheckedChange={(checked) =>
                                  setEditingCard({ ...editingCard, requires_auth: checked })
                                }
                              />
                              <Label>يتطلب تسجيل دخول</Label>
                            </div>

                            <div className="flex gap-2 pt-4">
                              <Button onClick={handleSaveCard} className="flex-1">
                                <Save className="h-4 w-4 mr-2" />
                                حفظ التغييرات
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setEditingCard(null)}
                                className="flex-1"
                              >
                                <X className="h-4 w-4 mr-2" />
                                إلغاء
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};