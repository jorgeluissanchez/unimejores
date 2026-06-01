import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Image, View } from 'react-native';
import { AspectRatio } from './aspect-ratio';
import { Text } from './text';

const meta: Meta<typeof AspectRatio> = {
  title: 'UI/AspectRatio',
  component: AspectRatio,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <View style={{ width: 320, padding: 16 }}><Story /></View>],
};
export default meta;
type Story = StoryObj<typeof AspectRatio>;

export const SixteenByNine: Story = {
  render: () => (
    <AspectRatio ratio={16 / 9}>
      <Image
        source={{ uri: 'https://picsum.photos/seed/uninorte/800/450' }}
        style={{ width: '100%', height: '100%', borderRadius: 8 }}
        resizeMode="cover"
      />
    </AspectRatio>
  ),
};

export const Square: Story = {
  render: () => (
    <AspectRatio ratio={1}>
      <Image
        source={{ uri: 'https://picsum.photos/seed/uni/400/400' }}
        style={{ width: '100%', height: '100%', borderRadius: 8 }}
        resizeMode="cover"
      />
    </AspectRatio>
  ),
};

export const FourByThree: Story = {
  render: () => (
    <AspectRatio ratio={4 / 3}>
      <View style={{ width: '100%', height: '100%', backgroundColor: '#e5e7eb', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="muted">4 : 3</Text>
      </View>
    </AspectRatio>
  ),
};
