const BASE_URL = "http://localhost:8000/api";

// ── Token helpers ──

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("railway_token");
}

export function setToken(token: string): void {
  localStorage.setItem("railway_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("railway_token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ── Generic fetch ──

async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message =
      (errorBody as { detail?: string }).detail ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ── Auth ──

export interface UserInfo {
  id: number;
  username: string;
  full_name: string | null;
  role: string;
  can_manage_warid: boolean;
  can_manage_sadir: boolean;
  can_manage_users: boolean;
  can_import_excel: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserInfo;
}

export function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

// ── Warid (وارد) ──

export interface WaridRecord {
  id: number;
  qaid_number: string;
  qaid_date: string;
  source_administration: string;
  letter_number: string | null;
  subject: string;
  notes: string | null;
  needs_followup: boolean;
  followup_status: string;
  created_at: string;
  [key: string]: unknown;
}

export function getWaridList(
  params?: Record<string, string>
): Promise<WaridRecord[]> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return apiFetch<WaridRecord[]>(`/documents/warid${qs}`);
}

export function createWarid(
  data: Record<string, unknown>
): Promise<{ id: number; message: string }> {
  return apiFetch("/documents/warid", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getWaridById(id: number): Promise<WaridRecord> {
  return apiFetch<WaridRecord>(`/documents/warid/${id}`);
}

export function updateWarid(
  id: number,
  data: Record<string, unknown>
): Promise<{ message: string }> {
  return apiFetch(`/documents/warid/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteWarid(id: number): Promise<{ message: string }> {
  return apiFetch(`/documents/warid/${id}`, { method: "DELETE" });
}

export function batchDeleteWarid(
  ids: number[]
): Promise<{ message: string; deleted_count: number }> {
  return apiFetch("/documents/warid/batch-delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

// ── Sadir (صادر) ──

export interface SadirRecord {
  id: number;
  qaid_number: string;
  qaid_date: string;
  destination_administration: string | null;
  letter_number: string | null;
  subject: string;
  notes: string | null;
  signature_status: string;
  needs_followup: boolean;
  followup_status: string;
  created_at: string;
  [key: string]: unknown;
}

export function getSadirList(
  params?: Record<string, string>
): Promise<SadirRecord[]> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return apiFetch<SadirRecord[]>(`/documents/sadir${qs}`);
}

export function createSadir(
  data: Record<string, unknown>
): Promise<{ id: number; message: string }> {
  return apiFetch("/documents/sadir", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getSadirById(id: number): Promise<SadirRecord> {
  return apiFetch<SadirRecord>(`/documents/sadir/${id}`);
}

export function updateSadir(
  id: number,
  data: Record<string, unknown>
): Promise<{ message: string }> {
  return apiFetch(`/documents/sadir/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteSadir(id: number): Promise<{ message: string }> {
  return apiFetch(`/documents/sadir/${id}`, { method: "DELETE" });
}

// ── Statistics ──

export interface Statistics {
  warid_count: number;
  sadir_count: number;
  pending_followups: number;
  monthly_counts: { warid: number; sadir: number };
}

export function getStatistics(): Promise<Statistics> {
  return apiFetch<Statistics>("/documents/statistics");
}

// ── Users ──

export interface UserRecord {
  id: number;
  username: string;
  full_name: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
  can_manage_warid: boolean;
  can_manage_sadir: boolean;
  can_manage_users: boolean;
  can_import_excel: boolean;
  created_at: string | null;
  last_login: string | null;
}

export function getUsers(): Promise<UserRecord[]> {
  return apiFetch<UserRecord[]>("/users");
}

export function createUser(
  data: Record<string, unknown>
): Promise<{ id: number; username: string; message: string }> {
  return apiFetch("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Deleted Records ──

export interface DeletedRecord {
  id: number;
  document_type: string;
  original_record_id: number;
  deleted_at: string;
  deleted_by_name: string | null;
}

export function getDeletedRecords(
  documentType?: string
): Promise<DeletedRecord[]> {
  const qs = documentType
    ? `?document_type=${documentType}`
    : "";
  return apiFetch<DeletedRecord[]>(`/documents/deleted${qs}`);
}

export function restoreDeleted(
  recordId: number
): Promise<{ message: string }> {
  return apiFetch("/documents/deleted/restore", {
    method: "POST",
    body: JSON.stringify({ record_id: recordId }),
  });
}

// ── Classification ──

export interface ClassificationOption {
  id: number;
  option_name: string;
  created_at: string | null;
}

export function getClassificationOptions(
  documentType: string
): Promise<ClassificationOption[]> {
  return apiFetch<ClassificationOption[]>(
    `/documents/classification/${documentType}`
  );
}

export function addClassificationOption(
  documentType: string,
  optionName: string
): Promise<{
  id: number;
  option_name: string;
  message: string;
}> {
  return apiFetch("/documents/classification", {
    method: "POST",
    body: JSON.stringify({
      document_type: documentType,
      option_name: optionName,
    }),
  });
}
