import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const { user, accessToken, logout } = useAuthStore();
  return {
    user,
    isAuthenticated: !!accessToken,
    isCustomer: user?.role === 'customer',
    isShopOwner: user?.role === 'shop_owner',
    isDeliveryPartner: user?.role === 'delivery_partner',
    logout,
  };
}
