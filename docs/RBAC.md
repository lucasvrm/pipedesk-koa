# RBAC & Permissions Guide

## RBAC Contract (Governance)
This section defines the **desired state** of the permissions system. All development must adhere to these rules.

### Permissions List
| Module | Permission | Description |
|--------|------------|-------------|
| **Tracks** | `tracks.view` | View tracks and track details. |
| | `tracks.create` | Create new tracks. |
| | `tracks.update` | Update existing tracks. |
| | `tracks.manage` | Full administration of tracks (includes delete/settings). |
| **Pipeline** | `pipeline.manage` | Access Pipeline Settings page (`/admin/pipeline`). |
| | `pipeline.update` | Update stages, SLAs, and transitions. |
| **Tags** | `tags.manage` | Access Tag Settings page (`/admin/tags`). |
| | `tags.update` | Create/Edit/Delete global tags. |
| **Custom Fields**| `custom_fields.manage` | Access Custom Fields Settings page (`/custom-fields`). |
| **RBAC** | `rbac.manage` | Manage Roles and Permissions (`/rbac` or `/admin/users`). |

---

## Implementation Coverage (Status)
Current status of enforcement in the codebase.

| Permission | Backend Enforcement (RLS/Service) | Frontend Guard (Route/UI) | Observations |
|------------|-----------------------------------|---------------------------|--------------|
| `tracks.view` | ✅ Enforced in DB (006_fix_schema) | ❌ **Missing** (Open to all Auth users) | Route `/tracks/:id` has no check. |
| `tracks.create` | ✅ Enforced in DB | ❌ **Missing** | |
| `tracks.update` | ✅ Enforced in DB | ❌ **Missing** | |
| `tracks.manage` | ✅ Enforced in DB | ❌ **Missing** | |
| `pipeline.manage` | ✅ Enforced in DB (005_rbac) | ⚠️ Partial (`admin` Role only) | Route guarded by `requiredRole=['admin']` instead of permission. |
| `pipeline.update` | ✅ Enforced in DB | ⚠️ Partial (`admin` Role only) | |
| `tags.manage` | ✅ Enforced in DB | ⚠️ Partial (`admin` Role only) | Route guarded by `requiredRole=['admin']`. |
| `tags.update` | ✅ Enforced in DB | ⚠️ Partial (`admin` Role only) | |
| `custom_fields.manage`| ❌ **Missing** | ❌ **Missing** | Page `/custom-fields` is currently open to any authenticated user (inside `ProtectedRoute`). |
| `rbac.manage` | ⚠️ Assumed via `admin` role | ⚠️ Partial (`admin` Role only) | Users/RBAC routes guarded by `requiredRole=['admin']`. |

> **Key**:
> - ✅ = Fully implemented and verified.
> - ⚠️ = Implemented via "Role" check (Legacy) instead of granular Permission check.
> - ❌ = Not enforced.

---

## Gaps (Backlog)
The following items are required to reach full compliance with the RBAC Contract:

1.  **Tracks**: Add `RequirePermission` guards to `TrackDetailPage` and `TracksList`.
2.  **Custom Fields**:
    - Seed `custom_fields.manage` permission.
    - Bind to `admin` role.
    - Protect `/custom-fields` route with `RequirePermission`.
3.  **Refactor Admin Routes**: Replace `requiredRole=['admin']` with specific `RequirePermission` guards for Pipeline, Tags, and Users pages to allow more granular access (e.g. `pipeline.manage` without full admin).
