// js/form-renderer-standard.js
// Bootstrap 5 form renderer for traditional vertical form layout

let formData = {}; // { fieldId: value, fieldId_note: value }
let hiddenFieldIds = new Set(); // Track fields hidden by conditional logic
let formContainer = null;
let currentFields = [];
let currentTemplate = null;
let onDataChangeCallback = null;
let isReadOnly = false;

// Initialize form with Bootstrap components
export function initializeForm(containerId, template, responseData = {}, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return null;
  }

  // Store references
  formContainer = container;
  currentFields = template.fields || [];
  currentTemplate = template;
  isReadOnly = options.readOnly || false;
  onDataChangeCallback = options.onDataChange || null;

  // Initialize form data with response data
  formData = { ...responseData };

  // Evaluate initial hidden fields based on conditional logic
  updateHiddenFields(currentFields, formData);

  // Clear container
  container.innerHTML = '';

  // Extract groups from fields
  const groups = extractGroups(currentFields);

  // Render form
  if (groups.length > 0) {
    // Render with accordion for grouped fields
    const accordion = renderAccordion(groups, currentFields, formData, isReadOnly);
    container.appendChild(accordion);

    // Render ungrouped fields (fields without group)
    const ungroupedFields = currentFields.filter(f => !f.group);
    if (ungroupedFields.length > 0) {
      const ungroupedContainer = document.createElement('div');
      ungroupedContainer.className = 'ungrouped-fields mt-3';
      ungroupedFields.forEach(field => {
        const fieldElement = renderField(field, formData[field.id], isReadOnly);
        ungroupedContainer.appendChild(fieldElement);
      });
      container.appendChild(ungroupedContainer);
    }
  } else {
    // No groups - render all fields in simple layout
    currentFields.forEach(field => {
      const fieldElement = renderField(field, formData[field.id], isReadOnly);
      container.appendChild(fieldElement);
    });
  }

  return container;
}

// Extract unique groups in order of first appearance
function extractGroups(fields) {
  const groupsSet = new Set();
  const groups = [];

  fields.forEach(field => {
    if (field.group && !groupsSet.has(field.group)) {
      groupsSet.add(field.group);
      groups.push(field.group);
    }
  });

  return groups;
}

// Render accordion structure for grouped fields
function renderAccordion(groups, fields, responseData, readOnly) {
  const accordion = document.createElement('div');
  accordion.className = 'accordion';
  accordion.id = 'formAccordion';

  groups.forEach((groupName, index) => {
    const groupFields = fields.filter(f => f.group === groupName);
    const completion = getGroupCompletion(groupName, groupFields, responseData);

    const item = document.createElement('div');
    item.className = 'accordion-item';

    const headerId = `heading-${index}`;
    const collapseId = `group-${index}`;

    // Accordion header
    const header = document.createElement('h2');
    header.className = 'accordion-header';
    header.id = headerId;

    const button = document.createElement('button');
    button.className = `accordion-button ${index > 0 ? 'collapsed' : ''}`;
    button.type = 'button';
    button.setAttribute('data-bs-toggle', 'collapse');
    button.setAttribute('data-bs-target', `#${collapseId}`);
    button.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');
    button.setAttribute('aria-controls', collapseId);

    const titleSpan = document.createElement('span');
    titleSpan.textContent = groupName;
    button.appendChild(titleSpan);

    // Completion badge
    const badge = document.createElement('span');
    badge.className = `completion-badge badge ${completion.complete ? 'bg-success' : 'bg-secondary'} ms-auto me-2`;
    badge.textContent = `${completion.filled}/${completion.total}`;
    badge.setAttribute('data-group', groupName);
    button.appendChild(badge);

    header.appendChild(button);
    item.appendChild(header);

    // Accordion body
    const collapseDiv = document.createElement('div');
    collapseDiv.id = collapseId;
    collapseDiv.className = `accordion-collapse collapse ${index === 0 ? 'show' : ''}`;
    collapseDiv.setAttribute('aria-labelledby', headerId);
    collapseDiv.setAttribute('data-bs-parent', '#formAccordion');

    const body = document.createElement('div');
    body.className = 'accordion-body';

    // Render fields in this group
    groupFields.forEach(field => {
      const fieldElement = renderField(field, responseData[field.id], readOnly);
      body.appendChild(fieldElement);
    });

    collapseDiv.appendChild(body);
    item.appendChild(collapseDiv);
    accordion.appendChild(item);
  });

  return accordion;
}

// Calculate completion for a group
function getGroupCompletion(groupName, groupFields, responseData) {
  let total = 0;
  let filled = 0;

  groupFields.forEach(field => {
    // Skip hidden fields
    if (hiddenFieldIds.has(field.id)) return;

    total++;
    const value = responseData[field.id];
    if (value !== null && value !== undefined && value !== '') {
      filled++;
    }
  });

  return {
    total,
    filled,
    complete: total > 0 && filled === total
  };
}

