import { supabase } from './supabase';

export const emptyState = () => ({ issues: [], flags: [], notifications: [], nextRefNumber: 0 });

export function friendlyError(error) {
  if (error?.code === '23505') return 'You have already done this for this issue.';
  return (error?.message || 'Something went wrong.').replace(/^[A-Z_]+:\s*/, '');
}

export function mapIssueRow(row, confirmerIds = [], historyRows = [], noteRows = []) {
  return {
    id: row.id,
    refId: `FRC-${new Date(row.created_at).getFullYear()}-${row.ref_number}`,
    title: row.title,
    description: row.description,
    category: row.category,
    buildingId: row.building_id,
    floorRoom: row.floor_room,
    severity: row.severity,
    status: row.status,
    reporterId: row.reporter_id,
    reporterName: row.reporter_name || 'Student',
    createdAt: row.created_at,
    confirmedByUserIds: Array.from(new Set([row.reporter_id, ...confirmerIds])),
    parentCanonicalId: row.parent_id,
    linkType: row.link_type,
    imageUrl: row.image_url,
    statusReason: row.status_reason || null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    placeName: row.place_name || null,
    adminNotes: noteRows.map((n) => ({ id: String(n.id), author: n.author_name, text: n.text, createdAt: n.created_at })),
    history: historyRows.map((h) => ({ action: h.action, actor: h.actor_name || 'System', at: h.created_at }))
  };
}

const groupBy = (rows, key) =>
  rows.reduce((acc, row) => ((acc[row[key]] = acc[row[key]] || []).push(row), acc), {});

export async function loadRemoteState(userId) {
  const [issues, confirmations, flags, notifications, audit, notes] = await Promise.all([
    supabase.from('issues').select('*').order('created_at', { ascending: false }),
    supabase.from('confirmations').select('issue_id,user_id'),
    supabase.from('flags').select('*, profiles:flagged_by(full_name,email)').order('created_at', { ascending: false }),
    supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('audit_log').select('*').order('created_at', { ascending: true }),
    supabase.from('admin_notes').select('*').order('created_at', { ascending: true })
  ]);
  if (issues.error) {
    console.error('Failed to load issues', issues.error);
    return null;
  }
  const confirmsByIssue = groupBy(confirmations.data || [], 'issue_id');
  const auditByIssue = groupBy(audit.data || [], 'issue_id');
  const notesByIssue = groupBy(notes.data || [], 'issue_id');
  return {
    issues: issues.data.map((row) =>
      mapIssueRow(row, (confirmsByIssue[row.id] || []).map((c) => c.user_id), auditByIssue[row.id] || [], notesByIssue[row.id] || [])
    ),
    flags: (flags.data || []).map((f) => ({
      id: f.id, issueId: f.issue_id, flaggedByUserId: f.flagged_by,
      flaggedByName: f.profiles?.full_name || f.profiles?.email || 'Student',
      reason: f.reason, details: f.details || '', status: f.status, createdAt: f.created_at
    })),
    notifications: (notifications.data || []).map((n) => ({
      id: n.id, userId: n.user_id, issueId: n.issue_id, title: n.title, message: n.message,
      type: n.type, read: n.read, createdAt: n.created_at
    })),
    nextRefNumber: 0
  };
}

