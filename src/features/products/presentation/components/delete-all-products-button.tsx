import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';
import React from 'react';
import { useProducts } from '../context/product-context';

export function DeleteAllProductsButton() {
  const { products, removeProduct } = useProducts();
  
  if (products.length === 0) {
    return null;
  }
  
  const handleDeleteAll = async () => {
    for (const product of products) {
      await removeProduct(product._id);
    }
  };
  
  return (
    <Button testID="delete-all-button" variant="destructive" size="sm" onPress={handleDeleteAll}>
      <Text>Eliminar todo</Text>
    </Button>
  );
}