// Update completion badges for all groups
function updateCompletionBadges() {
  const groups = extractGroups(currentFields);

  groups.forEach(groupName => {
    const groupFields = currentFields.filter(f => f.group === groupName);
    const completion = getGroupCompletion(groupName, groupFields, formData);

    const badge = formContainer.querySelector(`.completion-badge[data-group="${groupName}"]`);
    if (badge) {
      badge.textContent = `${completion.filled}/${completion.total}`;
      badge.className = `completion-badge badge ${completion.complete ? 'bg-success' : 'bg-secondary'} ms-auto me-2`;
    }
  });
}

// Render a single field based on type
function renderField(field, value, readOnly) {
  const container = document.createElement('div');
  container.className = 'mb-3 form-field';
  container.dataset.fieldId = field.id;

  // Check if field should be hidden
  if (hiddenFieldIds.has(field.id)) {
    container.classList.add('d-none');
  }

  let inputElement;

  switch (field.type) {
    case 'text':
      inputElement = renderTextField(field, value, readOnly);
      break;
    case 'textarea':
      inputElement = renderTextAreaField(field, value, readOnly);
      break;
    case 'number':
      inputElement = renderNumberField(field, value, readOnly);
      break;
    case 'date':
      inputElement = renderDateField(field, value, readOnly);
      break;
    case 'dropdown':
      inputElement = renderDropdownField(field, value, readOnly);
      break;
    case 'radio':
      inputElement = renderRadioField(field, value, readOnly);
      break;
    default:
      inputElement = renderTextField(field, value, readOnly);
  }

  container.appendChild(inputElement);

  // Add notes field
  const notesElement = renderNotesField(field.id, formData[`${field.id}_note`], readOnly);
  container.appendChild(notesElement);

  return container;
}

// Render label with required indicator and help icon
function renderLabel(field) {
  const label = document.createElement('label');
  label.className = 'form-label';
  label.htmlFor = `field-${field.id}`;
  label.textContent = field.label;

  // Required indicator
  if (field.required) {
    const asterisk = document.createElement('span');
    asterisk.className = 'text-danger';
    asterisk.textContent = ' *';
    label.appendChild(asterisk);
  }

  // Help icon
  if (field.help && currentTemplate?.helpDisplay !== 'column') {
    const helpIcon = document.createElement('span');
    helpIcon.className = 'help-icon ms-2';
    helpIcon.innerHTML = 'ⓘ';
    helpIcon.title = field.help;
    helpIcon.style.cursor = 'help';

    // Bootstrap tooltip (if available) or simple title
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
      new bootstrap.Tooltip(helpIcon);
    }

    label.appendChild(helpIcon);
  }

  return label;
}

// Render text input field
function renderTextField(field, value, readOnly) {
  const wrapper = document.createElement('div');

  const label = renderLabel(field);
  wrapper.appendChild(label);

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'form-control';
  input.id = `field-${field.id}`;
  input.value = value || field.defaultValue || '';
  input.disabled = readOnly;

  input.oninput = () => {
    formData[field.id] = input.value;
    onFieldChange();
  };

  wrapper.appendChild(input);

  // Validation feedback
  const feedback = document.createElement('div');
  feedback.className = 'invalid-feedback';
  feedback.textContent = 'This field is required';
  wrapper.appendChild(feedback);

  return wrapper;
}

// Render textarea field
function renderTextAreaField(field, value, readOnly) {
  const wrapper = document.createElement('div');

  const label = renderLabel(field);
  wrapper.appendChild(label);

  const textarea = document.createElement('textarea');
  textarea.className = 'form-control';
  textarea.id = `field-${field.id}`;
  textarea.rows = 3;
  textarea.value = value || field.defaultValue || '';
  textarea.disabled = readOnly;

  textarea.oninput = () => {
    formData[field.id] = textarea.value;
    onFieldChange();
  };

  wrapper.appendChild(textarea);

  // Validation feedback
  const feedback = document.createElement('div');
  feedback.className = 'invalid-feedback';
  feedback.textContent = 'This field is required';
  wrapper.appendChild(feedback);

  return wrapper;
}

// Render number input field
function renderNumberField(field, value, readOnly) {
  const wrapper = document.createElement('div');

  const label = renderLabel(field);
  wrapper.appendChild(label);

  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'form-control';
  input.id = `field-${field.id}`;
  input.value = value || field.defaultValue || '';
  input.disabled = readOnly;

  // Set min/max constraints
  if (field.minValue !== null && field.minValue !== undefined) {
    input.min = field.minValue;
  }
  if (field.maxValue !== null && field.maxValue !== undefined) {
    input.max = field.maxValue;
  }

  input.oninput = () => {
    formData[field.id] = input.value;
    onFieldChange();
  };

  wrapper.appendChild(input);

  // Validation feedback
  const feedback = document.createElement('div');
  feedback.className = 'invalid-feedback';
  feedback.textContent = 'This field is required';
  wrapper.appendChild(feedback);

  return wrapper;
}

