import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';
import React from 'react';
import { useProducts } from '../context/product-context';

interface DeleteProductButtonProps {
  productId: string;
}

export function DeleteProductButton({
  productId,
}: DeleteProductButtonProps) {
  const { removeProduct } = useProducts();
  return (
    <Button testID="delete-product-button" variant="destructive" size="sm" onPress={() => removeProduct(productId)}>
      <Text>Eliminar producto</Text>
    </Button>
  );
}
