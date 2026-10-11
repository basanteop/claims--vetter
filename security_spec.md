# Security Specification — NHIS Claims Vetting & Compliance Auditor

## 1. Data Invariants & Master Source of Truth

1. **Global Default-Deny Safety Net**: Every path not explicitly matched defaults to `allow read, write: if false;`.
2. **Verified Identity & Zero-Trust RBAC**:
   - All writes require `isSignedIn() && isEmailVerified()`.
   - Admin status (`isAdmin()`) is determined strictly via the bootstrapped runtime owner email (`basanteopoku@gmail.com` with `email_verified == true`) OR existence of `/admins/$(request.auth.uid)`.
   - Self-assigned privilege escalation is forbidden: Non-admin users creating their `/users/{userId}` document can only assign `role == 'claims_officer'` or `role == 'viewer'`, never `'admin'` or `'senior_auditor'`, unless `isAdmin()` is true.
   - Users cannot modify their own `role`, `uid`, or `createdAt` fields during profile updates unless `isAdmin()`.
3. **PII Split-Collection Isolation**:
   - `/users/{userId}` stores operational RBAC metadata (`uid`, `displayName`, `role`, `department`, `hipaaCertified`) with zero email/phone PII.
   - `/users/{userId}/private/{docId}` isolates PII (`email`) and is strictly readable/writable only by `isOwner(userId) || isAdmin()`, with parent existence check `exists(/databases/$(database)/documents/users/$(userId))`.
4. **Relational Integrity & Anti-Orphaned Writes**:
   - `ComplianceAlert` (`/alerts/{alertId}`) requires `exists(/databases/$(database)/documents/auditReports/$(incoming().reportId))` on creation so no alert can reference a non-existent report.
5. **Terminal State Locking**:
   - `AuditReport` documents with `existing().status == 'locked'` cannot be updated by non-admins.
   - `ComplianceAlert` documents with `existing().status == 'resolved'` cannot be updated by non-admins.
6. **Immutable HIPAA Audit Trail**:
   - `HipaaAuditLog` (`/auditLogs/{logId}`) is append-only (`allow create`, `allow update, delete: if false;`).
7. **Strict Temporal Integrity & Volumetric Bounds**:
   - Every `create` enforces `incoming().createdAt == request.time`.
   - Every `update` enforces `incoming().updatedAt == request.time` and `incoming().createdAt == existing().createdAt`.
   - Every string field enforces `.size() >= min && .size() <= max` and ID fields enforce `isValidId()`.

---

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (Self-Assigned Admin Escalation)**: Authenticated non-admin creates `/users/user_123` with `"role": "admin"`.
   ```json
   { "uid": "user_123", "displayName": "Attacker", "role": "admin", "department": "Audit", "hipaaCertified": true, "createdAt": "SERVER_TIMESTAMP", "updatedAt": "SERVER_TIMESTAMP" }
   ```
2. **Payload 2 (Shadow Field Injection on User Profile)**: Authenticated user updates `/users/user_123` with an undeclared ghost field `"isSuperAdmin": true`.
   ```json
   { "uid": "user_123", "displayName": "Alice", "role": "claims_officer", "department": "Claims", "hipaaCertified": true, "isSuperAdmin": true, "createdAt": "SERVER_TIMESTAMP", "updatedAt": "SERVER_TIMESTAMP" }
   ```
3. **Payload 3 (Unverified Admin Email Spoof)**: User with `"email": "basanteopoku@gmail.com"` but `"email_verified": false` attempts to write to `/admins/spoof_uid`.
   ```json
   { "uid": "spoof_uid", "createdAt": "SERVER_TIMESTAMP" }
   ```
4. **Payload 4 (Cross-User PII Read Leak)**: Authenticated `user_456` attempts `get` on `/users/user_123/private/info`.
   ```json
   { "operation": "get", "path": "/users/user_123/private/info", "authUid": "user_456" }
   ```
