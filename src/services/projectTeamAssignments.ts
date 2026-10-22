import supabase from '../lib/supabaseClient';
import { AssignedTeamMember } from '../types';

const TABLE = 'project_team_assignments';

function fromRow(row: Record<string, unknown>): AssignedTeamMember {
  return {
    memberId: String(row.member_id || ''),
    name: String(row.member_name || ''),
    role: String(row.member_role || ''),
    fee: Number(row.fee || 0),
    subJob: typeof row.sub_job === 'string' ? row.sub_job : undefined,
  };
}

function assignmentKey(assignment: Pick<AssignedTeamMember, 'memberId' | 'role'>): string {
  return `${assignment.memberId}::${(assignment.role || '').trim().toLowerCase()}`;
}

export async function listAssignmentsByProject(projectId: string): Promise<AssignedTeamMember[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('project_id', projectId);
  if (error) throw error;
  return (data || []).map(row => fromRow(row as Record<string, unknown>));
}

/**
 * Reconciles team assignments by their project/member/role columns:
 * - Prevents duplicate assignments for the same member + role
 * - Updates matching rows and reuses vacated role slots for replacements
 * - Only inserts brand new assignments
 * - Only deletes removed assignments without replacements
 */
export async function upsertAssignmentsForProject(projectId: string, assignments: AssignedTeamMember[]): Promise<AssignedTeamMember[]> {
  // 1. Fetch existing assignments
  const { data: existingRows, error: fetchErr } = await supabase
    .from(TABLE)
    .select('*')
    .eq('project_id', projectId);
  if (fetchErr) {
    console.error('[projectTeamAssignments] Fetch error:', fetchErr);
    throw fetchErr;
  }
  const existing = (existingRows || []).map(row => fromRow(row as Record<string, unknown>));

  // 2. Deduplicate incoming assignments by memberId + role
  const seenKeys = new Set<string>();
  const uniqueIncoming: AssignedTeamMember[] = [];
  for (const a of (assignments || [])) {
    if (!a.memberId) continue;
    const key = assignmentKey(a);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueIncoming.push(a);
    }
  }

  // 3. Diffing: Match incoming items to existing records
  const toUpdate: Array<{ existing: AssignedTeamMember; incoming: AssignedTeamMember }> = [];
  const toInsert: Array<{ memberId: string; name: string; role: string; fee: number; subJob?: string }> = [];

  // Track unmatched existing rows
  const remainingExisting = [...existing];

  // Pass 1: Match the existing member/role assignment.
  const unmatchedIncomingPass1: AssignedTeamMember[] = [];
  for (const inc of uniqueIncoming) {
    const idx = remainingExisting.findIndex(e => assignmentKey(e) === assignmentKey(inc));
    if (idx !== -1) {
      const found = remainingExisting.splice(idx, 1)[0];
      toUpdate.push({ existing: found, incoming: inc });
      continue;
    }
    unmatchedIncomingPass1.push(inc);
  }

  // Pass 2: Match a member whose role changed.
  const unmatchedIncomingPass2: AssignedTeamMember[] = [];
  for (const inc of unmatchedIncomingPass1) {
    const idx = remainingExisting.findIndex(e => e.memberId === inc.memberId);
    if (idx !== -1) {
      const found = remainingExisting.splice(idx, 1)[0];
      toUpdate.push({ existing: found, incoming: inc });
      continue;
    }
    unmatchedIncomingPass2.push(inc);
  }

  // Pass 3: Match by vacated role slot (e.g., replace one photographer with another).
  for (const inc of unmatchedIncomingPass2) {
    const normRole = (inc.role || '').trim().toLowerCase();
    const idx = remainingExisting.findIndex(e => (e.role || '').trim().toLowerCase() === normRole);
    if (idx !== -1) {
      const found = remainingExisting.splice(idx, 1)[0];
      toUpdate.push({ existing: found, incoming: inc });
    } else {
      // Completely new assignment slot
      toInsert.push({
        memberId: inc.memberId,
        name: inc.name,
        role: inc.role,
        fee: inc.fee ?? 0,
        subJob: inc.subJob,
      });
    }
  }

  // Pass 4: Execute updates on existing records
  for (const item of toUpdate) {
    const { existing: previous, incoming } = item;
    const { error: updErr } = await supabase
      .from(TABLE)
      .update({
        member_id: incoming.memberId,
        member_name: incoming.name,
        member_role: incoming.role,
        fee: incoming.fee ?? 0,
        sub_job: incoming.subJob ?? null,
      })
      .eq('project_id', projectId)
      .eq('member_id', previous.memberId)
      .eq('member_role', previous.role);
    if (updErr) {
      console.error('[projectTeamAssignments] Update error:', updErr);
      throw updErr;
    }
  }

  // Pass 5: Execute inserts for new records
  if (toInsert.length > 0) {
    const insertPayload = toInsert.map(item => ({
      project_id: projectId,
      member_id: item.memberId,
      member_name: item.name,
      member_role: item.role,
      fee: item.fee,
      sub_job: item.subJob ?? null,
    }));
    const { error: insErr } = await supabase
      .from(TABLE)
      .insert(insertPayload);
    if (insErr) {
      console.error('[projectTeamAssignments] Insert error:', insErr);
      throw insErr;
    }
  }

  // Pass 6: Delete only records that were truly removed
  for (const assignment of remainingExisting) {
    const { error: delErr } = await supabase
      .from(TABLE)
      .delete()
      .eq('project_id', projectId)
      .eq('member_id', assignment.memberId)
      .eq('member_role', assignment.role);
    if (delErr) {
      console.error('[projectTeamAssignments] Delete error:', delErr);
      throw delErr;
    }
  }

  // Return fresh state from DB
  return await listAssignmentsByProject(projectId);
}

export async function deleteAssignmentsByProject(projectId: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('project_id', projectId);
  if (error) throw error;
}
