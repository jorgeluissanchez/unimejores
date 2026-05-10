import ToastProvider from '@/core/components/ui/toast';
import { DIProvider } from '@/core/di/di-Provider';
import { useTheme } from '@/core/hooks/use-theme';
import { AuthProvider } from '@/features/auth/presentation/context/auth-context';
import "@/global.css";
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar } from 'react-native';

export default function RootLayout() {
  const theme = useTheme();

  React.useEffect(() => {
    if (process.env.EXPO_PUBLIC_USE_MOCK !== 'true') {
      return;
    }
    void import('@/mocks').then(({ initMocks }) => initMocks());
  }, []);

  return (
    <>
    <StatusBar 
          animated={true}
          barStyle="dark-content"
          showHideTransition="slide"
          hidden={true}
        />
    <DIProvider>
      <AuthProvider>
        <ThemeProvider value={theme}>
          <ToastProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(app)" options={{ headerShown: false }} />
            </Stack>
          </ToastProvider>
          <PortalHost />
        </ThemeProvider>
      </AuthProvider>
    </DIProvider>
    </>
  );
}
