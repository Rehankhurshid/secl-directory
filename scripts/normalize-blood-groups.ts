import { db } from '@/lib/db';
import { employees } from '@/lib/database/schema';
import { eq, sql, isNotNull } from 'drizzle-orm';

/**
 * Script to normalize blood group data in the database
 * Fixes inconsistent formats like "B -" vs "B-"
 */

async function normalizeBloodGroups() {
  console.log('🔄 Starting blood group normalization...');

  try {
    // First, let's analyze the current blood group data
    const bloodGroupAnalysis = await db
      .select({
        bloodGroup: employees.bloodGroup,
        count: sql<number>`count(*)`.as('count')
      })
      .from(employees)
      .where(isNotNull(employees.bloodGroup))
      .groupBy(employees.bloodGroup)
      .orderBy(employees.bloodGroup);

    console.log('\n📊 Current blood group distribution:');
    bloodGroupAnalysis.forEach(({ bloodGroup, count }) => {
      console.log(`  ${bloodGroup}: ${count} employees`);
    });

    // Define the mapping for normalization
    const bloodGroupMapping: Record<string, string> = {
      'A+': 'A+',
      'A-': 'A-',
      'B+': 'B+',
      'B-': 'B-',
      'B -': 'B-', // Fix spacing issue
      'AB+': 'AB+',
      'AB-': 'AB-',
      'O+': 'O+',
      'O-': 'O-',
      // Add any other variations you find
      'A +': 'A+',
      'B +': 'B+',
      'AB +': 'AB+',
      'O +': 'O+',
      'A -': 'A-',
      'AB -': 'AB-',
      'O -': 'O-',
    };

    // Get all unique blood groups that need normalization
    const bloodGroupsToNormalize = bloodGroupAnalysis
      .filter(({ bloodGroup }) => {
        if (!bloodGroup) return false;
        const normalized = bloodGroup.replace(/\s+/g, '').toUpperCase();
        return bloodGroup !== normalized || bloodGroupMapping[bloodGroup] !== bloodGroup;
      })
      .map(({ bloodGroup }) => bloodGroup);

    if (bloodGroupsToNormalize.length === 0) {
      console.log('\n✅ All blood groups are already normalized!');
      return;
    }

    console.log('\n🔧 Blood groups that need normalization:');
    bloodGroupsToNormalize.forEach(bg => {
      const normalized = bloodGroupMapping[bg!] || bg!.replace(/\s+/g, '').toUpperCase();
      console.log(`  "${bg}" → "${normalized}"`);
    });

    // Ask for confirmation
    console.log('\n⚠️  This will update the blood group values in the database.');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Perform the normalization
    let totalUpdated = 0;

    for (const bloodGroup of bloodGroupsToNormalize) {
      if (!bloodGroup) continue;
      
      const normalizedValue = bloodGroupMapping[bloodGroup] || bloodGroup.replace(/\s+/g, '').toUpperCase();
      
      console.log(`\n🔄 Updating "${bloodGroup}" to "${normalizedValue}"...`);
      
      const result = await db
        .update(employees)
        .set({ bloodGroup: normalizedValue })
        .where(eq(employees.bloodGroup, bloodGroup));

      // Get count of updated records
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(employees)
        .where(eq(employees.bloodGroup, normalizedValue));

      const updatedCount = countResult[0]?.count || 0;
      console.log(`✅ Updated ${updatedCount} records`);
      totalUpdated += updatedCount;
    }

    // Verify the results
    console.log('\n📊 New blood group distribution:');
    const newBloodGroupAnalysis = await db
      .select({
        bloodGroup: employees.bloodGroup,
        count: sql<number>`count(*)`.as('count')
      })
      .from(employees)
      .where(isNotNull(employees.bloodGroup))
      .groupBy(employees.bloodGroup)
      .orderBy(employees.bloodGroup);

    newBloodGroupAnalysis.forEach(({ bloodGroup, count }) => {
      console.log(`  ${bloodGroup}: ${count} employees`);
    });

    console.log(`\n✅ Blood group normalization complete! Updated ${totalUpdated} records.`);

    // Clear the filter cache to reflect the changes
    console.log('\n🗑️  Clearing filter cache...');
    const { FilterService } = await import('@/lib/services/filter-service');
    FilterService.clearCache();
    console.log('✅ Filter cache cleared');

  } catch (error) {
    console.error('❌ Error normalizing blood groups:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  normalizeBloodGroups()
    .then(() => {
      console.log('\n🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

export { normalizeBloodGroups };