// js/template-parser.js
// CSV to JSON template parser

// Parse CSV string to array of objects
export function parseCSV(csvString) {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have header row and at least one data row');
  }

  // Parse header row
  const headers = parseCSVRow(lines[0]).map(h => h.trim().toLowerCase());
  
  // Required columns
  const requiredColumns = ['field_id', 'field_type', 'label'];
  for (const col of requiredColumns) {
    if (!headers.includes(col)) {
      throw new Error(`Missing required column: ${col}`);
    }
  }

  // Parse data rows
  const fields = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    const values = parseCSVRow(line);
    const field = {};
    
    headers.forEach((header, index) => {
      field[header] = values[index]?.trim() || '';
    });
    
    // Validate and transform field
    const transformedField = transformField(field, i);
    if (transformedField) {
      fields.push(transformedField);
    }
  }

  return fields;
}

// Parse a single CSV row, handling quoted fields
function parseCSVRow(row) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    const nextChar = row[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  
  return result;
}

// Transform and validate a field object
function transformField(field, rowNum) {
  const validTypes = ['text', 'textarea', 'dropdown', 'radio', 'number', 'date'];

  // Validate field_type
  const fieldType = field.field_type?.toLowerCase();
  if (!validTypes.includes(fieldType)) {
    console.warn(`Row ${rowNum + 1}: Invalid field_type "${field.field_type}", defaulting to "text"`);
    field.field_type = 'text';
  }

  // Parse options for dropdown/radio
  let options = [];
  if (field.options) {
    options = field.options.split('|').map(o => o.trim()).filter(o => o);
  }

  // Parse required field
  const requiredValues = ['yes', 'true', '1'];
  const isRequired = requiredValues.includes(field.required?.toLowerCase());

  // Parse item_id (numeric or empty)
  const itemId = field.item_id ? parseInt(field.item_id, 10) : null;

  // Parse min/max values for number fields
  const minValue = field.min_value ? parseFloat(field.min_value) : null;
  const maxValue = field.max_value ? parseFloat(field.max_value) : null;

  return {
    id: field.field_id,
    type: fieldType,
    label: field.label,
    help: field.help_text || '',
    required: isRequired,
    options: options,
    defaultValue: field.default_value || '',
    skipIf: field.skip_if || '',
    skipToFieldId: field.skip_to_field_id || '',
    group: field.group || '',
    itemId: itemId,
    minValue: minValue,
    maxValue: maxValue
  };
}

// Convert parsed fields to full template schema
export function createTemplateSchema(jobId, title, description, fields, helpDisplay = 'tooltip') {
  // Sort fields by itemId (if present), otherwise maintain CSV order
  const sortedFields = [...fields].sort((a, b) => {
    // If both have itemId, sort by itemId
    if (a.itemId !== null && b.itemId !== null) {
      return a.itemId - b.itemId;
    }
    // If only one has itemId, it comes first
    if (a.itemId !== null) return -1;
    if (b.itemId !== null) return 1;
    // If neither has itemId, maintain original order
    return 0;
  });

  // Extract unique groups in order of first appearance
  const groups = [];
  const seenGroups = new Set();
  for (const field of sortedFields) {
    if (field.group && !seenGroups.has(field.group)) {
      groups.push(field.group);
      seenGroups.add(field.group);
    }
  }

  return {
    jobId: jobId,
    title: title,
    description: description,
    version: 1,
    helpDisplay: helpDisplay, // 'tooltip', 'inline', 'column'
    fields: sortedFields,
    groups: groups,
    createdAt: new Date().toISOString(),
    status: 'active'
  };
}

// Validate template schema
export function validateTemplateSchema(schema) {
  const errors = [];

  if (!schema.jobId) errors.push('Missing jobId');
  if (!schema.title) errors.push('Missing title');
  if (!schema.fields || schema.fields.length === 0) errors.push('No fields defined');

  // Check for duplicate field IDs
  const fieldIds = schema.fields.map(f => f.id);
  const duplicates = fieldIds.filter((id, index) => fieldIds.indexOf(id) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate field IDs: ${[...new Set(duplicates)].join(', ')}`);
  }

  // Check for duplicate item_ids (ignoring nulls)
  const itemIds = schema.fields.map(f => f.itemId).filter(id => id !== null);
  const duplicateItems = itemIds.filter((id, index) => itemIds.indexOf(id) !== index);
  if (duplicateItems.length > 0) {
    errors.push(`Duplicate item_id values: ${[...new Set(duplicateItems)].join(', ')}`);
  }

  // Build field ID map for skip logic validation
  const fieldIdMap = new Set(fieldIds);

  // Validate each field
  schema.fields.forEach((field, index) => {
    if (!field.id) errors.push(`Field ${index + 1}: Missing id`);
    if (!field.label) errors.push(`Field ${index + 1}: Missing label`);

    // Validate dropdown/radio options
    if (['dropdown', 'radio'].includes(field.type) && field.options.length === 0) {
      errors.push(`Field ${field.id}: dropdown/radio requires options`);
    }

    // Validate skip logic
    if (field.skipIf && !field.skipToFieldId) {
      errors.push(`Field ${field.id}: skip_if requires skip_to_field_id`);
    }
    if (field.skipToFieldId && !field.skipIf) {
      errors.push(`Field ${field.id}: skip_to_field_id requires skip_if`);
    }
    if (field.skipToFieldId && !fieldIdMap.has(field.skipToFieldId)) {
      errors.push(`Field ${field.id}: skip_to_field_id '${field.skipToFieldId}' does not exist`);
    }

    // Validate min/max for number fields
    if (field.minValue !== null && field.maxValue !== null && field.minValue > field.maxValue) {
      errors.push(`Field ${field.id}: min_value (${field.minValue}) greater than max_value (${field.maxValue})`);
    }
  });

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// Generate example CSV template
export function getExampleCSV() {
  return `item_id,field_id,field_type,label,help_text,required,options,default_value,skip_if,skip_to_field_id,group,min_value,max_value
10,country_name,text,Country Name,Enter the official country name,yes,,,,,Basic Information,,
20,has_referendum,radio,Referendum provision exists?,Is there a referendum mechanism?,yes,Yes|No,,No,final_notes,Basic Information,,
30,ref_type,dropdown,Type of Referendum,Select primary type,yes,Mandatory|Optional|Citizen-initiated,,,,,Basic Information,,
40,threshold,number,Signature Threshold (%),Percentage of voters required,no,,,,,Basic Information,0,100
50,final_notes,textarea,Final Notes,Additional observations,no,,,,,,,`;
}
