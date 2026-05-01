import { Stack } from 'expo-router';
import React from 'react';

import { useAuth } from '@/features/auth/presentation/context/auth-context';
import { ProductProvider } from '@/features/products/presentation/context/product-context';

export default function AppLayout() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return null;
  }
/*
  if (!isLoggedIn) {
    return <Redirect href={"/login" as RelativePathString} />;
  }
*/
  return (
    <ProductProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ProductProvider>
  );
}