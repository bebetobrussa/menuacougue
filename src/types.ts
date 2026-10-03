export type CategoryId = 'todos' | 'bovinos' | 'aves' | 'suinos' | 'embutidos' | 'especiais';

export interface Category {
  id: CategoryId;
  label: string;
  shortLabel: string;
}

export interface MeatItem {
  id: string;
  name: string;
  category: CategoryId;
  price: number;
  originalPrice?: number;
  unit: string; // 'kg' | 'un' | 'peça' | 'kit' | 'bandeja'
  isOffer: boolean;
  isFeaturedDaily: boolean; // Highlights in the big yellow sign
  featuredSubtitle?: string;
  featuredImage?: string;
  available: boolean;
  order: number;
  lastUpdated?: number;
}

export type ThemeId = 'wood_dark' | 'slate_dark' | 'butcher_red';

export interface StoreSettings {
  storeName: string;
  storeSubtitle: string;
  phone: string;
  whatsapp: string;
  tickerMessage: string;
  theme: ThemeId;
  columns: 2 | 3;
  showClock: boolean;
  showBannerImage: boolean;
  bannerImageUrl: string;
  autoRotateOffers: boolean;
  rotationIntervalSeconds: number;
  soundAlertOnPriceUpdate: boolean;
  tvZoom: number; // 90 to 120
  currencySymbol: string;
  featuredPhotoSize?: 'large' | 'medium';
  featuredPhotoFit?: 'cover' | 'contain';
  adminPin: string;
  requirePinForAdmin: boolean;
  column1Title?: string;
  column2Title?: string;
  badgeInitials?: string;
  badgeTitle?: string;
  badgeSubtitle?: string;
  bannerBadgeText?: string;
  nightModeEnabled?: boolean;
  nightModeAuto?: boolean;
  nightModeStartHour?: number;
  nightModeEndHour?: number;
  nightModeDimLevel?: number;
  maintenanceModeEnabled?: boolean;
  maintenanceTitle?: string;
  maintenanceMessage?: string;
  maintenanceEstimatedReturn?: string;
}
