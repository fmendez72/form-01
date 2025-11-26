// js/form-renderer.js
// Dynamic form renderer using Handsontable

let hotInstance = null;
let collapsedGroups = new Set(); // Track which groups are collapsed

// Initialize Handsontable with template schema
export function initializeForm(containerId, template, responseData, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return null;
  }

  const { readOnly = false, onDataChange = null } = options;
  const helpDisplay = template.helpDisplay || 'tooltip';

  // Build columns configuration
  const columns = buildColumns(template, helpDisplay, readOnly);
  
  // Build data array from template fields
  const data = buildDataArray(template.fields, responseData);

  // Destroy existing instance
  if (hotInstance) {
    hotInstance.destroy();
  }

  // Create Handsontable instance
  hotInstance = new Handsontable(container, {
    data: data,
    columns: columns,
    colHeaders: buildColHeaders(helpDisplay),
    rowHeaders: true,
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation',
    stretchH: 'all',
    autoWrapRow: true,
    wordWrap: true,
    manualRowResize: true,
    manualColumnResize: true,
    contextMenu: false,
    readOnly: readOnly,
    hiddenRows: {
      rows: [],
      indicators: false
    },
    cells: function(row, col, prop) {
      const cellProperties = {};
      const rowData = this.instance.getSourceDataAtRow(row);

      // Check if row should be hidden
      if (isRowHidden(this.instance, row)) {
        cellProperties.className = 'hidden-row';
      }

      // Check if this is a group header row
      const isGroupHeader = rowData?.fieldId && rowData.fieldId.endsWith('_header');
      if (isGroupHeader) {
        cellProperties.readOnly = true;
        if (col > 0) {
          // Hide all columns after the first for header rows
          cellProperties.className = 'htDimmed group-header-hidden-cell';
        }
      } else {
        // Make label and help columns read-only for regular rows
        if (prop === 'label' || prop === 'help') {
          cellProperties.readOnly = true;
          cellProperties.className = 'htDimmed';
        }
      }

      return cellProperties;
    },
    afterChange: function(changes, source) {
      if (source !== 'loadData' && onDataChange) {
        const currentData = extractResponseData(template.fields);
        onDataChange(currentData);
      }
    },
    beforeRenderer: function(TD, row, col, prop, value, cellProperties) {
      // Hide rows that belong to collapsed groups
      const rowData = this.getSourceDataAtRow(row);
      if (rowData && rowData.group && !rowData.fieldId.endsWith('_header')) {
        if (collapsedGroups.has(rowData.group)) {
          TD.parentElement.style.display = 'none';
        } else {
          TD.parentElement.style.display = '';
        }
      }

      // Hide additional cells in group header rows
      const isGroupHeader = rowData?.fieldId && rowData.fieldId.endsWith('_header');
      if (isGroupHeader && col > 0) {
        TD.style.display = 'none';
      }
    }
  });

  return hotInstance;
}

// Build column configuration based on template
function buildColumns(template, helpDisplay, readOnly) {
  const columns = [
    {
      data: 'label',
      readOnly: true,
      width: 250,
      renderer: labelRenderer
    }
  ];

  // Add help column based on display mode
  if (helpDisplay === 'column') {
    columns.push({
      data: 'help',
      readOnly: true,
      width: 200,
      renderer: helpColumnRenderer
    });
  }

  // Answer column with dynamic cell types
  columns.push({
    data: 'answer',
    width: 200,
    renderer: answerRenderer,
    editor: false // We use custom rendering
  });

  // Notes column
  columns.push({
    data: 'note',
    width: 150,
    type: 'text',
    renderer: notesRenderer
  });

  return columns;
}

// Build column headers
function buildColHeaders(helpDisplay) {
  const headers = ['Question'];
  if (helpDisplay === 'column') {
    headers.push('Help');
  }
  headers.push('Answer', 'Notes');
  return headers;
}

