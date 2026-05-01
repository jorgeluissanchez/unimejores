import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';
import { useAuth } from '@/features/auth/presentation/context/auth-context';
import React from 'react';
import { View } from 'react-native';

export default function SettingScreen() {
    const { logout } = useAuth();
    return (
        <View className="flex-1 bg-background">
            <View className="h-14 px-3 flex-row items-center justify-between border-b border-gray-200">
                <Text variant="h3">Perfil</Text>
                <Button variant="ghost" size="icon" onPress={() => logout()}>
                    <Text>Cerrar sesión</Text>
                </Button>
            </View>
            <View className="flex-1 justify-center items-center">
                <Text>Configuración del perfil...</Text>
            </View>
        </View>
    );
}