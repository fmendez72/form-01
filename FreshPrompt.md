# Implementation Prompt: Dual-View Form Renderer

## Context

You are working on a political data collection web app (form-01). The app currently uses Handsontable for form rendering, which works but provides a spreadsheet-like experience that isn't optimal for forms with 20-30+ fields. 

The goal is to add a traditional Bootstrap form renderer alongside the existing Handsontable renderer, allowing users to toggle between "Form View" (new) and "Table View" (existing).

## Background Information

**Read these files first (in order):**

1. `CLAUDE.md` - Complete project context, architecture, and technical specification for the new renderer
2. `js/form-renderer.js` - Existing Handsontable renderer (reference for API contract and conditional logic)
3. `docs/csv-structure.md` - Template field specification (field types, options, skip logic, groups)
4. `signin.html` - Where form rendering is invoked (see the `<script type="module">` section)
5. `css/styles.css` - Existing styles to maintain consistency

## What Needs to Be Done

### Phase 1: Create the Standard Form Renderer

Create `js/form-renderer-standard.js` that:

1. **Exports the same API** as `form-renderer.js`:
   ```javascript
   export function initializeForm(containerId, template, responseData, options = {});
   export function extractResponseData(fields);
   export function validateForm(fields);
   export function syncAllInputs();
   export function destroyForm();
   export function getHotInstance(); // return null
   ```

2. **Renders fields as Bootstrap 5 form components**:
   - text → `<input type="text" class="form-control">`
   - textarea → `<textarea class="form-control" rows="3">`
   - number → `<input type="number" class="form-control">` with min/max attributes
   - date → text input + calendar picker button (like existing renderer)
   - dropdown → `<select class="form-select">` with options
   - radio → horizontal radio group with `form-check-inline`

3. **Groups fields into Bootstrap Accordion sections**:
   - Fields with same `group` value go under one accordion item
   - Accordion items show completion indicator badge (e.g., "3/5 complete")
   - Fields without a group appear outside accordion (at top or bottom)

4. **Implements conditional logic (skip)**:
   - Reuse the `updateHiddenFields()` logic pattern from existing renderer
   - Hidden fields get `d-none` Bootstrap class
   - Re-evaluate on every field change

5. **Handles notes fields**:
   - Each field has an optional notes input below it
   - Notes stored as `fieldId_note` in response data

6. **Supports read-only mode**:
   - When `options.readOnly = true`, disable all inputs

7. **Calls `onDataChange` callback**:
   - When `options.onDataChange` provided, call it after field changes

### Phase 2: Integrate View Toggle in signin.html

1. **Add view toggle buttons** above the form:
   ```html
   <div class="btn-group btn-group-sm mb-3" role="group">
     <button type="button" class="btn btn-outline-primary active" id="formViewBtn">📝 Form View</button>
     <button type="button" class="btn btn-outline-primary" id="tableViewBtn">📊 Table View</button>
   </div>
   ```

2. **Import both renderers**:
   ```javascript
   import * as standardRenderer from './js/form-renderer-standard.js';
   import * as tableRenderer from './js/form-renderer.js';
   ```

3. **Implement toggle logic**:
   - Track current view in state variable
   - On toggle: extract current data, destroy current form, initialize with other renderer
   - Persist preference in `localStorage`
   - Default to "Form View"

4. **Update existing function calls** to use the active renderer

### Phase 3: Add CSS Styles

Add to `css/styles.css`:

```css
/* Standard Form Renderer */
.form-field {
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
}

.form-field:last-child {
  border-bottom: none;
}

/* Completion badges in accordion headers */
.accordion-button .completion-badge {
  font-weight: normal;
  font-size: 0.75em;
  margin-left: auto;
  margin-right: 8px;
}

.completion-badge.complete {
  background-color: var(--success-color);
}

/* Notes section styling */
.field-notes {
  margin-top: 8px;
}

.field-notes .form-label {
  font-size: 0.85em;
  color: var(--secondary-color);
}

/* View toggle */
.view-toggle {
  margin-bottom: 16px;
}

/* Help icon improvements */
.help-icon {
  cursor: help;
}
```

## Implementation Notes

### Conditional Logic Pattern

Copy this from `form-renderer.js` and adapt:

