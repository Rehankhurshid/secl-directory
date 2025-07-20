import { NextRequest, NextResponse } from 'next/server';
import { FilterService } from '@/lib/services/filter-service';

export async function GET(request: NextRequest) {
  try {
    // Force refresh to get latest normalized data
    const filterOptions = await FilterService.getFilterOptions(true);
    
    // Debug blood group data before transformation
    console.log('🎉 API - Blood Groups before transformation:', filterOptions.bloodGroups);
    
    // Transform to the expected format with name/count
    const transformOptions = (options: any[]) => 
      options.map(opt => ({
        name: opt.value,
        count: opt.count || 0
      }));
    
    const bloodGroupsTransformed = transformOptions(filterOptions.bloodGroups);
    console.log('🎉 API - Blood Groups after transformation:', bloodGroupsTransformed);
    
    return NextResponse.json({
      departments: transformOptions(filterOptions.departments),
      locations: transformOptions(filterOptions.areas), // Use areas as locations
      grades: transformOptions(filterOptions.grades),
      categories: transformOptions(filterOptions.categories),
      genders: transformOptions(filterOptions.genders),
      bloodGroups: bloodGroupsTransformed,
    });
  } catch (error) {
    console.error('Error fetching employee stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee stats' },
      { status: 500 }
    );
  }
}