// Build data array from template fields
function buildDataArray(fields, responseData = {}) {
  return fields.map(field => ({
    fieldId: field.id,
    label: field.label,
    help: field.help || '',
    type: field.type,
    options: field.options || [],
    required: field.required,
    group: field.group || '',
    answer: responseData[field.id] ?? field.defaultValue ?? '',
    note: responseData[`${field.id}_note`] ?? ''
  }));
}

// Custom renderer for label column (with tooltip help)
function labelRenderer(instance, td, row, col, prop, value, cellProperties) {
  Handsontable.renderers.TextRenderer.apply(this, arguments);

  const rowData = instance.getSourceDataAtRow(row);
  td.innerHTML = '';

  // Check if this is a group header row
  const isGroupHeader = rowData.fieldId && rowData.fieldId.endsWith('_header');

  if (isGroupHeader) {
    // Render as collapsible section header
    const groupName = rowData.group || rowData.fieldId;
    const isCollapsed = collapsedGroups.has(groupName);

    const headerDiv = document.createElement('div');
    headerDiv.className = 'group-header';
    headerDiv.style.cssText = `
      font-weight: bold;
      font-size: 1.1em;
      padding: 12px 8px;
      background: #f8f9fa;
      border-left: 4px solid #0d6efd;
      cursor: pointer;
      user-select: none;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    // Toggle icon
    const icon = document.createElement('span');
    icon.textContent = isCollapsed ? '▶' : '▼';
    icon.style.transition = 'transform 0.2s';
    headerDiv.appendChild(icon);

    // Label text (remove any existing arrow icons from the label)
    const labelText = document.createElement('span');
    labelText.textContent = value.replace(/^[▼▶]\s*/, '');
    headerDiv.appendChild(labelText);

    // Click handler to toggle collapse
    headerDiv.onclick = () => {
      toggleGroupCollapse(instance, groupName);
    };

    td.appendChild(headerDiv);
    td.colSpan = instance.countCols(); // Span across all columns
    td.style.padding = '0';

    // Make other cells in this row invisible
    cellProperties.className = 'group-header-cell';
  } else {
    // Regular field row
    const labelSpan = document.createElement('span');
    labelSpan.textContent = value;
    if (rowData.required) {
      labelSpan.innerHTML += ' <span class="text-danger">*</span>';
    }
    td.appendChild(labelSpan);

    // Add help icon if help text exists and not using column display
    const template = window.currentTemplate;
    if (rowData.help && template?.helpDisplay !== 'column') {
      const helpIcon = document.createElement('span');
      helpIcon.className = 'help-icon ms-2';
      helpIcon.innerHTML = 'ⓘ';
      helpIcon.title = rowData.help;
      helpIcon.style.cursor = 'pointer';
      helpIcon.style.color = '#6c757d';

      // Toggle tooltip on click
      helpIcon.onclick = (e) => {
        e.stopPropagation();
        showHelpTooltip(helpIcon, rowData.help);
      };

      td.appendChild(helpIcon);
    }

    td.style.whiteSpace = 'normal';
    td.style.verticalAlign = 'top';
    td.style.padding = '8px';
  }
}

// Custom renderer for help column
function helpColumnRenderer(instance, td, row, col, prop, value, cellProperties) {
  const rowData = instance.getSourceDataAtRow(row);
  const isGroupHeader = rowData?.fieldId && rowData.fieldId.endsWith('_header');

  if (isGroupHeader) {
    // Hide help column for group headers
    td.innerHTML = '';
    td.style.display = 'none';
    return;
  }

  td.innerHTML = '';
  td.style.whiteSpace = 'normal';
  td.style.fontSize = '0.85em';
  td.style.color = '#6c757d';
  td.style.padding = '8px';
  td.textContent = value || '';
}

// Custom renderer for answer column
function answerRenderer(instance, td, row, col, prop, value, cellProperties) {
  td.innerHTML = '';
  td.style.padding = '4px';

  const rowData = instance.getSourceDataAtRow(row);
  const isReadOnly = instance.getSettings().readOnly;

  // Check if this is a group header row
  const isGroupHeader = rowData.fieldId && rowData.fieldId.endsWith('_header');
  if (isGroupHeader) {
    // No answer input for group headers
    td.style.display = 'none';
    return;
  }

  let input;
  
  switch (rowData.type) {
    case 'dropdown':
      input = document.createElement('select');
      input.className = 'form-select form-select-sm';
      input.disabled = isReadOnly;
      
      // Add empty option
      const emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.textContent = '-- Select --';
      input.appendChild(emptyOpt);
      
      // Add options
      rowData.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if (opt === value) option.selected = true;
        input.appendChild(option);
      });
      
      input.onchange = () => {
        instance.setDataAtRowProp(row, 'answer', input.value);
      };
      break;
      
    case 'radio':
      input = document.createElement('div');
      input.className = 'd-flex flex-wrap gap-2';
      
      rowData.options.forEach((opt, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-check form-check-inline';
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.className = 'form-check-input';
        radio.name = `radio_${rowData.fieldId}`;
        radio.id = `radio_${rowData.fieldId}_${idx}`;
        radio.value = opt;
        radio.checked = opt === value;
        radio.disabled = isReadOnly;
        
        radio.onchange = () => {
          instance.setDataAtRowProp(row, 'answer', opt);
        };
        
        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = radio.id;
        label.textContent = opt;
        
        wrapper.appendChild(radio);
        wrapper.appendChild(label);
        input.appendChild(wrapper);
      });
      break;
      
    case 'textarea':
      input = document.createElement('textarea');
      input.className = 'form-control form-control-sm';
      input.rows = 2;
      input.value = value || '';
      input.disabled = isReadOnly;
      
      // Use input event for immediate updates
      input.oninput = () => {
        instance.setDataAtRowProp(row, 'answer', input.value);
      };
      break;
      
    case 'number':
      input = document.createElement('input');
      input.type = 'number';
      input.className = 'form-control form-control-sm';
      input.value = value || '';
      input.disabled = isReadOnly;
      
      // Use input event for immediate updates
      input.oninput = () => {
        instance.setDataAtRowProp(row, 'answer', input.value);
      };
      break;
      
    case 'date':
      // Create a container for date input with better UX
      input = document.createElement('div');
      input.className = 'd-flex align-items-center gap-2';
      
      const dateInput = document.createElement('input');
      dateInput.type = 'text';
      dateInput.className = 'form-control form-control-sm';
      dateInput.placeholder = 'YYYY-MM-DD';
      dateInput.value = value || '';
      dateInput.disabled = isReadOnly;
      dateInput.style.flex = '1';
      
      // Add date picker button
      const dateBtn = document.createElement('button');
      dateBtn.type = 'button';
      dateBtn.className = 'btn btn-outline-secondary btn-sm';
      dateBtn.innerHTML = '📅';
      dateBtn.disabled = isReadOnly;
      dateBtn.title = 'Open date picker';
      
      // Hidden native date picker
      const nativePicker = document.createElement('input');
      nativePicker.type = 'date';
      nativePicker.style.position = 'absolute';
      nativePicker.style.opacity = '0';
      nativePicker.style.width = '0';
      nativePicker.style.height = '0';
      nativePicker.disabled = isReadOnly;
      
      // Sync text input to data
      dateInput.oninput = () => {
        instance.setDataAtRowProp(row, 'answer', dateInput.value);
      };
      
      // Open native picker on button click
      dateBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        nativePicker.showPicker?.() || nativePicker.click();
      };
      
      // Sync native picker to text input
      nativePicker.onchange = () => {
        dateInput.value = nativePicker.value;
        instance.setDataAtRowProp(row, 'answer', nativePicker.value);
      };
      
      input.appendChild(dateInput);
      input.appendChild(dateBtn);
      input.appendChild(nativePicker);
      break;
      
    case 'text':
    default:
      input = document.createElement('input');
      input.type = 'text';
      input.className = 'form-control form-control-sm';
      input.value = value || '';
      input.disabled = isReadOnly;
      
      // Use input event for immediate updates
      input.oninput = () => {
        instance.setDataAtRowProp(row, 'answer', input.value);
      };
      break;
  }
  
  td.appendChild(input);
}

// Custom renderer for notes column
function notesRenderer(instance, td, row, col, prop, value, cellProperties) {
  const rowData = instance.getSourceDataAtRow(row);
  const isGroupHeader = rowData?.fieldId && rowData.fieldId.endsWith('_header');

  if (isGroupHeader) {
    // Hide notes column for group headers
    td.innerHTML = '';
    td.style.display = 'none';
    return;
  }

  // Default text renderer for regular rows
  Handsontable.renderers.TextRenderer.apply(this, arguments);
}

// Toggle group collapse/expand
function toggleGroupCollapse(instance, groupName) {
  if (collapsedGroups.has(groupName)) {
    collapsedGroups.delete(groupName);
  } else {
    collapsedGroups.add(groupName);
  }
  // Re-render the table
  instance.render();
}

// Check if a row should be hidden based on group collapse state
function isRowHidden(instance, row) {
  const rowData = instance.getSourceDataAtRow(row);
  if (!rowData || !rowData.group) return false;

  // Don't hide the header row itself
  if (rowData.fieldId && rowData.fieldId.endsWith('_header')) {
    return false;
  }

  // Hide if the group is collapsed
  return collapsedGroups.has(rowData.group);
}

// Show help tooltip
function showHelpTooltip(element, text) {
  // Remove existing tooltips
  document.querySelectorAll('.help-tooltip').forEach(t => t.remove());
  
  const tooltip = document.createElement('div');
  tooltip.className = 'help-tooltip';
  tooltip.textContent = text;
  tooltip.style.cssText = `
    position: absolute;
    background: #333;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    max-width: 300px;
    z-index: 1000;
    font-size: 0.85em;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  
  document.body.appendChild(tooltip);
  
  // Position tooltip
  const rect = element.getBoundingClientRect();
  tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
  tooltip.style.left = `${rect.left + window.scrollX}px`;
  
  // Close on click outside
  setTimeout(() => {
    document.addEventListener('click', function closeTooltip(e) {
      if (!tooltip.contains(e.target)) {
        tooltip.remove();
        document.removeEventListener('click', closeTooltip);
      }
    });
  }, 100);
}

// Force all inputs to sync their values to the data model
// This is important before saving/submitting to capture any unsaved edits
export function syncAllInputs() {
  if (!hotInstance) return;
  
  // Find all input elements in the Handsontable container
  const container = hotInstance.rootElement;
  const inputs = container.querySelectorAll('input, select, textarea');
  
  inputs.forEach(input => {
    // Trigger the input/change event to sync values
    if (input.tagName === 'SELECT') {
      input.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
}

// Extract response data from Handsontable
export function extractResponseData(fields) {
  if (!hotInstance) return {};
  
  const data = {};
  const sourceData = hotInstance.getSourceData();
  
  sourceData.forEach((row, index) => {
    const fieldId = row.fieldId;
    data[fieldId] = row.answer;
    if (row.note) {
      data[`${fieldId}_note`] = row.note;
    }
  });
  
  return data;
}

// Validate required fields
export function validateForm(fields) {
  if (!hotInstance) return { valid: true, errors: [] };
  
  // First sync all inputs to ensure we have latest data
  syncAllInputs();
  
  const errors = [];
  const sourceData = hotInstance.getSourceData();
  
  sourceData.forEach((row, index) => {
    if (row.required && !row.answer) {
      errors.push({
        row: index + 1,
        fieldId: row.fieldId,
        label: row.label,
        message: 'This field is required'
      });
    }
  });
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// Get Handsontable instance
export function getHotInstance() {
  return hotInstance;
}

// Destroy instance
export function destroyForm() {
  if (hotInstance) {
    hotInstance.destroy();
    hotInstance = null;
  }
}
