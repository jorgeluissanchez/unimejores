import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { Redirect } from "expo-router";

export default function Index() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) return null;

  if (isLoggedIn) {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/welcome" />;
}