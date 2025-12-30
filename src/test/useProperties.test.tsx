import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProperties } from '@/hooks/useProperties';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  id: '1',
                  title: 'Test Property',
                  price: 100000,
                  location: 'Test Location',
                  property_type: 'apartment',
                  is_published: true,
                  is_hidden: false,
                  listing_type: 'sale',
                  status: 'available'
                }
              ],
              error: null
            })
          }))
        }))
      }))
    }))
  }
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1' },
    isAdmin: false
  }))
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn()
  }))
}));

// Mock useDataCache
vi.mock('@/hooks/useDataCache', () => ({
  useDataCache: vi.fn(() => ({
    clearDataCache: vi.fn()
  }))
}));

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => children;
};

describe('useProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty arrays', () => {
    const { result } = renderHook(() => useProperties(), {
      wrapper: createWrapper(),
    });

    expect(result.current.properties).toEqual([]);
    expect(result.current.userProperties).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it('should fetch properties on mount', async () => {
    const { result } = renderHook(() => useProperties(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.properties).toHaveLength(1);
    expect(result.current.properties[0].title).toBe('Test Property');
  });

  it('should handle fetch errors gracefully', async () => {
    // Mock error response
    const mockSupabase = vi.mocked(supabase);
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error')
            })
          }))
        }))
      }))
    });

    const { result } = renderHook(() => useProperties(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should set empty arrays on error
    expect(result.current.properties).toEqual([]);
  });
});