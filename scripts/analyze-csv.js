const fs = require('fs');
const { parse } = require('csv-parse/sync');

const csvContent = fs.readFileSync('instructions/employee-sheet.csv', 'utf-8');
const records = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });

console.log('Total records:', records.length);

// Get unique departments
const depts = new Map();
records.forEach(r => {
  if (r.dept && r.dept !== 'null' && r.dept.trim() !== '') {
    depts.set(r.dept_code, r.dept);
  }
});

console.log('Unique departments:', depts.size);
console.log('Sample departments:');
let count = 0;
for (const [code, name] of depts) {
  console.log(`  ${code}: ${name}`);
  if (++count >= 5) break;
}

// Get unique areas
const areas = new Map();
records.forEach(r => {
  if (r.unit_code && r.area_name) {
    areas.set(r.unit_code, { area: r.area_name, unit: r.unit_name });
  }
});

console.log('\nUnique areas:', areas.size);
for (const [code, info] of areas) {
  console.log(`  ${code}: ${info.area} - ${info.unit}`);
}

// Check first 5 records
console.log('\nFirst 5 employee records:');
records.slice(0, 5).forEach(r => {
  console.log(`  ${r.emp_code}: ${r.name} - ${r.designation}`);
});