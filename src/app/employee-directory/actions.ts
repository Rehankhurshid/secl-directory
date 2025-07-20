'use server';

import { EmployeeService } from '@/lib/services/employee-service';

export async function getEmployeeByCode(empCode: string) {
  try {
    const employee = await EmployeeService.getEmployeeByCode(empCode);
    
    if (employee) {
      return {
        success: true,
        data: employee
      };
    }
    
    return { success: false, error: 'Employee not found' };
  } catch (error) {
    console.error('Error fetching employee:', error);
    return { success: false, error: 'Failed to fetch employee details' };
  }
}