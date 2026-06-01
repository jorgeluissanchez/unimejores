/**
 * Integration tests para EvaluationProvider + useEvaluation.
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import {
  EvaluationProvider,
  useEvaluation,
} from '@/features/evaluation/presentation/context/evaluation-context';
import type { Evaluation, Criterium } from '@/features/evaluation/domain/entities/evaluation';
import type { CourseUser } from '@/features/courses/domain/entities/course';

// ─── mock DI ─────────────────────────────────────────────────────────────────
const mockEvalRepo = {
  getMyCriteria: jest.fn(),
  getEvaluationByGroup: jest.fn(),
  getCriteriaByEvaluation: jest.fn(),
  getResultsByEvaluatorInGroup: jest.fn(),
  submitEvaluation: jest.fn(),
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

const mockCourseRepo = {
  getMembersByGroupIds: jest.fn(),
  getUserById: jest.fn(),
};

jest.mock('@/core/di/di-provider', () => ({
  useDI: jest.fn(() => ({
    resolve: jest.fn((token: symbol) => {
      const TOKENS = require('@/core/constants/tokens').TOKENS;
      if (token === TOKENS.EvaluationRepo) return mockEvalRepo;
      if (token === TOKENS.CourseRepo)     return mockCourseRepo;
      throw new Error(`Token desconocido: ${String(token)}`);
    }),
  })),
}));

// ─── mock Auth ────────────────────────────────────────────────────────────────
const mockExpireSession = jest.fn();

jest.mock('@/features/auth/presentation/context/auth-context', () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from '@/features/auth/presentation/context/auth-context';
const mockedUseAuth = useAuth as jest.Mock;

// ─── fixtures ─────────────────────────────────────────────────────────────────
const studentUser = { userId: 'u-1', role: 'student', email: 'a@a.com', name: 'A' };

const mockEvaluation: Evaluation = {
  _id: 'ev-1', evaluation_id: 'ev-1',
  title: 'Evaluación de pares', description: '',
  start_date: new Date().toISOString(),
  end_date: new Date().toISOString(),
  category_id: 'cat-1',
  created_by: 'prof-1',
};

const mockCriteria: Criterium[] = [
  { _id: 'c-1', criterium_id: 'c-1', name: 'Participación', description: '', max_score: 5 },
  { _id: 'c-2', criterium_id: 'c-2', name: 'Comunicación', description: '', max_score: 5 },
];

const peer1: CourseUser = { user_id: 'peer-1', name: 'Peer One', email: 'p1@t.com', role: 'student' };
const peer2: CourseUser = { user_id: 'peer-2', name: 'Peer Two', email: 'p2@t.com', role: 'student' };

// ─── helpers ─────────────────────────────────────────────────────────────────
function wrapper({ children }: { children: React.ReactNode }) {
  return <EvaluationProvider>{children}</EvaluationProvider>;
}

// ─── tests ────────────────────────────────────────────────────────────────────
describe('EvaluationProvider — estado inicial', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ loggedUser: studentUser, expireSession: mockExpireSession });
    mockEvalRepo.getMyCriteria.mockResolvedValue([]);
  });

  it('inicia sin evaluación ni criterios', async () => {
    const { result } = renderHook(() => useEvaluation(), { wrapper });
    await act(async () => {});
    expect(result.current.evaluation).toBeNull();
    expect(result.current.criteria).toEqual([]);
    expect(result.current.peers).toEqual([]);
  });
});

describe('EvaluationProvider — loadEvaluation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ loggedUser: studentUser, expireSession: mockExpireSession });
    mockEvalRepo.getMyCriteria.mockResolvedValue([]);
    // Group has peer1 and peer2 (plus the logged-in user)
    mockCourseRepo.getMembersByGroupIds.mockResolvedValue([
      { user_id: studentUser.userId },
      { user_id: peer1.user_id },
      { user_id: peer2.user_id },
    ]);
    mockCourseRepo.getUserById.mockImplementation(async (id: string) => {
      const map: Record<string, CourseUser> = {
        [studentUser.userId]: { user_id: studentUser.userId, name: 'Me', email: 'me@t.com', role: 'student' },
        [peer1.user_id]: peer1,
        [peer2.user_id]: peer2,
      };
      return map[id] ?? null;
    });
    mockEvalRepo.getEvaluationByGroup.mockResolvedValue(mockEvaluation);
    mockEvalRepo.getCriteriaByEvaluation.mockResolvedValue(mockCriteria);
    mockEvalRepo.getResultsByEvaluatorInGroup.mockResolvedValue([]);
  });

  it('carga la evaluación y criterios correctamente', async () => {
    const { result } = renderHook(() => useEvaluation(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.loadEvaluation('group-1');
    });

    expect(result.current.evaluation).toEqual(mockEvaluation);
    expect(result.current.criteria).toEqual(mockCriteria);
  });

  it('excluye al usuario logueado de la lista de peers', async () => {
    const { result } = renderHook(() => useEvaluation(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.loadEvaluation('group-1');
    });

    const peerIds = result.current.peers.map((p) => p.user.user_id);
    expect(peerIds).not.toContain(studentUser.userId);
    expect(peerIds).toContain(peer1.user_id);
    expect(peerIds).toContain(peer2.user_id);
  });

  it('marca como evaluated los peers que ya recibieron calificación', async () => {
    // peer1 ya fue evaluado
    mockEvalRepo.getResultsByEvaluatorInGroup.mockResolvedValueOnce([
      { evaluated_id: peer1.user_id },
    ]);

    const { result } = renderHook(() => useEvaluation(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.loadEvaluation('group-1');
    });

    const peer1Status = result.current.peers.find((p) => p.user.user_id === peer1.user_id);
    const peer2Status = result.current.peers.find((p) => p.user.user_id === peer2.user_id);
    expect(peer1Status?.evaluated).toBe(true);
    expect(peer2Status?.evaluated).toBe(false);
  });

  it('sets peers=[] cuando no hay evaluación activa', async () => {
    mockEvalRepo.getEvaluationByGroup.mockResolvedValueOnce(null);
    const { result } = renderHook(() => useEvaluation(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.loadEvaluation('group-1');
    });

    expect(result.current.peers).toEqual([]);
    expect(result.current.evaluation).toBeNull();
  });
});

describe('EvaluationProvider — submitScores', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ loggedUser: studentUser, expireSession: mockExpireSession });
    mockEvalRepo.getMyCriteria.mockResolvedValue([]);
    mockCourseRepo.getMembersByGroupIds.mockResolvedValue([
      { user_id: studentUser.userId }, { user_id: peer1.user_id },
    ]);
    mockCourseRepo.getUserById.mockImplementation(async (id: string) => {
      if (id === studentUser.userId) return { user_id: studentUser.userId, name: 'Me', email: 'me@t.com', role: 'student' };
      if (id === peer1.user_id) return peer1;
      return null;
    });
    mockEvalRepo.getEvaluationByGroup.mockResolvedValue(mockEvaluation);
    mockEvalRepo.getCriteriaByEvaluation.mockResolvedValue(mockCriteria);
    mockEvalRepo.getResultsByEvaluatorInGroup.mockResolvedValue([]);
    mockEvalRepo.submitEvaluation.mockResolvedValue(undefined);
  });

  it('marca al peer como evaluated tras un submit exitoso', async () => {
    const { result } = renderHook(() => useEvaluation(), { wrapper });
    await act(async () => {});

    await act(async () => { await result.current.loadEvaluation('group-1'); });

    await act(async () => {
      await result.current.submitScores('group-1', peer1.user_id, { 'c-1': 5, 'c-2': 4 });
    });

    const peer1Status = result.current.peers.find((p) => p.user.user_id === peer1.user_id);
    expect(peer1Status?.evaluated).toBe(true);
  });

  it('llama expireSession si el error es de sesión expirada', async () => {
    mockEvalRepo.submitEvaluation.mockRejectedValueOnce(new Error('expired token'));
    const { result } = renderHook(() => useEvaluation(), { wrapper });
    await act(async () => {});
    await act(async () => { await result.current.loadEvaluation('group-1'); });

    await act(async () => {
      await result.current.submitScores('group-1', peer1.user_id, {});
    });

    expect(mockExpireSession).toHaveBeenCalled();
  });
});

describe('useEvaluation guard', () => {
  it('lanza error cuando se usa fuera de EvaluationProvider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useEvaluation())).toThrow(
      'useEvaluation debe usarse dentro de EvaluationProvider'
    );
    consoleSpy.mockRestore();
  });
});

describe('EvaluationProvider — professor: createEvaluation', () => {
  const professorUser = { userId: 'p-1', role: 'professor', email: 'prof@a.com', name: 'Prof' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ loggedUser: professorUser, expireSession: mockExpireSession });
    mockEvalRepo.getMyCriteria.mockResolvedValue([]);
  });

  it('calls createEvaluation on the repo and returns the result', async () => {
    const newEval = { ...mockEvaluation, _id: 'ev-new', evaluation_id: 'ev-new', title: 'Nueva Evaluación' };
    mockEvalRepo.createEvaluation.mockResolvedValueOnce(newEval);

    const { result } = renderHook(() => useEvaluation(), { wrapper });
    await act(async () => {});

    let returned: typeof mockEvaluation | undefined;
    await act(async () => {
      returned = await result.current.createEvaluation({
        title: 'Nueva Evaluación',
        description: '',
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        category_id: 'cat-1',
      });
    });

    expect(returned?._id).toBe('ev-new');
    expect(mockEvalRepo.createEvaluation).toHaveBeenCalledTimes(1);
  });

  it('deleteEvaluation calls the repo with the correct id', async () => {
    mockEvalRepo.deleteEvaluation.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useEvaluation(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.deleteEvaluation('ev-1');
    });

    expect(mockEvalRepo.deleteEvaluation).toHaveBeenCalledWith('ev-1');
  });

  it('updateEvaluation calls the repo with the updated object', async () => {
    const updated = { ...mockEvaluation, title: 'Evaluación Actualizada' };
    mockEvalRepo.updateEvaluation.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useEvaluation(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.updateEvaluation(updated);
    });

    expect(mockEvalRepo.updateEvaluation).toHaveBeenCalledWith(updated);
  });
});

describe('EvaluationProvider — professor: criteria CRUD', () => {
  const professorUser = { userId: 'p-1', role: 'professor', email: 'prof@a.com', name: 'Prof' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ loggedUser: professorUser, expireSession: mockExpireSession });
    mockEvalRepo.getMyCriteria.mockResolvedValue([]);
  });

  it('addCriterium calls repo and refreshes myCriteria', async () => {
    const newCrit = { _id: 'c-new', criterium_id: 'c-new', name: 'Test Crit', description: '', max_score: 5, created_by: 'p-1' };
    mockEvalRepo.addCriterium.mockResolvedValueOnce(undefined);
    mockEvalRepo.getMyCriteria
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([newCrit]);

    const { result } = renderHook(() => useEvaluation(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.addCriterium({ name: 'Test Crit', description: '', created_by: 'p-1' });
    });

    expect(result.current.myCriteria).toHaveLength(1);
    expect(result.current.myCriteria[0]._id).toBe('c-new');
  });

  it('deleteCriterium calls repo with correct id', async () => {
    mockEvalRepo.deleteCriterium.mockResolvedValueOnce(undefined);
    mockEvalRepo.getMyCriteria.mockResolvedValue([]);

    const { result } = renderHook(() => useEvaluation(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.deleteCriterium('c-1');
    });

    expect(mockEvalRepo.deleteCriterium).toHaveBeenCalledWith('c-1');
  });

  it('updateCriterium calls repo with correct criterium', async () => {
    const updatedCrit = { _id: 'c-1', criterium_id: 'c-1', name: 'Updated', description: 'desc', max_score: 10, created_by: 'p-1' };
    mockEvalRepo.updateCriterium.mockResolvedValueOnce(undefined);
    mockEvalRepo.getMyCriteria.mockResolvedValue([]);

    const { result } = renderHook(() => useEvaluation(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.updateCriterium(updatedCrit);
    });

    expect(mockEvalRepo.updateCriterium).toHaveBeenCalledWith(updatedCrit);
  });
});
