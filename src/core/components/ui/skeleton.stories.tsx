import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';
import { Skeleton } from './skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <View style={{ width: 340, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  render: () => <Skeleton style={{ height: 20, borderRadius: 4 }} />,
};

export const Circle: Story = {
  render: () => <Skeleton style={{ width: 48, height: 48, borderRadius: 24 }} />,
};

export const TextLine: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      <Skeleton style={{ height: 16, width: '80%' }} />
      <Skeleton style={{ height: 16, width: '60%' }} />
      <Skeleton style={{ height: 16, width: '70%' }} />
    </View>
  ),
};

export const CardSkeleton: Story = {
  render: () => (
    <View style={{ gap: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' }}>
      {/* Avatar + title row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Skeleton style={{ width: 40, height: 40, borderRadius: 20 }} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton style={{ height: 14, width: '60%' }} />
          <Skeleton style={{ height: 12, width: '40%' }} />
        </View>
      </View>
      {/* Body lines */}
      <Skeleton style={{ height: 14 }} />
      <Skeleton style={{ height: 14, width: '85%' }} />
      <Skeleton style={{ height: 14, width: '55%' }} />
      {/* Button */}
      <Skeleton style={{ height: 48, borderRadius: 24, marginTop: 4 }} />
    </View>
  ),
};

export const CourseSkeleton: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{ gap: 10, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' }}
        >
          <Skeleton style={{ height: 18, width: '70%' }} />
          <Skeleton style={{ height: 13, width: '50%' }} />
          <Skeleton style={{ height: 40, borderRadius: 20, marginTop: 4 }} />
        </View>
      ))}
    </View>
  ),
};
