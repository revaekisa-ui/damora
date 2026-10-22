import { describe, expect, it } from 'vitest';
import { DEFAULT_WORKFLOWS, getWorkflows } from './workflows';

describe('getWorkflows', () => {
  it('uses shared defaults when no workflow is configured', () => {
    expect(getWorkflows()).toBe(DEFAULT_WORKFLOWS);
    expect(getWorkflows({} as any)).toBe(DEFAULT_WORKFLOWS);
  });

  it('prefers configured workflows over legacy workflow fields', () => {
    const workflows = [{ id: 'custom', title: 'Alur Acara', timeline: ['Persiapan'] }];

    expect(getWorkflows({
      workflows,
      weddingWorkflow: { title: 'Legacy', timeline: [] },
    } as any)).toBe(workflows);
  });

  it('supports legacy wedding workflow settings', () => {
    const config = { weddingWorkflow: { title: 'Wedding', timeline: ['Hari acara'] } };

    expect(getWorkflows(config as any)).toEqual([
      { id: 'wf-wedding', title: 'Wedding', timeline: ['Hari acara'] },
    ]);
  });
});
