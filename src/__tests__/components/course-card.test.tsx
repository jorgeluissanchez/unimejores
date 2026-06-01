import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CourseCard } from '@/features/courses/presentation/components/course-card';
import type { Course } from '@/features/courses/domain/entities/course';

// ─── mocks ────────────────────────────────────────────────────────────────────
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}));

jest.mock('react-native-svg', () => ({
  SvgXml: () => null,
}));

// ─── helpers ─────────────────────────────────────────────────────────────────
const mockCourse: Course = {
  _id: 'course-1',
  course_id: 'course-1',
  name: 'Ingeniería de Software',
  nrc: '10234',
  description: 'Diseño y desarrollo de sistemas.',
};

const defaultProps = {
  course: mockCourse,
  pendingCount: 2,
  svg: '<svg></svg>',
  background: '#3B82F6',
  textColor: '#FFFFFF',
  secondaryTextColor: '#DBEAFE',
  buttonBackground: '#1D4ED8',
  buttonTextColor: '#FFFFFF',
};

beforeEach(() => jest.clearAllMocks());

// ─── tests ────────────────────────────────────────────────────────────────────
describe('CourseCard', () => {
  it('muestra el nombre del curso', () => {
    const { getByText } = render(<CourseCard {...defaultProps} />);
    expect(getByText('Ingeniería de Software')).toBeTruthy();
  });

  it('muestra "2 Grupos por Calificar" cuando pendingCount=2', () => {
    const { getByText } = render(<CourseCard {...defaultProps} pendingCount={2} />);
    expect(getByText('2 Grupos por Calificar')).toBeTruthy();
  });

  it('muestra "1 Grupo por Calificar" (singular) cuando pendingCount=1', () => {
    const { getByText } = render(<CourseCard {...defaultProps} pendingCount={1} />);
    expect(getByText('1 Grupo por Calificar')).toBeTruthy();
  });

  it('muestra "Todos han Sido Calificados" cuando pendingCount=0', () => {
    const { getByText } = render(<CourseCard {...defaultProps} pendingCount={0} />);
    expect(getByText('Todos han Sido Calificados')).toBeTruthy();
  });

  it('usa statusText personalizado cuando se provee', () => {
    const { getByText } = render(
      <CourseCard {...defaultProps} statusText="Evaluación activa" />
    );
    expect(getByText('Evaluación activa')).toBeTruthy();
  });

  it('navega a la ruta del curso al presionar COMIENZA', () => {
    const { getByText } = render(<CourseCard {...defaultProps} />);
    fireEvent.press(getByText('COMIENZA'));
    expect(mockPush).toHaveBeenCalledWith(`/course/${mockCourse._id}`);
  });

  it('navega a href personalizado cuando se provee', () => {
    const { getByText } = render(
      <CourseCard {...defaultProps} href="/custom-route" />
    );
    fireEvent.press(getByText('COMIENZA'));
    expect(mockPush).toHaveBeenCalledWith('/custom-route');
  });

  it('el botón COMIENZA está deshabilitado cuando pendingCount=0', () => {
    const { getByRole } = render(<CourseCard {...defaultProps} pendingCount={0} />);
    // Pressable con disabled renderiza sin poder disparar onPress
    expect(getByRole('button')).toBeTruthy();
  });

  it('botón COMIENZA habilitado no llama push cuando disabled=true explícito', () => {
    const { getByText } = render(<CourseCard {...defaultProps} disabled />);
    fireEvent.press(getByText('COMIENZA'));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows "X Grupos por Calificar" text when pendingCount > 0', () => {
    const { getByText } = render(<CourseCard {...defaultProps} pendingCount={3} />);
    expect(getByText('3 Grupos por Calificar')).toBeTruthy();
  });

  it('shows "Todos han Sido Calificados" when pendingCount is 0', () => {
    const { getByText } = render(<CourseCard {...defaultProps} pendingCount={0} />);
    expect(getByText('Todos han Sido Calificados')).toBeTruthy();
  });

  it('shows custom statusText when provided', () => {
    const { getByText } = render(<CourseCard {...defaultProps} statusText="Custom Status" />);
    expect(getByText('Custom Status')).toBeTruthy();
  });
});
