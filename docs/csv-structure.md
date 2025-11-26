# CSV Template Structure Specification

**Version:** 3.0
**Last Updated:** 2025-01-26
**Breaking Changes:** Yes (not backward compatible with v2.x templates)

---

## Quick Reference

### Column Overview

| Column | Type | Required | Description | Example Values |
|--------|------|----------|-------------|----------------|
| `item_id` | number | optional | Numeric display order | 10, 20, 30, 100 |
| `field_id` | text | **required** | Unique identifier for this field | q1, doc_date, country_name |
| `field_type` | text | **required** | Type of input control | text, dropdown, radio, number, date, textarea |
| `label` | text | **required** | Display label shown to user | "Document Date", "Country Name" |
| `help_text` | text | optional | Help/tooltip text | "Enter date in YYYY-MM-DD format" |
| `required` | boolean | optional | Is field required? | yes, no, true, false, 1, 0 |
| `options` | text | conditional* | Pipe-separated choices | "Yes\|No\|Unknown" |
| `default_value` | text | optional | Default/pre-filled value | "Unknown", "2024" |
| `skip_if` | text | optional | Value that triggers conditional skip | "No", "None" |
| `skip_to_field_id` | text | optional | Field ID to jump to | q15, final_comments |
| `group` | text | optional | Section/group name for organization | "Basic Information", "Assessment" |
| `min_value` | number | optional | Minimum value for number fields | 0, -100, 1900 |
| `max_value` | number | optional | Maximum value for number fields | 100, 9999, 2100 |

\* Required for `dropdown` and `radio` field types

### Minimal Valid CSV

```csv
field_id,field_type,label
q1,text,Your Name
q2,dropdown,Country
```

---

## Field Types

### 1. text
**Single-line text input**

- **Purpose:** Short text responses (names, IDs, codes)
- **Validation:** None (unless min_value/max_value used for length - not currently supported)
- **Recommended for:** Names, IDs, short codes, single words

**Example:**
```csv
item_id,field_id,field_type,label,help_text,required
10,full_name,text,Full Name,Enter your complete legal name,yes
20,email,text,Email Address,,no
```

### 2. textarea
**Multi-line text input**

- **Purpose:** Longer text responses (paragraphs, descriptions, comments)
- **Rows:** Auto-sized (2 rows minimum)
- **Recommended for:** Comments, descriptions, explanations, notes

**Example:**
```csv
item_id,field_id,field_type,label,help_text,required
30,comments,textarea,Additional Comments,Provide any additional context,no
```

### 3. number
**Numeric input**

- **Purpose:** Numeric values, counts, percentages, years
- **Supports:** `min_value` and `max_value` constraints
- **Validation:** Client-side validation for range if min/max specified
- **Recommended for:** Ages, counts, percentages, years, scores

**Example:**
```csv
item_id,field_id,field_type,label,help_text,required,min_value,max_value
40,age,number,Age,Your age in years,yes,18,120
50,satisfaction,number,Satisfaction (1-10),Rate from 1 to 10,yes,1,10
60,year,number,Year,4-digit year,yes,1900,2100
```

### 4. date
**Date input with hybrid UI**

- **Format:** YYYY-MM-DD (ISO 8601)
- **UI:** Text input + calendar picker button
- **Recommended for:** Birth dates, document dates, event dates

**Example:**
```csv
item_id,field_id,field_type,label,help_text,required
70,doc_date,date,Document Date,Date document was created,yes
80,birth_date,date,Birth Date,,no
```

### 5. dropdown
**Select dropdown menu**

- **Purpose:** Single selection from predefined options
- **Requires:** `options` column with pipe-separated values
- **UI:** Standard HTML select element
- **Recommended for:** 3+ options, categorical data, yes/no/unknown

**Example:**
```csv
item_id,field_id,field_type,label,help_text,required,options
90,country,dropdown,Country,Select your country,yes,United States|Canada|Mexico|United Kingdom|Germany|France|Spain|Italy|Other
100,referendum,dropdown,Referendum exists?,Is there a referendum provision?,yes,Yes|No|Unknown
```

### 6. radio
**Radio button group**

- **Purpose:** Single selection from 2-6 options
- **Requires:** `options` column with pipe-separated values
- **UI:** Horizontal radio button group
- **Recommended for:** 2-6 options, binary choices, Likert scales
- **Limit:** Recommend max 6 options (UI space constraints)

