import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employees } from '@/lib/database/schema';
import { eq, sql, and } from 'drizzle-orm';

export async function GET() {
  try {
    // Get unique blood groups with counts
    const bloodGroupStats = await db
      .select({
        bloodGroup: employees.bloodGroup,
        count: sql<number>`count(*)`.as('count')
      })
      .from(employees)
      .where(eq(employees.isActive, true))
      .groupBy(employees.bloodGroup)
      .orderBy(employees.bloodGroup);

    // Get sample employees for each blood group
    const samplesByBloodGroup: Record<string, any[]> = {};
    
    for (const stat of bloodGroupStats) {
      if (stat.bloodGroup) {
        const samples = await db
          .select({
            empCode: employees.empCode,
            name: employees.name,
            bloodGroup: employees.bloodGroup
          })
          .from(employees)
          .where(
            and(
              eq(employees.isActive, true),
              eq(employees.bloodGroup, stat.bloodGroup)
            )
          )
          .limit(3);
        
        samplesByBloodGroup[stat.bloodGroup] = samples;
      }
    }

    // Get total active employees
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(eq(employees.isActive, true));

    return NextResponse.json({
      totalActiveEmployees: totalResult[0]?.count || 0,
      bloodGroupStats,
      samplesByBloodGroup,
      debug: {
        nullCount: bloodGroupStats.find(s => s.bloodGroup === null),
        distinctValues: bloodGroupStats.map(s => s.bloodGroup),
        totalCounted: bloodGroupStats.reduce((sum, s) => sum + (s.count || 0), 0)
      }
    });
  } catch (error) {
    console.error('Error debugging blood groups:', error);
    return NextResponse.json(
      { error: 'Failed to debug blood groups' },
      { status: 500 }
    );
  }
}