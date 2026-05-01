import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Text } from '@/core/components/ui/text';
import React, { useState } from 'react';
import { Keyboard, View } from 'react-native';
import { useProducts } from '../context/product-context';

type AddProductFormProps = {
    onCancel: () => void;
};

type FormErrors = {
    name?: string;
    quantity?: string;
};

export function AddProductForm({ onCancel }: AddProductFormProps) {
    const { addProduct } = useProducts();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});

    const validate = (): boolean => {
        const newErrors: FormErrors = {};

        if (!name.trim()) newErrors.name = 'El nombre es obligatorio';
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
        if (!validate()) return;

        await addProduct({
            name: name.trim(),
            description: description.trim(),
            quantity: Number(quantity),
        });

        setName('');
        setDescription('');
        setQuantity('');
        setErrors({});
        onCancel();
    };

    return (
        <View className="mt-4 gap-4">
            <View className="gap-1.5">
                <Label>Nombre</Label>
                <Input
                    testID="name-input"
                    value={name}
                    placeholder="Ej: Arroz"
                    onChangeText={(value: string) => {
                        setName(value);
                        if (errors.name) setErrors((current) => ({ ...current, name: undefined }));
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
                    onChangeText={setDescription}
                />
            </View>

            <View className="gap-1.5">
                <Label>Cantidad</Label>
                <Input
                    testID="quantity-input"
                    value={quantity}
                    placeholder="Ej: 10"
                    onChangeText={(value: string) => {
                        setQuantity(value);
                        if (errors.quantity) setErrors((current) => ({ ...current, quantity: undefined }));
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
                    <Text>Guardar</Text>
                </Button>
            </View>
        </View>
    );
}
