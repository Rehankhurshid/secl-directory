import { db } from '@/lib/db';
import { employees, departments, areas } from '@/lib/database/schema';
import { eq, ilike, and, or, count, desc, asc, isNotNull } from 'drizzle-orm';
import { FilterService, FilterOptions, FilterOption } from './filter-service';

export interface Employee {
  // Primary Key & Unique Identifiers
  id: number;
  empCode: string;
  
  // Basic Personal Information
  name: string;
  fatherName: string | null;
  dob: string | null;
  gender: string | null;
  
  // Contact Information
  emailId: string | null;
  phoneNumber1: string | null;
  phoneNumber2: string | null;
  permanentAddress: string | null;
  presentAddress: string | null;
  
  // Employment Details
  designation: string | null;
  category: string | null;
  grade: string | null;
  discipline: string | null;
  dateOfAppointment: string | null;
  areaJoiningDate: string | null;
  gradeJoiningDate: string | null;
  incrementDate: string | null;
  expectedExitDate: string | null;
  companyPostingDate: string | null;
  
  // Organizational Structure
  areaName: string | null;
  unitCode: string | null;
  unitName: string | null;
  deptCode: string | null;
  department: string | null;
  subDepartment: string | null;
  
  // Personal Details
  bloodGroup: string | null;
  casteCode: string | null;
  religionCode: string | null;
  maritalStatusCode: string | null;
  spouseName: string | null;
  spouseEmpCode: string | null;
  
  // Financial Information
  bankAccountNo: string | null;
  bankName: string | null;
  basicSalary: number | null;
  hra: number | null;
  ncwaBasic: number | null;
  
  // Identity Documents
  aadhaarNo: string | null;
  panNo: string | null;
  
  // System Fields
  isActive: boolean;
  payFlag: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  
  // Optional fields
  profileImage?: string | null;
}

export interface EmployeeFilters {
  search?: string;
  department?: string;
  area?: string;
  designation?: string;
  category?: string;
  grade?: string;
  gender?: string;
  bloodGroup?: string;
}

