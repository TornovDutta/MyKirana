export type UserRole = 'customer' | 'shop_owner' | 'delivery_partner';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  profile_image?: string;
}

export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface Shop {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  pincode: string;
  location: GeoLocation;
  delivery_radius_km: number;
  phone: string;
  categories: string[];
  opening_time: string;
  closing_time: string;
  is_open: boolean;
  owner_id: string;
  rating: number;
  total_ratings: number;
  image_url?: string;
  distance_km?: number;
}

export interface Product {
  id: string;
  shop_id: string;
  shop_name?: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  mrp: number;
  discount_percent: number;
  unit: string;
  quantity_in_stock: number;
  is_available: boolean;
  image_url?: string;
  brand?: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  product_id: string;
  shop_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface DeliveryAddress {
  address: string;
  city: string;
  pincode: string;
  coordinates: [number, number];
}

export interface Order {
  id: string;
  customer_id: string;
  items: OrderItem[];
  shops_involved: string[];
  delivery_address: DeliveryAddress;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  delivery_partner_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Delivery {
  id: string;
  order_id: string;
  partner_id: string;
  status: string;
  current_location?: [number, number];
  delivery_address: string;
  created_at: string;
  updated_at: string;
}

export interface OrderPreview {
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  shops_count: number;
  unfulfilled_count: number;
}
