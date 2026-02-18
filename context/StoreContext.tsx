import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAlert } from './AlertContext';

// --- Types ---
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  outletId: string;
  outletName: string;
  isVeg: boolean;
  selectedOptions?: any[];
  isReadyToPick?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth:string;
  gender:string;
  zCoins: number;
  campus?: string;
    profileImage?: string; // ✅ ADD THIS

  dietaryPreference?: string;
  allergies?: string[];
  notificationPreferences?: {
    orders: boolean;
    promo: boolean;
    chat: boolean;
  };
  streak?: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status:
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'out_for_delivery'
  | 'delivered'
  | 'picked_up';
  createdAt: string;
  isDeal?: boolean;
  discount?: string;
  originalPrice?: number;
  outletId: string;
  outletName: string;
  pickupTime?: string;
  paymentMethod?: string;
  pickupSlot?: string;
  instructions?: string;
  updatedAt: string; // ISO String
}

export interface Outlet {
  id: string;
  name: string;
  image: string;
  rating: number;
  deliveryTime?: string; // Optional or deprecated
  prepTime?: string;     // Backend sends this
  campus: string;
  isOpen: boolean;
}

export interface Campus {
  name: string;
  location: string;
  city: string;
  state: string;
  activeOutlets?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isVeg: boolean;
  rating?: number;
  votes?: number;
  isDeal?: boolean;
  discount?: string;
  originalPrice?: number;
  outletId: string;
  outletName: string;
  isReadyToPick?: boolean;
  prepTime?: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'order' | 'promo' | 'system';
  targetId?: string;
  createdAt: string;
}

// HARDCODED RANKS
export const RANKS = [
  { name: 'Silver', icon: 'Star', color: '#94a3b8', minOrders: 0 },
  { name: 'Gold', icon: 'Award', color: '#eab308', minOrders: 5 },
  { name: 'Platinum', icon: 'Crown', color: '#a855f7', minOrders: 15 },
  { name: 'Diamond', icon: 'Trophy', color: '#06b6d4', minOrders: 30 },
];

export interface UserStats {
  zCoins: number;
  weeklyOrders: number;
  streak: number;
  currentRank: { name: string; icon: string; color: string; minOrders: number };
  nextRank: { name: string; minOrders: number } | null;
  progress: number;
}

interface StoreContextType {
  user: UserProfile | null;
  authToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: { user: UserProfile; token: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<UserProfile>) => void;
  setLocalUser: (data: Partial<UserProfile>) => void;

  cart: CartItem[];
  addToCart: (item: any, qty: number, skipOutletCheck?: boolean) => Promise<void>;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => Promise<void>;

  orders: Order[];
  placeOrder: (time: string, paymentMethod: string, specialInstructions?: string) => Promise<Order>;
  cancelOrder: (id: string) => void;

  favorites: string[];
  toggleFavorite: (id: string) => void;
  favoriteItems: MenuItem[];


  outlets: Outlet[];
  campuses: Campus[];
  selectedCampus: string;
  setSelectedCampus: (campus: string) => void;

  activeOutletId: string | null;
  setActiveOutletId: (id: string) => void;

  deals: MenuItem[];
  menuItems: MenuItem[];
  categories: string[];
  searchGlobalItems: (query: string) => Promise<MenuItem[]>;
  fetchMenuItems: (outletId: string) => Promise<void>;
  fetchDeals: (outletId: string) => Promise<void>;

  notifications: Notification[];
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;

  refreshApp: () => Promise<void>;
  stats: UserStats;
  getOutletSlots: (outletId: string) => Promise<any[]>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [selectedCampus, setSelectedCampus] = useState('KITSW');
  const [activeOutletId, setActiveOutletId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // --- 1. INITIALIZATION ---
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUser = await AsyncStorage.getItem('userData');

        if (storedToken && storedUser) {
          setAuthToken(storedToken);
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          if (parsedUser.campus) setSelectedCampus(parsedUser.campus);
        }
      } catch (error) {
        console.error('Failed to load auth data:', error);
      } finally {
        setIsAuthLoading(false);
      }
    };

    loadAuthData();

    // 🔒 Listen for 401 Unauthorized events from API
    const handleUnauthorized = () => {
      console.log('🔒 Session expired. Logging out.');
      logout();
    };

    // Lazy import or robust import
    import('../utils/events').then(({ globalEvents }) => {
      globalEvents.on('auth:unauthorized', handleUnauthorized);
    });

    return () => {
      import('../utils/events').then(({ globalEvents }) => {
        globalEvents.off('auth:unauthorized', handleUnauthorized);
      });
    };
  }, []);

  // --- 2. QUERIES ---
  const { data: outlets = [] } = useQuery({
    queryKey: ['outlets', selectedCampus],
    queryFn: () => apiFetch(`outlets?campus=${selectedCampus}`),
    enabled: !!selectedCampus,
    staleTime: 1000 * 60 * 5,
  });

  const { data: campuses = [] } = useQuery({
    queryKey: ['campuses'],
    queryFn: () => apiFetch('campuses'),
    staleTime: 1000 * 60 * 60, // 1 hour caching
  });

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: () => apiFetch('cart', {}, authToken || ''),
    enabled: !!authToken,
  });
  const cart = cartData?.items || [];

