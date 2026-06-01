import type { Meta, StoryObj } from '@storybook/react';
import {
  AlertCircle, Bell, BookOpen, CheckCircle2,
  ChevronRight, FileText, Home, LogOut,
  Settings, Star, User, Users,
} from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { Text } from './text';
import { Icon } from './icon';

const meta: Meta<typeof Icon> = {
  title: 'UI/Icon',
  component: Icon,
  parameters: { layout: 'centered' },
  argTypes: { size: { control: { type: 'range', min: 12, max: 48 } } },
};
export default meta;
type Story = StoryObj<typeof Icon>;

export const Default: Story = {
  render: () => <Icon as={Home} size={24} />,
};

export const Sizes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      {[12, 16, 20, 24, 32, 40].map((size) => (
        <Icon key={size} as={Star} size={size} />
      ))}
    </View>
  ),
};

export const Colored: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Icon as={CheckCircle2} size={24} className="text-green-500" />
      <Icon as={AlertCircle} size={24} className="text-destructive" />
      <Icon as={Star} size={24} className="text-yellow-500" />
      <Icon as={Bell} size={24} className="text-primary" />
    </View>
  ),
};

export const Gallery: Story = {
  render: () => {
    const icons = [Home, User, Users, BookOpen, FileText, Settings, Bell, LogOut, ChevronRight, AlertCircle, CheckCircle2, Star];
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20, maxWidth: 280, justifyContent: 'center' }}>
        {icons.map((LucideIcon, i) => (
          <View key={i} style={{ alignItems: 'center', gap: 4 }}>
            <Icon as={LucideIcon} size={20} />
          </View>
        ))}
      </View>
    );
  },
};

export const WithText: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Icon as={Bell} size={16} />
      <Text>3 notificaciones pendientes</Text>
    </View>
  ),
};
