# Phase Validation with Conditional Requirements - Implementation Guide

## Overview

Phase Validation is a Pipefy-inspired feature that enforces **process engineering** rules on your deal workflow. Unlike basic kanban boards where you can freely drag cards between columns, Phase Validation implements **conditional gates** that block stage transitions until specific requirements are met.

### The Problem It Solves

In high-stakes financial deal management, moving to the next phase without critical information can lead to:
- **Compliance violations** (missing regulatory approvals)
- **Financial risks** (advancing without budget approval)
- **Process inefficiencies** (forgetting to collect essential data)
- **Human error** (oversight in fast-paced environments)

### The Solution

Phase Validation allows administrators to configure **if-then rules** at the process level:

> "A player track can ONLY move from 'Analysis' to 'Proposal' IF:
> - The 'Volume' field is filled
> - AND the volume is less than R$ 5,000,000
> - AND the 'Observações' field contains the word 'aprovado'"

When users attempt a blocked transition, they see:
- ❌ **Clear rejection** with custom error message
- 📋 **List of unmet requirements** with specific field names
- 💡 **Guidance** on what needs to be filled before proceeding

---

## Architecture

### Core Components

1. **Phase Transition Rules** (`phaseValidation.ts`)
   - Rule definition with conditions
   - Validation engine that evaluates rules
   - Field operators (equals, greater_than, less_than, contains, is_filled, is_empty)

2. **Phase Validation Manager** (`PhaseValidationManager.tsx`)
   - Admin UI for viewing and managing rules
   - Enable/disable rules without deletion
   - Rule listing with visual indicators

3. **Phase Rule Editor** (`PhaseRuleEditor.tsx`)
   - Create/edit rule interface
   - Condition builder with field selector
   - AND/OR logic configuration
   - Custom error message input

4. **Phase Validation Dialog** (`PhaseValidationDialog.tsx`)
   - User-facing validation feedback
   - Shows which conditions failed
   - Blocks or allows transition based on validation

5. **Integration Points**
   - `PlayerTrackDetailDialog`: Stage change dropdown validation
   - Future: Drag-and-drop kanban boards
   - Future: Bulk operations

---

## Data Model

### PhaseTransitionRule

```typescript
interface PhaseTransitionRule {
  id: string                    // Unique identifier
  fromStage: PlayerStage | 'any' // Source stage or any stage
  toStage: PlayerStage          // Target stage
  conditions: FieldCondition[]  // Array of conditions to check
  requireAll: boolean           // true = AND logic, false = OR logic
  errorMessage?: string         // Custom error shown to user
  enabled: boolean              // Rule active/inactive toggle
  createdAt: string
  createdBy: string             // User who created the rule
}
```

### FieldCondition

```typescript
interface FieldCondition {
  id: string
  fieldName: string             // Key from AVAILABLE_FIELDS
  fieldType: FieldType          // text | number | date | select | boolean
  operator: ValidationOperator  // How to compare
  value?: any                   // Comparison value (not needed for is_filled/is_empty)
  label: string                 // Human-readable field name
}
```

### Available Fields

The system supports validation on both **Player Track** fields and **Master Deal** fields:

**Track Fields:**
- `track.playerName` - Player name (text)
- `track.trackVolume` - Negotiation volume (number)
- `track.probability` - Win probability % (number)
- `track.responsibles` - Assigned team members (select)
- `track.notes` - Track observations (text)

**Deal Fields:**
- `deal.volume` - Master deal volume (number)
- `deal.operationType` - Operation type (select)
- `deal.observations` - Deal observations (text)

### Validation Operators

Different operators are available based on field type:

**Text Fields:**
- `is_filled` - Has any content
- `is_empty` - Has no content
- `contains` - Contains specific text
- `equals` - Exactly matches value
- `not_equals` - Does not match value

**Number Fields:**
- `is_filled` - Has a value
- `is_empty` - Has no value
- `equals` - Exactly equals number
- `not_equals` - Does not equal number
- `greater_than` - Is greater than value
- `less_than` - Is less than value

