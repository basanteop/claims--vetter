/**
 * Firestore Security Rules Test Suite — Dirty Dozen Verification
 */
export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collection: string;
  operation: 'create' | 'update' | 'delete' | 'get' | 'list';
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  { id: 1, name: 'Self-Assigned Admin Escalation', collection: 'users', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 2, name: 'Shadow Field Injection on User Profile', collection: 'users', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
  { id: 3, name: 'Unverified Admin Email Spoof', collection: 'admins', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 4, name: 'Cross-User PII Read Leak', collection: 'users/user_123/private', operation: 'get', expectedResult: 'PERMISSION_DENIED' },
  { id: 5, name: 'Identity Spoofing on Audit Report Creation', collection: 'auditReports', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 6, name: 'Terminal State Bypass on Locked Audit Report', collection: 'auditReports', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
  { id: 7, name: 'Orphaned Alert Creation Without Parent Report', collection: 'alerts', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 8, name: 'Denial-of-Wallet Oversized String Poisoning', collection: 'vettingRules', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 9, name: 'Immutable Field Tampering on Update', collection: 'vettingRules', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
  { id: 10, name: 'HIPAA Audit Log Deletion/Tampering', collection: 'auditLogs', operation: 'delete', expectedResult: 'PERMISSION_DENIED' },
  { id: 11, name: 'Client Timestamp Forgery', collection: 'auditLogs', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 12, name: 'ID Poisoning Attack', collection: 'vettingRules', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
];
