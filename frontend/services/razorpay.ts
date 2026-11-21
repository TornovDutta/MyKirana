import { NativeModules } from 'react-native';

interface RazorpayOptions {
  key: string;
  amount: number | string;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
  };
  theme?: {
    color?: string;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

const SafeRazorpay = {
  open: async (options: RazorpayOptions): Promise<RazorpayResponse> => {
    if (NativeModules.RNRazorpayCheckout && NativeModules.RazorpayEventEmitter) {
      try {
        const RazorpayCheckout = require('react-native-razorpay').default;
        return await RazorpayCheckout.open(options);
      } catch (err) {
        console.warn('Error opening RazorpayCheckout:', err);
        throw err;
      }
    }
    throw new Error('Razorpay native module is not available in Expo Go. Please select Cash on Delivery or use a custom development build.');
  },
};

export default SafeRazorpay;
