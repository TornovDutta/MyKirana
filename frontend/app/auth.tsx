import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function AuthCallbackRedirect() {
  const params = useLocalSearchParams<{
    id_token?: string;
    email?: string;
    name?: string;
  }>();

  return (
    <Redirect
      href={{
        pathname: '/login',
        params: {
          ...(params.id_token ? { id_token: params.id_token } : {}),
          ...(params.email ? { email: params.email } : {}),
          ...(params.name ? { name: params.name } : {}),
        },
      }}
    />
  );
}
