import { describe, it, expect } from 'bun:test';
import { getCapability, isSupported, getFrameworkCapabilities } from '../src/capability/matrix';

describe('capability matrix', () => {
  it('express supports local auth', () => {
    expect(getCapability('express', 'local', 'local', 'none')).toBe('supported');
  });
  it('express supports docker db', () => {
    expect(getCapability('express', 'docker', 'local', 'none')).toBe('supported');
  });
  it('express, hono, elysia, nextjs support supabase and clerk auth as standard', () => {
    for (const fw of ['express', 'hono', 'elysia', 'nextjs']) {
      expect(getCapability(fw, 'local', 'supabase', 'none')).toBe('supported');
      expect(getCapability(fw, 'local', 'clerk', 'none')).toBe('supported');
    }
  });
  it('returns undefined for unknown framework', () => {
    expect(getFrameworkCapabilities('unknown-framework')).toBeUndefined();
  });
  it('rejects unknown target values', () => {
    expect(getCapability('express', 'unknown', 'unknown', 'unknown')).toBe('unsupported');
  });
  it('lets unsupported dimensions override experimental ones', () => {
    expect(getCapability('react', 'local', 'local', 'docker')).toBe('unsupported');
  });
  it('isSupported returns true for supported combinations', () => {
    expect(isSupported('express', 'docker', 'local', 'docker')).toBe(true);
  });
  it('all backend frameworks support neon db as standard', () => {
    const frameworks = ['express', 'hono', 'elysia', 'nextjs', 'python', 'go', 'rust'];
    for (const fw of frameworks) {
      expect(getCapability(fw, 'neon', 'local', 'none')).toBe('supported');
      expect(isSupported(fw, 'neon', 'local', 'none')).toBe(true);
    }
  });
});
