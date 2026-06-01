import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

const mockLogin = jest.fn();
const mockClearError = jest.fn();

jest.mock('@/features/auth/presentation/context/auth-context', () => ({
  useAuth: jest.fn(() => ({
    login: mockLogin,
    loading: false,
    error: null,
    clearError: mockClearError,
    isLoggedIn: false,
    loggedUser: null,
  })),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
}));

jest.mock('react-native-svg', () => ({
  SvgXml: () => null,
  Svg: () => null,
}));

jest.mock('lucide-react-native', () => ({
  ArrowLeft: () => null,
}));


// LoginScreen is the default export
import LoginScreen from '@/features/auth/presentation/screens/login-screen';
import { useAuth } from '@/features/auth/presentation/context/auth-context';
const mockedUseAuth = useAuth as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('LoginScreen', () => {
  it('renders email input, password input, and login button', () => {
    const { getByTestId } = render(<LoginScreen />);
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('login-button')).toBeTruthy();
  });

  it('shows validation error when submitted empty', async () => {
    const { getByTestId, getByText } = render(<LoginScreen />);
    fireEvent.press(getByTestId('login-button'));
    await waitFor(() => {
      expect(getByText(/Ingresa tu correo/i)).toBeTruthy();
    });
  });

  it('shows invalid-email error for bad email format', async () => {
    const { getByTestId, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByTestId('email-input'), 'notanemail');
    fireEvent.press(getByTestId('login-button'));
    await waitFor(() => {
      expect(getByText(/correo válido/i)).toBeTruthy();
    });
  });

  it('shows short-password error for < 6 chars', async () => {
    const { getByTestId, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByTestId('email-input'), 'valid@test.com');
    fireEvent.changeText(getByTestId('password-input'), '123');
    fireEvent.press(getByTestId('login-button'));
    await waitFor(() => {
      expect(getByText(/Mínimo 6/i)).toBeTruthy();
    });
  });

  it('shows error banner when auth context has an error', () => {
    mockedUseAuth.mockReturnValueOnce({
      login: mockLogin, loading: false, error: 'Credenciales inválidas',
      clearError: mockClearError, isLoggedIn: false, loggedUser: null,
    });
    const { getByText } = render(<LoginScreen />);
    expect(getByText(/Credenciales inválidas/i)).toBeTruthy();
  });

  it('calls login with email and password on valid submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const { getByTestId } = render(<LoginScreen />);
    fireEvent.changeText(getByTestId('email-input'), 'test@uninorte.edu.co');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.press(getByTestId('login-button'));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@uninorte.edu.co', 'password123');
    });
  });
});
