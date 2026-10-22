import { beforeEach, describe, expect, it, vi } from 'vitest';

const fromMock = vi.fn();
const selectMock = vi.fn();
const updateMock = vi.fn();
const insertMock = vi.fn();
const deleteMock = vi.fn();
const eqMock = vi.fn();
let queryResults: Array<{ data: unknown; error: null }> = [];

const queryBuilder = {
  select: selectMock,
  update: updateMock,
  insert: insertMock,
  delete: deleteMock,
  eq: eqMock,
  then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => {
    const result: { data: unknown; error: null } = queryResults.shift() || { data: [] as unknown[], error: null };
    return Promise.resolve(result).then(resolve, reject);
  },
};

vi.mock('../../lib/supabaseClient', () => ({
  default: {
    from: fromMock,
  },
}));

describe('project team assignment reconciliation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults = [];
    fromMock.mockReturnValue(queryBuilder);
    selectMock.mockReturnValue(queryBuilder);
    updateMock.mockReturnValue(queryBuilder);
    insertMock.mockReturnValue(queryBuilder);
    deleteMock.mockReturnValue(queryBuilder);
    eqMock.mockReturnValue(queryBuilder);
  });

  it('updates a replaced role using existing schema columns instead of a missing id', async () => {
    const existingRow: {
      project_id: string;
      member_id: string;
      member_name: string;
      member_role: string;
      fee: number;
      sub_job: string | null;
    } = {
      project_id: 'project-1',
      member_id: 'member-old',
      member_name: 'Old Photographer',
      member_role: 'Fotografer',
      fee: 500000,
      sub_job: null,
    };
    queryResults = [
      { data: [existingRow], error: null },
      { data: null, error: null },
      { data: [{ ...existingRow, member_id: 'member-new', member_name: 'New Photographer', fee: 750000 }], error: null },
    ];

    const { upsertAssignmentsForProject } = await import('../projectTeamAssignments');
    const result = await upsertAssignmentsForProject('project-1', [{
      memberId: 'member-new',
      name: 'New Photographer',
      role: 'Fotografer',
      fee: 750000,
    }]);

    expect(updateMock).toHaveBeenCalledWith({
      member_id: 'member-new',
      member_name: 'New Photographer',
      member_role: 'Fotografer',
      fee: 750000,
      sub_job: null,
    });
    expect(eqMock.mock.calls).toEqual([
      ['project_id', 'project-1'],
      ['project_id', 'project-1'],
      ['member_id', 'member-old'],
      ['member_role', 'Fotografer'],
      ['project_id', 'project-1'],
    ]);
    expect(eqMock.mock.calls.some(([column]) => column === 'id')).toBe(false);
    expect(result).toEqual([{
      memberId: 'member-new',
      name: 'New Photographer',
      role: 'Fotografer',
      fee: 750000,
      subJob: undefined,
    }]);
  });
});
