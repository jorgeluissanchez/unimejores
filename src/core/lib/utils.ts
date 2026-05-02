import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isSessionExpiredError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");

  return (
    message.includes("Error al renovar el token") ||
    message.includes("No autorizado (problema con el token)") ||
    message.includes("token inválido") ||
    message.includes("Token inválido") ||
    message.includes("expired token")
  );
}