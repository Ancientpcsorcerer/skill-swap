import { registerSchema, loginSchema } from '../modules/auth/auth.validation';
import { createProjectSchema } from '../modules/projects/projects.validation';

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    test('accepts valid registration input and transforms to lowercase', () => {
      const valid = {
        name: 'Aarav Sharma',
        username: 'Aarav_01',
        email: 'AARAV@Example.COM',
        password: 'Password123!',
      };

      const result = registerSchema.parse(valid);
      expect(result.username).toBe('aarav_01');
      expect(result.email).toBe('aarav@example.com');
    });

    test('rejects short passwords', () => {
      const invalid = {
        name: 'Aarav Sharma',
        username: 'aarav',
        email: 'aarav@example.com',
        password: 'short',
      };

      expect(() => registerSchema.parse(invalid)).toThrow();
    });

    test('rejects invalid usernames with symbols', () => {
      const invalid = {
        name: 'Aarav Sharma',
        username: 'aarav@sharma!',
        email: 'aarav@example.com',
        password: 'Password123!',
      };

      expect(() => registerSchema.parse(invalid)).toThrow();
    });
  });

  describe('loginSchema', () => {
    test('accepts valid login identifier and password', () => {
      const valid = {
        identifier: 'aarav@example.com',
        password: 'Password123!',
      };

      const result = loginSchema.parse(valid);
      expect(result.identifier).toBe('aarav@example.com');
    });

    test('rejects empty credentials', () => {
      expect(() => loginSchema.parse({ identifier: '', password: '' })).toThrow();
    });
  });

  describe('createProjectSchema', () => {
    test('applies defaults for art, status, and is_discoverable', () => {
      const input = {
        title: 'Autonomous UAV',
        description: 'Building open-source autopilot systems',
        type: 'Hardware',
      };

      const result = createProjectSchema.parse(input);
      expect(result.status).toBe('Ongoing');
      expect(result.art).toBe('product');
      expect(result.is_discoverable).toBe(true);
      expect(result.tags).toEqual([]);
      expect(result.required_skills).toEqual([]);
    });
  });
});