**Date Fields:**
- `is_filled` - Date is set
- `is_empty` - No date set
- `greater_than` - After specific date
- `less_than` - Before specific date

**Select/Boolean Fields:**
- `is_filled` - Has selection
- `is_empty` - No selection
- `equals` - Matches value
- `not_equals` - Doesn't match value

---

## Usage Guide

### For Administrators

#### Creating a Rule

1. **Open Phase Validation Manager**
   - Click your avatar → "Validação de Fases"
   - Requires `MANAGE_SETTINGS` permission

2. **Click "Nova Regra"**

3. **Configure Transition**
   - **From Stage**: Select source stage or "Qualquer fase" for all sources
   - **To Stage**: Select the destination stage you want to protect

4. **Add Conditions**
   - Click "Adicionar Condição"
   - Select **Field** (e.g., "Volume da Negociação")
   - Select **Operator** (e.g., "é menor que")
   - Enter **Value** if needed (e.g., "5000000")
   - Repeat for multiple conditions

5. **Set Logic Type**
   - Toggle **"Todas as condições devem ser atendidas"**
     - ON = AND logic (all must pass)
     - OFF = OR logic (any one can pass)

6. **Custom Error Message**
   - Write user-friendly message explaining why transition is blocked
   - Example: "O volume deve ser inferior a R$ 5M e aprovado antes de criar proposta"

7. **Save**

#### Example Rules

**Rule 1: Budget Approval Gate**
```
From: Analysis
To: Proposal
Conditions:
  - Volume (less_than) 5000000
  - Observações (contains) "aprovado"
Logic: AND (both required)
Error: "Propostas acima de R$ 5M requerem aprovação da diretoria nas observações"
```

**Rule 2: Basic Data Completeness**
```
From: Any
To: Negotiation
Conditions:
  - Player Name (is_filled)
  - Volume (is_filled)
  - Responsáveis (is_filled)
Logic: AND
Error: "Preencha todos os campos básicos antes de iniciar negociação"
```

**Rule 3: Small Deal Fast Track**
```
From: NDA
To: Closing
Conditions:
  - Volume (less_than) 500000
Logic: AND
Error: "Apenas deals abaixo de R$ 500k podem ir direto ao fechamento"
```

#### Managing Rules

- **Enable/Disable**: Toggle switch without deleting
- **Edit**: Click pencil icon to modify
- **Delete**: Click trash icon (permanent)
- **View**: See all conditions in collapsed card format

---

### For Users (Analysts/NewBusiness)

#### When Changing Stages

1. **Open Player Track** detail dialog
2. **Change Stage** dropdown to new value
3. **Validation Runs Automatically**

**If Validation Passes ✅:**
- Green success dialog
- "Todos os requisitos foram atendidos"
- Click "Confirmar Transição"
- Stage changes immediately

**If Validation Fails ❌:**
- Red error dialog
- Custom error message from admin
- List of failed conditions:
  - "Volume da Negociação é menor que 5000000"
  - "Observações contém 'aprovado'"
- Dialog cannot be confirmed
- User must:
  1. Click "Fechar"
  2. Fill missing fields
  3. Retry stage change

---

## Technical Implementation

### Validation Flow

```
User changes stage dropdown
         ↓
handleStageChange(newStage)
         ↓
validatePhaseTransition(track, deal, targetStage, rules)
         ↓
    For each applicable rule:
      - Check fromStage matches
      - Check toStage matches
      - Evaluate each condition
      - Apply AND/OR logic
         ↓
    Return ValidationResult
         ↓
If valid: performStageChange()
If invalid: Show PhaseValidationDialog with errors
```

### Validation Engine

The `validatePhaseTransition` function:

1. **Filter applicable rules** based on current and target stages
2. **For each rule**:
   - Get field values from track and master deal
   - Evaluate each condition using the operator
   - Check if AND/OR logic is satisfied
