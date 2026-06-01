import type { Meta, StoryObj } from '@storybook/react';
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react-native';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from './text';
import { ToggleGroup, ToggleGroupIcon, ToggleGroupItem } from './toggle-group';

const meta: Meta<typeof ToggleGroup> = {
  title: 'UI/ToggleGroup',
  component: ToggleGroup,
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof ToggleGroup>;

export const Single: Story = {
  render: () => {
    const [value, setValue] = useState('student');
    return (
      <ToggleGroup type="single" value={value} onValueChange={(v) => v && setValue(v)}>
        <ToggleGroupItem value="student" isFirst><Text>Estudiante</Text></ToggleGroupItem>
        <ToggleGroupItem value="professor" isLast><Text>Profesor</Text></ToggleGroupItem>
      </ToggleGroup>
    );
  },
};

export const Multiple: Story = {
  render: () => {
    const [values, setValues] = useState<string[]>([]);
    return (
      <ToggleGroup type="multiple" value={values} onValueChange={setValues}>
        <ToggleGroupItem value="bold" isFirst><Text>B</Text></ToggleGroupItem>
        <ToggleGroupItem value="italic"><Text>I</Text></ToggleGroupItem>
        <ToggleGroupItem value="underline" isLast><Text>U</Text></ToggleGroupItem>
      </ToggleGroup>
    );
  },
};

export const WithIcons: Story = {
  render: () => {
    const [align, setAlign] = useState('left');
    return (
      <ToggleGroup type="single" variant="outline" value={align} onValueChange={(v) => v && setAlign(v)}>
        <ToggleGroupItem value="left" isFirst>
          <ToggleGroupIcon as={AlignLeft} />
        </ToggleGroupItem>
        <ToggleGroupItem value="center">
          <ToggleGroupIcon as={AlignCenter} />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" isLast>
          <ToggleGroupIcon as={AlignRight} />
        </ToggleGroupItem>
      </ToggleGroup>
    );
  },
};

export const Outline: Story = {
  render: () => {
    const [value, setValue] = useState('sm');
    return (
      <ToggleGroup type="single" variant="outline" value={value} onValueChange={(v) => v && setValue(v)}>
        <ToggleGroupItem value="sm" isFirst><Text>S</Text></ToggleGroupItem>
        <ToggleGroupItem value="md"><Text>M</Text></ToggleGroupItem>
        <ToggleGroupItem value="lg" isLast><Text>L</Text></ToggleGroupItem>
      </ToggleGroup>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <ToggleGroup type="single" value="a" onValueChange={() => {}}>
      <ToggleGroupItem value="a" isFirst disabled><Text>A</Text></ToggleGroupItem>
      <ToggleGroupItem value="b" isLast disabled><Text>B</Text></ToggleGroupItem>
    </ToggleGroup>
  ),
};
