# PipeDesk

A modern Deal Flow Management Platform.

## 🚀 Governance & RBAC

Access control is enforced via Supabase RLS policies and Role-Based Access Control (RBAC).

### Key Permissions
The system uses the following permission codes (bound to the `admin` role by default):

| Permission | Description |
|------------|-------------|
| `pipeline.manage` | Grants access to the Pipeline Settings UI. |
| `pipeline.update` | Allows modifying stages, SLA policies, and transition rules. |
| `tags.manage` | Grants access to the Tag Settings UI. |
| `tags.update` | Allows creating, editing, and deleting global tags. |

### Feature Flags
Modules can be toggled via `tags_config` in System Settings. If a module is disabled, API endpoints return `FEATURE_DISABLED` to ensure integrity.
