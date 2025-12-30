import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';

interface Subscriber {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  account_created?: string;
}

const Subscribers: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSubscribers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, email, full_name, phone, created_at');
        if (error) {
          console.error('Error fetching subscribers:', error);
          setSubscribers([]);
        } else {
          setSubscribers(
            (data ?? []).map((profile: Database['public']['Tables']['profiles']['Row']) => ({
              id: profile.user_id,
              email: profile.email || '',
              full_name: profile.full_name || 'مستخدم جديد',
              phone: profile.phone,
              account_created: profile.created_at,
            }))
          );
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setSubscribers([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubscribers();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">المشتركين</h1>
      {isLoading ? (
        <div>جاري التحميل...</div>
      ) : (
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">الاسم الكامل</th>
              <th className="py-2 px-4 border-b">البريد الإلكتروني</th>
              <th className="py-2 px-4 border-b">رقم الهاتف</th>
              <th className="py-2 px-4 border-b">تاريخ الإنشاء</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((subscriber) => (
              <tr key={subscriber.id}>
                <td className="py-2 px-4 border-b">{subscriber.full_name}</td>
                <td className="py-2 px-4 border-b">{subscriber.email}</td>
                <td className="py-2 px-4 border-b">{subscriber.phone || '-'}</td>
                <td className="py-2 px-4 border-b">{subscriber.account_created?.split('T')[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Subscribers;
