# PipeDesk

A modern Deal Flow Management Platform.

## 🚀 Governance & RBAC

Access control is enforced via Supabase RLS policies and Role-Based Access Control (RBAC).

### Key Permissions & Documentation
For the complete list of permissions, governance rules, and implementation status, please refer to:

👉 **[RBAC Governance & Status](./docs/RBAC.md)**

### Feature Flags
Modules can be toggled via `tags_config` in System Settings. If a module is disabled, API endpoints return `FEATURE_DISABLED` to ensure integrity.