// Render date field (text input + calendar button)
function renderDateField(field, value, readOnly) {
  const wrapper = document.createElement('div');

  const label = renderLabel(field);
  wrapper.appendChild(label);

  const inputGroup = document.createElement('div');
  inputGroup.className = 'd-flex gap-2';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'form-control';
  input.id = `field-${field.id}`;
  input.placeholder = 'YYYY-MM-DD';
  input.value = value || field.defaultValue || '';
  input.disabled = readOnly;
  input.style.flex = '1';

  input.oninput = () => {
    formData[field.id] = input.value;
    onFieldChange();
  };

  // Calendar button
  const calendarBtn = document.createElement('button');
  calendarBtn.type = 'button';
  calendarBtn.className = 'btn btn-outline-secondary';
  calendarBtn.innerHTML = '📅';
  calendarBtn.disabled = readOnly;
  calendarBtn.title = 'Open date picker';

  // Hidden native date picker
  const nativePicker = document.createElement('input');
  nativePicker.type = 'date';
  nativePicker.style.position = 'absolute';
  nativePicker.style.opacity = '0';
  nativePicker.style.width = '0';
  nativePicker.style.height = '0';
  nativePicker.disabled = readOnly;

  calendarBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    nativePicker.showPicker?.() || nativePicker.click();
  };

  nativePicker.onchange = () => {
    input.value = nativePicker.value;
    formData[field.id] = nativePicker.value;
    onFieldChange();
  };

  inputGroup.appendChild(input);
  inputGroup.appendChild(calendarBtn);
  inputGroup.appendChild(nativePicker);

  wrapper.appendChild(inputGroup);

  // Validation feedback
  const feedback = document.createElement('div');
  feedback.className = 'invalid-feedback';
  feedback.textContent = 'This field is required';
  wrapper.appendChild(feedback);

  return wrapper;
}

// Render dropdown field
function renderDropdownField(field, value, readOnly) {
  const wrapper = document.createElement('div');

  const label = renderLabel(field);
  wrapper.appendChild(label);

  const select = document.createElement('select');
  select.className = 'form-select';
  select.id = `field-${field.id}`;
  select.disabled = readOnly;

  // Empty option
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = '-- Select --';
  select.appendChild(emptyOption);

  // Add options
  (field.options || []).forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    if (opt === (value || field.defaultValue)) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  select.onchange = () => {
    formData[field.id] = select.value;
    onFieldChange();
  };

  wrapper.appendChild(select);

  // Validation feedback
  const feedback = document.createElement('div');
  feedback.className = 'invalid-feedback';
  feedback.textContent = 'This field is required';
  wrapper.appendChild(feedback);

  return wrapper;
}

// Render radio field
function renderRadioField(field, value, readOnly) {
  const wrapper = document.createElement('div');

  const label = renderLabel(field);
  wrapper.appendChild(label);

  const radioGroup = document.createElement('div');
  radioGroup.className = 'd-flex flex-wrap gap-3';

  (field.options || []).forEach((opt, idx) => {
    const radioWrapper = document.createElement('div');
    radioWrapper.className = 'form-check form-check-inline';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.className = 'form-check-input';
    radio.name = `radio-${field.id}`;
    radio.id = `radio-${field.id}-${idx}`;
    radio.value = opt;
    radio.checked = opt === (value || field.defaultValue);
    radio.disabled = readOnly;

    radio.onchange = () => {
      formData[field.id] = opt;
      onFieldChange();
    };

    const radioLabel = document.createElement('label');
    radioLabel.className = 'form-check-label';
    radioLabel.htmlFor = radio.id;
    radioLabel.textContent = opt;

    radioWrapper.appendChild(radio);
    radioWrapper.appendChild(radioLabel);
    radioGroup.appendChild(radioWrapper);
  });

  wrapper.appendChild(radioGroup);

  // Validation feedback
  const feedback = document.createElement('div');
  feedback.className = 'invalid-feedback d-block';
  feedback.textContent = 'This field is required';
  feedback.style.display = 'none';
  wrapper.appendChild(feedback);

  return wrapper;
}

