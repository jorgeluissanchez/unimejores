import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Text } from '@/core/components/ui/text';
import React, { useEffect, useState } from 'react';
import { Keyboard, View } from 'react-native';
import { Product } from '../../domain/entities/product';
import { useProducts } from '../context/product-context';

type UpdateProductFormProps = {
  productId: string;
  onCancel: () => void;
};

type FormErrors = {
  name?: string;
  quantity?: string;
};

export function UpdateProductForm({productId, onCancel }: UpdateProductFormProps) {
  const { updateProduct, getProduct } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const loadedProduct = await getProduct(productId);
        if (loadedProduct) {
          setProduct(loadedProduct);
          setName(loadedProduct.name);
          setDescription(loadedProduct.description);
          setQuantity(loadedProduct.quantity.toString());
        }
      } catch (error) {
        console.error('Error al cargar el producto:', error);
      } finally {
        setIsLoadingProduct(false);
      }
    };
    loadProduct();
  }, [productId, getProduct]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }

    if (!quantity.trim()) {
      newErrors.quantity = 'La cantidad es obligatoria';
    } else if (isNaN(Number(quantity)) || Number(quantity) < 0) {
      newErrors.quantity = 'La cantidad debe ser un número válido y positivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validate() || !product) return;

    await updateProduct({
      _id: product._id,
      name: name.trim(),
      description: description.trim(),
      quantity: Number(quantity),
    });
    onCancel();
  };

  if (isLoadingProduct) {
    return (
      <View className="mt-4 items-center justify-center">
        <Text>Cargando producto...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View className="mt-4 items-center justify-center">
        <Text className="text-destructive">Producto no encontrado</Text>
      </View>
    );
  }

  return (
    <View className="mt-4 gap-4">
      <View className="gap-1.5">
        <Label>Nombre</Label>
        <Input
          testID="name-input"
          value={name}
          placeholder="Ej: Arroz"
          onChangeText={(v: string) => {
            setName(v);
            if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
          }}
          className={errors.name ? 'border-destructive' : undefined}
        />
        {!!errors.name && <Text className="text-sm text-destructive">{errors.name}</Text>}
      </View>

      <View className="gap-1.5">
        <Label>Descripción</Label>
        <Input
          testID="description-input"
          value={description}
          placeholder="Ej: Bolsa de 1kg"
          onChangeText={(v: string) => setDescription(v)}
        />
      </View>

      <View className="gap-1.5">
        <Label>Cantidad</Label>
        <Input
          testID="quantity-input"
          value={quantity}
          placeholder="Ej: 10"
          onChangeText={(v: string) => {
            setQuantity(v);
            if (errors.quantity) setErrors((e) => ({ ...e, quantity: undefined }));
          }}
          keyboardType="numeric"
          className={errors.quantity ? 'border-destructive' : undefined}
        />
        {!!errors.quantity && <Text className="text-sm text-destructive">{errors.quantity}</Text>}
      </View>

      <View className="flex-row items-center justify-end gap-2">
        <Button variant="outline" onPress={onCancel}>
          <Text>Cancelar</Text>
        </Button>
        <Button onPress={handleSubmit} testID="save-button">
          <Text>Actualizar</Text>
        </Button>
      </View>
    </View>
  );
}