**Example:**
```csv
item_id,field_id,field_type,label,help_text,required,options
110,agreement,radio,Level of agreement,How much do you agree?,yes,Strongly Agree|Agree|Neutral|Disagree|Strongly Disagree
120,yes_no,radio,Regular elections?,Are elections held regularly?,yes,Yes|No
```

---

## Column Specifications

### item_id (optional)
**Numeric display order**

- **Type:** Integer
- **Purpose:** Explicit ordering of fields (allows non-sequential numbering)
- **Validation:** Must be unique if provided
- **Behavior:**
  - If present: Fields sorted by `item_id` ascending
  - If missing: Uses CSV row order
  - Allows gaps (10, 20, 30) for future insertions

**Best Practice:** Use increments of 10 (10, 20, 30...) to allow inserting fields later (e.g., 15, 25)

**Example:**
```csv
item_id,field_id,field_type,label
10,q1,text,Question 1
20,q2,text,Question 2
30,q3,text,Question 3
```

Later you can insert:
```csv
item_id,field_id,field_type,label
10,q1,text,Question 1
15,q1a,text,Question 1a (NEW)
20,q2,text,Question 2
```

### field_id (required)
**Unique identifier**

- **Type:** Text string
- **Purpose:** Unique key for data storage and references
- **Validation:** Must be unique across entire template
- **Constraints:**
  - Recommended: lowercase, alphanumeric, underscores
  - No spaces or special characters (-, ., @, etc. discouraged)
  - Avoid reserved words: id, type, data, value, label

**Best Practices:**
- Descriptive: `doc_date` not `d1`
- Consistent naming: `q1`, `q2`, `q3` or `question_1`, `question_2`
- Prefixes for grouping: `demo_age`, `demo_gender`, `demo_education`

**Examples:**
- Good: `q1`, `doc_date`, `country_name`, `satisfaction_score`
- Avoid: `Q-1`, `doc.date`, `question 1`, `id`

### field_type (required)
**Input control type**

- **Type:** Text string (case-insensitive)
- **Valid Values:** `text`, `textarea`, `number`, `date`, `dropdown`, `radio`
- **Validation:** Must be one of the 6 valid types
- **Behavior:** Invalid types default to `text` with console warning

**Case Insensitive:**
- `TEXT`, `Text`, `text` all valid
- `DROPDOWN`, `Dropdown`, `dropdown` all valid

### label (required)
**Display text**

- **Type:** Text string
- **Purpose:** Shown to users as the question/field label
- **Best Practices:**
  - Clear and concise
  - Use question mark for questions ("Do you agree?")
  - Start with capital letter
  - Avoid abbreviations unless standard
  - Keep under 100 characters for readability

**Examples:**
- "What is your age?"
- "Country of residence"
- "Document Date"
- "Do you agree with this statement?"

### help_text (optional)
**Help/tooltip content**

- **Type:** Text string
- **Purpose:** Additional guidance shown as tooltip or help column
- **Display Modes:** Tooltip (default), Column, or Inline
- **Best Practices:**
  - Provide examples: "e.g., 2024-01-15"
  - Clarify format: "Enter in YYYY-MM-DD format"
  - Explain purpose: "This helps us understand..."
  - Keep concise (1-2 sentences)

**Examples:**
```csv
field_id,field_type,label,help_text
doc_id,text,Document ID,Format: COUNTRY-YEAR-###  (e.g. USA-2024-001)
birth_date,date,Birth Date,Enter in YYYY-MM-DD format
```

### required (optional)
**Field requirement flag**

- **Type:** Boolean
- **Valid Values:**
  - True: `yes`, `true`, `1` (case-insensitive)
  - False: `no`, `false`, `0`, empty, or any other value
- **Default:** false (optional)
- **Validation:** Required fields validated on form submission
- **UI Indicator:** Red asterisk (*) shown next to label

**Example:**
```csv
field_id,field_type,label,required
name,text,Full Name,yes
email,text,Email Address,no
age,number,Age,1
comments,textarea,Comments,false
```

### options (conditional)
**Choice list for dropdown/radio**

- **Type:** Pipe-separated text string
- **Required For:** `dropdown` and `radio` field types
- **Ignored For:** Other field types
- **Format:** `Option1|Option2|Option3`
- **Validation:** At least 1 option required for dropdown/radio
- **Processing:** Trimmed, empty options removed

**Best Practices:**
- Logical order: alphabetical, most-to-least common, yes/no/unknown
- Consistent casing: "Yes|No|Unknown" not "yes|NO|Unknown"
- Keep option text short (under 50 chars)
- Use "Other" or "Unknown" for catch-all

