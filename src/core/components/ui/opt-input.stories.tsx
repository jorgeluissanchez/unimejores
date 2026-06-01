import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { View } from 'react-native';
import { OTPInput } from './opt-input';
import { Text } from './text';

const meta: Meta<typeof OTPInput> = {
  title: 'UI/OTPInput',
  component: OTPInput,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <View style={{ padding: 24, alignItems: 'center' }}><Story /></View>],
};
export default meta;
type Story = StoryObj<typeof OTPInput>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return <OTPInput value={value} onChange={setValue} length={6} />;
  },
};

export const WithSeparator: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return <OTPInput value={value} onChange={setValue} length={6} separator />;
  },
};

export const Masked: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return <OTPInput value={value} onChange={setValue} length={4} mask />;
  },
};

export const FourDigits: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return <OTPInput value={value} onChange={setValue} length={4} />;
  },
};

export const WithError: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return <OTPInput value={value} onChange={setValue} length={6} error="Código incorrecto. Intenta de nuevo." />;
  },
};

export const Disabled: Story = {
  render: () => (
    <OTPInput value="123456" onChange={() => {}} length={6} disabled />
  ),
};

export const WithExpiryTimer: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return <OTPInput value={value} onChange={setValue} length={6} expiresIn={60} showExpiryTimer />;
  },
};

export const WithOnComplete: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const [completed, setCompleted] = useState(false);
    return (
      <View style={{ alignItems: 'center', gap: 12 }}>
        <OTPInput value={value} onChange={setValue} length={6} onComplete={() => setCompleted(true)} />
        {completed && <Text variant="muted" className="text-green-600">¡Código completo!</Text>}
      </View>
    );
  },
};
