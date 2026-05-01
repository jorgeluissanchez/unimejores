import { Button } from '@/core/components/ui/button';
import { Card, CardContent } from '@/core/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { Text } from '@/core/components/ui/text';
import React from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { useProducts } from '../context/product-context';
import { DeleteProductButton } from './delete-product-button';
import { UpdateProductForm } from './update-product-form';


export function ListProducts() {
    
    const { products, isLoading } = useProducts();
    const [isUpdateOpen, setIsUpdateOpen] = React.useState(false);
    const [porductId, setProductId] = React.useState<string>('');


    const onOpenUpdate = (id: string) => {
        setProductId(id);
        setIsUpdateOpen(true);
    }
    const onCloseUpdate = () => {
        setProductId('');
        setIsUpdateOpen(false);
    }
    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator testID="loading-indicator" size="large" />
            </View>
        );
    }

    return (
        <>
            {products.length === 0 ? (
                <View className="flex-1 items-center justify-center gap-3">
                    <Text className="text-muted-foreground">No se encontraron productos</Text>
                </View>
            ) : (
                <>
                    <FlatList
                        contentContainerStyle={{ gap: 12, paddingBottom: 88 }}
                        data={products}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <Card>
                                <CardContent className="py-4">
                                    <View className="flex-row items-center justify-between gap-3">
                                        <View className="flex-1">
                                            <Text className="font-semibold">{item.name}</Text>
                                            <Text className="text-sm text-muted-foreground">Cant: {item.quantity}</Text>
                                        </View>
                                        <View className="flex-row items-center gap-2">
                                            <Button onPress={() => onOpenUpdate(item._id)}>
                                                <Text className="text-sm text-primary">Editar</Text>
                                            </Button>
                                            <DeleteProductButton productId={item._id} />
                                        </View>
                                    </View>
                                </CardContent>
                            </Card>
                        )}
                    />
                    <Dialog open={isUpdateOpen} onOpenChange={onCloseUpdate}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Actualizar producto</DialogTitle>
                                <DialogDescription>Edita los detalles del producto</DialogDescription>
                            </DialogHeader>
                            <UpdateProductForm productId={porductId} onCancel={onCloseUpdate} />
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </>
    );
}


