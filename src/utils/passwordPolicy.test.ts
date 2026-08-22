import { validatePassword, passwordRules, PASSWORD_MIN_LENGTH } from './passwordPolicy';

describe('validatePassword', () => {
  test('rejects a password shorter than the minimum length', () => {
    expect(validatePassword('Ab1')).toBe(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  });

  test('rejects a long-enough password missing an uppercase letter', () => {
    expect(validatePassword('lowercase123')).toBe(
      'Password must contain uppercase, lowercase, and a number'
    );
  });

  test('rejects a long-enough password missing a lowercase letter', () => {
    expect(validatePassword('UPPERCASE123')).toBe(
      'Password must contain uppercase, lowercase, and a number'
    );
  });

  test('rejects a long-enough password missing a digit', () => {
    expect(validatePassword('NoDigitsHere')).toBe(
      'Password must contain uppercase, lowercase, and a number'
    );
  });

  test('accepts a password meeting every rule', () => {
    expect(validatePassword('ValidPass123')).toBeNull();
  });

  test('length is checked before complexity (a too-short password gets the length message even if also missing complexity)', () => {
    expect(validatePassword('a1')).toBe(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  });
});

describe('passwordRules (react-hook-form integration contract)', () => {
  test('required carries the expected message', () => {
    expect(passwordRules.required).toBe('Password is required');
  });

  test('minLength matches PASSWORD_MIN_LENGTH', () => {
    expect(passwordRules.minLength.value).toBe(PASSWORD_MIN_LENGTH);
  });

  test('pattern rejects a password with no digit, no uppercase, or no lowercase', () => {
    expect(passwordRules.pattern.value.test('nouppercase1')).toBe(false);
    expect(passwordRules.pattern.value.test('NOLOWERCASE1')).toBe(false);
    expect(passwordRules.pattern.value.test('NoDigitsHere')).toBe(false);
  });

  test('pattern accepts a password with all three', () => {
    expect(passwordRules.pattern.value.test('ValidPass123')).toBe(true);
  });
});
