export type AppRole = 'superadmin' | 'admin' | 'agent' | 'staff';
export type TaxReturnStatus = 'pending' | 'in_progress' | 'review' | 'approved' | 'submitted' | 'rejected';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type DocumentStatus = 'uploaded' | 'verified' | 'rejected' | 'missing';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Client {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  ssn_last_four?: string;
  filing_status?: string;
  assigned_agent_id?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  license_number?: string;
  specialization?: string;
  commission_rate: number;
  status: string;
  total_clients: number;
  total_returns: number;
  created_at: string;
  updated_at: string;
}

export interface TaxReturn {
  id: string;
  client_id: string;
  agent_id?: string;
  tax_year: number;
  return_type: string;
  status: TaxReturnStatus;
  federal_refund?: number;
  state_refund?: number;
  federal_owed?: number;
  state_owed?: number;
  gross_income?: number;
  adjusted_gross_income?: number;
  total_deductions?: number;
  filing_date?: string;
  submitted_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  agent?: Agent;
}

export interface Document {
  id: string;
  client_id: string;
  tax_return_id?: string;
  name: string;
  document_type: string;
  file_url?: string;
  file_size?: number;
  status: DocumentStatus;
  verified_by?: string;
  verified_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface Payment {
  id: string;
  client_id: string;
  tax_return_id?: string;
  amount: number;
  payment_type: string;
  payment_method?: string;
  status: PaymentStatus;
  transaction_id?: string;
  processed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}
