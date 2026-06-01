import type { Meta, StoryObj } from '@storybook/react';
import { Info } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { Button } from './button';
import { Icon } from './icon';
import { Text } from './text';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

const meta: Meta<typeof Tooltip> = {
  title: 'UI/Tooltip',
  component: Tooltip,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <View style={{ padding: 64 }}><Story /></View>],
};
export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline"><Text>Hover o long-press</Text></Button>
      </TooltipTrigger>
      <TooltipContent>
        <Text>Evaluación de pares</Text>
      </TooltipContent>
    </Tooltip>
  ),
};

export const OnIcon: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon">
          <Icon as={Info} size={18} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <Text>La nota máxima por criterio es 5 puntos</Text>
      </TooltipContent>
    </Tooltip>
  ),
};

export const Bottom: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button><Text>Tooltip abajo</Text></Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <Text>Aparece debajo del elemento</Text>
      </TooltipContent>
    </Tooltip>
  ),
};
