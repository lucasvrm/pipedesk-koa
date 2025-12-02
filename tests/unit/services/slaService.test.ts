import { describe, it, expect, vi, beforeEach } from 'vitest';
import { differenceInHours, addHours, subHours } from 'date-fns';

// Mock types
interface SlaPolicy {
  stageId: string;
  maxHours: number;
  warningThresholdHours: number;
}

interface Track {
  id: string;
  stageEnteredAt: string;
  currentStage: string;
}

describe('SLA Logic Tests', () => {
  const policies: SlaPolicy[] = [
    { stageId: 'analysis', maxHours: 48, warningThresholdHours: 24 },
    { stageId: 'proposal', maxHours: 24, warningThresholdHours: 12 },
    { stageId: 'nda', maxHours: 0, warningThresholdHours: 0 }, // No SLA
  ];

  function getSlaStatus(track: Track, policy: SlaPolicy | undefined): 'ok' | 'warning' | 'overdue' {
    if (!policy || policy.maxHours === 0) return 'ok';

    const entryTime = new Date(track.stageEnteredAt);
    const now = new Date();
    const hoursInStage = differenceInHours(now, entryTime);

    if (hoursInStage >= policy.maxHours) return 'overdue';
    if (policy.warningThresholdHours > 0 && hoursInStage >= policy.warningThresholdHours) return 'warning';
    return 'ok';
  }

  it('should return OK when well within limits', () => {
    const track = {
      id: '1',
      currentStage: 'analysis',
      stageEnteredAt: subHours(new Date(), 10).toISOString()
    };
    const policy = policies.find(p => p.stageId === 'analysis');

    expect(getSlaStatus(track, policy)).toBe('ok');
  });

  it('should return WARNING when past threshold but not max', () => {
    const track = {
      id: '1',
      currentStage: 'analysis',
      stageEnteredAt: subHours(new Date(), 25).toISOString() // > 24, < 48
    };
    const policy = policies.find(p => p.stageId === 'analysis');

    expect(getSlaStatus(track, policy)).toBe('warning');
  });

  it('should return OVERDUE when past max hours', () => {
    const track = {
      id: '1',
      currentStage: 'analysis',
      stageEnteredAt: subHours(new Date(), 50).toISOString() // > 48
    };
    const policy = policies.find(p => p.stageId === 'analysis');

    expect(getSlaStatus(track, policy)).toBe('overdue');
  });

  it('should return OK if no SLA configured (maxHours=0)', () => {
    const track = {
      id: '1',
      currentStage: 'nda',
      stageEnteredAt: subHours(new Date(), 100).toISOString()
    };
    const policy = policies.find(p => p.stageId === 'nda');

    expect(getSlaStatus(track, policy)).toBe('ok');
  });
});
