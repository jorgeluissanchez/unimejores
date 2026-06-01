import { cn, isSessionExpiredError, parseCsvLine } from '@/core/lib/utils';

// ─── cn ──────────────────────────────────────────────────────────────────────

describe('cn', () => {
  it('merges two class strings', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('resolves tailwind conflicts — last class wins', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('handles conditional falsy class (boolean short-circuit)', () => {
    expect(cn('base', false && 'skipped', 'last')).toBe('base last');
  });

  it('returns empty string when called with no args', () => {
    expect(cn()).toBe('');
  });

  it('ignores undefined and null values', () => {
    expect(cn(undefined, null as any, 'visible')).toBe('visible');
  });

  it('deduplicates conflicting background colors', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });
});

// ─── isSessionExpiredError ───────────────────────────────────────────────────

describe('isSessionExpiredError', () => {
  it.each([
    ['Error al renovar el token', true],
    ['No autorizado (problema con el token)', true],
    ['token inválido', true],
    ['Token inválido', true],
    ['expired token', true],
    ['Error de red', false],
    ['Credenciales inválidas', false],
    ['', false],
  ])('message "%s" → %s', (message, expected) => {
    expect(isSessionExpiredError(new Error(message))).toBe(expected);
  });

  it('returns false for null input', () => {
    expect(isSessionExpiredError(null)).toBe(false);
  });

  it('returns false for undefined input', () => {
    expect(isSessionExpiredError(undefined)).toBe(false);
  });

  it('accepts a plain string (not wrapped in Error)', () => {
    expect(isSessionExpiredError('expired token detected')).toBe(true);
  });

  it('returns false for plain unrelated string', () => {
    expect(isSessionExpiredError('network timeout')).toBe(false);
  });

  it('returns false for a number', () => {
    expect(isSessionExpiredError(404)).toBe(false);
  });
});

// ─── parseCsvLine ────────────────────────────────────────────────────────────

describe('parseCsvLine', () => {
  it('splits by comma', () => {
    expect(parseCsvLine('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('handles a quoted field containing a comma', () => {
    expect(parseCsvLine('"hello, world",foo')).toEqual(['hello, world', 'foo']);
  });

  it('trims whitespace around each field', () => {
    expect(parseCsvLine(' alice , bob , carol ')).toEqual(['alice', 'bob', 'carol']);
  });

  it('handles an empty field in the middle', () => {
    expect(parseCsvLine('a,,c')).toEqual(['a', '', 'c']);
  });

  it('handles a trailing empty field', () => {
    expect(parseCsvLine('a,b,')).toEqual(['a', 'b', '']);
  });

  it('returns a single-element array when no commas', () => {
    expect(parseCsvLine('only')).toEqual(['only']);
  });

  it('returns [""] for an empty string', () => {
    expect(parseCsvLine('')).toEqual(['']);
  });

  it('strips surrounding quotes from a quoted field', () => {
    expect(parseCsvLine('"quoted"')).toEqual(['quoted']);
  });
});
