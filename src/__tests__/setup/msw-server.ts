/// <reference types="jest" />
import { setupServer } from 'msw/node';
import { handlers } from '@/mocks/handlers';

export const server = setupServer(...handlers);

// Start MSW before all tests, reset after each, stop after all.
// onUnhandledRequest: 'bypass' lets tests that mock fetch() directly still work.
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
