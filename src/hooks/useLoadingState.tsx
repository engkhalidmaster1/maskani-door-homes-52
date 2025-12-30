import { useState } from 'react';

export const useLoadingState = (initialLoading = false) => {
  const [loading, setLoading] = useState(initialLoading);

  const withLoading = async <T,>(asyncFn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      setLoading(false);
    }
  };

  return { loading, setLoading, withLoading };
};