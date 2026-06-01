import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';
import { Text } from './text';

const meta: Meta<typeof Accordion> = {
  title: 'UI/Accordion',
  component: Accordion,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <View style={{ width: 360, padding: 16 }}><Story /></View>],
};
export default meta;
type Story = StoryObj<typeof Accordion>;

export const Single: Story = {
  render: () => (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger><Text>¿Qué es la evaluación de pares?</Text></AccordionTrigger>
        <AccordionContent><Text>Es un proceso en el que los estudiantes evalúan el trabajo de sus compañeros de grupo según criterios establecidos.</Text></AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger><Text>¿Cómo se calcula la nota?</Text></AccordionTrigger>
        <AccordionContent><Text>La nota final es el promedio ponderado de las calificaciones recibidas de cada par evaluador.</Text></AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger><Text>¿Puedo ver quién me evaluó?</Text></AccordionTrigger>
        <AccordionContent><Text>Las evaluaciones son anónimas. Solo el profesor puede ver los resultados individuales.</Text></AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple">
      <AccordionItem value="a">
        <AccordionTrigger><Text>Sección A</Text></AccordionTrigger>
        <AccordionContent><Text>Contenido de la sección A.</Text></AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger><Text>Sección B</Text></AccordionTrigger>
        <AccordionContent><Text>Contenido de la sección B.</Text></AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