export interface EmployeeSearchResult {
  employees: Employee[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export class EmployeeService {
  /**
   * Get paginated employees with optional filters
   */
  static async getEmployees(
    filters: EmployeeFilters = {},
    page: number = 1,
    limit: number = 50
  ): Promise<EmployeeSearchResult> {
    try {
      console.log('EmployeeService.getEmployees - Received filters:', filters);
      const offset = (page - 1) * limit;
      
      // Build where conditions
      const conditions = [];
      
      // Active employees only
      conditions.push(eq(employees.isActive, true));
      
      // Search filter
      if (filters.search) {
        const searchTerm = `%${filters.search.toLowerCase()}%`;
        conditions.push(
          or(
            ilike(employees.name, searchTerm),
            ilike(employees.empCode, searchTerm),
            ilike(employees.designation, searchTerm),
            ilike(employees.emailId, searchTerm)
          )
        );
      }
      
      // Department filter
      if (filters.department && filters.department !== 'all') {
        conditions.push(eq(employees.department, filters.department));
      }
      
      // Area filter
      if (filters.area && filters.area !== 'all') {
        conditions.push(eq(employees.areaName, filters.area));
      }
      
      // Designation filter
      if (filters.designation && filters.designation !== 'all') {
        conditions.push(eq(employees.designation, filters.designation));
      }
      
      // Category filter
      if (filters.category && filters.category !== 'all') {
        conditions.push(eq(employees.category, filters.category));
      }
      
      // Grade filter
      if (filters.grade && filters.grade !== 'all') {
        conditions.push(eq(employees.grade, filters.grade));
      }
      
      // Gender filter
      if (filters.gender && filters.gender !== 'all') {
        conditions.push(eq(employees.gender, filters.gender));
      }
      
      // Blood Group filter
      if (filters.bloodGroup && filters.bloodGroup !== 'all') {
        conditions.push(eq(employees.bloodGroup, filters.bloodGroup));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      // Get total count
      const totalResults = await db
        .select({ count: count() })
        .from(employees)
        .where(whereClause);
      
      const totalCount = totalResults[0]?.count || 0;
      const totalPages = Math.ceil(totalCount / limit);
      
      // Get employees with ALL fields
      const employeesList = await db
        .select({
          // Primary Key & Unique Identifiers
          id: employees.id,
          empCode: employees.empCode,
          
          // Basic Personal Information
          name: employees.name,
          fatherName: employees.fatherName,
          dob: employees.dob,
          gender: employees.gender,
          
          // Contact Information
          emailId: employees.emailId,
          phoneNumber1: employees.phoneNumber1,
          phoneNumber2: employees.phoneNumber2,
          permanentAddress: employees.permanentAddress,
          presentAddress: employees.presentAddress,
          
          // Employment Details
          designation: employees.designation,
          category: employees.category,
          grade: employees.grade,
          discipline: employees.discipline,
          dateOfAppointment: employees.dateOfAppointment,
          areaJoiningDate: employees.areaJoiningDate,
          gradeJoiningDate: employees.gradeJoiningDate,
          incrementDate: employees.incrementDate,
          expectedExitDate: employees.expectedExitDate,
          companyPostingDate: employees.companyPostingDate,
          
          // Organizational Structure
          areaName: employees.areaName,
          unitCode: employees.unitCode,
          unitName: employees.unitName,
          deptCode: employees.deptCode,
          department: employees.department,
          subDepartment: employees.subDepartment,
          
          // Personal Details
          bloodGroup: employees.bloodGroup,
          casteCode: employees.casteCode,
          religionCode: employees.religionCode,
          maritalStatusCode: employees.maritalStatusCode,
          spouseName: employees.spouseName,
          spouseEmpCode: employees.spouseEmpCode,
          
          // Financial Information
          bankAccountNo: employees.bankAccountNo,
          bankName: employees.bankName,
          basicSalary: employees.basicSalary,
          hra: employees.hra,
          ncwaBasic: employees.ncwaBasic,
          
          // Identity Documents
          aadhaarNo: employees.aadhaarNo,
          panNo: employees.panNo,
          
          // System Fields
          isActive: employees.isActive,
          payFlag: employees.payFlag,
          createdAt: employees.createdAt,
          updatedAt: employees.updatedAt,
        })
        .from(employees)
        .where(whereClause)
        .orderBy(asc(employees.name))
        .limit(limit)
        .offset(offset);
      
      return {
        employees: employeesList.map(emp => ({
          ...emp,
          isActive: emp.isActive ?? true,
          dob: emp.dob ? emp.dob.toString() : null,
          dateOfAppointment: emp.dateOfAppointment ? emp.dateOfAppointment.toString() : null,
          areaJoiningDate: emp.areaJoiningDate ? emp.areaJoiningDate.toString() : null,
          gradeJoiningDate: emp.gradeJoiningDate ? emp.gradeJoiningDate.toString() : null,
          incrementDate: emp.incrementDate ? emp.incrementDate.toString() : null,
          expectedExitDate: emp.expectedExitDate ? emp.expectedExitDate.toString() : null,
          companyPostingDate: emp.companyPostingDate ? emp.companyPostingDate.toString() : null,
          createdAt: emp.createdAt ? emp.createdAt.toISOString() : null,
          updatedAt: emp.updatedAt ? emp.updatedAt.toISOString() : null,
          basicSalary: emp.basicSalary ? Number(emp.basicSalary) : null,
          hra: emp.hra ? Number(emp.hra) : null,
          ncwaBasic: emp.ncwaBasic ? Number(emp.ncwaBasic) : null,
          profileImage: null, // TODO: Add profile images
        })),
        totalCount,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
      
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw new Error('Failed to fetch employees');
    }
  }
  
  /**
   * Get a single employee by employee code
   */
  static async getEmployeeByCode(empCode: string): Promise<Employee | null> {
    try {
      const [employee] = await db
        .select({
          // Primary Key & Unique Identifiers
          id: employees.id,
          empCode: employees.empCode,
          
          // Basic Personal Information
          name: employees.name,
          fatherName: employees.fatherName,
          dob: employees.dob,
          gender: employees.gender,
          
          // Contact Information
          emailId: employees.emailId,
          phoneNumber1: employees.phoneNumber1,
          phoneNumber2: employees.phoneNumber2,
          permanentAddress: employees.permanentAddress,
          presentAddress: employees.presentAddress,
          
          // Employment Details
          designation: employees.designation,
          category: employees.category,
          grade: employees.grade,
          discipline: employees.discipline,
          dateOfAppointment: employees.dateOfAppointment,
          areaJoiningDate: employees.areaJoiningDate,
          gradeJoiningDate: employees.gradeJoiningDate,
          incrementDate: employees.incrementDate,
          expectedExitDate: employees.expectedExitDate,
          companyPostingDate: employees.companyPostingDate,
          
          // Organizational Structure
          areaName: employees.areaName,
          unitCode: employees.unitCode,
          unitName: employees.unitName,
          deptCode: employees.deptCode,
          department: employees.department,
          subDepartment: employees.subDepartment,
          
          // Personal Details
          bloodGroup: employees.bloodGroup,
          casteCode: employees.casteCode,
          religionCode: employees.religionCode,
          maritalStatusCode: employees.maritalStatusCode,
          spouseName: employees.spouseName,
          spouseEmpCode: employees.spouseEmpCode,
          
          // Financial Information
          bankAccountNo: employees.bankAccountNo,
          bankName: employees.bankName,
          basicSalary: employees.basicSalary,
          hra: employees.hra,
          ncwaBasic: employees.ncwaBasic,
          
          // Identity Documents
          aadhaarNo: employees.aadhaarNo,
          panNo: employees.panNo,
          
          // System Fields
          isActive: employees.isActive,
          payFlag: employees.payFlag,
          createdAt: employees.createdAt,
          updatedAt: employees.updatedAt,
        })
        .from(employees)
        .where(and(
          eq(employees.empCode, empCode),
          eq(employees.isActive, true)
        ))
        .limit(1);
      
      if (!employee) {
        return null;
      }
      
      return {
        ...employee,
        isActive: employee.isActive ?? true,
        dob: employee.dob ? employee.dob.toString() : null,
        dateOfAppointment: employee.dateOfAppointment ? employee.dateOfAppointment.toString() : null,
        areaJoiningDate: employee.areaJoiningDate ? employee.areaJoiningDate.toString() : null,
        gradeJoiningDate: employee.gradeJoiningDate ? employee.gradeJoiningDate.toString() : null,
        incrementDate: employee.incrementDate ? employee.incrementDate.toString() : null,
        expectedExitDate: employee.expectedExitDate ? employee.expectedExitDate.toString() : null,
        companyPostingDate: employee.companyPostingDate ? employee.companyPostingDate.toString() : null,
        createdAt: employee.createdAt ? employee.createdAt.toISOString() : null,
        updatedAt: employee.updatedAt ? employee.updatedAt.toISOString() : null,
        basicSalary: employee.basicSalary ? Number(employee.basicSalary) : null,
        hra: employee.hra ? Number(employee.hra) : null,
        ncwaBasic: employee.ncwaBasic ? Number(employee.ncwaBasic) : null,
        profileImage: null, // TODO: Add profile images
      };
      
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw new Error('Failed to fetch employee');
    }
  }
  
  /**
   * Get unique departments for filters
   */
  static async getDepartments(): Promise<string[]> {
    try {
      const depts = await db
        .selectDistinct({ department: employees.department })
        .from(employees)
        .where(and(
          eq(employees.isActive, true),
          isNotNull(employees.department)
        ))
        .orderBy(asc(employees.department));
      
      return depts.map(d => d.department).filter(Boolean) as string[];
    } catch (error) {
      console.error('Error fetching departments:', error);
      return [];
    }
  }
  
  /**
   * Get unique areas for filters
   */
  static async getAreas(): Promise<string[]> {
    try {
      const areasList = await db
        .selectDistinct({ areaName: employees.areaName })
        .from(employees)
        .where(and(
          eq(employees.isActive, true),
          isNotNull(employees.areaName)
        ))
        .orderBy(asc(employees.areaName));
      
      return areasList.map(a => a.areaName).filter(Boolean) as string[];
    } catch (error) {
      console.error('Error fetching areas:', error);
      return [];
    }
  }
  
  /**
   * Get unique designations for filters
   */
  static async getDesignations(): Promise<string[]> {
    try {
      const designations = await db
        .selectDistinct({ designation: employees.designation })
        .from(employees)
        .where(and(
          eq(employees.isActive, true),
          isNotNull(employees.designation)
        ))
        .orderBy(asc(employees.designation));
      
      return designations.map(d => d.designation).filter(Boolean) as string[];
    } catch (error) {
      console.error('Error fetching designations:', error);
      return [];
    }
  }
  
  /**
   * Get unique categories for filters
   */
  static async getCategories(): Promise<string[]> {
    try {
      const categories = await db
        .selectDistinct({ category: employees.category })
        .from(employees)
        .where(and(
          eq(employees.isActive, true),
          isNotNull(employees.category)
        ))
        .orderBy(asc(employees.category));
      
      return categories.map(c => c.category).filter(Boolean) as string[];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }
  
  /**
   * Get unique grades for filters
   */
  static async getGrades(): Promise<string[]> {
    try {
      const grades = await db
        .selectDistinct({ grade: employees.grade })
        .from(employees)
        .where(and(
          eq(employees.isActive, true),
          isNotNull(employees.grade)
        ))
        .orderBy(asc(employees.grade));
      
      return grades.map(g => g.grade).filter(Boolean) as string[];
    } catch (error) {
      console.error('Error fetching grades:', error);
      return [];
    }
  }
  
  /**
   * Get unique genders for filters
   */
  static async getGenders(): Promise<string[]> {
    try {
      const genders = await db
        .selectDistinct({ gender: employees.gender })
        .from(employees)
        .where(and(
          eq(employees.isActive, true),
          isNotNull(employees.gender)
        ))
        .orderBy(asc(employees.gender));
      
      return genders.map(g => g.gender).filter(Boolean) as string[];
    } catch (error) {
      console.error('Error fetching genders:', error);
      return [];
    }
  }
  
  /**
   * Get unique blood groups for filters
   */
  static async getBloodGroups(): Promise<string[]> {
    try {
      const bloodGroups = await db
        .selectDistinct({ bloodGroup: employees.bloodGroup })
        .from(employees)
        .where(and(
          eq(employees.isActive, true),
          isNotNull(employees.bloodGroup)
        ))
        .orderBy(asc(employees.bloodGroup));
      
      return bloodGroups.map(b => b.bloodGroup).filter(Boolean) as string[];
    } catch (error) {
      console.error('Error fetching blood groups:', error);
      return [];
    }
  }
  
  /**
   * Get all unique filter options in a single efficient call
   * @deprecated Use FilterService.getFilterOptions() instead
   */
  static async getFilterOptions(): Promise<{
    departments: string[];
    areas: string[];
    designations: string[];
    categories: string[];
    grades: string[];
    genders: string[];
    bloodGroups: string[];
  }> {
    try {
      // Use the new FilterService but convert to old format for backward compatibility
      const filterOptions = await FilterService.getFilterOptions();
      
      return {
        departments: filterOptions.departments.map(opt => opt.value),
        areas: filterOptions.areas.map(opt => opt.value),
        designations: filterOptions.designations.map(opt => opt.value),
        categories: filterOptions.categories.map(opt => opt.value),
        grades: filterOptions.grades.map(opt => opt.value),
        genders: filterOptions.genders.map(opt => opt.value),
        bloodGroups: filterOptions.bloodGroups.map(opt => opt.value)
      };
    } catch (error) {
      console.error('❌ Error fetching filter options:', error);
      return {
        departments: [],
        areas: [],
        designations: [],
        categories: [],
        grades: [],
        genders: [],
        bloodGroups: []
      };
    }
  }

  /**
   * Get enhanced filter options with counts
   */
  static async getEnhancedFilterOptions(): Promise<FilterOptions> {
    return FilterService.getFilterOptions();
  }

  /**
   * Validate filter values against actual database data
   */
  static async validateFilters(filters: EmployeeFilters): Promise<{
    isValid: boolean;
    invalidFilters: string[];
  }> {
    const invalidFilters: string[] = [];

    // Check each filter value
    if (filters.department && filters.department !== 'all') {
      const isValid = await FilterService.validateFilterValue('departments', filters.department);
      if (!isValid) invalidFilters.push('department');
    }

    if (filters.area && filters.area !== 'all') {
      const isValid = await FilterService.validateFilterValue('areas', filters.area);
      if (!isValid) invalidFilters.push('area');
    }

    if (filters.designation && filters.designation !== 'all') {
      const isValid = await FilterService.validateFilterValue('designations', filters.designation);
      if (!isValid) invalidFilters.push('designation');
    }

    if (filters.category && filters.category !== 'all') {
      const isValid = await FilterService.validateFilterValue('categories', filters.category);
      if (!isValid) invalidFilters.push('category');
    }

    if (filters.grade && filters.grade !== 'all') {
      const isValid = await FilterService.validateFilterValue('grades', filters.grade);
      if (!isValid) invalidFilters.push('grade');
    }

    if (filters.gender && filters.gender !== 'all') {
      const isValid = await FilterService.validateFilterValue('genders', filters.gender);
      if (!isValid) invalidFilters.push('gender');
    }

    if (filters.bloodGroup && filters.bloodGroup !== 'all') {
      const isValid = await FilterService.validateFilterValue('bloodGroups', filters.bloodGroup);
      if (!isValid) invalidFilters.push('bloodGroup');
    }

    return {
      isValid: invalidFilters.length === 0,
      invalidFilters
    };
  }

  /**
   * Get database statistics efficiently
   */
  static async getStats(): Promise<{
    totalEmployees: number;
    totalDepartments: number;
    totalAreas: number;
  }> {
    try {
      // Use a single query to get employee count and unique departments/areas
      const [employeeStats, uniqueData] = await Promise.all([
        db.select({ count: count() }).from(employees).where(eq(employees.isActive, true)),
        db
          .selectDistinct({
            department: employees.department,
            areaName: employees.areaName
          })
          .from(employees)
          .where(eq(employees.isActive, true))
      ]);

      const totalEmployees = employeeStats[0]?.count || 0;
      const totalDepartments = new Set(uniqueData.map(row => row.department).filter(Boolean)).size;
      const totalAreas = new Set(uniqueData.map(row => row.areaName).filter(Boolean)).size;
      
      console.log('✅ Stats fetched successfully:', { totalEmployees, totalDepartments, totalAreas });
      
      return {
        totalEmployees,
        totalDepartments,
        totalAreas
      };
      
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      return { totalEmployees: 0, totalDepartments: 0, totalAreas: 0 };
    }
  }
} 