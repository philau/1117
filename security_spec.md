# Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Strict Ownership**: Every document in `clients`, `projects`, `tasks`, and `workLogs` must carry an `ownerId` matching `request.auth.uid`, and `ownerId` is immutable after creation.
2. **PII Isolation**: `users/{userId}` contains PII (`email`, `phone`, `location`) and may only be read (`get`), created, or updated by the owning user (`request.auth.uid == userId`). `list` queries on `users` are permanently denied.
3. **Referential Integrity**: When creating or updating a `Project` with a non-empty `clientId`, that `Client` document must exist and belong to `request.auth.uid`. When creating or updating a `Task` or `WorkLog` with a non-empty `projectId`, that `Project` document must exist and belong to `request.auth.uid`.
4. **Strict Field Allowlisting & Bounds**: Every collection enforces exact `keys().hasAll(...) && keys().hasOnly(...)` on creation and `affectedKeys().hasOnly(...)` on action-based updates, alongside string `.size()` limits and regex guards (`isValidId`, ISO date pattern).
5. **Temporal Integrity**: `createdAt` must equal `request.time` on create and remain immutable on update; `updatedAt` must equal `request.time` on both create and update.
6. **Verified Identity**: Write operations require a signed-in user with `request.auth.token.email_verified == true`.
7. **Secure List Queries**: Every `allow list` rule evaluates `resource.data.ownerId == request.auth.uid` directly without `get()`/`exists()` calls.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Identity Spoofing (Create)**: User A attempts to create a project with `ownerId: "userB"`. -> `PERMISSION_DENIED`
2. **Cross-Tenant Read (`get`)**: User A attempts to read User B's `users/{userB}` profile. -> `PERMISSION_DENIED`
3. **Blanket User List Scraping**: Any signed-in user attempts `list` on `/users`. -> `PERMISSION_DENIED`
4. **Unscoped Collection Query (`list`)**: User A queries `/projects` without `where('ownerId', '==', userA)`. -> `PERMISSION_DENIED`
5. **Shadow / Ghost Field Injection**: User A creates a task including an extra field `isAdmin: true`. -> `PERMISSION_DENIED`
6. **Shadow Field Update**: User A updates a task and injects `extraFlag: "hacked"`. -> `PERMISSION_DENIED`
7. **Immutable Field Tampering**: User A updates a project to change `ownerId` or `createdAt`. -> `PERMISSION_DENIED`
8. **Client-Forged Timestamp**: User A creates a client with a past `createdAt` timestamp instead of `request.time`. -> `PERMISSION_DENIED`
9. **Orphaned Relational Reference**: User A creates a task with `projectId: "non_existent_project"` or another user's `projectId`. -> `PERMISSION_DENIED`
10. **ID Poisoning**: User A writes to `/projects/invalid$id*with>badchars` or a 1.5KB document ID. -> `PERMISSION_DENIED`
11. **Value / Type Poisoning**: User A updates a project's `status` to `"archived"` (not in enum) or `name` to a 500-char string (exceeds 120). -> `PERMISSION_DENIED`
12. **Unverified Email Spoof**: A signed-in user with `email_verified: false` attempts to create or update a document. -> `PERMISSION_DENIED`
