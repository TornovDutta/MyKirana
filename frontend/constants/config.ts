export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

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
