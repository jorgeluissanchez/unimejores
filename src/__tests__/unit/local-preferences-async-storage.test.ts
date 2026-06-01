/**
 * Unit tests para LocalPreferencesAsyncStorage.
 * AsyncStorage se reemplaza por un Map en memoria para aislar cada test.
 *
 * NOTA: jest.mock() es hoisted (elevado) antes de que se ejecute cualquier
 * declaración del archivo. Por eso la variable que usa la factory DEBE tener
 * el prefijo "mock" — es la convención que Jest permite en modo hoisted.
 */

// mockStore es el Map en memoria que simula AsyncStorage
const mockStore = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    setItem:    jest.fn(async (k: string, v: string) => { mockStore.set(k, v); }),
    getItem:    jest.fn(async (k: string) => mockStore.get(k) ?? null),
    removeItem: jest.fn(async (k: string) => { mockStore.delete(k); }),
    clear:      jest.fn(async () => { mockStore.clear(); }),
  },
}));

import { LocalPreferencesAsyncStorage } from '@/core/storage/local-preferences-async-storage';

function getInstance() {
  (LocalPreferencesAsyncStorage as any).instance = null; // reset singleton
  return LocalPreferencesAsyncStorage.getInstance();
}

beforeEach(() => {
  mockStore.clear();
  jest.clearAllMocks();
});

// ─── singleton ────────────────────────────────────────────────────────────────
describe('singleton', () => {
  it('siempre retorna la misma instancia', () => {
    (LocalPreferencesAsyncStorage as any).instance = null;
    const a = LocalPreferencesAsyncStorage.getInstance();
    const b = LocalPreferencesAsyncStorage.getInstance();
    expect(a).toBe(b);
  });
});

// ─── storeData / retrieveData ─────────────────────────────────────────────────
describe('storeData y retrieveData', () => {
  it('guarda y recupera un string', async () => {
    const prefs = getInstance();
    await prefs.storeData('token', 'abc-123');
    expect(await prefs.retrieveData('token')).toBe('abc-123');
  });

  it('guarda y recupera un objeto', async () => {
    const prefs = getInstance();
    await prefs.storeData('user', { id: 1, name: 'Test' });
    expect(await prefs.retrieveData('user')).toEqual({ id: 1, name: 'Test' });
  });

  it('retorna null para una clave inexistente', async () => {
    const prefs = getInstance();
    expect(await prefs.retrieveData('ghost')).toBeNull();
  });

  it('sobreescribe un valor existente', async () => {
    const prefs = getInstance();
    await prefs.storeData('key', 'first');
    await prefs.storeData('key', 'second');
    expect(await prefs.retrieveData('key')).toBe('second');
  });
});

// ─── removeData ───────────────────────────────────────────────────────────────
describe('removeData', () => {
  it('elimina una clave existente', async () => {
    const prefs = getInstance();
    await prefs.storeData('token', 'abc');
    await prefs.removeData('token');
    expect(await prefs.retrieveData('token')).toBeNull();
  });

  it('no lanza error al eliminar una clave que no existe', async () => {
    const prefs = getInstance();
    await expect(prefs.removeData('ghost')).resolves.not.toThrow();
  });
});

// ─── storeEntry / getAllEntries ───────────────────────────────────────────────
describe('storeEntry y getAllEntries', () => {
  it('agrega entradas a una lista vacía', async () => {
    const prefs = getInstance();
    await prefs.storeEntry('logs', { msg: 'a' });
    await prefs.storeEntry('logs', { msg: 'b' });
    expect(await prefs.getAllEntries('logs')).toEqual([{ msg: 'a' }, { msg: 'b' }]);
  });

  it('retorna [] cuando la clave no existe', async () => {
    const prefs = getInstance();
    expect(await prefs.getAllEntries('nada')).toEqual([]);
  });
});

// ─── replaceEntries ───────────────────────────────────────────────────────────
describe('replaceEntries', () => {
  it('reemplaza la lista completa', async () => {
    const prefs = getInstance();
    await prefs.storeEntry('items', 'old');
    await prefs.replaceEntries('items', ['new1', 'new2']);
    expect(await prefs.getAllEntries('items')).toEqual(['new1', 'new2']);
  });
});

// ─── clearAll ────────────────────────────────────────────────────────────────
describe('clearAll', () => {
  it('elimina todas las claves', async () => {
    const prefs = getInstance();
    await prefs.storeData('a', 1);
    await prefs.storeData('b', 2);
    await prefs.clearAll();
    expect(await prefs.retrieveData('a')).toBeNull();
    expect(await prefs.retrieveData('b')).toBeNull();
  });
});