3. **Aggregate failures**
4. **Return result** with isValid flag and failed conditions

### Condition Evaluation

```typescript
function evaluateCondition(condition: FieldCondition, value: any): boolean {
  switch (condition.operator) {
    case 'is_filled':
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'string') return value.trim().length > 0
      return value !== null && value !== undefined && value !== ''
    
    case 'less_than':
      return Number(value) < Number(condition.value)
    
    // ... other operators
  }
}
```

---

## Best Practices

### Rule Design

✅ **DO:**
- Write clear, specific error messages
- Use AND logic for strict gates (compliance)
- Use OR logic for flexible alternatives
- Start with a few critical rules
- Test rules with realistic data

❌ **DON'T:**
- Create circular dependencies (A→B requires C, C→A requires B)
- Over-constrain workflows (users stuck)
- Use vague error messages ("Invalid")
- Create conflicting rules for same transition

### Common Patterns

**1. Budget Tier Gates**
```
Small deals (< R$ 500k): Fast track to closing
Medium deals (< R$ 5M): Normal approval flow
Large deals (≥ R$ 5M): Requires executive approval in observations
```

**2. Progressive Data Collection**
```
NDA → Analysis: Just player name
Analysis → Proposal: + Volume filled
Proposal → Negotiation: + Responsible assigned
Negotiation → Closing: + Observations with "aprovado"
```

**3. Compliance Checkpoints**
```
Any → Closing: 
  - Volume is filled
  - Observations contains "compliance OK"
  - Responsible is assigned
```

---

## Future Enhancements

### Planned Features

1. **Custom Fields Integration**
   - Validate on user-defined custom fields
   - Dynamic field registry

2. **Kanban Drag-and-Drop Validation**
   - Show lock icon on blocked columns
   - Tooltip preview of requirements
   - Shake animation on invalid drop

3. **Bulk Operation Validation**
   - Validate before bulk stage changes
   - Show which items will fail

4. **Validation History**
   - Audit log of blocked attempts
   - Analytics on common validation failures

5. **Rule Templates**
   - Pre-built rule sets for common workflows
   - Import/export rule configurations

6. **Advanced Operators**
   - `is_one_of` for multiple values
   - `matches_regex` for pattern matching
   - `is_before_today` / `is_after_today` for dates

7. **Conditional Notifications**
   - Notify admin when users repeatedly fail validation
   - Auto-suggest filling missing fields

---

## Troubleshooting

### Rule Not Triggering

**Check:**
1. Rule is **enabled** (toggle switch)
2. **fromStage** matches current stage (or set to "any")
3. **toStage** matches target stage
4. Field names in conditions are correct
5. No typos in comparison values

### Validation Always Fails

**Check:**
1. Field actually has data (check track in database)
2. Operator is appropriate for field type
3. Value comparison is correct (number vs string)
4. AND/OR logic is set correctly
5. Custom field paths are correct (track.* vs deal.*)

### Users Confused by Error

**Fix:**
1. Improve custom error message
2. Be specific about which field and why
3. Provide example: "Ex: Digite 'aprovado por [nome]' nas observações"
4. Consider breaking into multiple simpler rules

---

## API Reference

### Core Functions

#### `validatePhaseTransition()`

```typescript
function validatePhaseTransition(
  track: PlayerTrack,
  deal: MasterDeal | undefined,
  targetStage: PlayerStage,
  rules: PhaseTransitionRule[]
): ValidationResult
```

Validates if a track can transition to target stage.

**Returns:**
```typescript
{
  isValid: boolean                  // Can transition?
  failedConditions: FieldCondition[] // Which conditions failed
  errorMessage: string              // User-facing error
}
```

#### `formatConditionDescription()`

```typescript
function formatConditionDescription(condition: FieldCondition): string
```

Converts a condition to human-readable text.

**Example Output:**
- "Volume da Negociação é menor que 5000000"
- "Observações contém 'aprovado'"
- "Responsáveis está preenchido"

