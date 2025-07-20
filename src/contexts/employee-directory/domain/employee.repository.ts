import { Employee } from './employee.entity';
import { EmployeeId, EmployeeSearchFilters, PaginationParams, PaginatedResponse } from '@/types';

// Repository interface - defines contracts for data access
// Implementation will be in the infrastructure layer
export interface EmployeeRepository {
  // Core CRUD operations
  findById(id: EmployeeId): Promise<Employee | null>;
  findByEmployeeId(employeeId: string): Promise<Employee | null>;
  findByEmail(email: string): Promise<Employee | null>;
  findAll(pagination?: PaginationParams): Promise<PaginatedResponse<Employee>>;
  
  // Search and filtering
  search(filters: EmployeeSearchFilters, pagination?: PaginationParams): Promise<PaginatedResponse<Employee>>;
  findByDepartment(department: string, pagination?: PaginationParams): Promise<PaginatedResponse<Employee>>;
  findByManager(managerId: EmployeeId): Promise<Employee[]>;
  findDirectReports(managerId: EmployeeId): Promise<Employee[]>;
  
  // Organizational queries
  findActiveEmployees(pagination?: PaginationParams): Promise<PaginatedResponse<Employee>>;
  findInactiveEmployees(pagination?: PaginationParams): Promise<PaginatedResponse<Employee>>;
  findByLocation(location: string): Promise<Employee[]>;
  findByGrade(grade: string): Promise<Employee[]>;
  
  // Write operations
  save(employee: Employee): Promise<Employee>;
  update(id: EmployeeId, employee: Partial<Employee>): Promise<Employee>;
  delete(id: EmployeeId): Promise<void>;
  
  // Bulk operations
  saveMany(employees: Employee[]): Promise<Employee[]>;
  updateMany(updates: { id: EmployeeId; data: Partial<Employee> }[]): Promise<Employee[]>;
  
  // Statistics and aggregations
  countByDepartment(): Promise<Record<string, number>>;
  countByLocation(): Promise<Record<string, number>>;
  countByGrade(): Promise<Record<string, number>>;
  getTotalCount(): Promise<number>;
  getActiveCount(): Promise<number>;
} 