import { isAdminUser } from './auth.models';

describe('isAdminUser', () => {
  it('normalizes the primary role shape', () => {
    expect(isAdminUser({ email: 'admin@example.com', role: 'Admin' })).toBe(true);
    expect(isAdminUser({ email: 'buyer@example.com', role: 'Customer' })).toBe(false);
  });

  it('normalizes defensive roles shapes', () => {
    expect(isAdminUser({ email: 'admin@example.com', roles: ['Customer', 'Admin'] })).toBe(true);
    expect(isAdminUser({ email: 'admin@example.com', roles: 'Admin' })).toBe(true);
  });

  it('normalizes defensive claims shapes', () => {
    expect(isAdminUser({
      email: 'admin@example.com',
      claims: [
        {
          type: 'role',
          value: 'Admin'
        }
      ]
    })).toBe(true);
    expect(isAdminUser({
      email: 'admin@example.com',
      claims: {
        isAdmin: true
      }
    })).toBe(true);
  });
});
