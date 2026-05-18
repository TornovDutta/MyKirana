import { useEffect } from 'react';
import { router } from 'expo-router';

// Registration is now part of the OTP login flow.
// New users are detected automatically when they enter their phone number.
export default function RegisterScreen() {
  useEffect(() => {
    router.replace('/(auth)/login');
  }, []);

  return null;
}
