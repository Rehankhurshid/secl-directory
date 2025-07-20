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

// Blood group normalization mapping
const bloodGroupMapping = {
  'A+': 'A+',
  'A-': 'A-',
  'B+': 'B+',
  'B-': 'B-',
  'B -': 'B-', // Fix spacing issue
  'AB+': 'AB+',
  'AB-': 'AB-',
  'O+': 'O+',
  'O-': 'O-',
  // Add any other variations
  'A +': 'A+',
  'B +': 'B+',
  'AB +': 'AB+',
  'O +': 'O+',
  'A -': 'A-',
  'AB -': 'AB-',
  'O -': 'O-',
};

function normalizeBloodGroup(bloodGroup) {
  if (!bloodGroup || bloodGroup === 'null' || bloodGroup.trim() === '') {
    return null;
  }
  
  // First check if it's in our mapping
  if (bloodGroupMapping[bloodGroup]) {
    return bloodGroupMapping[bloodGroup];
  }
  
  // Otherwise normalize by removing spaces and converting to uppercase
  return bloodGroup.replace(/\s+/g, '').toUpperCase();
}

function parseDate(dateStr) {
  if (!dateStr || dateStr === 'null' || dateStr === '') return null;
  
  // Handle different date formats
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY or DD/MM/YYYY
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0]) {
        // Assume DD/MM/YYYY format for Indian data
        const [, day, month, year] = match;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toISOString().split('T')[0]; // Return as YYYY-MM-DD
      } else {
        // YYYY-MM-DD format
        return dateStr;
      }
    }
  }
  
  console.warn(`Could not parse date: ${dateStr}`);
  return null;
}

function parseDecimal(value) {
  if (!value || value === 'null' || value === '') return null;
  
  // Remove any non-numeric characters except decimal point
  const cleaned = value.replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? null : num;
}

function sanitizeString(value) {
  if (!value || value === 'null' || value.trim() === '') return null;
  return value.trim();
}

async function updateEmployeesFromCSV() {
  console.log('🔄 Starting comprehensive employee data update from CSV...');

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
    
    console.log(`📊 Found ${records.length} employee records in CSV`);
    
    // Show update options
    console.log('\n🔧 Update Options:');
    console.log('1. Update only blood groups');
    console.log('2. Update all employee data (comprehensive)');
    console.log('3. Add new employees only');
    console.log('4. Exit');
    
    // For now, we'll do blood group update only (option 1)
    console.log('\n⚠️  Running blood group update only...');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Statistics
    let updated = 0;
    let added = 0;
    let skipped = 0;
    let errors = 0;
    const updateDetails = [];
    
    // Process each record
    for (const record of records) {
      try {
        // Get the correct blood group (prefer second column if different)
        const blood1 = record.blood;
        const blood2 = record.blood2;
        const rawBloodGroup = blood2 && blood2 !== blood1 ? blood2 : blood1;
        const normalizedBloodGroup = normalizeBloodGroup(rawBloodGroup);
        
        // Check if employee exists
        const existing = await sql`
          SELECT * FROM employees 
          WHERE emp_code = ${record.emp_code}
        `;
        
        if (existing.length === 0) {
          // Employee doesn't exist - could add them here
          console.log(`❓ Employee not found: ${record.emp_code} - ${record.name}`);
          skipped++;
          continue;
        }
        
        const currentEmployee = existing[0];
        const updates = {};
        
        // Check what needs updating
        if (normalizedBloodGroup && currentEmployee.blood_group !== normalizedBloodGroup) {
          updates.blood_group = normalizedBloodGroup;
        }
        
        // Could add more fields to update here:
        // if (record.email_id && currentEmployee.email_id !== record.email_id) {
        //   updates.email_id = sanitizeString(record.email_id);
        // }
        
        if (Object.keys(updates).length > 0) {
          // Build update query dynamically
          const setClause = Object.keys(updates)
            .map((key, index) => `${key} = $${index + 2}`)
            .join(', ');
          
          const values = [record.emp_code, ...Object.values(updates)];
          
          await sql.unsafe(
            `UPDATE employees SET ${setClause}, updated_at = NOW() WHERE emp_code = $1`,
            values
          );
          
          updateDetails.push({
            empCode: record.emp_code,
            name: record.name,
            updates: updates
          });
          
          updated++;
          
          if (updated % 100 === 0) {
            console.log(`📈 Updated ${updated} employees...`);
          }
        } else {
          skipped++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing employee ${record.emp_code}:`, error.message);
        errors++;
      }
    }
    
    // Show update details
    if (updateDetails.length > 0) {
      console.log('\n📋 Update Details (first 20):');
      updateDetails.slice(0, 20).forEach(detail => {
        const updateStr = Object.entries(detail.updates)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        console.log(`  ${detail.empCode} - ${detail.name}: ${updateStr}`);
      });
      
      if (updateDetails.length > 20) {
        console.log(`  ... and ${updateDetails.length - 20} more`);
      }
    }
    
    // Show final blood group distribution
    console.log('\n📊 Final blood group distribution:');
    const finalDistribution = await sql`
      SELECT blood_group, COUNT(*) as count
      FROM employees
      WHERE blood_group IS NOT NULL
      GROUP BY blood_group
      ORDER BY blood_group
    `;
    
    finalDistribution.forEach(({ blood_group, count }) => {
      console.log(`  ${blood_group}: ${count} employees`);
    });
    
    console.log('\n🎉 Update completed!');
    console.log(`✅ Updated: ${updated} employees`);
    console.log(`➕ Added: ${added} new employees`);
    console.log(`⏭️  Skipped: ${skipped} employees`);
    console.log(`❌ Errors: ${errors}`);

  } catch (error) {
    console.error('❌ Error updating employees:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the script
updateEmployeesFromCSV()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });