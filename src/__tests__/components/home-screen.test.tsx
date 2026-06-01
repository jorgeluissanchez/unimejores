import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';

// ─── mocks ────────────────────────────────────────────────────────────────────

const mockStudentUser = { userId: 'u-1', email: 'test@test.com', role: 'student', name: 'Test' };
const mockProfUser    = { userId: 'p-1', email: 'prof@test.com', role: 'professor', name: 'Prof' };
const mockCourse = { _id: 'c-1', course_id: 'c-1', name: 'Ingeniería de Software', nrc: '10234', description: '', created_by: 'p-1' };

jest.mock('@/features/auth/presentation/context/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/courses/presentation/context/course-context', () => ({ useCourses: jest.fn() }));
jest.mock('@/features/evaluation/presentation/context/evaluation-context', () => ({ useEvaluation: jest.fn() }));
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
  useLocalSearchParams: jest.fn(() => ({})),
}));
jest.mock('react-native-svg', () => ({
  SvgXml: () => null,
  Svg: () => null,
  Circle: () => null,
}));

// Mock lucide-react-native icons to avoid rendering issues
jest.mock('lucide-react-native', () => ({
  List: () => null,
  X: () => null,
}));

// Mock the Drawer components (uses reanimated / portals)
jest.mock('@/core/components/ui/drawer', () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DrawerContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DrawerTitle: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock CriteriaDrawer to avoid deep dependency chain
jest.mock('@/features/evaluation/presentation/components/criteria-drawer', () => ({
  CriteriaDrawer: () => null,
}));

// Mock form components used inside Drawers
jest.mock('@/features/courses/presentation/components/forms/add-course-form', () => ({
  AddCourseForm: () => null,
}));
jest.mock('@/features/courses/presentation/components/forms/update-course-form', () => ({
  UpdateCourseForm: () => null,
}));

// Mock PendingEvalCard
jest.mock('@/features/courses/presentation/components/pending-eval-card', () => ({
  PendingEvalCard: () => null,
}));

import { useAuth } from '@/features/auth/presentation/context/auth-context';
import { useCourses } from '@/features/courses/presentation/context/course-context';
import { useEvaluation } from '@/features/evaluation/presentation/context/evaluation-context';
import { HomeScreen } from '@/features/courses/presentation/screens/home-screen';

const mockedUseAuth = useAuth as jest.Mock;
const mockedUseCourses = useCourses as jest.Mock;
const mockedUseEvaluation = useEvaluation as jest.Mock;

// ─── default mock return values ───────────────────────────────────────────────

const defaultEvalMock = {
  myCriteria: [],
  evaluation: null,
  criteria: [],
  peers: [],
  isLoading: false,
  error: null,
  loadEvaluation: jest.fn(),
  submitScores: jest.fn(),
  addCriterium: jest.fn(),
  updateCriterium: jest.fn(),
  deleteCriterium: jest.fn(),
  getEvaluationByCategory: jest.fn(),
  getEvaluationsByCategory: jest.fn().mockResolvedValue([]),
  createEvaluation: jest.fn(),
  updateEvaluation: jest.fn(),
  deleteEvaluation: jest.fn(),
  getCriteriaForEvaluation: jest.fn(),
  getEvaluationCriteria: jest.fn(),
  addCriteriumToEvaluation: jest.fn(),
  removeCriteriumFromEvaluation: jest.fn(),
  getResultsByGroup: jest.fn().mockResolvedValue([]),
};

const defaultCoursesMock = {
  courses: [mockCourse],
  isLoading: false,
  error: null,
  refresh: jest.fn(),
  pendingEvaluations: [],
  pendingLoading: false,
  addCourse: jest.fn(),
  updateCourse: jest.fn(),
  deleteCourse: jest.fn(),
  getCategoriesByCourse: jest.fn().mockResolvedValue([]),
  getGroupsByCategory: jest.fn().mockResolvedValue([]),
  getGroupMembersDetail: jest.fn(),
  getMembersByGroup: jest.fn().mockResolvedValue([]),
  getGroupByCategory: jest.fn(),
  getMembersByGroupIds: jest.fn(),
  getUserById: jest.fn(),
  addCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
  addGroup: jest.fn(),
  updateGroup: jest.fn(),
  deleteGroup: jest.fn(),
  addMemberToGroup: jest.fn(),
  removeMemberFromGroup: jest.fn(),
  getStudentsInCourse: jest.fn(),
  getAvailableStudents: jest.fn(),
  addStudentToCourse: jest.fn(),
  removeStudentFromCourse: jest.fn(),
  getUserByEmail: jest.fn(),
  importGroupsCsv: jest.fn(),
  clearError: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseEvaluation.mockReturnValue(defaultEvalMock);
  mockedUseCourses.mockReturnValue(defaultCoursesMock);
});

// ─── tests ────────────────────────────────────────────────────────────────────

describe('HomeScreen – student view', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({ loggedUser: mockStudentUser });
  });

  it('renders the course name from the courses array', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Ingeniería de Software')).toBeTruthy();
  });

  it('renders multiple course names when several courses are provided', () => {
    const secondCourse = { _id: 'c-2', course_id: 'c-2', name: 'Cálculo Diferencial', nrc: '20001', description: '', created_by: 'p-1' };
    mockedUseCourses.mockReturnValue({ ...defaultCoursesMock, courses: [mockCourse, secondCourse] });
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Ingeniería de Software')).toBeTruthy();
    expect(getByText('Cálculo Diferencial')).toBeTruthy();
  });

  it('shows empty state text when courses array is empty', () => {
    mockedUseCourses.mockReturnValue({ ...defaultCoursesMock, courses: [] });
    const { getByText } = render(<HomeScreen />);
    expect(getByText('No tienes cursos asignados')).toBeTruthy();
  });

  it('shows ActivityIndicator when pendingLoading is true', () => {
    mockedUseCourses.mockReturnValue({ ...defaultCoursesMock, pendingLoading: true });
    const { UNSAFE_getAllByType } = render(<HomeScreen />);
    const indicators = UNSAFE_getAllByType(ActivityIndicator);
    expect(indicators.length).toBeGreaterThan(0);
  });
});

describe('HomeScreen – professor view', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({ loggedUser: mockProfUser });
  });

  it('renders the course name from the courses array', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Ingeniería de Software')).toBeTruthy();
  });

  it('renders multiple course names when several courses are provided', () => {
    const secondCourse = { _id: 'c-2', course_id: 'c-2', name: 'Física I', nrc: '30001', description: '', created_by: 'p-1' };
    mockedUseCourses.mockReturnValue({ ...defaultCoursesMock, courses: [mockCourse, secondCourse] });
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Ingeniería de Software')).toBeTruthy();
    expect(getByText('Física I')).toBeTruthy();
  });

  it('shows empty state text when courses array is empty', () => {
    mockedUseCourses.mockReturnValue({ ...defaultCoursesMock, courses: [] });
    const { getByText } = render(<HomeScreen />);
    expect(getByText('No tienes cursos creados')).toBeTruthy();
  });

  it('shows ActivityIndicator when isLoading=true and courses is empty', () => {
    mockedUseCourses.mockReturnValue({ ...defaultCoursesMock, courses: [], isLoading: true });
    const { UNSAFE_getAllByType } = render(<HomeScreen />);
    const indicators = UNSAFE_getAllByType(ActivityIndicator);
    expect(indicators.length).toBeGreaterThan(0);
  });
});
