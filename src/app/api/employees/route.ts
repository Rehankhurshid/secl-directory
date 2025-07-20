import { NextRequest, NextResponse } from 'next/server';
import { EmployeeService } from '@/lib/services/employee-service';
import { FilterService } from '@/lib/services/filter-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Get query parameters
    const search = searchParams.get('search') || undefined;
    const department = searchParams.get('department') || undefined;
    const location = searchParams.get('location') || undefined;
    const grade = searchParams.get('grade') || undefined;
    const category = searchParams.get('category') || undefined;
    const gender = searchParams.get('gender') || undefined;
    const bloodGroup = searchParams.get('bloodGroup') || undefined;
    const sortBy = searchParams.get('sortBy') || 'name';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Build filters object
    const filters = {
      search: search || '',
      department: department || '',
      area: location || '', // Map location to area
      grade: grade || '',
      category: category || '',
      gender: gender || '',
      bloodGroup: bloodGroup || '',
    };
    
    // Get employees with filters
    const result = await EmployeeService.getEmployees(filters, page, limit);
    
    // Transform the data to match the expected format
    const transformedEmployees = result.employees.map(emp => ({
      id: emp.empCode,
      empCode: emp.empCode,
      name: emp.name,
      designation: emp.designation,
      department: emp.department,
      location: emp.areaName,
      grade: emp.grade,
      category: emp.category,
      gender: emp.gender,
      bloodGroup: emp.bloodGroup,
      profileImage: emp.profileImage || null,
    }));
    
    return NextResponse.json({
      employees: transformedEmployees,
      total: result.totalCount,
      page: result.currentPage,
      totalPages: result.totalPages,
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}