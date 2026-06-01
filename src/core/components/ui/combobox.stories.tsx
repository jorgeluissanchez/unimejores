import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from './combobox';
import { Label } from './label';

const STUDENTS = [
  { value: 'u1', label: 'Ana García' },
  { value: 'u2', label: 'Carlos López' },
  { value: 'u3', label: 'María Torres' },
  { value: 'u4', label: 'Juan Martínez' },
  { value: 'u5', label: 'Sofía Herrera' },
];

const COURSES = [
  { value: 'sis', label: 'Ingeniería de Software' },
  { value: 'net', label: 'Redes de Computadores' },
  { value: 'db', label: 'Bases de Datos' },
  { value: 'ai', label: 'Inteligencia Artificial' },
];

const meta: Meta<typeof Combobox> = {
  title: 'UI/Combobox',
  component: Combobox,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <View style={{ width: 320, padding: 16, minHeight: 300 }}><Story /></View>],
};
export default meta;
type Story = StoryObj<typeof Combobox>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<string | undefined>(undefined);
    const [query, setQuery] = useState('');
    const filtered = STUDENTS.filter((s) => s.label.toLowerCase().includes(query.toLowerCase()));
    return (
      <Combobox value={value} onValueChange={setValue}>
        <ComboboxInput placeholder="Buscar estudiante..." filterFn={setQuery} />
        <ComboboxContent>
          <ComboboxList>
            <ComboboxEmpty shown={filtered.length === 0} />
            {filtered.map((s) => <ComboboxItem key={s.value} value={s.value} label={s.label} />)}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );
  },
};

export const WithLabel: Story = {
  render: () => {
    const [value, setValue] = useState<string | undefined>(undefined);
    return (
      <View style={{ gap: 6 }}>
        <Label>Selecciona un curso</Label>
        <Combobox value={value} onValueChange={setValue}>
          <ComboboxInput placeholder="Buscar curso..." />
          <ComboboxContent>
            <ComboboxList>
              {COURSES.map((c) => <ComboboxItem key={c.value} value={c.value} label={c.label} />)}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </View>
    );
  },
};

export const WithError: Story = {
  render: () => {
    const [value, setValue] = useState<string | undefined>(undefined);
    return (
      <Combobox value={value} onValueChange={setValue} hasError>
        <ComboboxInput placeholder="Selecciona un estudiante..." />
        <ComboboxContent>
          <ComboboxList>
            {STUDENTS.map((s) => <ComboboxItem key={s.value} value={s.value} label={s.label} />)}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );
  },
};
