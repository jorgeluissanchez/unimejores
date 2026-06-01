import { Container } from '@/core/di/container';

const TOKEN_A = Symbol('TokenA');
const TOKEN_B = Symbol('TokenB');
const TOKEN_C = Symbol('TokenC');

describe('Container', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  it('resolves a registered instance', () => {
    const instance = { value: 42 };
    container.register(TOKEN_A, instance);
    expect(container.resolve(TOKEN_A)).toBe(instance);
  });

  it('throws when resolving an unregistered token', () => {
    expect(() => container.resolve(TOKEN_B)).toThrow();
  });

  it('error message mentions the token', () => {
    expect(() => container.resolve(TOKEN_B)).toThrow(/No hay proveedor/);
  });

  it('overwrites a previous registration with the same token', () => {
    const first = { v: 1 };
    const second = { v: 2 };
    container.register(TOKEN_A, first);
    container.register(TOKEN_A, second);
    expect(container.resolve<{ v: number }>(TOKEN_A).v).toBe(2);
  });

  it('returns the exact same instance on every resolve (singleton)', () => {
    const instance = { count: 0 };
    container.register(TOKEN_A, instance);
    const a = container.resolve(TOKEN_A);
    const b = container.resolve(TOKEN_A);
    expect(a).toBe(b);
  });

  it('register is chainable (returns the container itself)', () => {
    const result = container.register(TOKEN_A, {});
    expect(result).toBe(container);
  });

  it('supports multiple tokens independently', () => {
    const objA = { id: 'a' };
    const objC = { id: 'c' };
    container.register(TOKEN_A, objA).register(TOKEN_C, objC);
    expect(container.resolve(TOKEN_A)).toBe(objA);
    expect(container.resolve(TOKEN_C)).toBe(objC);
  });

  it('resolves class instances correctly', () => {
    class Service {
      greet() { return 'hi'; }
    }
    const svc = new Service();
    container.register(TOKEN_A, svc);
    expect(container.resolve<Service>(TOKEN_A).greet()).toBe('hi');
  });
});
