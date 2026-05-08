export type Priority = 'Low' | 'Medium' | 'High';
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type FlipPotential = 'Low' | 'Medium' | 'High';
export type ProjectStatus =
  | 'New Lead'
  | 'Contacted'
  | 'Negotiating'
  | 'Under Review'
  | 'Purchased'
  | 'Passed';

export type ClientStatus = 'Prospect' | 'Registered' | 'Active' | 'Completed' | 'Cancelled';
export type SessionType = 'Build Session' | 'Rudder Workshop' | 'Consultation' | 'Orientation' | 'Other';
export type SessionStatus = 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';

export interface CrmProject {
  id: string;
  project_name: string;
  seller_name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  source: string;
  listing_url: string;
  category: string;
  completion_pct: number;
  condition_text: string;
  build_quality_rating: number;
  aircraft_notes: string;
  engine_type: string;
  engine_model: string;
  engine_hours: number | null;
  engine_condition: string;
  firewall_forward: boolean;
  asking_price: number | null;
  my_offer: number | null;
  estimated_value: number | null;
  target_purchase_price: number | null;
  deal_score: number;
  project_cost: number | null;
  profit_potential: number | null;
  profit_pct: number | null;
  pros: string;
  cons: string;
  risk_level: RiskLevel;
  flip_potential: FlipPotential;
  strategy_notes: string;
  status: ProjectStatus;
  priority: Priority;
  created_at: string;
  updated_at: string;
}

export type ProjectDraft = Omit<CrmProject, 'id' | 'created_at' | 'updated_at'>;

export const EMPTY_DRAFT: ProjectDraft = {
  project_name: '',
  seller_name: '',
  phone: '',
  email: '',
  city: '',
  state: '',
  source: '',
  listing_url: '',
  category: 'CH750 STOL',
  completion_pct: 0,
  condition_text: '',
  build_quality_rating: 3,
  aircraft_notes: '',
  engine_type: '',
  engine_model: '',
  engine_hours: null,
  engine_condition: '',
  firewall_forward: false,
  asking_price: null,
  my_offer: null,
  estimated_value: null,
  target_purchase_price: null,
  deal_score: 5,
  project_cost: null,
  profit_potential: null,
  profit_pct: null,
  pros: '',
  cons: '',
  risk_level: 'Medium',
  flip_potential: 'Medium',
  strategy_notes: '',
  status: 'New Lead',
  priority: 'Medium',
};

export interface CrmClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  program_type: string;
  status: ClientStatus;
  pilot_status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type ClientDraft = Omit<CrmClient, 'id' | 'created_at' | 'updated_at'>;

export const EMPTY_CLIENT_DRAFT: ClientDraft = {
  name: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  program_type: 'Rudder Workshop',
  status: 'Prospect',
  pilot_status: '',
  notes: '',
};

export interface CrmSession {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  session_type: SessionType;
  client_id: string | null;
  client_name: string;
  instructor: string;
  max_capacity: number;
  enrolled_count: number;
  status: SessionStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type SessionDraft = Omit<CrmSession, 'id' | 'created_at' | 'updated_at'>;

export const EMPTY_SESSION_DRAFT: SessionDraft = {
  title: '',
  description: '',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date().toISOString().slice(0, 10),
  session_type: 'Build Session',
  client_id: null,
  client_name: '',
  instructor: '',
  max_capacity: 1,
  enrolled_count: 0,
  status: 'Scheduled',
  notes: '',
};
