require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

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

async function normalizeBloodGroups() {
  console.log('🔄 Starting blood group normalization...');

  try {
    // First, analyze the current blood group data
    const analysisResult = await sql`
      SELECT blood_group, COUNT(*) as count
      FROM employees
      WHERE blood_group IS NOT NULL
      GROUP BY blood_group
      ORDER BY blood_group
    `;
    
    console.log('\n📊 Current blood group distribution:');
    analysisResult.forEach(({ blood_group, count }) => {
      console.log(`  ${blood_group}: ${count} employees`);
    });

    // Define the mapping for normalization
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

    // Find blood groups that need normalization
    const bloodGroupsToNormalize = analysisResult.filter(({ blood_group }) => {
      const normalized = blood_group.replace(/\s+/g, '').toUpperCase();
      return blood_group !== normalized || (bloodGroupMapping[blood_group] && bloodGroupMapping[blood_group] !== blood_group);
    });

    if (bloodGroupsToNormalize.length === 0) {
      console.log('\n✅ All blood groups are already normalized!');
      await sql.end();
      return;
    }

    console.log('\n🔧 Blood groups that need normalization:');
    bloodGroupsToNormalize.forEach(({ blood_group, count }) => {
      const normalized = bloodGroupMapping[blood_group] || blood_group.replace(/\s+/g, '').toUpperCase();
      console.log(`  "${blood_group}" → "${normalized}" (${count} records)`);
    });

    // Ask for confirmation
    console.log('\n⚠️  This will update the blood group values in the database.');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Perform the normalization
    let totalUpdated = 0;

    for (const { blood_group, count } of bloodGroupsToNormalize) {
      const normalizedValue = bloodGroupMapping[blood_group] || blood_group.replace(/\s+/g, '').toUpperCase();
      
      console.log(`\n🔄 Updating "${blood_group}" to "${normalizedValue}"...`);
      
      const result = await sql`
        UPDATE employees
        SET blood_group = ${normalizedValue}
        WHERE blood_group = ${blood_group}
      `;
      
      console.log(`✅ Updated ${result.count} records`);
      totalUpdated += result.count;
    }

    // Verify the results
    console.log('\n📊 New blood group distribution:');
    const newAnalysisResult = await sql`
      SELECT blood_group, COUNT(*) as count
      FROM employees
      WHERE blood_group IS NOT NULL
      GROUP BY blood_group
      ORDER BY blood_group
    `;
    
    newAnalysisResult.forEach(({ blood_group, count }) => {
      console.log(`  ${blood_group}: ${count} employees`);
    });

    console.log(`\n✅ Blood group normalization complete! Updated ${totalUpdated} records.`);

  } catch (error) {
    console.error('❌ Error normalizing blood groups:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the script
normalizeBloodGroups()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });