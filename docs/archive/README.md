# Archive Documentation

This directory contains historical documentation from the PipeDesk project. These documents have been archived during the December 2025 documentation refactoring and reorganized into small categories (máximo de 4 arquivos por pasta) for easier navigation.

## Purpose

These documents are kept for:
- Historical reference
- Understanding development evolution
- Migration documentation
- Audit and compliance purposes
- Learning from past decisions

## ⚠️ Important Notice

**These documents are OUTDATED and should NOT be used as current reference.**

For current documentation, see the main [/docs](../) directory.

## Structure

### `/migrations`
Database and system migration guides from past iterations:
- `summaries/` — MIGRATION_SUMMARY.md, MIGRATION_COMPLETE_OLD.md, NEXT_STEPS.md
- `supabase/` — SUPABASE_AUTH_SETUP.md, SUPABASE_PROFILES_MIGRATION_GUIDE.md, SUPABASE_MIGRATION.md

### `/phases`
Phase-specific implementation documentation:
- `phase1/` — PHASE1_IMPLEMENTATION.md
- `phase2/` — PHASE2_IMPLEMENTATION.md, PHASE2_QUICKSTART.md, PHASE2_FINAL_SUMMARY.md, FASE_2_DELIVERY.md
- `validation/` — PHASE_VALIDATION_GUIDE.md

### `/reports`
Quality assurance reports, audits, and implementation summaries grouped by topic:
- `implementation/` — IMPLEMENTATION_SUMMARY.md, FEATURES_IMPLEMENTATION.md, IMPLEMENTATION_STATUS.md, FINAL_QA_REPORT.md
- `ui-ux/` — UI_UX_AUDIT_REPORT.md, UI_UX_IMPROVEMENTS_IMPLEMENTED.md, UX_IMPROVEMENTS_GUIDE.md, VISUAL_CHANGES_SUMMARY.md
- `rbac/` — RBAC.md, RBAC_GUIDE.md, RBAC_IMPLEMENTATION.md
- `google-drive/` — google-drive-integration.md, GOOGLE_DRIVE_PD_GOOGLE_INTEGRATION.md
- `admin/` — admin-settings-test-plan.md, ADVANCED_FEATURES_INTEGRATION.md, SUPABASE_AUTH_VALIDATION.md
- `architecture/` — DASHBOARD_ARCHITECTURE.md
- `README_OLD.md` — original documentation index kept for reference

## When to Reference Archive

### ✅ Good Reasons to Look Here
- Understanding why a technical decision was made
- Researching how a migration was performed
- Learning about project evolution
- Audit trail for compliance
- Historical context for current features

### ❌ Bad Reasons to Look Here
- Finding current installation instructions → Use [/docs/getting-started/](../getting-started/)
- Understanding current features → Use [/docs/features/](../features/)
- Learning current architecture → Use [/docs/development/](../development/)
- Contributing to the project → Use [/docs/development/CONTRIBUTING.md](../development/CONTRIBUTING.md)

## Finding Current Documentation

**Start Here:** [/docs/README.md](../README.md)

**Common Needs:**
- **Installation:** [/docs/getting-started/installation.md](../getting-started/installation.md)
- **Quick Start:** [/docs/getting-started/quick-start.md](../getting-started/quick-start.md)
- **Features:** [/docs/features/](../features/)
- **Development:** [/docs/development/](../development/)
- **Contributing:** [/docs/development/CONTRIBUTING.md](../development/CONTRIBUTING.md)
