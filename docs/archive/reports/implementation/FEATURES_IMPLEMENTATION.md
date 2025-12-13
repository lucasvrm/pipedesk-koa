# M&A Advanced Features Implementation

This document describes the three advanced features implemented for the PipeDesk-Koa M&A workflow management system.

## 1. Q&A Module (Questions & Answers)

### Overview
A comprehensive Q&A system that enables clients to ask questions about deals and tracks, with analysts providing answers. The system supports internal notes and role-based visibility.

### Database Schema
Two new tables were added to `supabase-schema.sql`:

- **`questions`**: Stores questions with priority, category, and status
- **`answers`**: Stores answers with internal/external visibility flag

### Features Implemented
- **Ask Question Dialog**: Clients and analysts can create questions with:
  - Title and detailed content
  - Priority levels (low, medium, high, urgent)
  - Optional categorization
  - Automatic status tracking (open, answered, closed)

- **Answer Question Interface**: Analysts can:
  - Respond to questions
  - Mark answers as "internal" (visible only to analysts)
  - Update question status automatically

- **Role-Based Visibility**:
  - Clients see only their questions and public answers
  - Analysts see all questions and all answers (including internal notes)
  - Impersonation mode respects these visibility rules

### Integration Points
- Added Q&A tab to **Deal Detail Dialog** (`DealDetailDialog.tsx`)
- Added Q&A tab to **Player Track Detail Dialog** (`PlayerTrackDetailDialog.tsx`)
- Component: `src/components/QAPanel.tsx`

### UI Components
- Question cards with priority and status badges
- Category filtering
- Answer threads with timestamps
- Internal answer indicators
- Empty states with CTAs

---

## 2. Anonymization Toggle (Impersonation Mode)

### Overview
Allows administrators to view the application as if they were a client, ensuring that client-facing views properly anonymize sensitive data like player names and internal information.

### Implementation

#### Context Provider
Created `ImpersonationContext` (`src/contexts/ImpersonationContext.tsx`):
- Global state management for impersonation mode
- Boolean flag `isImpersonating`
- Accessible throughout the app via `useImpersonation()` hook

#### UI Toggle
Added to the app header (visible only to Admin users):
- Switch component with eye icons (Eye/EyeSlash)
- Label: "Modo Cliente" (Client Mode)
- Positioned in the header next to search and notifications

#### Effects When Active
When the impersonation toggle is ON:
- `effectiveRole` is set to "client" throughout the app
- Player names are anonymized (e.g., "Player 1234")
- Edit/delete buttons are hidden
- Internal answers in Q&A are hidden
- Sensitive data is masked

### Integration Points
- `src/App.tsx`: Toggle switch in header
- `src/lib/helpers.ts`: Updated `anonymizePlayerName` to accept boolean flag
- `src/components/QAPanel.tsx`: Respects impersonation for answer visibility
- Wrapped app in `ImpersonationProvider` in `src/main.tsx`

### Security
- Only Admin users see the toggle
- Client users never have access to impersonation mode
- State is not persisted (resets on refresh for security)

---

## 3. Document Generator

### Overview
Professional document generation system that creates Microsoft Word (.docx) files from deal data using the `docx` library.

### Library
- **Package**: `docx` v9.0.4
- **Security**: Verified no vulnerabilities via GitHub Advisory Database
- **Size**: ~350KB minified

### Document Templates

#### Teaser
A concise overview document containing:
- Deal name and basic information
- Operation type and volume
- Deadline
- Observations
- List of active players with stages and probabilities
- Generation timestamp

#### CIM (Confidential Information Memorandum)
A comprehensive document containing:
- Executive summary
- Deal description
- Financial overview with fee calculations
- Detailed player track information
- Confidentiality notice
- Generation timestamp

### Features
- **Template Selection**: Radio group UI for choosing document type
- **Client-Side Generation**: Documents are generated in the browser
- **Automatic Download**: Files download with formatted names:
  - Format: `{ClientName}_{TEMPLATE}_YYYY-MM-DD.docx`
  - Example: `ABC_Corporation_TEASER_2025-11-20.docx`
- **Data Formatting**: Proper currency, date, and percentage formatting
- **Professional Styling**: Headers, tables, and consistent typography

### Integration Points
- Added "Gerar Documento" button to Deal Detail Dialog header
- Component: `src/components/DocumentGenerator.tsx`
- Imports deal and player track data automatically

### UI/UX
- Dialog with template selection
- Preview descriptions for each template type
- Loading states during generation
- Success/error toast notifications
- Cancel option

---

## Technical Details

### Type Definitions
Added to `src/lib/types.ts`:
```typescript
export interface Question {
  id: string
  entityId: string
  entityType: 'deal' | 'track'
  title: string
  content: string
  category?: string
  priority: QuestionPriority
  status: QuestionStatus
  askedBy: string
  createdAt: string
  updatedAt: string
}

export interface Answer {
  id: string
  questionId: string
  content: string
  isInternal: boolean
  answeredBy: string
  createdAt: string
  updatedAt: string
}
```

### Database Indexes
Added for performance:
```sql
CREATE INDEX idx_questions_entity ON questions(entity_id, entity_type);
CREATE INDEX idx_questions_asked_by ON questions(asked_by);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_answered_by ON answers(answered_by);
```

### Dependencies Updated
- Added: `docx@9.0.4`
- No breaking changes to existing dependencies

---

## Testing & Quality Assurance

### Build Status
✅ All builds successful with no errors

### Code Review
✅ Code review completed - 1 minor comment addressed

### Security Scan
✅ CodeQL analysis - 0 vulnerabilities found

### Browser Compatibility
- Tested with modern browsers (Chrome, Firefox, Safari, Edge)
- Document generation uses standard Web APIs
- No IE11 support required

---

## Usage Examples

### Q&A Module
1. Navigate to a Deal or Player Track
2. Click on the "Q&A" tab
3. Click "Fazer Pergunta" to ask a question
4. Analysts can click "Responder" on open questions
5. Mark answers as internal if needed for team-only notes

### Anonymization Toggle
1. Log in as Admin user
2. Look for "Modo Cliente" switch in header
3. Toggle ON to view as client
4. Player names will anonymize, internal data will hide
5. Toggle OFF to return to admin view

### Document Generator
1. Open a Deal detail dialog
2. Click "Gerar Documento" button in header
3. Select template type (Teaser or CIM)
4. Click "Gerar Documento"
5. File will download automatically

---

## Future Enhancements

Potential improvements for future iterations:
- Email notifications for Q&A activity
- Document templates customization
- PDF export option
- Bulk document generation
- Question threading/discussions
- Document version control
- Template variables/placeholders
- Export analytics for Q&A activity

---

## Maintenance Notes

### Q&A Module
- Questions and answers are stored in Spark KV store
- No backend API calls required
- Data persists in browser local storage

### Document Generator
- All generation happens client-side
- No server processing required
- Large documents may take a few seconds to generate

### Anonymization Toggle
- State resets on page refresh (by design for security)
- Does not affect actual data, only display
- Admin-only feature enforced by UI checks

---

## Support

For questions or issues related to these features, please contact the development team or create an issue in the repository.
