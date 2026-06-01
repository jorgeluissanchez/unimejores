/**
 * Integration tests para CourseProvider + useCourses.
 * courseRepo y authContext se inyectan como mocks.
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { CourseProvider, useCourses } from '@/features/courses/presentation/context/course-context';
import type { Course } from '@/features/courses/domain/entities/course';

// ─── mock DI ─────────────────────────────────────────────────────────────────
const mockCourseRepo = {
  getMyEnrolledCourses: jest.fn(),
  getMyCreatedCourses: jest.fn(),
  getPendingEvaluations: jest.fn(),
  addCourse: jest.fn(),
  updateCourse: jest.fn(),
  deleteCourse: jest.fn(),
  getCategoriesByCourse: jest.fn(),
  getGroupsByCategory: jest.fn(),
  getGroupMembersDetail: jest.fn(),
  getMembersByGroup: jest.fn(),
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
};

jest.mock('@/core/di/di-provider', () => ({
  useDI: jest.fn(() => ({ resolve: jest.fn(() => mockCourseRepo) })),
}));

// ─── mock Auth ────────────────────────────────────────────────────────────────
const mockExpireSession = jest.fn();

jest.mock('@/features/auth/presentation/context/auth-context', () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from '@/features/auth/presentation/context/auth-context';
const mockedUseAuth = useAuth as jest.Mock;

// ─── helpers ─────────────────────────────────────────────────────────────────
const studentUser = { userId: 'u-1', email: 'test@test.com', role: 'student', name: 'Test' };
const professorUser = { userId: 'p-1', email: 'prof@test.com', role: 'professor', name: 'Prof' };

const mockCourse: Course = {
  _id: 'c-1', course_id: 'c-1', name: 'Redes', nrc: '999', description: '',
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <CourseProvider>{children}</CourseProvider>;
}

// ─── tests ────────────────────────────────────────────────────────────────────
describe('CourseProvider — estado inicial', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ loggedUser: studentUser, expireSession: mockExpireSession });
    mockCourseRepo.getMyEnrolledCourses.mockResolvedValue([]);
    mockCourseRepo.getPendingEvaluations.mockResolvedValue([]);
  });

  it('inicia con courses=[] e isLoading mientras carga', () => {
    const { result } = renderHook(() => useCourses(), { wrapper });
    expect(result.current.courses).toEqual([]);
  });

  it('carga los cursos del estudiante al montar', async () => {
    mockCourseRepo.getMyEnrolledCourses.mockResolvedValueOnce([mockCourse]);
    const { result } = renderHook(() => useCourses(), { wrapper });
    await act(async () => {});
    expect(result.current.courses).toEqual([mockCourse]);
    expect(mockCourseRepo.getMyEnrolledCourses).toHaveBeenCalledWith(studentUser.userId);
  });

  it('carga los cursos creados por el profesor al montar', async () => {
    mockedUseAuth.mockReturnValue({ loggedUser: professorUser, expireSession: mockExpireSession });
    mockCourseRepo.getMyCreatedCourses.mockResolvedValueOnce([mockCourse]);
    const { result } = renderHook(() => useCourses(), { wrapper });
    await act(async () => {});
    expect(result.current.courses).toEqual([mockCourse]);
    expect(mockCourseRepo.getMyCreatedCourses).toHaveBeenCalledWith(professorUser.userId);
  });
});

describe('CourseProvider — manejo de errores', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ loggedUser: studentUser, expireSession: mockExpireSession });
  });

  it('setea error cuando getMyEnrolledCourses falla', async () => {
    mockCourseRepo.getMyEnrolledCourses.mockRejectedValueOnce(new Error('Red caída'));
    const { result } = renderHook(() => useCourses(), { wrapper });
    await act(async () => {});
    expect(result.current.error).toBe('Red caída');
  });

  it('llama expireSession cuando el error es de sesión expirada', async () => {
    mockCourseRepo.getMyEnrolledCourses.mockRejectedValueOnce(
      new Error('expired token')
    );
    const { result } = renderHook(() => useCourses(), { wrapper });
    await act(async () => {});
    expect(mockExpireSession).toHaveBeenCalled();
    expect(result.current.courses).toEqual([]);
  });

  it('clearError resetea el error a null', async () => {
    mockCourseRepo.getMyEnrolledCourses.mockRejectedValueOnce(new Error('fallo'));
    const { result } = renderHook(() => useCourses(), { wrapper });
    await act(async () => {});
    expect(result.current.error).toBeTruthy();
    act(() => { result.current.clearError(); });
    expect(result.current.error).toBeNull();
  });
});

describe('CourseProvider — addCourse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ loggedUser: professorUser, expireSession: mockExpireSession });
    mockCourseRepo.getMyCreatedCourses.mockResolvedValue([]);
    mockCourseRepo.addCourse.mockResolvedValue(mockCourse);
  });

  it('agrega el nuevo curso a la lista de courses', async () => {
    const { result } = renderHook(() => useCourses(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.addCourse({
        name: 'Redes', nrc: '999', description: '', user_id: professorUser.userId,
      });
    });

    expect(result.current.courses).toContainEqual(mockCourse);
  });
});

describe('useCourses guard', () => {
  it('lanza error cuando se usa fuera de CourseProvider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useCourses())).toThrow(
      'useCourses debe usarse dentro de CourseProvider'
    );
    consoleSpy.mockRestore();
  });
});

describe('CourseProvider — deleteCourse (professor)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ loggedUser: professorUser, expireSession: mockExpireSession });
    mockCourseRepo.getPendingEvaluations.mockResolvedValue([]);
    mockCourseRepo.deleteCourse.mockResolvedValue(undefined);
  });

  it('removes the course from the list after deleteCourse', async () => {
    // First load returns the course; after delete the refresh returns empty list
    mockCourseRepo.getMyCreatedCourses
      .mockResolvedValueOnce([mockCourse])
      .mockResolvedValueOnce([]);

    const { result } = renderHook(() => useCourses(), { wrapper });
    await act(async () => {});
    expect(result.current.courses).toHaveLength(1);

    await act(async () => {
      await result.current.deleteCourse('c-1');
    });

    expect(result.current.courses).toHaveLength(0);
  });
});

describe('CourseProvider — updateCourse (professor)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ loggedUser: professorUser, expireSession: mockExpireSession });
    mockCourseRepo.getMyCreatedCourses.mockResolvedValue([mockCourse]);
    mockCourseRepo.getPendingEvaluations.mockResolvedValue([]);
    mockCourseRepo.updateCourse.mockResolvedValue(undefined);
  });

  it('calls updateCourse on the repo with the updated course', async () => {
    const { result } = renderHook(() => useCourses(), { wrapper });
    await act(async () => {});

    const updated = { ...mockCourse, name: 'Redes Actualizado' };
    await act(async () => {
      await result.current.updateCourse(updated);
    });

    expect(mockCourseRepo.updateCourse).toHaveBeenCalledWith(updated);
  });
});

describe('CourseProvider — addCategory (professor)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ loggedUser: professorUser, expireSession: mockExpireSession });
    mockCourseRepo.getMyCreatedCourses.mockResolvedValue([]);
    mockCourseRepo.getPendingEvaluations.mockResolvedValue([]);
  });

  it('calls addCategory on the repo with correct args and returns the result', async () => {
    const newCat = { _id: 'cat-1', name: 'Cat Test', description: '', course_id: 'c-1' };
    mockCourseRepo.addCategory.mockResolvedValueOnce(newCat);

    const { result } = renderHook(() => useCourses(), { wrapper });
    await act(async () => {});

    let returned: typeof newCat | undefined;
    await act(async () => {
      returned = await result.current.addCategory({ name: 'Cat Test', description: '', course_id: 'c-1' });
    });

    expect(mockCourseRepo.addCategory).toHaveBeenCalledWith({ name: 'Cat Test', description: '', course_id: 'c-1' });
    expect(returned?._id).toBe('cat-1');
  });
});

describe('CourseProvider — deleteCategory (professor)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ loggedUser: professorUser, expireSession: mockExpireSession });
    mockCourseRepo.getMyCreatedCourses.mockResolvedValue([]);
    mockCourseRepo.getPendingEvaluations.mockResolvedValue([]);
    mockCourseRepo.deleteCategory.mockResolvedValue(undefined);
  });

  it('calls deleteCategory on the repo', async () => {
    const { result } = renderHook(() => useCourses(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.deleteCategory('cat-1');
    });

    expect(mockCourseRepo.deleteCategory).toHaveBeenCalledWith('cat-1');
  });
});

describe('CourseProvider — addGroup / deleteGroup (professor)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ loggedUser: professorUser, expireSession: mockExpireSession });
    mockCourseRepo.getMyCreatedCourses.mockResolvedValue([]);
    mockCourseRepo.getPendingEvaluations.mockResolvedValue([]);
  });

  it('calls addGroup on the repo and returns the new group', async () => {
    const newGroup = { _id: 'g-1', name: 'Group Test', category_id: 'cat-1' };
    mockCourseRepo.addGroup.mockResolvedValueOnce(newGroup);

    const { result } = renderHook(() => useCourses(), { wrapper });
    await act(async () => {});

    let returned: typeof newGroup | undefined;
    await act(async () => {
      returned = await result.current.addGroup({ name: 'Group Test', category_id: 'cat-1' });
    });

    expect(returned?._id).toBe('g-1');
  });

  it('calls deleteGroup on the repo', async () => {
    mockCourseRepo.deleteGroup.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCourses(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.deleteGroup('g-1');
    });

    expect(mockCourseRepo.deleteGroup).toHaveBeenCalledWith('g-1');
  });
});
