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

export interface WorkspaceDefinition {
  title: string;
  eyebrow: string;
  description: string;
  resource: string;
  primaryAction: string;
  columns: readonly string[];
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
