const fs = require('fs');
const { parse } = require('csv-parse/sync');

const csvContent = fs.readFileSync('instructions/employee-sheet.csv', 'utf-8');
const records = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });

console.log('Total records:', records.length);

// Analyze numeric fields that might have text
const numericFields = ['basic', 'hra', 'ncwa_basic'];
const issues = {
  invalidNumeric: {},
  invalidDates: {},
  missingRequired: [],
  duplicateEmpCodes: new Set()
};

// Check for duplicate emp_codes
const empCodes = new Set();
records.forEach(r => {
  if (empCodes.has(r.emp_code)) {
    issues.duplicateEmpCodes.add(r.emp_code);
  }
  empCodes.add(r.emp_code);
});

// Analyze each record
records.forEach((r, index) => {
  // Check numeric fields
  numericFields.forEach(field => {
    const value = r[field];
    if (value && value !== 'null' && value !== '') {
      // Check if it's not a valid number
      if (isNaN(parseFloat(value.replace(/[,]/g, '')))) {
        if (!issues.invalidNumeric[field]) {
          issues.invalidNumeric[field] = [];
        }
        issues.invalidNumeric[field].push({
          row: index + 2,
          empCode: r.emp_code,
          value: value
        });
      }
    }
  });
  
  // Check date fields
  const dateFields = ['dob', 'dt_appt', 'area_joining_date', 'grade_joining_date', 
                     'incr_date', 'expected_exit_date', 'company_posting_date'];
  dateFields.forEach(field => {
    const value = r[field];
    if (value && value !== 'null' && value !== '') {
      // Check if it matches expected date format
      if (!value.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        if (!issues.invalidDates[field]) {
          issues.invalidDates[field] = [];
        }
        issues.invalidDates[field].push({
          row: index + 2,
          empCode: r.emp_code,
          value: value
        });
      }
    }
  });
  
  // Check required fields
  if (!r.emp_code || !r.name) {
    issues.missingRequired.push({
      row: index + 2,
      empCode: r.emp_code || 'MISSING',
      name: r.name || 'MISSING'
    });
  }
});

// Report findings
console.log('\n=== DATA ISSUES ANALYSIS ===\n');

console.log('1. DUPLICATE EMPLOYEE CODES:', issues.duplicateEmpCodes.size);
if (issues.duplicateEmpCodes.size > 0) {
  console.log('   First 5 duplicates:', Array.from(issues.duplicateEmpCodes).slice(0, 5));
}

console.log('\n2. INVALID NUMERIC VALUES:');
Object.entries(issues.invalidNumeric).forEach(([field, items]) => {
  console.log(`   ${field}: ${items.length} issues`);
  if (items.length > 0) {
    console.log(`   Sample values:`);
    items.slice(0, 3).forEach(item => {
      console.log(`     Row ${item.row} (${item.empCode}): "${item.value}"`);
    });
  }
});

console.log('\n3. INVALID DATE VALUES:');
Object.entries(issues.invalidDates).forEach(([field, items]) => {
  if (items.length > 0) {
    console.log(`   ${field}: ${items.length} issues`);
    console.log(`   Sample values:`);
    items.slice(0, 3).forEach(item => {
      console.log(`     Row ${item.row} (${item.empCode}): "${item.value}"`);
    });
  }
});

console.log('\n4. MISSING REQUIRED FIELDS:', issues.missingRequired.length);
if (issues.missingRequired.length > 0) {
  issues.missingRequired.slice(0, 5).forEach(item => {
    console.log(`   Row ${item.row}: emp_code="${item.empCode}", name="${item.name}"`);
  });
}

// Check column length
console.log('\n5. FIELD LENGTH ANALYSIS:');
const maxLengths = {};
records.forEach(r => {
  Object.entries(r).forEach(([key, value]) => {
    if (value && value !== 'null') {
      const len = value.length;
      if (!maxLengths[key] || len > maxLengths[key].length) {
        maxLengths[key] = { length: len, value: value, empCode: r.emp_code };
      }
    }
  });
});

const longFields = Object.entries(maxLengths)
  .filter(([_, data]) => data.length > 100)
  .sort((a, b) => b[1].length - a[1].length);

if (longFields.length > 0) {
  console.log('   Fields with values > 100 characters:');
  longFields.forEach(([field, data]) => {
    console.log(`   ${field}: ${data.length} chars (${data.empCode})`);
    console.log(`     Sample: "${data.value.substring(0, 50)}..."`);
  });
}