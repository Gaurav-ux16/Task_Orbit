/**
 * Unit tests for taskWorkflowService.js — status transition rules & research-paper alignment
 * Supabase is mocked so no real database is needed.
 */

import { jest } from '@jest/globals';

// Mock Supabase before importing anything that depends on it
jest.unstable_mockModule('../src/config/supabase.js', () => ({
  default: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { id: 'task-1', status: 'in_progress', project_id: 'proj-1', assignee_id: 'assignee-001' }, error: null }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
      insert: () => Promise.resolve({ data: {}, error: null }),
    }),
  },
}));

const { isValidTransition, validateTransition, TRANSITIONS } = await import('../src/services/taskWorkflowService.js');

describe('Task status transitions', () => {
  describe('isValidTransition', () => {
    test('todo → in_progress is valid', () => {
      expect(isValidTransition('todo', 'in_progress')).toBe(true);
    });

    test('in_progress → submitted is valid', () => {
      expect(isValidTransition('in_progress', 'submitted')).toBe(true);
    });

    test('submitted → in_review is valid', () => {
      expect(isValidTransition('submitted', 'in_review')).toBe(true);
    });

    test('in_review → approved is valid', () => {
      expect(isValidTransition('in_review', 'approved')).toBe(true);
    });

    test('in_review → revision is valid', () => {
      expect(isValidTransition('in_review', 'revision')).toBe(true);
    });

    test('revision → in_progress is valid', () => {
      expect(isValidTransition('revision', 'in_progress')).toBe(true);
    });

    // Invalid transitions
    test('todo → approved is invalid', () => {
      expect(isValidTransition('todo', 'approved')).toBe(false);
    });

    test('todo → submitted is invalid', () => {
      expect(isValidTransition('todo', 'submitted')).toBe(false);
    });

    test('approved → in_progress is invalid (terminal state)', () => {
      expect(isValidTransition('approved', 'in_progress')).toBe(false);
    });

    test('approved → revision is invalid (terminal state)', () => {
      expect(isValidTransition('approved', 'revision')).toBe(false);
    });

    test('approved → todo is invalid (terminal state)', () => {
      expect(isValidTransition('approved', 'todo')).toBe(false);
    });

    test('in_progress → in_review is invalid (must go through submitted)', () => {
      expect(isValidTransition('in_progress', 'in_review')).toBe(false);
    });

    test('revision → approved is invalid (must resubmit first)', () => {
      expect(isValidTransition('revision', 'approved')).toBe(false);
    });

    test('unknown status → anything returns false', () => {
      expect(isValidTransition('nonexistent', 'in_progress')).toBe(false);
    });

    test('same status → same status returns false', () => {
      expect(isValidTransition('in_progress', 'in_progress')).toBe(false);
    });
  });

  describe('TRANSITIONS map', () => {
    test('approved has no allowed transitions', () => {
      expect(TRANSITIONS['approved']).toEqual([]);
    });

    test('all statuses are represented', () => {
      const expected = ['todo', 'in_progress', 'submitted', 'in_review', 'revision', 'approved'];
      for (const status of expected) {
        expect(TRANSITIONS).toHaveProperty(status);
      }
    });
  });

  describe('validateTransition — Research Paper Alignment', () => {
    const ownedTask = { id: 'task-1', status: 'todo', assignee_id: 'assignee-001' };
    const unownedTask = { id: 'task-2', status: 'todo', assignee_id: 'assignee-002' };

    test('valid transition by authorized owner succeeds without throwing', () => {
      expect(() => {
        validateTransition(ownedTask, 'in_progress', { id: 'assignee-001', role: 'assignee' });
      }).not.toThrow();
    });

    test('invalid workflow transition throws HTTP 409 Conflict', () => {
      expect(() => {
        validateTransition(ownedTask, 'approved', { id: 'assignee-001', role: 'assignee' });
      }).toThrow(expect.objectContaining({ status: 409 }));
    });

    test('terminal approved state transition throws HTTP 409 Conflict', () => {
      const approvedTask = { id: 'task-3', status: 'approved', assignee_id: 'assignee-001' };
      expect(() => {
        validateTransition(approvedTask, 'in_progress', { id: 'assignee-001', role: 'assignee' });
      }).toThrow(expect.objectContaining({ status: 409 }));
    });

    test('assignee attempting to approve task throws HTTP 403 Forbidden', () => {
      const reviewTask = { id: 'task-4', status: 'in_review', assignee_id: 'assignee-001' };
      expect(() => {
        validateTransition(reviewTask, 'approved', { id: 'assignee-001', role: 'assignee' });
      }).toThrow(expect.objectContaining({ status: 403 }));
    });

    test('reviewer approving in_review task succeeds', () => {
      const reviewTask = { id: 'task-4', status: 'in_review', assignee_id: 'assignee-001' };
      expect(() => {
        validateTransition(reviewTask, 'approved', { id: 'reviewer-001', role: 'reviewer' });
      }).not.toThrow();
    });

    test('assignee transitioning unowned task throws HTTP 403 Forbidden', () => {
      expect(() => {
        validateTransition(unownedTask, 'in_progress', { id: 'assignee-001', role: 'assignee' });
      }).toThrow(expect.objectContaining({ status: 403 }));
    });
  });
});
