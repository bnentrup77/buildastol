import { supabase } from '../supabase';
import type { CrmProject, ProjectDraft, CrmClient, ClientDraft, CrmSession, SessionDraft } from './types';

// ─── Deal Photos ──────────────────────────────────────────────────────────────

export interface DealPhoto {
  id: string;
  project_id: string;
  storage_path: string;
  filename: string;
  created_at: string;
}

export async function fetchPhotos(projectId: string): Promise<DealPhoto[]> {
  const { data, error } = await supabase
    .from('crm_deal_photos')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as DealPhoto[];
}

export async function uploadPhoto(projectId: string, file: File): Promise<DealPhoto> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const uid = crypto.randomUUID();
  const path = `${projectId}/${uid}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('deal-photos')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;

  const { data, error: insertError } = await supabase
    .from('crm_deal_photos')
    .insert({ project_id: projectId, storage_path: path, filename: file.name })
    .select()
    .single();
  if (insertError) throw insertError;
  return data as DealPhoto;
}

export async function deletePhoto(photo: DealPhoto): Promise<void> {
  await supabase.storage.from('deal-photos').remove([photo.storage_path]);
  const { error } = await supabase.from('crm_deal_photos').delete().eq('id', photo.id);
  if (error) throw error;
}

export function getPhotoUrl(storagePath: string): string {
  const { data } = supabase.storage.from('deal-photos').getPublicUrl(storagePath);
  return data.publicUrl;
}

// ─── Aircraft Types ───────────────────────────────────────────────────────────

export interface AircraftType {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function fetchAircraftTypes(): Promise<AircraftType[]> {
  const { data, error } = await supabase
    .from('aircraft_types')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data as AircraftType[];
}

export async function createAircraftType(name: string, sortOrder = 0): Promise<AircraftType> {
  const { data, error } = await supabase
    .from('aircraft_types')
    .insert({ name: name.trim(), sort_order: sortOrder, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data as AircraftType;
}

export async function updateAircraftType(id: string, name: string): Promise<AircraftType> {
  const { data, error } = await supabase
    .from('aircraft_types')
    .update({ name: name.trim(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as AircraftType;
}

export async function deleteAircraftType(id: string): Promise<void> {
  const { error } = await supabase.from('aircraft_types').delete().eq('id', id);
  if (error) throw error;
}

// ─── Pricing Config ───────────────────────────────────────────────────────────

export interface PricingConfig {
  id: string;
  aircraft_type: string;
  component: string;
  label: string;
  default_cost: number;
  sort_order: number;
  updated_at: string;
}

export async function fetchPricingConfig(aircraftType?: string): Promise<PricingConfig[]> {
  let q = supabase.from('pricing_config').select('*').order('sort_order', { ascending: true });
  if (aircraftType) q = q.eq('aircraft_type', aircraftType);
  const { data, error } = await q;
  if (error) throw error;
  return data as PricingConfig[];
}

export async function createPricingConfig(
  aircraftType: string, component: string, label: string, defaultCost: number, sortOrder = 0
): Promise<PricingConfig> {
  const { data, error } = await supabase
    .from('pricing_config')
    .insert({ aircraft_type: aircraftType, component, label, default_cost: defaultCost, sort_order: sortOrder, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data as PricingConfig;
}

export async function updatePricingConfig(id: string, fields: Partial<Pick<PricingConfig, 'label' | 'default_cost' | 'sort_order'>>): Promise<void> {
  const { error } = await supabase
    .from('pricing_config')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deletePricingConfig(id: string): Promise<void> {
  const { error } = await supabase.from('pricing_config').delete().eq('id', id);
  if (error) throw error;
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function fetchProjects(): Promise<CrmProject[]> {
  const { data, error } = await supabase
    .from('crm_projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as CrmProject[];
}

export async function createProject(draft: ProjectDraft): Promise<CrmProject> {
  const { data, error } = await supabase
    .from('crm_projects')
    .insert({ ...draft, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data as CrmProject;
}

export async function updateProject(id: string, draft: Partial<ProjectDraft>): Promise<CrmProject> {
  const { data, error } = await supabase
    .from('crm_projects')
    .update({ ...draft, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as CrmProject;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('crm_projects').delete().eq('id', id);
  if (error) throw error;
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export async function fetchClients(): Promise<CrmClient[]> {
  const { data, error } = await supabase
    .from('crm_clients')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as CrmClient[];
}

export async function createClient(draft: ClientDraft): Promise<CrmClient> {
  const { data, error } = await supabase
    .from('crm_clients')
    .insert({ ...draft, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data as CrmClient;
}

export async function updateClient(id: string, draft: Partial<ClientDraft>): Promise<CrmClient> {
  const { data, error } = await supabase
    .from('crm_clients')
    .update({ ...draft, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as CrmClient;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from('crm_clients').delete().eq('id', id);
  if (error) throw error;
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export async function fetchSessions(): Promise<CrmSession[]> {
  const { data, error } = await supabase
    .from('crm_schedule')
    .select('*')
    .order('start_date', { ascending: true });
  if (error) throw error;
  return data as CrmSession[];
}

export async function createSession(draft: SessionDraft): Promise<CrmSession> {
  const { data, error } = await supabase
    .from('crm_schedule')
    .insert({ ...draft, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data as CrmSession;
}

export async function updateSession(id: string, draft: Partial<SessionDraft>): Promise<CrmSession> {
  const { data, error } = await supabase
    .from('crm_schedule')
    .update({ ...draft, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as CrmSession;
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase.from('crm_schedule').delete().eq('id', id);
  if (error) throw error;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function verifyCredentials(username: string, passwordHash: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('crm_users')
    .select('id')
    .eq('username', username)
    .eq('password_hash', passwordHash)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

export async function updateCredentials(username: string, newUsername: string, newHash: string): Promise<void> {
  const { error } = await supabase
    .from('crm_users')
    .update({ username: newUsername, password_hash: newHash, updated_at: new Date().toISOString() })
    .eq('username', username);
  if (error) throw error;
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function exportToCsv(projects: CrmProject[]): void {
  const headers = [
    'Project Name', 'Seller', 'Phone', 'Email', 'City', 'State', 'Source',
    'Category', 'Completion %', 'Condition', 'Build Quality', 'Aircraft Notes',
    'Engine Type', 'Engine Model', 'Engine Hours', 'Engine Condition', 'Firewall Forward',
    'Asking Price', 'My Offer', 'Est. Value', 'Target Price', 'Deal Score',
    'Pros', 'Cons', 'Risk Level', 'Flip Potential', 'Strategy Notes',
    'Status', 'Priority', 'Created At',
  ];
  const rows = projects.map(p => [
    p.project_name, p.seller_name, p.phone, p.email, p.city, p.state, p.source,
    p.category, p.completion_pct, p.condition_text, p.build_quality_rating, p.aircraft_notes,
    p.engine_type, p.engine_model, p.engine_hours ?? '', p.engine_condition, p.firewall_forward ? 'Yes' : 'No',
    p.asking_price ?? '', p.my_offer ?? '', p.estimated_value ?? '', p.target_purchase_price ?? '', p.deal_score,
    p.pros, p.cons, p.risk_level, p.flip_potential, p.strategy_notes,
    p.status, p.priority, new Date(p.created_at).toLocaleDateString(),
  ]);
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `crm-projects-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
