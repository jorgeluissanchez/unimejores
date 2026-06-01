import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Text } from './text';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage
        source={{ uri: 'https://i.pravatar.cc/150?img=3' }}
        alt="Foto de perfil"
      />
      <AvatarFallback><Text>ES</Text></AvatarFallback>
    </Avatar>
  ),
};

export const Fallback: Story = {
  render: () => (
    <Avatar>
      <AvatarImage source={{ uri: 'https://broken-url.xyz/img.jpg' }} alt="Roto" />
      <AvatarFallback><Text>JS</Text></AvatarFallback>
    </Avatar>
  ),
};

export const Large: Story = {
  render: () => (
    <Avatar className="size-16">
      <AvatarImage source={{ uri: 'https://i.pravatar.cc/150?img=7' }} alt="Grande" />
      <AvatarFallback><Text>LG</Text></AvatarFallback>
    </Avatar>
  ),
};

export const AvatarGroup: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: -8 }}>
      {['img=1', 'img=2', 'img=3', 'img=4'].map((q, i) => (
        <Avatar key={q} className="border-background border-2" style={{ zIndex: 4 - i }}>
          <AvatarImage source={{ uri: `https://i.pravatar.cc/150?${q}` }} alt={q} />
          <AvatarFallback><Text>{String.fromCharCode(65 + i)}</Text></AvatarFallback>
        </Avatar>
      ))}
    </View>
  ),
};
