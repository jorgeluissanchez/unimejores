import React from 'react';
import { render } from '@testing-library/react-native';
import EvaluationScreen from '@/features/evaluation/presentation/screens/evaluation-screen';
import { useEvaluation } from '@/features/evaluation/presentation/context/evaluation-context';

// ─── mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/features/evaluation/presentation/context/evaluation-context', () => ({
  useEvaluation: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
  useLocalSearchParams: jest.fn(() => ({ courseId: 'c-1', groupId: 'g-1', evaluateeId: 'peer-1' })),
}));

jest.mock('react-native-svg', () => ({ SvgXml: () => null }));

jest.mock('lucide-react-native', () => ({
  ArrowLeft: () => null,
  Check: () => null,
}));

// ─── fixtures ─────────────────────────────────────────────────────────────────

const mockEvaluation = {
  _id: 'ev-1',
  evaluation_id: 'ev-1',
  title: 'Eval Test',
  description: '',
  start_date: new Date().toISOString(),
  end_date: new Date().toISOString(),
  category_id: 'cat-1',
  created_by: 'p-1',
};

const mockCriteria = [
  {
    _id: 'c-1',
    criterium_id: 'c-1',
    name: 'Participación activa',
    description: 'Desc',
    max_score: 5,
    created_by: 'p-1',
  },
  {
    _id: 'c-2',
    criterium_id: 'c-2',
    name: 'Comunicación efectiva',
    description: 'Desc',
    max_score: 5,
    created_by: 'p-1',
  },
];

const mockPeer = {
  user_id: 'peer-1',
  name: 'Peer User',
  email: 'peer@test.com',
  _id: 'peer-1',
  role: 'student',
};

const defaultMockUseEvaluation = {
  evaluation: mockEvaluation,
  criteria: mockCriteria,
  peers: [{ user: mockPeer, evaluated: false }],
  isLoading: false,
  error: null,
  loadEvaluation: jest.fn(),
  submitScores: jest.fn(),
  myCriteria: [],
  addCriterium: jest.fn(),
  updateCriterium: jest.fn(),
  deleteCriterium: jest.fn(),
  getEvaluationByCategory: jest.fn(),
  getEvaluationsByCategory: jest.fn(),
  createEvaluation: jest.fn(),
  updateEvaluation: jest.fn(),
  deleteEvaluation: jest.fn(),
  getCriteriaForEvaluation: jest.fn(),
  getEvaluationCriteria: jest.fn(),
  addCriteriumToEvaluation: jest.fn(),
  removeCriteriumFromEvaluation: jest.fn(),
  getResultsByGroup: jest.fn(),
};

const mockUseEvaluation = useEvaluation as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseEvaluation.mockReturnValue(defaultMockUseEvaluation);
});

// ─── tests ────────────────────────────────────────────────────────────────────

describe('EvaluationScreen', () => {
  it('renders criteria names', () => {
    const { getByText } = render(<EvaluationScreen />);
    expect(getByText('Participación activa')).toBeTruthy();
    expect(getByText('Comunicación efectiva')).toBeTruthy();
  });

  it("renders the peer's name in the header", () => {
    const { getByText } = render(<EvaluationScreen />);
    expect(getByText('Evaluando a Peer User')).toBeTruthy();
  });

  it('has a submit button visible', () => {
    const { getByText } = render(<EvaluationScreen />);
    // Button text is TERMINAR when no pending peers remain
    expect(getByText('TERMINAR')).toBeTruthy();
  });

  it('shows loading indicator when isLoading is true', () => {
    mockUseEvaluation.mockReturnValue({ ...defaultMockUseEvaluation, isLoading: true });
    const { queryByText } = render(<EvaluationScreen />);
    // Criteria should not be visible while loading
    expect(queryByText('Participación activa')).toBeNull();
  });

  it('shows error message when error is set', () => {
    mockUseEvaluation.mockReturnValue({
      ...defaultMockUseEvaluation,
      error: 'Error de red',
      criteria: [],
    });
    const { getByText } = render(<EvaluationScreen />);
    expect(getByText('Error de red')).toBeTruthy();
  });

  it('shows SIGUIENTE COMPAÑEROS when more peers remain', () => {
    const anotherPeer = {
      user_id: 'peer-2',
      name: 'Another Peer',
      email: 'another@test.com',
      _id: 'peer-2',
      role: 'student',
    };
    mockUseEvaluation.mockReturnValue({
      ...defaultMockUseEvaluation,
      peers: [
        { user: mockPeer, evaluated: false },
        { user: anotherPeer, evaluated: false },
      ],
    });
    const { getByText } = render(<EvaluationScreen />);
    expect(getByText('SIGUIENTE COMPAÑEROS')).toBeTruthy();
  });
});
