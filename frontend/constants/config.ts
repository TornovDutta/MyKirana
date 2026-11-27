import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiBaseUrl = (): string => {
  // On Web: connect to port 8000 on the same host the browser is accessing (e.g. localhost or current IP)
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:8000`;
  }

  // On Mobile: connect directly to the machine serving the Expo bundle
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (Platform.OS !== 'web' && host) {
    if (host === 'localhost' || host === '127.0.0.1') {
      return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
    }
    return `http://${host}:8000`;
  }

  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl;
  }

  return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();

const DEFAULT_DELIVERY_RADIUS_KM = 10;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  preparing: 'Being Prepared',
  ready: 'Ready for Pickup',
  picked_up: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: '#FF6F00',
  confirmed: '#1976D2',
  preparing: '#7B1FA2',
  ready: '#0097A7',
  picked_up: '#F57C00',
  delivered: '#388E3C',
  cancelled: '#D32F2F',
};

export const PRODUCT_CATEGORIES = [
  'Fruits & Vegetables',
  'Dairy & Eggs',
  'Grains & Pulses',
  'Snacks',
  'Beverages',
  'Personal Care',
  'Household',
  'Bakery',
  'Frozen Foods',
  'Other',
];