```javascript
let hiddenFieldIds = new Set();

function updateHiddenFields(fields, responseData) {
  hiddenFieldIds.clear();
  const fieldMap = new Map(fields.map(f => [f.id, f]));

  for (const field of fields) {
    if (field.skipIf && field.skipToFieldId) {
      const currentValue = responseData[field.id] || '';
      if (currentValue === field.skipIf) {
        const currentIndex = fields.findIndex(f => f.id === field.id);
        const targetIndex = fields.findIndex(f => f.id === field.skipToFieldId);
        if (targetIndex > currentIndex) {
          for (let i = currentIndex + 1; i < targetIndex; i++) {
            hiddenFieldIds.add(fields[i].id);
          }
        }
      }
    }
  }
}
```

### Field Rendering Example

```javascript
function renderTextField(field, value, isReadOnly) {
  const div = document.createElement('div');
  div.className = 'mb-3 form-field';
  div.dataset.fieldId = field.id;
  
  const label = document.createElement('label');
  label.className = 'form-label';
  label.htmlFor = `field-${field.id}`;
  label.textContent = field.label;
  
  if (field.required) {
    const asterisk = document.createElement('span');
    asterisk.className = 'text-danger';
    asterisk.textContent = ' *';
    label.appendChild(asterisk);
  }
  
  if (field.help) {
    const helpIcon = document.createElement('span');
    helpIcon.className = 'help-icon ms-1';
    helpIcon.textContent = 'ⓘ';
    helpIcon.title = field.help;
    label.appendChild(helpIcon);
  }
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'form-control';
  input.id = `field-${field.id}`;
  input.value = value || '';
  input.disabled = isReadOnly;
  
  input.oninput = () => {
    formData[field.id] = input.value;
    onFieldChange();
  };
  
  div.appendChild(label);
  div.appendChild(input);
  
  // Add notes field
  div.appendChild(renderNotesField(field.id, formData[`${field.id}_note`], isReadOnly));
  
  return div;
}
```

### Accordion Structure

```javascript
function renderAccordion(groups, fields, responseData, isReadOnly) {
  const accordion = document.createElement('div');
  accordion.className = 'accordion';
  accordion.id = 'formAccordion';
  
  groups.forEach((groupName, index) => {
    const groupFields = fields.filter(f => f.group === groupName);
    const completion = getGroupCompletion(groupName, groupFields, responseData);
    
    const item = document.createElement('div');
    item.className = 'accordion-item';
    
    item.innerHTML = `
      <h2 class="accordion-header">
        <button class="accordion-button ${index > 0 ? 'collapsed' : ''}" 
                type="button" 
                data-bs-toggle="collapse" 
                data-bs-target="#group-${index}">
          ${groupName}
          <span class="completion-badge badge ${completion.complete ? 'bg-success' : 'bg-secondary'}">
            ${completion.filled}/${completion.total}
          </span>
        </button>
      </h2>
      <div id="group-${index}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}">
        <div class="accordion-body"></div>
      </div>
    `;
    
    const body = item.querySelector('.accordion-body');
    groupFields.forEach(field => {
      body.appendChild(renderField(field, responseData[field.id], isReadOnly));
    });
    
    accordion.appendChild(item);
  });
  
  return accordion;
}
```

## Testing

After implementation, test with these scenarios:

1. **Basic rendering**: Load `simple-survey.csv` template, verify all field types render
2. **Conditional logic**: Load `conditional-form.csv`, test skip behavior
3. **Groups**: Load `grouped-likert.csv`, verify accordion sections
4. **Data persistence**: Fill form, save, reload, verify data restored
5. **View toggle**: Switch between Form/Table view, verify data preserved
6. **Validation**: Try to submit with missing required fields
7. **Read-only mode**: View a submitted response, verify fields disabled

## Success Criteria

- [ ] New form renderer works with all existing templates
- [ ] Data format identical between renderers (extractResponseData output matches)
- [ ] Conditional logic works correctly
- [ ] View toggle preserves all entered data
- [ ] Auto-save continues to work
- [ ] Submit workflow unchanged
- [ ] No changes needed to Firestore data model
- [ ] No changes needed to admin panel

## Files to Create/Modify

| File | Action |
|------|--------|
| `js/form-renderer-standard.js` | CREATE - new Bootstrap form renderer |
| `signin.html` | MODIFY - add view toggle, import both renderers |
| `css/styles.css` | MODIFY - add styles for new form components |
| `CLAUDE.md` | MODIFY - update implementation status checkboxes |

## Do NOT Change

- `js/form-renderer.js` - keep existing Handsontable renderer as-is
- `js/firestore-service.js` - data model unchanged
- `admin.html` - admin panel unchanged
- Template CSV format - no changes
- Firestore collections/documents - no changes
