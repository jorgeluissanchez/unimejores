import { Button } from '@/core/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/core/components/ui/drawer';
import { Text } from '@/core/components/ui/text';
import { LogoutButton } from '@/features/auth/presentation/components/logout-button';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AddProductForm } from '../components/add-product-form';
import { DeleteAllProductsButton } from '../components/delete-all-products-button';
import { ListProducts } from '../components/list-products';
import { useProducts } from '../context/product-context';

export default function ProductsScreen() {
  const { products, isLoading } = useProducts();
  const [isAddOpen, setIsAddOpen] = React.useState(false);

  const onAddOpenChange = (open: boolean) => {
    setIsAddOpen(open);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator testID="loading-indicator" size="large" />
      </View>
    );
  }

  return (
    <View testID="product-screen" className="flex-1 p-4">
      <View className="mb-4 flex-row items-center gap-2">
        <Text variant="h3" className="flex-1 border-b-0 pb-0">Productos</Text>
        <Button testID="add-product-button" variant="default" size="sm" onPress={() => onAddOpenChange(true)}>
          <Text>Agregar</Text>
        </Button>
        <DeleteAllProductsButton  />
        <LogoutButton />
      </View>

      {products.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3">
          <Text className="text-muted-foreground">No se encontraron productos</Text>
        </View>
      ) : (
        <ListProducts />
      )}

      <Drawer open={isAddOpen} onOpenChange={onAddOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Agregar producto</DrawerTitle>
            <DrawerDescription>Crea un nuevo producto</DrawerDescription>
          </DrawerHeader>
          <AddProductForm onCancel={() => onAddOpenChange(false)} />
        </DrawerContent>
      </Drawer>
    </View>
  );
}
