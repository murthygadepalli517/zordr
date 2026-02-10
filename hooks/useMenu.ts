import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useStore } from '../context/StoreContext';

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  dietary?: string;
  rating?: number;
  isAvailable: boolean;
  outletId?: string;
};

export const useMenu = (outletId?: string, category?: string) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authToken } = useStore();

  const fetchItems = async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = 'menu/items?limit=100';

      if (outletId) {
        endpoint += `&outletId=${outletId}`;
      }

      if (category && category !== 'All') {
        endpoint += `&category=${category}`;
      }

      const data = await apiFetch(endpoint, {}, authToken || '');
      setItems(data || []);
    } catch (err: any) {
      console.error('Failed to fetch menu items:', err);
      setError(err.message || 'Failed to load menu');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [outletId, category]);

  return { items, loading, error, refetch: fetchItems };
};

export const useSearchMenu = (
  searchQuery: string,
  filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    dietary?: string;
  }
) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { authToken } = useStore();

  const search = async () => {
    if (!searchQuery && !filters) {
      setItems([]);
      return;
    }

    setLoading(true);

    try {
      let endpoint = 'menu/items?';

      if (searchQuery) {
        endpoint += `search=${encodeURIComponent(searchQuery)}&`;
      }

      if (filters?.category && filters.category !== 'All') {
        endpoint += `category=${filters.category}&`;
      }

      if (filters?.minPrice) {
        endpoint += `minPrice=${filters.minPrice}&`;
      }

      if (filters?.maxPrice) {
        endpoint += `maxPrice=${filters.maxPrice}&`;
      }

      if (filters?.dietary) {
        endpoint += `dietary=${filters.dietary}&`;
      }

      const data = await apiFetch(endpoint, {}, authToken || '');
      setItems(data || []);
    } catch (err) {
      console.error('Search failed:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      search();
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [searchQuery, filters?.category, filters?.minPrice, filters?.maxPrice, filters?.dietary]);

  return { items, loading };
};
