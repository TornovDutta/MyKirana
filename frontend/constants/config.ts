import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];

  if (envUrl && envUrl.trim() !== '') {
    // On mobile devices, localhost refers to the phone itself, so replace with host IP if available
    if (Platform.OS !== 'web' && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) && host) {
      return `http://${host}:8000`;
    }
    return envUrl;
  }

  // Fallback for mobile devices: connect to backend on the computer's IP
  if (Platform.OS !== 'web' && host) {
    return `http://${host}:8000`;
  }

  return 'http://localhost:8000';
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
