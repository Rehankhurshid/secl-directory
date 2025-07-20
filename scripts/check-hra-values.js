const fs = require('fs');
const { parse } = require('csv-parse/sync');

const csvContent = fs.readFileSync('instructions/employee-sheet.csv', 'utf-8');
const records = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });

// Remove the empty row
const validRecords = records.filter(r => r.emp_code && r.name);
console.log('Valid records:', validRecords.length);

// Find records with '2% OF BASIC' in numeric fields
const problematicRecords = validRecords.filter(r => {
  return r.hra === '2% OF BASIC' || 
         r.basic === '2% OF BASIC' || 
         r.ncwa_basic === '2% OF BASIC';
});

console.log('\nRecords with "2% OF BASIC":', problematicRecords.length);
if (problematicRecords.length > 0) {
  console.log('Sample records:');
  problematicRecords.slice(0, 10).forEach(r => {
    console.log(`  ${r.emp_code}: ${r.name}`);
    console.log(`    HRA: ${r.hra}, Basic: ${r.basic}, NCWA: ${r.ncwa_basic}`);
  });
}

// Check all unique non-numeric values in numeric fields
const checkField = (fieldName) => {
  const nonNumeric = new Set();
  validRecords.forEach(r => {
    const value = r[fieldName];
    if (value && value !== 'null' && value !== '') {
      // Try to parse as number
      const cleaned = value.replace(/[,]/g, '');
      if (isNaN(parseFloat(cleaned))) {
        nonNumeric.add(value);
      }
    }
  });
  return Array.from(nonNumeric);
};

console.log('\nNon-numeric values in numeric fields:');
console.log('HRA:', checkField('hra'));
console.log('Basic:', checkField('basic'));
console.log('NCWA Basic:', checkField('ncwa_basic'));