**Examples:**
```csv
field_id,field_type,label,options
answer,dropdown,Your Answer,Yes|No|Unknown
rating,radio,Rating,Excellent|Good|Fair|Poor
region,dropdown,Region,North America|South America|Europe|Asia|Africa|Oceania
```

**Escaping:** Pipe character (|) cannot be used within option text (no escape mechanism)

### default_value (optional)
**Pre-filled value**

- **Type:** Text string
- **Purpose:** Pre-populate field on form load
- **Behavior:**
  - For dropdowns/radio: Must match exact option value
  - For dates: Must be YYYY-MM-DD format
  - For numbers: Must be valid number
  - Invalid defaults ignored (field left empty)

**Example:**
```csv
field_id,field_type,label,options,default_value
answer,dropdown,Do you agree?,Yes|No|Unknown,Unknown
year,number,Year,,2024
country,dropdown,Country,USA|Canada|Mexico,USA
```

### skip_if (optional)
**Conditional logic trigger value**

- **Type:** Text string (exact match)
- **Purpose:** Value that triggers conditional skip to another field
- **Logic:** Simple equality check (case-sensitive)
- **Requires:** Must be used with `skip_to_field_id`
- **Behavior:** If field value equals `skip_if`, jump to `skip_to_field_id` and hide intervening fields

**Example:**
```csv
item_id,field_id,field_type,label,options,skip_if,skip_to_field_id
10,referendum,dropdown,Referendum exists?,Yes|No,No,q15
20,ref_type,dropdown,Type of referendum?,Mandatory|Optional,,,
30,ref_threshold,number,Signature threshold %,,,1,100
...
150,q15,textarea,Final comments,,
```

In this example, if user selects "No" for referendum, they skip directly to q15, bypassing ref_type and ref_threshold.

**Validation:**
- `skip_to_field_id` must reference valid `field_id` in template
- Circular dependencies not allowed (causes validation error)

### skip_to_field_id (optional)
**Conditional logic target**

- **Type:** Text string (must match existing `field_id`)
- **Purpose:** Field ID to jump to when `skip_if` condition met
- **Requires:** Must be used with `skip_if`
- **Validation:**
  - Referenced field_id must exist in template
  - Cannot create circular dependencies
  - Must reference a field with higher item_id (forward jumps only)

**Example:**
```csv
item_id,field_id,field_type,label,skip_if,skip_to_field_id
10,has_parliament,radio,Parliament exists?,No,q20
20,parliament_type,dropdown,Type of parliament,,,
30,parliament_seats,number,Number of seats,,,
40,q20,text,Country name,,
```

### group (optional)
**Section/group assignment**

- **Type:** Text string
- **Purpose:** Organize fields into collapsible sections
- **Behavior:**
  - Fields with same `group` value appear under that section header
  - Section headers auto-generated from unique group values
  - Sections are collapsible in UI
  - Collapse state preserved during session (not persisted)

**Display Order:** Groups appear in order of first occurrence

**Example:**
```csv
item_id,field_id,field_type,label,group
10,name,text,Full Name,Basic Information
20,age,number,Age,Basic Information
30,country,dropdown,Country,Basic Information
40,q1,radio,Question 1,Assessment
50,q2,radio,Question 2,Assessment
60,comments,textarea,Final Comments,
```

Renders as:
```
▼ Basic Information
  Full Name: [____]
  Age: [____]
  Country: [▼]

▼ Assessment
  Question 1: ◯ Option1 ◯ Option2
  Question 2: ◯ Option1 ◯ Option2

Final Comments: [________]
```

**Best Practices:**
- Consistent naming: "Basic Information" not "basic info" or "BASIC INFORMATION"
- Descriptive: "Demographics" not "Section 1"
- Keep short: Under 30 characters
- Capitalize first letters: "Work Environment" not "work environment"

### min_value (optional)
**Minimum value for number fields**

- **Type:** Number (integer or decimal)
- **Purpose:** Set lower bound for number field validation
- **Applies To:** `number` field type only
- **Validation:** Client-side validation on input
- **UI:** User prevented from entering values below minimum

**Example:**
```csv
field_id,field_type,label,min_value,max_value
age,number,Age,0,150
percentage,number,Percentage,0,100
year,number,Year,1900,2100
temperature,number,Temperature (°C),-273.15,1000
```

### max_value (optional)
**Maximum value for number fields**

- **Type:** Number (integer or decimal)
- **Purpose:** Set upper bound for number field validation
- **Applies To:** `number` field type only
- **Validation:** Client-side validation on input
- **UI:** User prevented from entering values above maximum