// Render notes field
function renderNotesField(fieldId, value, readOnly) {
  const wrapper = document.createElement('div');
  wrapper.className = 'field-notes mt-2';

  const label = document.createElement('label');
  label.className = 'form-label small text-muted';
  label.htmlFor = `field-${fieldId}-note`;
  label.textContent = 'Notes';
  wrapper.appendChild(label);

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'form-control form-control-sm';
  input.id = `field-${fieldId}-note`;
  input.placeholder = 'Optional notes';
  input.value = value || '';
  input.disabled = readOnly;

  input.oninput = () => {
    formData[`${fieldId}_note`] = input.value;
    onFieldChange();
  };

  wrapper.appendChild(input);

  return wrapper;
}

// Called when any field changes
function onFieldChange() {
  // Re-evaluate hidden fields based on new data
  updateHiddenFields(currentFields, formData);

  // Update UI to show/hide fields
  updateFieldVisibility();

  // Update completion badges
  updateCompletionBadges();

  // Call callback if provided
  if (onDataChangeCallback) {
    onDataChangeCallback(formData);
  }
}

// Update which fields should be hidden based on conditional logic
function updateHiddenFields(fields, responseData) {
  hiddenFieldIds.clear();

  const fieldMap = new Map(fields.map(f => [f.id, f]));

  for (const field of fields) {
    if (field.skipIf && field.skipToFieldId) {
      const currentValue = responseData[field.id] || '';

      // If skip condition is met, hide fields between this one and target
      if (currentValue === field.skipIf) {
        const targetField = fieldMap.get(field.skipToFieldId);
        if (targetField) {
          // Find indices
          const currentIndex = fields.findIndex(f => f.id === field.id);
          const targetIndex = fields.findIndex(f => f.id === field.skipToFieldId);

          // Hide all fields between current and target (exclusive)
          if (targetIndex > currentIndex) {
            for (let i = currentIndex + 1; i < targetIndex; i++) {
              hiddenFieldIds.add(fields[i].id);
            }
          }
        }
      }
    }
  }
}

// Update DOM to show/hide fields based on hiddenFieldIds
function updateFieldVisibility() {
  if (!formContainer) return;

  const fieldElements = formContainer.querySelectorAll('.form-field');
  fieldElements.forEach(element => {
    const fieldId = element.dataset.fieldId;
    if (hiddenFieldIds.has(fieldId)) {
      element.classList.add('d-none');
    } else {
      element.classList.remove('d-none');
    }
  });
}

// Force all inputs to sync (for compatibility with existing API)
export function syncAllInputs() {
  // In standard renderer, data is always synced via oninput/onchange
  // This function exists for API compatibility but is a no-op
  return;
}

// Extract response data from form
export function extractResponseData(fields) {
  // Data is already in formData object, but re-evaluate hidden fields
  if (fields) {
    updateHiddenFields(fields, formData);
  }

  return { ...formData };
}

// Validate form and return errors
export function validateForm(fields) {
  const errors = [];

  fields.forEach((field, index) => {
    // Skip fields hidden by conditional logic
    if (hiddenFieldIds.has(field.id)) return;

    // Check required fields
    if (field.required) {
      const value = formData[field.id];
      if (!value || value === '') {
        errors.push({
          row: index + 1,
          fieldId: field.id,
          label: field.label,
          message: 'This field is required'
        });

        // Add visual indicator
        const fieldElement = formContainer?.querySelector(`#field-${field.id}`);
        if (fieldElement) {
          fieldElement.classList.add('is-invalid');
          const feedback = fieldElement.parentElement.querySelector('.invalid-feedback');
          if (feedback) {
            feedback.style.display = 'block';
          }
        }
      } else {
        // Remove visual indicator if valid
        const fieldElement = formContainer?.querySelector(`#field-${field.id}`);
        if (fieldElement) {
          fieldElement.classList.remove('is-invalid');
          const feedback = fieldElement.parentElement.querySelector('.invalid-feedback');
          if (feedback) {
            feedback.style.display = 'none';
          }
        }
      }
    }

    // Validate number field min/max
    if (field.type === 'number') {
      const value = formData[field.id];
      if (value) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          if (field.minValue !== null && field.minValue !== undefined && numValue < field.minValue) {
            errors.push({
              row: index + 1,
              fieldId: field.id,
              label: field.label,
              message: `Value must be at least ${field.minValue}`
            });
          }
          if (field.maxValue !== null && field.maxValue !== undefined && numValue > field.maxValue) {
            errors.push({
              row: index + 1,
              fieldId: field.id,
              label: field.label,
              message: `Value must be at most ${field.maxValue}`
            });
          }
        }
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// Get Handsontable instance (returns null for this renderer)
export function getHotInstance() {
  return null;
}

// Destroy form and clean up
export function destroyForm() {
  if (formContainer) {
    formContainer.innerHTML = '';
  }

  formData = {};
  hiddenFieldIds.clear();
  formContainer = null;
  currentFields = [];
  currentTemplate = null;
  onDataChangeCallback = null;
  isReadOnly = false;
}
