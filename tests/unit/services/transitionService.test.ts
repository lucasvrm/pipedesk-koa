import { describe, it, expect, vi } from 'vitest';

// Mock types
interface TransitionRule {
  fromStage: string;
  toStage: string;
  enabled: boolean;
}

describe('Transition Logic Tests', () => {
  const rules: TransitionRule[] = [
    { fromStage: 'nda', toStage: 'analysis', enabled: true },
    { fromStage: 'nda', toStage: 'closing', enabled: false }, // Explicitly blocked
    // 'analysis' -> 'proposal' is not in list (Implicitly allowed in our logic)
  ];

  function validateTransition(from: string, to: string, rules: TransitionRule[]): boolean {
    if (from === to) return true;

    const relevantRule = rules.find(r => r.fromStage === from && r.toStage === to);

    // If rule exists, respect enabled status
    if (relevantRule) return relevantRule.enabled;

    // Default to allowed if no rule exists
    return true;
  }

  it('should allow transition if rule is enabled', () => {
    expect(validateTransition('nda', 'analysis', rules)).toBe(true);
  });

  it('should block transition if rule is disabled', () => {
    expect(validateTransition('nda', 'closing', rules)).toBe(false);
  });

  it('should allow transition if no rule exists (default allow)', () => {
    expect(validateTransition('analysis', 'proposal', rules)).toBe(true);
  });

  it('should allow self-transition', () => {
    expect(validateTransition('nda', 'nda', rules)).toBe(true);
  });
});
