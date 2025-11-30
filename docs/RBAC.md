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
| **Leads** | `leads.view` | View leads list and details. |
| | `leads.create` | Create new leads. |
| | `leads.update` | Edit lead details. |
| | `leads.qualify` | Execute lead qualification (convert to Deal). |
| | `leads.manage` | Delete leads or manage configurations. |
| **Contacts** | `contacts.view` | View contacts list and details. |
| | `contacts.create` | Create new contacts. |
| | `contacts.update` | Edit contact details. |
| | `contacts.manage` | Delete contacts. |

---

## Implementation Coverage (Status)
Current status of enforcement in the codebase.

| Permission | Backend Enforcement (RLS/Service) | Frontend Guard (Route/UI) | Observations |
|------------|-----------------------------------|---------------------------|--------------|
| `tracks.*` | ✅ Enforced in DB | ❌ **Missing** | Route `/tracks/:id` has no check. |
| `pipeline.*` | ✅ Enforced in DB | ⚠️ Partial (`admin` Role) | |
| `tags.*` | ✅ Enforced in DB | ⚠️ Partial (`admin` Role) | |
| `custom_fields.*`| ❌ **Missing** | ❌ **Missing** | |
| `rbac.manage` | ⚠️ Assumed via `admin` role | ⚠️ Partial (`admin` Role) | |
| `leads.*` | ✅ Enforced in DB (007) | ❌ **Pending UI** | New module. |
| `contacts.*` | ✅ Enforced in DB (007) | ❌ **Pending UI** | New module. |

> **Key**:
> - ✅ = Fully implemented and verified.
> - ⚠️ = Implemented via "Role" check (Legacy) instead of granular Permission check.
> - ❌ = Not enforced.

---

## Gaps (Backlog)
The following items are required to reach full compliance with the RBAC Contract:

1.  **Tracks**: Add `RequirePermission` guards to `TrackDetailPage` and `TracksList`.
2.  **Custom Fields**: Seed `custom_fields.manage` permission and bind to admin.
3.  **Leads/Contacts**: Ensure UI checks permissions before showing "Qualify" button or "Edit" forms.