async function uploadPhoto(dataUrl, userId) {
  const blob = await (await fetch(dataUrl)).blob();
  const extension = (blob.type.split('/')[1] || 'png').replace('+xml', '');
  const path = `${userId}/${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from('issue-photos').upload(path, blob, { contentType: blob.type });
  if (error) throw error;
  return supabase.storage.from('issue-photos').getPublicUrl(path).data.publicUrl;
}

export async function submitIssue(input, userId) {
  try {
    const imageUrl = input.imageUrl?.startsWith('data:') ? await uploadPhoto(input.imageUrl, userId) : input.imageUrl || null;
    return await supabase
      .from('issues')
      .insert({
        title: input.title, description: input.description, category: input.category,
        building_id: input.buildingId, floor_room: input.floorRoom, severity: input.severity,
        reporter_id: userId, image_url: imageUrl,
        latitude: input.spot?.latitude ?? null, longitude: input.spot?.longitude ?? null, place_name: input.spot?.placeName || null
      })
      .select()
      .single();
  } catch (error) {
    return { data: null, error };
  }
}

export const confirmIssue = (issueId, userId) => supabase.from('confirmations').insert({ issue_id: issueId, user_id: userId });
export const flagIssue = (issueId, userId, reason, details) =>
  supabase.from('flags').insert({ issue_id: issueId, flagged_by: userId, reason, details });
export const updateIssue = (issueId, patch) => supabase.from('issues').update(patch).eq('id', issueId);
export const addNote = (issueId, authorId, authorName, text) =>
  supabase.from('admin_notes').insert({ issue_id: issueId, author_id: authorId, author_name: authorName, text });
export const notifyUser = (userId, issueId, title, message, type) =>
  supabase.from('notifications').insert({ user_id: userId, issue_id: issueId, title, message, type });
export const resolveFlag = (flagId, status) =>
  supabase.from('flags').update({ status, resolved_at: new Date().toISOString() }).eq('id', flagId);
export const markRead = (ids) => supabase.from('notifications').update({ read: true }).in('id', ids);
export const respondToClarification = (issueId, text) =>
  supabase.rpc('respond_to_clarification', { p_issue: issueId, p_text: text });
export const findSimilar = (buildingId, category, text) =>
  supabase.rpc('find_similar_issues', { p_building: buildingId, p_category: category, p_text: text });

export async function loadBuildingCoords() {
  const { data } = await supabase.from('buildings').select('id,latitude,longitude').not('latitude', 'is', null);
  return data || [];
}
export async function updateBuildingCoordinates(buildingId, latitude, longitude) {
  const { data, error } = await supabase.from('buildings').update({ latitude, longitude }).eq('id', buildingId).select();
  if (!error && (!data || data.length === 0)) return { error: { message: 'Only administrators can move building pins.' } };
  return { error };
}

export async function getDailyLimit() {
  const { data } = await supabase.from('app_settings').select('int_value').eq('key', 'daily_report_limit').maybeSingle();
  return data?.int_value ?? 3;
}
export async function saveDailyLimit(limit) {
  const { data, error } = await supabase.from('app_settings').update({ int_value: limit }).eq('key', 'daily_report_limit').select();
  if (!error && (!data || data.length === 0)) return { error: { message: 'Only administrators can change this setting.' } };
  return { error };
}
export async function listFlaggedUsers() {
  const { data } = await supabase
    .from('profiles')
    .select('id,full_name,email,abuse_strikes,restricted_until')
    .or('abuse_strikes.gt.0,restricted_until.not.is.null')
    .order('abuse_strikes', { ascending: false });
  return data || [];
}
export const recordAbuse = (userId, note) => supabase.rpc('record_abuse', { p_user: userId, p_note: note });
export const liftRestriction = (userId) => supabase.rpc('lift_restriction', { p_user: userId });

export async function getModerationSettings() {
  const { data } = await supabase.from('app_settings').select('key,int_value,text_value');
  const byKey = Object.fromEntries((data || []).map((row) => [row.key, row]));
  return {
    autoPublish: (byKey.auto_publish?.int_value ?? 1) === 1,
    blockedWords: byKey.blocked_words?.text_value ?? '',
    flagThreshold: byKey.flag_threshold?.int_value ?? 3
  };
}
export async function saveModerationSettings(rules) {
  const updates = [
    ['auto_publish', { int_value: rules.autoPublish ? 1 : 0 }],
    ['blocked_words', { text_value: rules.blockedWords }],
    ['flag_threshold', { int_value: rules.flagThreshold }]
  ];
  for (const [key, values] of updates) {
    const { data, error } = await supabase.from('app_settings').update(values).eq('key', key).select();
    if (error) return { error };
    if (!data || data.length === 0) return { error: { message: 'Only administrators can change moderation rules.' } };
  }
  return { error: null };
}
