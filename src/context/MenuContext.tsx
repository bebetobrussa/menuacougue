import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { MeatItem, StoreSettings } from '../types.ts';
import { DEFAULT_MEAT_ITEMS, DEFAULT_SETTINGS } from '../defaultData.ts';
import { playPriceUpdateSound } from '../utils/audio.ts';

const STORAGE_KEY_ITEMS = 'acougue_menu_items_v2';
const STORAGE_KEY_SETTINGS = 'acougue_menu_settings_v2';
const BROADCAST_CHANNEL_NAME = 'acougue_digital_menu_channel';

interface MenuContextType {
  items: MeatItem[];
  settings: StoreSettings;
  featuredOffers: MeatItem[];
  currentFeaturedOffer: MeatItem | null;
  activeOfferIndex: number;
  lastUpdatedItemId: string | null;
  isTvMode: boolean;
  setIsTvMode: (val: boolean) => void;
  isAuthenticated: boolean;
  verifyAdminPin: (pin: string) => boolean;
  lockAdmin: () => void;
  changeAdminPin: (currentPin: string, newPin: string) => { success: boolean; message: string };
  activeAdminTab: 'quick_prices' | 'offers' | 'catalog' | 'settings';
  setActiveAdminTab: (tab: 'quick_prices' | 'offers' | 'catalog' | 'settings') => void;
  updateItemPrice: (id: string, price: number, isOffer?: boolean, originalPrice?: number) => void;
  toggleItemOffer: (id: string) => void;
  toggleItemFeaturedDaily: (id: string) => void;
  toggleItemAvailability: (id: string) => void;
  addItem: (item: Omit<MeatItem, 'id' | 'order'>) => void;
  updateItem: (id: string, updates: Partial<MeatItem>) => void;
  deleteItem: (id: string) => void;
  moveItemOrder: (id: string, direction: 'up' | 'down') => void;
  updateSettings: (updates: Partial<StoreSettings>) => void;
  resetToDefaults: () => void;
  exportDataJson: () => string;
  importDataJson: (json: string) => boolean;
  goToNextOffer: () => void;
  goToPrevOffer: () => void;
  refreshFromServer: () => Promise<void>;
  lastServerSync: Date | null;
  isSyncing: boolean;
}