const { data: favoritesData = [] } = useQuery<MenuItem[]>({
  queryKey: ['favorites'],
  queryFn: () => apiFetch('favorites', {}, authToken || ''),
  enabled: !!authToken,
});

const favorites = favoritesData.map((item) => item.id);
const favoriteItems = favoritesData;


  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => apiFetch('orders', {}, authToken || ''),
    enabled: !!authToken,
    refetchInterval: (query) => {
      const hasActive = query.state.data?.some((o: Order) =>
        ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
      );
      return hasActive ? 10000 : false;
    },
  });

  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiFetch('notifications', {}, authToken || ''),
    enabled: !!authToken,
  });

  // --- NOTIFICATION TOAST LOGIC ---
  const notifiedIdsRef = React.useRef<Set<string>>(new Set());
  const isFirstNotificationLoad = React.useRef(true);

  useEffect(() => {
    if (notifications.length === 0) return;

    if (isFirstNotificationLoad.current) {
      // First load: just mark all existing as "seen" so we don't blast toasts
      notifications.forEach((n: Notification) => notifiedIdsRef.current.add(n.id));
      isFirstNotificationLoad.current = false;
      return;
    }

    notifications.forEach((n: Notification) => {
      // If it's unread AND we haven't notified about it yet
      if (!n.read && !notifiedIdsRef.current.has(n.id)) {
        notifiedIdsRef.current.add(n.id);

        // Show local notification (Toast)
        import('expo-notifications').then((Notifications) => {
          Notifications.scheduleNotificationAsync({
            content: {
              title: n.title,
              body: n.message,
              data: { type: n.type, targetId: n.targetId },
            },
            trigger: null, // Show immediately
          });
        });
      }
    });
  }, [notifications]);

  // --- GLOBAL SOUND LOGIC ---
  const previousStatusRef = React.useRef<{ [key: string]: string }>({});

  useEffect(() => {
    orders.forEach((order: Order) => {
      const prevStatus = previousStatusRef.current[order.id];
      const currentStatus = order.status;

      // Only play if status CHANGED and is not the initial load
      if (prevStatus && prevStatus !== currentStatus) {
        // Play sound based on NEW status
        import('../utils/sound').then(({ playSound }) => {
          if (currentStatus === 'confirmed') playSound('order_confirmed');
          else if (currentStatus === 'preparing') playSound('order_preparing');
          else if (currentStatus === 'ready') playSound('order_ready');
          else if (currentStatus === 'picked_up' || currentStatus === 'completed')
            playSound('order_pickup');
        });
      }

      // Update ref
      previousStatusRef.current[order.id] = currentStatus;
    });
  }, [orders]);

  const { data: outletMenuData } = useQuery({
    queryKey: ['menu', activeOutletId],
    queryFn: () => apiFetch(`menu?outletId=${activeOutletId}`, {}, authToken || ''),
    enabled: !!activeOutletId,
  });

  const menuItems = (outletMenuData?.items || []).map((item: any) => ({
    ...item,
    outletId: activeOutletId,
  }));

  const categories = outletMenuData?.categories || ['All'];

  const { data: deals = [] } = useQuery({
    queryKey: ['deals', activeOutletId],
    queryFn: () => apiFetch(`menu/deals?outletId=${activeOutletId}`, {}, authToken || ''),
    enabled: !!activeOutletId,
  });

  // --- 3. MUTATIONS (With Optimistic Updates) ---

  const registerPushTokenMutation = useMutation({
    mutationFn: (token: string) =>
      apiFetch('user/push-token', { method: 'POST', body: { pushToken: token } }, authToken || ''),
  });

  const loginMutation = async (data: { user: UserProfile; token: string }) => {
    const userData = {
      ...data.user,
      dietaryPreference: (data.user as any).dietary || 'Veg',
      allergies: data.user.allergies || [],
      campus: data.user.campus || selectedCampus,
    };

    setUser(userData);
    setAuthToken(data.token);
    if (data.user.campus) setSelectedCampus(data.user.campus);

    try {
      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken) registerPushTokenMutation.mutate(pushToken);

      queryClient.invalidateQueries();
    } catch (error) {
      console.error('Login storage error:', error);
    }
  };

  const logout = async () => {
    setUser(null);
    setAuthToken(null);
    setActiveOutletId(null);
    queryClient.clear();
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error(error);
    }
  };

  // --- CART OPTIMISTIC UPDATES ---

  const addToCartMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      apiFetch('cart/add', { method: 'POST', body: { itemId, quantity } }, authToken || ''),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`cart/remove/${id}`, { method: 'DELETE' }, authToken || ''),
    // OPTIMISTIC UPDATE: Remove instantly
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData(['cart']);

      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.filter((item: any) => item.id !== id),
        };
      });
      return { previousCart };
    },
    onError: (err, id, context: any) => {
      queryClient.setQueryData(['cart'], context.previousCart);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
    },
  });

  const updateQtyMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      apiFetch('cart/update', { method: 'PUT', body: { itemId, quantity } }, authToken || ''),
    // OPTIMISTIC UPDATE: Update qty instantly
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData(['cart']);

      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item: any) => (item.id === itemId ? { ...item, quantity } : item)),
        };
      });
      return { previousCart };
    },
    onError: (err, vars, context: any) => {
      queryClient.setQueryData(['cart'], context.previousCart);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () => apiFetch('cart/clear', { method: 'DELETE' }, authToken || ''),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData(['cart']);
      queryClient.setQueryData(['cart'], { items: [], summary: { total: 0, itemCount: 0 } });
      return { previousCart };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
    },
  });

  const placeOrderMutation = useMutation({
    mutationFn: (data: any) => apiFetch('orders', { method: 'POST', body: data }, authToken || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      // Instantly clear cart locally since order is placed
      queryClient.setQueryData(['cart'], { items: [], summary: { total: 0, itemCount: 0 } });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`orders/${id}/cancel`, { method: 'PUT' }, authToken || ''),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`favorites/toggle/${id}`, { method: 'POST' }, authToken || ''),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  // const updateUserMutation = useMutation({
  //   mutationFn: (data: any) =>
  //     apiFetch('user/profile', { method: 'PUT', body: data }, authToken || ''),
  //   onSuccess: (newData) => {
  //     setUser((prev) => {
  //       if (!prev) return null;
  //       const updated = { ...prev, ...newData };
  //       AsyncStorage.setItem('userData', JSON.stringify(updated));
  //       return updated;
  //     });
  //   },
  // });


const updateUserMutation = useMutation({
  mutationFn: async (data: Partial<UserProfile>) => {
    return await apiFetch(
      'user/profile',
      {
        method: 'PUT',
        body: data,
      },
      authToken || ''
    );
  },
  onSuccess: async (newData) => {
    setUser((prev) => {
      if (!prev) return null;

      const updatedUser: UserProfile = {
        ...prev,
        ...newData,
        profileImage: newData.profileImage ?? prev.profileImage,
      };

      AsyncStorage.setItem('userData', JSON.stringify(updatedUser)).catch(
        console.error
      );

      return updatedUser;
    });
  },
});


  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`notifications/${id}/read`, { method: 'PUT' }, authToken || ''),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiFetch('notifications/mark-all-read', { method: 'POST' }, authToken || ''),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const clearAllNotificationsMutation = useMutation({
    mutationFn: () => apiFetch('notifications/clear-all', { method: 'DELETE' }, authToken || ''),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const setLocalUser = (data: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data } as UserProfile;
      AsyncStorage.setItem('userData', JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  };

  const addToCart = React.useCallback(async (item: any, qty: number, skipOutletCheck = false) => {
    if (!authToken) return;

    // Check for different outlet
    if (!skipOutletCheck && cart.length > 0 && cart[0].outletId !== item.outletId) {
      showAlert({
        title: 'Start New Order?',
        message: `Your cart contains items from ${cart[0].outletName}. Would you like to clear it and add items from ${item.outletName}?`,
        type: 'warning',
        buttons: [
          { text: 'Cancel', onPress: () => { }, style: 'cancel' },
          {
            text: 'Clear & Add',
            style: 'destructive',
            onPress: async () => {
              await clearCartMutation.mutateAsync();
              await addToCartMutation.mutateAsync({ itemId: item.id, quantity: qty });
            },
          },
        ],
      });
      return;
    }

    await addToCartMutation.mutateAsync({ itemId: item.id, quantity: qty });
  }, [authToken, cart, clearCartMutation, addToCartMutation, showAlert]);

  const updateQuantity = React.useCallback((id: string, delta: number) => {
    const item = cart.find((i: CartItem) => i.id === id);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) removeFromCartMutation.mutate(id);
    else updateQtyMutation.mutate({ itemId: id, quantity: newQty });
  }, [cart, removeFromCartMutation, updateQtyMutation]);

  const placeOrder = React.useCallback(async (
    time: string,
    paymentMethod: string,
    specialInstructions?: string
  ): Promise<Order> => {
    if (!authToken) throw new Error('User not authenticated');
    try {
      const result = await placeOrderMutation.mutateAsync({
        items: cart.map((item: CartItem) => ({ id: item.id, quantity: item.quantity })),
        pickupSlot: time,
        pickupTime: time, // Send both for compatibility
        outletId: cart[0]?.outletId,
        paymentMethod: paymentMethod,
        specialInstructions: specialInstructions,
      });
      return result as Order;
    } catch (error: any) {
      showAlert({
        title: 'Order Failed',
        message: error.message || 'Something went wrong while placing your order.',
        type: 'error',
      });
      throw error;
    }
  }, [authToken, placeOrderMutation, cart, showAlert]);

  const searchGlobalItems = async (query: string) => {
    if (!authToken) return [];
    return apiFetch(`menu/items?search=${encodeURIComponent(query)}`, {}, authToken);
  };

  const refreshApp = async () => {
    await queryClient.refetchQueries();
  };

  const getOutletSlots = async (outletId: string) => {
    if (!authToken) return [];
    const response = await apiFetch(`outlets/${outletId}/slots`, {}, authToken);
    return response || [];
  };

  const stats: UserStats = React.useMemo(() => {
    const completedOrdersValue = orders.filter(
      (o: Order) => o.status === 'completed' || o.status === 'delivered'
    ).length;
    let currentRankIndex = 0;
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (completedOrdersValue >= RANKS[i].minOrders) {
        currentRankIndex = i;
        break;
      }
    }

    const currentRank = RANKS[currentRankIndex];
    const nextRank = currentRankIndex < RANKS.length - 1 ? RANKS[currentRankIndex + 1] : null;
    const progress = nextRank
      ? ((completedOrdersValue - currentRank.minOrders) / (nextRank.minOrders - currentRank.minOrders)) *
      100
      : 100;

    return {
      zCoins: user?.zCoins ?? 0,
      weeklyOrders: completedOrdersValue,
      streak: user?.streak || 0,
      currentRank: currentRank,
      nextRank: nextRank,
      progress: Math.min(Math.max(progress, 0), 100),
    };
  }, [orders, user?.zCoins, user?.streak]);

  const value: StoreContextType = React.useMemo(() => ({
    user,
    authToken,
    isAuthenticated: !!authToken,
    isLoading: isAuthLoading,
    login: loginMutation,
    logout,
    updateUser: (data) => updateUserMutation.mutate(data),
    setLocalUser,

    cart,
    addToCart,
    removeFromCart: (id) => removeFromCartMutation.mutate(id),
    updateQuantity,
    clearCart: () => clearCartMutation.mutateAsync(),

    orders,
    placeOrder,
    cancelOrder: (id) => cancelOrderMutation.mutate(id),

    favorites,
    toggleFavorite: (id) => toggleFavoriteMutation.mutate(id),
    favoriteItems,

    outlets,
    campuses,
    selectedCampus,
    setSelectedCampus,

    activeOutletId,
    setActiveOutletId,

    deals,
    menuItems,
    categories,
    searchGlobalItems,
    fetchMenuItems: async (outletId: string) => {
      await queryClient.refetchQueries({ queryKey: ['menu', outletId] });
    },
    fetchDeals: async (outletId: string) => {
      await queryClient.refetchQueries({ queryKey: ['deals', outletId] });
    },

    notifications,
    fetchNotifications: async () => {
      await refetchNotifications();
    },
    markAsRead: (id) => markReadMutation.mutate(id),
    markAllAsRead: () => markAllReadMutation.mutate(),
    clearAllNotifications: () => clearAllNotificationsMutation.mutate(),

    refreshApp,
    stats,
    getOutletSlots,
  }), [
    user, authToken, isAuthLoading, cart, orders, favorites, outlets, campuses, selectedCampus, activeOutletId, deals, menuItems, categories, notifications, stats,
    addToCart, updateQuantity, placeOrder, searchGlobalItems, refreshApp, getOutletSlots,
    loginMutation, updateUserMutation, removeFromCartMutation, updateQtyMutation, clearCartMutation, cancelOrderMutation, toggleFavoriteMutation,
    markReadMutation, markAllReadMutation, clearAllNotificationsMutation, refetchNotifications, queryClient
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
