import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';

// NativeWind needs a stub on the test environment
jest.mock('nativewind', () => ({
  styled: (c: any) => c,
}));

describe('Button', () => {
  it('renders its children', () => {
    const { getByText } = render(<Button><Text>Enviar</Text></Button>);
    expect(getByText('Enviar')).toBeTruthy();
  });

  it('has role="button" for accessibility', () => {
    const { getByRole } = render(<Button><Text>X</Text></Button>);
    expect(getByRole('button')).toBeTruthy();
  });

  it('fires onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<Button onPress={onPress}><Text>Go</Text></Button>);
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Button onPress={onPress} disabled><Text>Off</Text></Button>
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('forwards testID to the underlying Pressable', () => {
    const { getByTestId } = render(
      <Button testID="submit-btn"><Text>Submit</Text></Button>
    );
    expect(getByTestId('submit-btn')).toBeTruthy();
  });

  it.each(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const)(
    'renders variant "%s" without crashing',
    (variant) => {
      const { getByRole } = render(
        <Button variant={variant}><Text>{variant}</Text></Button>
      );
      expect(getByRole('button')).toBeTruthy();
    }
  );

  it.each(['default', 'sm', 'lg', 'icon'] as const)(
    'renders size "%s" without crashing',
    (size) => {
      const { getByRole } = render(
        <Button size={size}><Text>.</Text></Button>
      );
      expect(getByRole('button')).toBeTruthy();
    }
  );
});
