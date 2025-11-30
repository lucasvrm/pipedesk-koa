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
| | `leads.delete` | Delete leads. |
| **Contacts** | `contacts.view` | View contacts list and details. |
| | `contacts.create` | Create new contacts. |
| | `contacts.update` | Edit contact details. |
| | `contacts.delete` | Delete contacts. |
| **Companies** | `companies.view` | View companies list and details. |
| | `companies.create` | Create new companies. |
| | `companies.update` | Edit company details. |
| | `companies.delete` | Delete companies. |

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
| `leads.*` | ✅ Enforced in DB (RLS: `010`) | ✅ Fully Enforced | Create/Update/Qualify buttons protected. RPC checked. |
| `contacts.*` | ✅ Enforced in DB (RLS: `010`) | ✅ Fully Enforced | Create/Edit/Delete buttons protected. |
| `companies.*` | ✅ Enforced in DB (RLS: `010`) | ⚠️ Partial | List page guarded by role, not permission. |

> **Key**:
> - ✅ = Fully implemented and verified.
> - ⚠️ = Implemented via "Role" check (Legacy) instead of granular Permission check.
> - ❌ = Not enforced.

## Enforcement Strategy
The system uses a dual-layer enforcement strategy:

1.  **Frontend (UX):** Use `<RequirePermission>` component to hide/disable UI elements.
    ```tsx
    <RequirePermission permission="leads.qualify">
      <Button>Qualify</Button>
    </RequirePermission>
    ```

2.  **Backend (Security):** Supabase RLS policies using `public.has_permission(code)`.
    ```sql
    CREATE POLICY "Contacts update" ON contacts
      FOR UPDATE USING (public.has_permission('contacts.update'));
    ```
    And RPC checks for complex transactions:
    ```sql
    IF NOT public.has_permission('leads.qualify') THEN
      RAISE EXCEPTION 'Access Denied';
    END IF;
    ```
