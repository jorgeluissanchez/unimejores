import { Button } from "@/core/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
import { OTPInput } from "@/core/components/ui/opt-input";
import { Text } from "@/core/components/ui/text";
import { useToast } from '@/core/components/ui/toast';
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { RelativePathString, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { View } from "react-native";

export default function VerifyEmailScreen() {
  const { validate } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string | string[] }>();

  const initialEmail = useMemo(() => {
    const value = params.email;
    return Array.isArray(value) ? value[0] ?? "" : value ?? "";
  }, [params.email]);

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const toast = useToast();

  const validateForm = (): boolean => {
    const trimmedEmail = email.trim();
    const trimmedCode = code.trim();

    if (!trimmedEmail) {
      setErrorMessage("Falta el correo para verificar");
      toast.show({
        title: 'Error de verificación',
        description: 'Falta el correo para verificar',
        variant: 'destructive',
      });
      return false;
    }

    if (!trimmedCode) {
      setErrorMessage("Ingresa el código de verificación");
      toast.show({
        title: 'Error de verificación',
        description: 'Ingresa el código de verificación',
        variant: 'destructive',
      });
      return false;
    } else if (trimmedCode.length !== 6 || !/^\d{6}$/.test(trimmedCode)) {
      setErrorMessage("El código debe tener 6 dígitos");
      toast.show({
        title: 'Error de verificación',
        description: 'El código debe tener 6 dígitos',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (!validateForm()) return;

    setLoading(true);
    const result = await validate(email.trim(), code.trim());
    setLoading(false);

    if (result) {
      setErrorMessage(result);
      toast.show({
        title: 'La verificación falló',
        description: result,
        variant: 'destructive',
      });
      return;
    }

    const msg = "Correo verificado correctamente. Ahora puedes iniciar sesión.";
    toast.show({
      title: 'Éxito',
      description: msg,
      variant: 'default',
    });
    setCode("");
    setTimeout(() => router.replace('/login' as RelativePathString), 800);
  };

  return (
    <View className="flex-1 justify-center p-5">
      <Card className="max-w-xl mx-auto w-full">
        <CardHeader>
          <CardTitle className="text-center">Verifica tu correo</CardTitle>
          <CardDescription className="text-center">
            Ingresa el código de 6 dígitos enviado a tu bandeja de entrada. Revisa spam si no lo ves.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-4">

          {!!errorMessage && (
            <View className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
              <Text className="text-sm text-destructive">{errorMessage}</Text>
            </View>
          )}

          <View className="items-center gap-3 py-2">
            <OTPInput
              length={6}
              separator={true}
              keyboard="numeric"
              value={code}
              onChange={(value: string) => {
                setCode(value.replace(/\D/g, ""));
                if (errorMessage) setErrorMessage(null);
              }}
              onComplete={(value: string) => {
                setCode(value.replace(/\D/g, ""));
                void handleSubmit();
              }}
              shouldHandleClipboard={false}
            />
            <Text className="text-center text-sm text-muted-foreground">
              Ingresa el código de 6 dígitos enviado a tu correo
            </Text>
          </View>

          <Button onPress={handleSubmit} disabled={loading}>
            <Text>{loading ? "Verificando..." : "Verificar correo"}</Text>
          </Button>

          <Button variant="link" onPress={() => router.replace('/login' as RelativePathString)}>
            <Text>Volver al inicio de sesión</Text>
          </Button>
        </CardContent>
      </Card>
    </View>
  );
}