export type BeautyRole =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'receptionist'
  | 'specialist'
  | 'cashier'
  | 'customer'
  | 'auditor';

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: { requestId: string; nextCursor?: string };
}

export interface BeautyRecord {
  id: string;
  branchId?: string;
  name?: string;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: readonly BeautyRole[];
}

export interface NavSection {
  label: string;
  items: readonly NavItem[];
}

export type WorkspaceFieldType =
  'text' | 'email' | 'tel' | 'number' | 'date' | 'datetime-local' | 'textarea' | 'select';

export interface WorkspaceOption {
  label: string;
  value: string;
}

export interface WorkspaceField {
  key: string;
  label: string;
  type: WorkspaceFieldType;
  placeholder?: string;
  required?: boolean;
  options?: readonly WorkspaceOption[];
  fullWidth?: boolean;
  min?: number;
  step?: number;
}

export type WorkspaceColumnFormat = 'text' | 'status' | 'date' | 'currency' | 'number';

export interface WorkspaceColumn {
  key: string;
  label: string;
  format?: WorkspaceColumnFormat;
}

export interface WorkspaceDefinition {
  title: string;
  eyebrow: string;
  description: string;
  resource: string;
  primaryAction: string;
  columns: readonly WorkspaceColumn[];
  fields?: readonly WorkspaceField[];
  emptyTitle?: string;
  emptyDescription?: string;
  branchRequired?: boolean;
  readonly?: boolean;
}

export interface BranchRecord extends BeautyRecord {
  name: string;
  active?: boolean;
}

export interface IdentityProfile {
  uid?: string;
  displayName?: string;
  email?: string;
  role?: BeautyRole;
  tenantId?: string;
}