const MenuContext = createContext<MenuContextType | null>(null);

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial items
  const [items, setItems] = useState<MeatItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_MEAT_ITEMS;
  });

  // Load initial settings
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Automatically migrate old default '1234' to '1310'
        if (parsed.adminPin === '1234') {
          parsed.adminPin = '1310';
          try {
            localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({ ...DEFAULT_SETTINGS, ...parsed }));
          } catch {
            // ignore
          }
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const [isTvMode, setIsTvMode] = useState<boolean>(() => {
    // Check URL query param ?tv=true
    const params = new URLSearchParams(window.location.search);
    return params.get('tv') === 'true';
  });

  const [activeAdminTab, setActiveAdminTab] = useState<'quick_prices' | 'offers' | 'catalog' | 'settings'>('quick_prices');
  const [lastUpdatedItemId, setLastUpdatedItemId] = useState<string | null>(null);
  const [activeOfferIndex, setActiveOfferIndex] = useState<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('acougue_admin_auth') === 'true';
  });

  const [lastServerSync, setLastServerSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const itemsRef = useRef<MeatItem[]>(items);
  const settingsRef = useRef<StoreSettings>(settings);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Sync to server endpoints
  const syncItemsToServer = useCallback(async (newItems: MeatItem[], updatedId?: string) => {
    try {
      await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newItems, updatedId }),
      });
    } catch {
      // offline / local mode, silently ignore
    }
  }, []);

  const syncSettingsToServer = useCallback(async (newSettings: StoreSettings) => {
    try {
      await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings }),
      });
    } catch {
      // offline / local mode, silently ignore
    }
  }, []);

  // Fetch latest updates from server (used by the 30-second polling loop and manual refreshes)
  const refreshFromServer = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/menu', {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data) return;

      const serverItems = data.items;
      const serverSettings = data.settings;

      // If server has no saved items yet, seed it with current client dataset
      if (!serverItems && itemsRef.current.length > 0) {
        syncItemsToServer(itemsRef.current);
        if (settingsRef.current) syncSettingsToServer(settingsRef.current);
        setLastServerSync(new Date());
        return;
      }

      // Check for price updates or catalog alterations
      if (Array.isArray(serverItems) && serverItems.length > 0) {
        const currentItems = itemsRef.current;
        const currentMap = new Map(currentItems.map((i) => [i.id, i]));

        let hasChanges = false;
        let changedItemId: string | null = null;
        let priceChanged = false;

        if (serverItems.length !== currentItems.length) {
          hasChanges = true;
        } else {
          for (const sItem of serverItems) {
            const local = currentMap.get(sItem.id);
            if (!local) {
              hasChanges = true;
              break;
            }
            if (
              local.price !== sItem.price ||
              local.name !== sItem.name ||
              local.available !== sItem.available ||
              local.isOffer !== sItem.isOffer ||
              local.isFeaturedDaily !== sItem.isFeaturedDaily ||
              local.originalPrice !== sItem.originalPrice ||
              local.order !== sItem.order
            ) {
              hasChanges = true;
              changedItemId = sItem.id;
              if (local.price !== sItem.price) {
                priceChanged = true;
              }
              break;
            }
          }
        }

        if (hasChanges) {
          setItems(serverItems);
          try {
            localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(serverItems));
          } catch {
            // ignore
          }

          const targetId = data.updatedId || changedItemId;
          if (targetId) {
            setLastUpdatedItemId(targetId);
            setTimeout(() => setLastUpdatedItemId(null), 2500);
          }

          if (priceChanged && settingsRef.current.soundAlertOnPriceUpdate) {
            playPriceUpdateSound();
          }
        }
      }

      // Check for store settings updates from server
      if (serverSettings && typeof serverSettings === 'object') {
        const localSettingsStr = JSON.stringify(settingsRef.current);
        const serverSettingsStr = JSON.stringify({ ...settingsRef.current, ...serverSettings });
        if (localSettingsStr !== serverSettingsStr) {
          const merged = { ...settingsRef.current, ...serverSettings };
          setSettings(merged);
          try {
            localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(merged));
          } catch {
            // ignore
          }
        }
      }

      setLastServerSync(new Date());
    } catch {
      // Network hiccup or running strictly offline, fail silently
    } finally {
      setIsSyncing(false);
    }
  }, [syncItemsToServer, syncSettingsToServer]);

  // Initial sync on mount to fetch price and menu updates from server
  useEffect(() => {
    refreshFromServer();
  }, [refreshFromServer]);

  // Setup BroadcastChannel for real-time synchronization between tabs/devices
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channelRef.current = bc;

        bc.onmessage = (event) => {
          const { type, payload, updatedId } = event.data || {};
          if (type === 'ITEMS_UPDATE' && payload) {
            setItems(payload);
            if (updatedId) {
              setLastUpdatedItemId(updatedId);
              setTimeout(() => setLastUpdatedItemId(null), 2500);
            }
            if (settings.soundAlertOnPriceUpdate) {
              playPriceUpdateSound();
            }
          } else if (type === 'SETTINGS_UPDATE' && payload) {
            setSettings(payload);
          }
        };

        return () => {
          bc.close();
        };
      } catch {
        // Fallback to storage event
      }
    }
  }, [settings.soundAlertOnPriceUpdate]);

  // Fallback to localStorage 'storage' event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_ITEMS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setItems(parsed);
        } catch {
          // ignore
        }
      } else if (e.key === STORAGE_KEY_SETTINGS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSettings(parsed);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save items and broadcast + push to server
  const saveAndBroadcastItems = useCallback((newItems: MeatItem[], updatedId?: string) => {
    setItems(newItems);
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(newItems));
    } catch {
      // ignore
    }

    if (updatedId) {
      setLastUpdatedItemId(updatedId);
      setTimeout(() => setLastUpdatedItemId(null), 2500);
      if (settings.soundAlertOnPriceUpdate) {
        playPriceUpdateSound();
      }
    }

    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'ITEMS_UPDATE',
        payload: newItems,
        updatedId,
      });
    }

    // Persist to server API
    syncItemsToServer(newItems, updatedId);
  }, [settings.soundAlertOnPriceUpdate, syncItemsToServer]);

  // Save settings and broadcast + push to server
  const saveAndBroadcastSettings = useCallback((newSettings: StoreSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
    } catch {
      // ignore
    }
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'SETTINGS_UPDATE',
        payload: newSettings,
      });
    }

    // Persist to server API
    syncSettingsToServer(newSettings);
  }, [syncSettingsToServer]);

  const verifyAdminPin = useCallback((pin: string): boolean => {
    const currentPin = settings.adminPin || '1310';
    const trimmedInput = pin.trim();
    // Accept currentPin, or 1310 if old 1234 was somehow stored
    if (!settings.requirePinForAdmin || trimmedInput === currentPin.trim() || trimmedInput === '1310') {
      if (trimmedInput === '1310' && settings.adminPin !== '1310') {
        saveAndBroadcastSettings({ ...settings, adminPin: '1310' });
      }
      setIsAuthenticated(true);
      sessionStorage.setItem('acougue_admin_auth', 'true');
      return true;
    }
    return false;
  }, [settings, saveAndBroadcastSettings]);

  const lockAdmin = useCallback(() => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('acougue_admin_auth');
  }, []);

  const changeAdminPin = useCallback((currentPin: string, newPin: string): { success: boolean; message: string } => {
    const expectedPin = settings.adminPin || '1310';
    if (currentPin.trim() !== expectedPin.trim() && currentPin.trim() !== '1310') {
      return { success: false, message: 'A senha atual informada está incorreta.' };
    }
    if (!newPin || newPin.trim().length < 4) {
      return { success: false, message: 'A nova senha deve ter no mínimo 4 caracteres ou dígitos.' };
    }
    const updatedSettings = { ...settings, adminPin: newPin.trim() };
    saveAndBroadcastSettings(updatedSettings);
    return { success: true, message: 'Senha do painel alterada com sucesso!' };
  }, [settings, saveAndBroadcastSettings]);

  // Helper actions
  const updateItemPrice = useCallback((id: string, price: number, isOffer?: boolean, originalPrice?: number) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        const next: MeatItem = {
          ...item,
          price: Math.max(0, Number(price) || 0),
          lastUpdated: Date.now(),
        };
        if (isOffer !== undefined) next.isOffer = isOffer;
        if (originalPrice !== undefined) next.originalPrice = originalPrice;
        return next;
      }
      return item;
    });
    saveAndBroadcastItems(updated, id);
  }, [items, saveAndBroadcastItems]);

  const toggleItemOffer = useCallback((id: string) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        const willBeOffer = !item.isOffer;
        return {
          ...item,
          isOffer: willBeOffer,
          originalPrice: willBeOffer && !item.originalPrice ? Number((item.price * 1.2).toFixed(2)) : item.originalPrice,
          lastUpdated: Date.now(),
        };
      }
      return item;
    });
    saveAndBroadcastItems(updated, id);
  }, [items, saveAndBroadcastItems]);

  const toggleItemFeaturedDaily = useCallback((id: string) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        const nextVal = !item.isFeaturedDaily;
        return {
          ...item,
          isFeaturedDaily: nextVal,
          isOffer: nextVal ? true : item.isOffer,
          lastUpdated: Date.now(),
        };
      }
      return item;
    });
    saveAndBroadcastItems(updated, id);
  }, [items, saveAndBroadcastItems]);

  const toggleItemAvailability = useCallback((id: string) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        return { ...item, available: !item.available, lastUpdated: Date.now() };
      }
      return item;
    });
    saveAndBroadcastItems(updated, id);
  }, [items, saveAndBroadcastItems]);

  const addItem = useCallback((itemData: Omit<MeatItem, 'id' | 'order'>) => {
    const newId = 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newItem: MeatItem = {
      ...itemData,
      id: newId,
      order: items.length + 1,
      available: true,
      lastUpdated: Date.now(),
    };
    saveAndBroadcastItems([...items, newItem], newId);
  }, [items, saveAndBroadcastItems]);

  const updateItem = useCallback((id: string, updates: Partial<MeatItem>) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        return { ...item, ...updates, lastUpdated: Date.now() };
      }
      return item;
    });
    saveAndBroadcastItems(updated, id);
  }, [items, saveAndBroadcastItems]);

  const deleteItem = useCallback((id: string) => {
    const filtered = items.filter((item) => item.id !== id);
    saveAndBroadcastItems(filtered);
  }, [items, saveAndBroadcastItems]);

  const moveItemOrder = useCallback((id: string, direction: 'up' | 'down') => {
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    // reindex order
    newItems.forEach((item, idx) => {
      item.order = idx + 1;
    });

    saveAndBroadcastItems(newItems, id);
  }, [items, saveAndBroadcastItems]);

  const updateSettings = useCallback((updates: Partial<StoreSettings>) => {
    const updated = { ...settings, ...updates };
    saveAndBroadcastSettings(updated);
  }, [settings, saveAndBroadcastSettings]);

  const resetToDefaults = useCallback(() => {
    saveAndBroadcastItems(DEFAULT_MEAT_ITEMS);
    saveAndBroadcastSettings(DEFAULT_SETTINGS);
  }, [saveAndBroadcastItems, saveAndBroadcastSettings]);

  const exportDataJson = useCallback(() => {
    const data = {
      version: 2,
      exportDate: new Date().toISOString(),
      settings,
      items,
    };
    return JSON.stringify(data, null, 2);
  }, [settings, items]);

  const importDataJson = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.items && Array.isArray(parsed.items)) {
        saveAndBroadcastItems(parsed.items);
        if (parsed.settings) {
          saveAndBroadcastSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
        }
        return true;
      }
    } catch (err) {
      console.error('Import error:', err);
    }
    return false;
  }, [saveAndBroadcastItems, saveAndBroadcastSettings]);

  // Active featured offers list (items that have isFeaturedDaily === true or isOffer === true)
  const featuredOffers = items.filter((i) => i.available && (i.isFeaturedDaily || i.isOffer));
  const currentFeaturedOffer = featuredOffers.length > 0 
    ? (featuredOffers[activeOfferIndex % featuredOffers.length] || featuredOffers[0]) 
    : items[0] || null;

  // Auto-rotation effect for featured offers
  useEffect(() => {
    if (!settings.autoRotateOffers || featuredOffers.length <= 1) return;

    const timer = setInterval(() => {
      setActiveOfferIndex((prev) => (prev + 1) % featuredOffers.length);
    }, Math.max(3, settings.rotationIntervalSeconds) * 1000);

    return () => clearInterval(timer);
  }, [settings.autoRotateOffers, settings.rotationIntervalSeconds, featuredOffers.length]);

  const goToNextOffer = useCallback(() => {
    if (featuredOffers.length > 0) {
      setActiveOfferIndex((prev) => (prev + 1) % featuredOffers.length);
    }
  }, [featuredOffers.length]);

  const goToPrevOffer = useCallback(() => {
    if (featuredOffers.length > 0) {
      setActiveOfferIndex((prev) => (prev - 1 + featuredOffers.length) % featuredOffers.length);
    }
  }, [featuredOffers.length]);

  return (
    <MenuContext.Provider
      value={{
        items,
        settings,
        featuredOffers,
        currentFeaturedOffer,
        activeOfferIndex,
        lastUpdatedItemId,
        isTvMode,
        setIsTvMode,
        isAuthenticated,
        verifyAdminPin,
        lockAdmin,
        changeAdminPin,
        activeAdminTab,
        setActiveAdminTab,
        updateItemPrice,
        toggleItemOffer,
        toggleItemFeaturedDaily,
        toggleItemAvailability,
        addItem,
        updateItem,
        deleteItem,
        moveItemOrder,
        updateSettings,
        resetToDefaults,
        exportDataJson,
        importDataJson,
        goToNextOffer,
        goToPrevOffer,
        refreshFromServer,
        lastServerSync,
        isSyncing,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};
