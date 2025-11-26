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
  
  return {
    id: field.field_id,
    type: fieldType,
    label: field.label,
    help: field.help_text || '',
    required: isRequired,
    options: options,
    defaultValue: field.default_value || '',
    validation: field.validation || '',
    skipToIfNo: field.skip_to_if_no || '',
    width: field.width || ''
  };
}

// Convert parsed fields to full template schema
export function createTemplateSchema(jobId, title, description, fields, helpDisplay = 'tooltip') {
  return {
    jobId: jobId,
    title: title,
    description: description,
    version: 1,
    helpDisplay: helpDisplay, // 'tooltip', 'inline', 'column'
    fields: fields,
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
    errors.push(`Duplicate field IDs: ${duplicates.join(', ')}`);
  }
  
  // Validate each field
  schema.fields.forEach((field, index) => {
    if (!field.id) errors.push(`Field ${index + 1}: Missing id`);
    if (!field.label) errors.push(`Field ${index + 1}: Missing label`);
    if (['dropdown', 'radio'].includes(field.type) && field.options.length === 0) {
      errors.push(`Field ${field.id}: dropdown/radio requires options`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// Generate example CSV template
export function getExampleCSV() {
  return `field_id,field_type,label,help_text,required,options,default_value,skip_to_if_no
q1,dropdown,Is there a referendum provision?,A referendum is a direct vote by citizens on a specific issue or law.,yes,Yes|No|Unknown,,q8
q2,dropdown,Type of referendum,Select the primary type of referendum allowed.,yes,Mandatory|Optional|Citizen-initiated,,
q3,number,Signature threshold (%),Percentage of electorate required to trigger referendum.,yes,,,
q4,radio,Constitutional basis?,Is the referendum explicitly mentioned in the constitution?,yes,Yes|No,,
q5,text,Relevant article/section,Citation of the legal provision (e.g. Art. 75),no,,,
q6,textarea,Brief description,Summarize the referendum mechanism in 2-3 sentences.,no,,,
q7,date,Date of adoption,When was this provision enacted?,no,,,
q8,textarea,Additional notes,Any other observations or comments.,no,,,`;
}
