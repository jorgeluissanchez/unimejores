import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Progress } from './progress';
import { Text } from './text';

const meta: Meta<typeof Progress> = {
  title: 'UI/Progress',
  component: Progress,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <View style={{ width: 320, padding: 16, gap: 16 }}><Story /></View>],
  argTypes: { value: { control: { type: 'range', min: 0, max: 100 } } },
};
export default meta;
type Story = StoryObj<typeof Progress>;

export const Empty: Story = { render: () => <Progress value={0} /> };
export const Quarter: Story = { render: () => <Progress value={25} /> };
export const Half: Story = { render: () => <Progress value={50} /> };
export const ThreeQuarters: Story = { render: () => <Progress value={75} /> };
export const Full: Story = { render: () => <Progress value={100} /> };

export const WithLabel: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="small">Criterios completados</Text>
        <Text variant="small">3 / 4</Text>
      </View>
      <Progress value={75} />
    </View>
  ),
};

export const Animated: Story = {
  render: () => {
    const [value, setValue] = useState(0);
    useEffect(() => {
      const id = setInterval(() => setValue((v) => (v >= 100 ? 0 : v + 5)), 300);
      return () => clearInterval(id);
    }, []);
    return (
      <View style={{ gap: 8 }}>
        <Progress value={value} />
        <Text variant="muted" style={{ textAlign: 'center' }}>{value}%</Text>
      </View>
    );
  },
};
