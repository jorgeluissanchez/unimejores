import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LogoutButton } from '@/features/auth/presentation/components/logout-button';

const mockLogout = jest.fn();

jest.mock('@/features/auth/presentation/context/auth-context', () => ({
  useAuth: jest.fn(() => ({ logout: mockLogout })),
}));

beforeEach(() => jest.clearAllMocks());

describe('LogoutButton', () => {
  it('renderiza el texto "Cerrar sesión"', () => {
    const { getByText } = render(<LogoutButton />);
    expect(getByText('Cerrar sesión')).toBeTruthy();
  });

  it('tiene testID="logout-button"', () => {
    const { getByTestId } = render(<LogoutButton />);
    expect(getByTestId('logout-button')).toBeTruthy();
  });

  it('llama a logout() al presionar', () => {
    const { getByTestId } = render(<LogoutButton />);
    fireEvent.press(getByTestId('logout-button'));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