---

## Validation Rules

### Template-Level Validation

1. **Unique field_id**
   - Every `field_id` must be unique across entire template
   - Duplicate IDs cause validation error with list of duplicates
   - Error: "Duplicate field IDs found: q1, q2"

2. **Unique item_id (if provided)**
   - If any row has `item_id`, duplicates cause validation error
   - Null/empty item_id values allowed (multiple rows can have empty)
   - Error: "Duplicate item_id values found: 10, 20"

3. **Required columns present**
   - `field_id`, `field_type`, `label` must exist for every row
   - Missing required column causes validation error
   - Error: "Row 5 missing required column: field_id"

4. **Valid field_type**
   - Must be one of: text, textarea, number, date, dropdown, radio
   - Invalid types default to 'text' with console warning
   - Warning: "Invalid field type 'select' for field q1, defaulting to 'text'"

### Field-Level Validation

1. **Options for dropdown/radio**
   - `dropdown` and `radio` must have `options` column with at least 1 option
   - Empty options cause validation error
   - Error: "Field q1 (dropdown) requires options"

2. **Skip logic references**
   - If `skip_if` set, `skip_to_field_id` must reference valid field_id
   - Non-existent target causes validation error
   - Error: "Field q1 skip_to_field_id 'q99' does not exist"

3. **Circular dependencies**
   - Skip logic cannot create circular references
   - Circular dependency causes validation error
   - Error: "Circular skip dependency detected: q1 → q2 → q3 → q1"

4. **Min/max constraints**
   - `min_value` must be less than or equal to `max_value`
   - Constraint violation causes validation error
   - Error: "Field age: min_value (100) greater than max_value (18)"

---

## Complete Examples

### Example 1: Simple Survey

```csv
item_id,field_id,field_type,label,help_text,required,options,default_value,group
10,name,text,Full Name,Enter your complete legal name,yes,,,Demographics
20,age,number,Age,Your age in years,yes,,18,Demographics
30,country,dropdown,Country,Select your country of residence,yes,United States|Canada|United Kingdom|Australia|Other,,Demographics
40,satisfaction,radio,Overall Satisfaction,How satisfied are you?,yes,Very Satisfied|Satisfied|Neutral|Dissatisfied|Very Dissatisfied,,Feedback
50,comments,textarea,Additional Comments,Share any additional thoughts,no,,,Feedback
```

### Example 2: Conditional Logic

```csv
item_id,field_id,field_type,label,required,options,skip_if,skip_to_field_id,group
10,has_referendum,dropdown,Does country have referendum provision?,yes,Yes|No|Unknown,No,final_comments,Referendum
20,ref_type,dropdown,Type of referendum,yes,Mandatory|Optional|Citizen-initiated,,,Referendum
30,ref_threshold,number,Signature threshold (%),no,,,,,Referendum
40,final_comments,textarea,Final Comments,no,,,,
```

If user selects "No" for has_referendum, they skip directly to final_comments.

### Example 3: Number Constraints

```csv
item_id,field_id,field_type,label,required,min_value,max_value,group
10,year_founded,number,Year Founded,yes,1500,2024,Historical Data
20,population,number,Population (millions),yes,0.001,8000,Demographics
30,gdp_growth,number,GDP Growth (%),no,-20,50,Economics
```

### Example 4: Mixed Field Types

```csv
item_id,field_id,field_type,label,help_text,required,options,default_value,min_value,max_value,group
10,doc_id,text,Document ID,Format: COUNTRY-YEAR-###,yes,,,,,Metadata
20,doc_date,date,Document Date,Date created or published,yes,,,,,Metadata
30,doc_type,dropdown,Document Type,,yes,Policy Paper|Research Report|Legal Document|Press Release,,,,,Metadata
40,has_elections,radio,Regular elections held?,Are elections conducted regularly?,yes,Yes|No,,,No,elections_detail,Assessment
50,election_frequency,number,Election frequency (years),How often elections occur,no,,4,1,10,Assessment
60,elections_detail,dropdown,Election status detail,Provide more detail on elections,yes,Free and Fair|Somewhat Fair|Questionable|Not Free,,,,,Assessment
70,final_notes,textarea,Additional Notes,Any other relevant information,no,,,,,
```

---

## Migration Guide (v2.x → v3.0)

### Breaking Changes

1. **Section headers removed from CSV**
   - **Old:** Rows with `field_id` ending in `_header`
   - **New:** Use `group` column only
   - **Action:** Delete all `*_header` rows, assign `group` to related fields

