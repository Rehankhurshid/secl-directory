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

async function updateBloodGroupsFromCSV() {
  console.log('🔄 Starting blood group update from CSV...');

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
    
    // Analyze blood group data
    const bloodGroupAnalysis = new Map();
    records.forEach(record => {
      // Check both blood columns and use the second one if it's different
      const blood1 = record.blood;
      const blood2 = record.blood2;
      const bloodGroup = blood2 && blood2 !== blood1 ? blood2 : blood1;
      
      if (bloodGroup && bloodGroup !== 'null') {
        const count = bloodGroupAnalysis.get(bloodGroup) || 0;
        bloodGroupAnalysis.set(bloodGroup, count + 1);
      }
    });
    
    console.log('\n📊 Blood group distribution in CSV:');
    Array.from(bloodGroupAnalysis.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([bloodGroup, count]) => {
        const normalized = normalizeBloodGroup(bloodGroup);
        if (normalized !== bloodGroup) {
          console.log(`  ${bloodGroup} → ${normalized}: ${count} employees`);
        } else {
          console.log(`  ${bloodGroup}: ${count} employees`);
        }
      });
    
    // Ask for confirmation
    console.log('\n⚠️  This will update blood group values in the database based on CSV data.');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Update employees
    let updated = 0;
    let skipped = 0;
    let notFound = 0;
    
    for (const record of records) {
      try {
        // Get the correct blood group (prefer second column if different)
        const blood1 = record.blood;
        const blood2 = record.blood2;
        const rawBloodGroup = blood2 && blood2 !== blood1 ? blood2 : blood1;
        const normalizedBloodGroup = normalizeBloodGroup(rawBloodGroup);
        
        if (!normalizedBloodGroup) {
          skipped++;
          continue;
        }
        
        // Check if employee exists
        const existing = await sql`
          SELECT emp_code, blood_group 
          FROM employees 
          WHERE emp_code = ${record.emp_code}
        `;
        
        if (existing.length === 0) {
          notFound++;
          continue;
        }
        
        const currentBloodGroup = existing[0].blood_group;
        
        // Only update if different
        if (currentBloodGroup !== normalizedBloodGroup) {
          await sql`
            UPDATE employees
            SET blood_group = ${normalizedBloodGroup}
            WHERE emp_code = ${record.emp_code}
          `;
          
          console.log(`✅ Updated ${record.emp_code}: ${currentBloodGroup || 'null'} → ${normalizedBloodGroup}`);
          updated++;
        } else {
          skipped++;
        }
        
      } catch (error) {
        console.error(`❌ Error updating employee ${record.emp_code}:`, error.message);
      }
    }
    
    // Show final blood group distribution
    console.log('\n📊 Verifying final blood group distribution:');
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
    
    console.log('\n🎉 Blood group update completed!');
    console.log(`✅ Updated: ${updated} employees`);
    console.log(`⏭️  Skipped (no change needed): ${skipped} employees`);
    console.log(`❓ Not found in database: ${notFound} employees`);
    
    // Note about clearing cache
    console.log('\n💡 Note: You may need to restart your Next.js server to see updated filter counts.');

  } catch (error) {
    console.error('❌ Error updating blood groups:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the script
updateBloodGroupsFromCSV()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });