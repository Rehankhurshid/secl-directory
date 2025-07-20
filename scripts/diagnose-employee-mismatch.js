require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Parse the database URL
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

// Create connection with SSL
const sql = postgres(connectionString, {
  ssl: 'require'
});

async function diagnoseEmployeeMismatch() {
  console.log('🔍 Diagnosing employee data mismatch between CSV and database...\n');

  try {
    // Read CSV file
    const csvPath = path.join(process.cwd(), 'instructions', 'employee-sheet.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV - handling duplicate columns
    const records = parse(csvContent, {
      columns: (header) => {
        // Handle duplicate blood columns
        const modifiedHeader = header.map((col, index) => {
          if (col === 'blood' && header.slice(0, index).includes('blood')) {
            return 'blood2'; // Rename second blood column
          }
          return col;
        });
        return modifiedHeader;
      },
      skip_empty_lines: true,
      trim: true,
    });
    
    console.log(`📊 Found ${records.length} employee records in CSV\n`);
    
    // Get all employee codes from database
    const dbEmployees = await sql`
      SELECT emp_code, name, blood_group, is_active
      FROM employees
      ORDER BY emp_code
    `;
    
    console.log(`📊 Found ${dbEmployees.length} employees in database\n`);
    
    // Create maps for quick lookup
    const csvEmployeeMap = new Map();
    records.forEach(record => {
      csvEmployeeMap.set(record.emp_code, record);
    });
    
    const dbEmployeeMap = new Map();
    dbEmployees.forEach(emp => {
      dbEmployeeMap.set(emp.emp_code, emp);
    });
    
    // Find mismatches
    const inCsvNotInDb = [];
    const inDbNotInCsv = [];
    const bloodGroupMismatches = [];
    
    // Check CSV employees not in database
    records.forEach(record => {
      if (!dbEmployeeMap.has(record.emp_code)) {
        inCsvNotInDb.push({
          empCode: record.emp_code,
          name: record.name,
          department: record.dept,
          designation: record.designation
        });
      } else {
        // Check blood group mismatch
        const dbEmp = dbEmployeeMap.get(record.emp_code);
        const csvBlood = record.blood2 && record.blood2 !== record.blood ? record.blood2 : record.blood;
        
        if (csvBlood && csvBlood !== 'null' && dbEmp.blood_group !== csvBlood) {
          bloodGroupMismatches.push({
            empCode: record.emp_code,
            name: record.name,
            csvBlood: csvBlood,
            dbBlood: dbEmp.blood_group || 'null'
          });
        }
      }
    });
    
    // Check database employees not in CSV
    dbEmployees.forEach(dbEmp => {
      if (!csvEmployeeMap.has(dbEmp.emp_code)) {
        inDbNotInCsv.push({
          empCode: dbEmp.emp_code,
          name: dbEmp.name,
          bloodGroup: dbEmp.blood_group,
          isActive: dbEmp.is_active
        });
      }
    });
    
    // Display results
    console.log('📋 DIAGNOSIS RESULTS:\n');
    
    console.log(`1. Employees in CSV but NOT in database: ${inCsvNotInDb.length}`);
    if (inCsvNotInDb.length > 0) {
      console.log('   First 10 examples:');
      inCsvNotInDb.slice(0, 10).forEach(emp => {
        console.log(`   - ${emp.empCode}: ${emp.name} (${emp.designation}, ${emp.department})`);
      });
      if (inCsvNotInDb.length > 10) {
        console.log(`   ... and ${inCsvNotInDb.length - 10} more\n`);
      } else {
        console.log('');
      }
    }
    
    console.log(`2. Employees in database but NOT in CSV: ${inDbNotInCsv.length}`);
    if (inDbNotInCsv.length > 0) {
      console.log('   First 10 examples:');
      inDbNotInCsv.slice(0, 10).forEach(emp => {
        console.log(`   - ${emp.empCode}: ${emp.name} (Active: ${emp.isActive}, Blood: ${emp.bloodGroup})`);
      });
      if (inDbNotInCsv.length > 10) {
        console.log(`   ... and ${inDbNotInCsv.length - 10} more\n`);
      } else {
        console.log('');
      }
    }
    
    console.log(`3. Blood group mismatches: ${bloodGroupMismatches.length}`);
    if (bloodGroupMismatches.length > 0) {
      console.log('   First 20 examples:');
      bloodGroupMismatches.slice(0, 20).forEach(emp => {
        console.log(`   - ${emp.empCode}: ${emp.name} | CSV: "${emp.csvBlood}" vs DB: "${emp.dbBlood}"`);
      });
      if (bloodGroupMismatches.length > 20) {
        console.log(`   ... and ${bloodGroupMismatches.length - 20} more\n`);
      } else {
        console.log('');
      }
    }
    
    // Check for duplicate employee codes in CSV
    const csvEmpCodes = records.map(r => r.emp_code);
    const duplicates = csvEmpCodes.filter((code, index) => csvEmpCodes.indexOf(code) !== index);
    const uniqueDuplicates = [...new Set(duplicates)];
    
    if (uniqueDuplicates.length > 0) {
      console.log(`4. Duplicate employee codes in CSV: ${uniqueDuplicates.length}`);
      console.log('   Examples:');
      uniqueDuplicates.slice(0, 10).forEach(code => {
        const count = csvEmpCodes.filter(c => c === code).length;
        console.log(`   - ${code}: appears ${count} times`);
      });
      console.log('');
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`- Total unique employees in CSV: ${new Set(csvEmpCodes).size}`);
    console.log(`- Total employees in database: ${dbEmployees.length}`);
    console.log(`- Employees matched: ${dbEmployees.length - inDbNotInCsv.length}`);
    console.log(`- New employees to add from CSV: ${inCsvNotInDb.length}`);
    console.log(`- Blood groups needing update: ${bloodGroupMismatches.length}`);
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (inCsvNotInDb.length > 0) {
      console.log(`1. Run "npm run import:employees" to add ${inCsvNotInDb.length} new employees from CSV`);
    }
    if (bloodGroupMismatches.length > 0) {
      console.log(`2. Run "npm run update:blood-groups" to fix ${bloodGroupMismatches.length} blood group mismatches`);
    }
    if (inDbNotInCsv.length > 0) {
      console.log(`3. Review ${inDbNotInCsv.length} employees in database that are not in CSV (possibly old/inactive)`);
    }

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the script
diagnoseEmployeeMismatch()
  .then(() => {
    console.log('\n🎉 Diagnosis completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Diagnosis failed:', error);
    process.exit(1);
  });