5. **Payload 5 (Identity Spoofing on Audit Report Creation)**: Authenticated `user_123` creates `/auditReports/rep_1` with `"authorId": "other_user_999"`.
   ```json
   { "reportId": "rep_1", "batchNumber": "NHIS-01", "facilityName": "St John", "serviceMonth": "03", "serviceYear": "2026", "totalClaims": 10, "totalBatchAmount": 500.0, "flaggedClaimsCount": 2, "estimatedAdjustmentAmount": 50.0, "criticalAlertsCount": 1, "status": "in_review", "hipaaEncryptionHash": "sha256_abc12345", "authorId": "other_user_999", "createdAt": "SERVER_TIMESTAMP", "updatedAt": "SERVER_TIMESTAMP" }
   ```
6. **Payload 6 (Terminal State Bypass on Locked Audit Report)**: Non-admin owner attempts to update `/auditReports/rep_1` after `status` is already `'locked'`.
   ```json
   { "status": "in_review", "updatedAt": "SERVER_TIMESTAMP" }
   ```
7. **Payload 7 (Orphaned Alert Creation Without Parent Report)**: User creates `/alerts/alert_99` pointing to non-existent `reportId: "non_existent_report"`.
   ```json
   { "alertId": "alert_99", "reportId": "non_existent_report", "batchNumber": "NHIS-01", "claimId": "CLA-1", "ruleCode": "R01", "severity": "critical", "title": "Alert", "message": "Mismatch", "financialImpact": 100, "status": "open", "authorId": "user_123", "createdAt": "SERVER_TIMESTAMP", "updatedAt": "SERVER_TIMESTAMP" }
   ```
8. **Payload 8 (Denial-of-Wallet Oversized String Poisoning)**: User creates `/vettingRules/rule_1` with a 5,000-character `description` exceeding `maxLength: 1000`.
   ```json
   { "ruleId": "rule_1", "code": "R01", "title": "Rule", "category": "Clinical", "severity": "high", "description": "<5000_CHARS>", "criteriaSummary": "Valid", "sourceDocument": "PDF", "isActive": true, "authorId": "user_123", "createdAt": "SERVER_TIMESTAMP", "updatedAt": "SERVER_TIMESTAMP" }
   ```
9. **Payload 9 (Immutable Field Tampering on Update)**: Owner updates `/vettingRules/rule_1` and mutates `createdAt` or `authorId`.
   ```json
   { "authorId": "new_owner", "updatedAt": "SERVER_TIMESTAMP" }
   ```
10. **Payload 10 (HIPAA Audit Log Deletion/Tampering)**: Admin or user attempts to `update` or `delete` `/auditLogs/log_1`.
    ```json
    { "operation": "delete", "path": "/auditLogs/log_1" }
    ```
11. **Payload 11 (Client Timestamp Forgery)**: User creates `/auditLogs/log_2` with a backdated `createdAt` timestamp instead of `request.time`.
    ```json
    { "logId": "log_2", "actorUid": "user_123", "actorRole": "claims_officer", "action": "EXPORT_PDF", "resourceType": "AuditReport", "resourceId": "rep_1", "details": "Exported report", "createdAt": "2020-01-01T00:00:00Z" }
    ```
12. **Payload 12 (ID Poisoning Attack)**: User creates `/vettingRules/bad$id!@#` where path ID mismatches regex `^[a-zA-Z0-9_\-]+$`.
    ```json
    { "ruleId": "bad$id!@#", "code": "R01", "title": "Rule", "category": "Clinical", "severity": "high", "description": "Desc", "criteriaSummary": "Crit", "sourceDocument": "PDF", "isActive": true, "authorId": "user_123", "createdAt": "SERVER_TIMESTAMP", "updatedAt": "SERVER_TIMESTAMP" }
    ```

---

## 3. Conflict & Red Team Verification Matrix

- **Identity Spoofing**: Blocked on all collections (`incoming().uid == request.auth.uid`, `incoming().authorId == request.auth.uid`, `incoming().actorUid == request.auth.uid`).
- **State Shortcutting / Terminal State**: Locked reports (`status == 'locked'`) and resolved alerts (`status == 'resolved'`) reject non-admin updates.
- **Resource / Value Poisoning**: All `update` blocks begin with `isValid[Entity](incoming())`, enforcing full schema/type/length checks alongside `affectedKeys().hasOnly(...)`.
- **Query Trust Test**: All `allow list` rules explicitly evaluate `resource.data` against `request.auth.uid` or `isAdmin()`.