2. **Skip logic columns renamed**
   - **Old:** `skip_to_if_no` column
   - **New:** `skip_if` + `skip_to_field_id` columns
   - **Action:** Split single column into two

3. **Removed columns**
   - `validation` - Deferred to future version
   - `width` - Not implemented, now removed
   - **Action:** Delete these columns if present

4. **New required column**
   - `item_id` - Optional but recommended
   - **Action:** Add column, number rows by 10s (10, 20, 30...)

### Migration Steps

**Step 1: Add item_id column**

Before:
```csv
field_id,field_type,label
q1,text,Question 1
q2,text,Question 2
```

After:
```csv
item_id,field_id,field_type,label
10,q1,text,Question 1
20,q2,text,Question 2
```

**Step 2: Remove header rows, add group**

Before:
```csv
field_id,field_type,label,group
sec1_header,text,=== SECTION 1 ===,
q1,text,Question 1,
q2,text,Question 2,
sec2_header,text,=== SECTION 2 ===,
q3,text,Question 3,
```

After:
```csv
item_id,field_id,field_type,label,group
10,q1,text,Question 1,Section 1
20,q2,text,Question 2,Section 1
30,q3,text,Question 3,Section 2
```

**Step 3: Update skip logic**

Before:
```csv
field_id,field_type,label,options,skip_to_if_no
q1,dropdown,Has referendum?,Yes|No,q10
```

After:
```csv
field_id,field_type,label,options,skip_if,skip_to_field_id
q1,dropdown,Has referendum?,Yes|No,No,q10
```

**Step 4: Add min/max for number fields (optional)**

Before:
```csv
field_id,field_type,label
age,number,Age
```

After:
```csv
field_id,field_type,label,min_value,max_value
age,number,Age,0,150
```

### Validation Checklist

After migration, verify:

- [ ] All `field_id` values are unique
- [ ] All `item_id` values are unique (no duplicates)
- [ ] No rows with `_header` suffix remain
- [ ] All fields have `group` assigned (if using sections)
- [ ] `skip_to_if_no` replaced with `skip_if` + `skip_to_field_id`
- [ ] `dropdown` and `radio` fields have `options`
- [ ] `skip_to_field_id` references valid `field_id`
- [ ] Number fields have `min_value`/`max_value` if needed
- [ ] Template validates without errors in admin panel

---

## Edge Cases

### Empty or Missing Columns

**Q: What if item_id is blank/empty?**
A: Row uses CSV row order for display position. Allowed.

**Q: What if help_text is empty?**
A: No help shown for that field. Valid.

**Q: What if default_value doesn't match options for dropdown?**
A: Default ignored, field starts empty. No error.

### Special Characters

**Q: Can field_id contain spaces?**
A: Not recommended. Use underscores: `doc_date` not `doc date`.

**Q: Can label contain quotes?**
A: Yes. CSV parser handles quoted fields correctly.

**Q: Can options contain pipe character?**
A: No. Pipe is the delimiter. No escape mechanism currently.

### Conditional Logic

**Q: Can multiple fields skip to the same target?**
A: Yes, valid. Multiple paths can converge.

**Q: Can skip_if be empty but skip_to_field_id set?**
A: No. Both must be set or both empty.

**Q: What if skip_to_field_id has lower item_id (backward jump)?**
A: Currently allowed, but not recommended (can create confusion).

### Groups

**Q: Can a field have no group?**
A: Yes. It appears outside any section header.

**Q: What if only some fields have groups?**
A: Grouped fields appear under headers, ungrouped fields appear standalone. Valid.

**Q: Can groups be nested (sub-groups)?**
A: No. Only one level of grouping supported.

---

## Best Practices Summary

1. **Use item_id with gaps (10, 20, 30)** - Easier to insert fields later
2. **Descriptive field_id names** - `doc_date` not `d1`
3. **Clear, concise labels** - Under 100 chars, use question mark for questions
4. **Helpful help_text** - Provide format examples and purpose
5. **Consistent option formatting** - "Yes|No|Unknown" not "yes|NO|unknown"
6. **Logical option order** - Alphabetical or most-to-least common
7. **Group related fields** - Use `group` for sections
8. **Validate skip logic** - Ensure no circular dependencies
9. **Set number constraints** - Use min/max for number fields
10. **Test after migration** - Upload and verify in admin panel

---

## Support

For questions or issues:
- Check this specification first
- Review examples in `templates/` directory
- Consult CLAUDE.md for implementation details
- Report bugs at: https://github.com/fmendez72/form-01/issues