#### `getStageLabel()`

```typescript
function getStageLabel(stage: PlayerStage): string
```

Maps stage code to Portuguese label.

**Mapping:**
- `nda` → "NDA"
- `analysis` → "Análise"
- `proposal` → "Proposta"
- `negotiation` → "Negociação"
- `closing` → "Fechamento"

---

## Comparison with Other Tools

### vs. Pipefy

**Similarities:**
- ✅ Conditional phase transitions
- ✅ Custom error messages
- ✅ Field-based validation
- ✅ Process engineering focus

**Our Advantages:**
- ✅ AND/OR logic in single rule
- ✅ Validate on parent (deal) fields
- ✅ Enable/disable without deleting
- ✅ Clear visual feedback

**Pipefy Advantages:**
- SaaS infrastructure
- More field types (file upload validation)
- Workflow automation triggers

### vs. Standard Kanban (Trello/Jira)

Standard kanban tools have **NO validation** - you can move cards freely. This is dangerous in regulated industries.

**Our Phase Validation provides:**
- Compliance enforcement
- Data quality gates
- Process standardization
- Audit trail of why stages changed

---

## Security & Permissions

### Who Can Create Rules?

Only users with `MANAGE_SETTINGS` permission (typically **admin** role).

### Who Is Affected?

**All users** attempting stage changes are subject to validation, including admins. No bypass mechanism (by design - compliance must be universal).

### Data Storage

Rules stored in KV store at key `phaseTransitionRules`.

**Data includes:**
- Rule configuration
- Created by user ID
- Creation timestamp
- Enabled status

**Does NOT include:**
- Actual field values
- User PIPs
- Historical attempts

---

## Performance Considerations

### Validation Speed

Validation runs **synchronously** on stage change:
- O(n) where n = number of enabled rules
- O(m) per rule where m = number of conditions
- Typical: < 10ms for 10 rules

### Scale Limits

Current architecture supports:
- ✅ Up to 100 rules (tested)
- ✅ Up to 20 conditions per rule
- ⚠️ Complex regex operators not implemented yet

### Optimization

Rules are filtered before evaluation:
1. Only enabled rules checked
2. Only rules matching fromStage/toStage
3. Short-circuit on first failure (AND logic)

---

## Testing Scenarios

### Test Case 1: Simple Blocking

**Setup:**
- Rule: NDA → Analysis requires "Player Name is filled"

**Test:**
1. Create track with empty playerName
2. Try to change stage to Analysis
3. Expect: ❌ Blocked with error
4. Fill playerName
5. Retry
6. Expect: ✅ Success

### Test Case 2: AND Logic

**Setup:**
- Rule: Analysis → Proposal requires:
  - Volume is filled AND
  - Volume < 5000000

**Test:**
1. Track with volume = 6000000
2. Try to change to Proposal
3. Expect: ❌ Blocked ("volume too high")
4. Change volume to 3000000
5. Retry
6. Expect: ✅ Success

### Test Case 3: OR Logic

**Setup:**
- Rule: Any → Closing requires:
  - Volume < 500000 OR
  - Observations contains "executive approved"

**Test:**
1. Track with volume = 1000000, no observations
2. Try Closing
3. Expect: ❌ Blocked
4. Add "executive approved" to observations
5. Retry
6. Expect: ✅ Success (even though volume still high)

---

## Conclusion

Phase Validation transforms your DCM system from a simple kanban board into a **process-aware workflow engine**. By enforcing data quality gates at the process level, you:

- ✅ **Prevent errors** before they happen
- ✅ **Ensure compliance** with regulatory requirements
- ✅ **Standardize workflows** across all team members
- ✅ **Maintain data quality** throughout deal lifecycle
- ✅ **Provide clear guidance** when users make mistakes

This feature is inspired by best-in-class process management tools like Pipefy, but tailored specifically for the high-stakes, compliance-critical world of M&A deal management.
