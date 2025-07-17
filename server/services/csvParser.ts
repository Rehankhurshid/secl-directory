import fs from 'fs';
import path from 'path';
import type { InsertEmployee } from '@shared/schema';

export class CSVParser {
  private csvFilePath: string;

  constructor() {
    this.csvFilePath = path.resolve(process.cwd(), 'attached_assets', 'employees_1752596265899.csv');
  }

  async parseEmployeeCSV(): Promise<InsertEmployee[]> {
    try {
      const csvContent = await fs.promises.readFile(this.csvFilePath, 'utf-8');
      const lines = csvContent.split('\n');
      const headers = this.parseCSVLine(lines[0]);
      
      const employees: InsertEmployee[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = this.parseCSVLine(line);
        if (values.length < headers.length) continue;
        
        const employee: InsertEmployee = {
          employeeId: values[2] || '',
          name: values[1] || '',
          designation: values[3] || '',
          department: values[4] || '',
          email: values[5] || values[28] || '',
          location: values[6] || '',
          areaName: values[8] || '',
          unitName: values[9] || '',
          dob: values[10] || '',
          fatherName: values[11] || '',
          category: values[12] || '',
          grade: values[13] || '',
          discipline: values[14] || '',
          bankAccNo: values[15] || '',
          bank: values[16] || '',
          deptCode: values[18] || '',
          subDept: values[19] || '',
          phone1: values[29] || '',
          phone2: values[30] || '',
          gender: values[31] || '',
          presentAddress: values[32] || '',
          permanentAddress: values[33] || '',
          spouseName: values[34] || '',
          bloodGroup: values[48] || '',
        };
        
        employees.push(employee);
      }
      
      return employees;
    } catch (error) {
      console.error('Error parsing CSV:', error);
      throw new Error('Failed to parse employee CSV file');
    }
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
      
      i++;
    }
    
    values.push(current.trim());
    return values;
  }

  getEmployeeStats(employees: InsertEmployee[]) {
    const stats = {
      total: employees.length,
      departments: new Map<string, number>(),
      locations: new Map<string, number>(),
      grades: new Map<string, number>(),
    };

    employees.forEach(employee => {
      // Count departments
      const dept = employee.department;
      stats.departments.set(dept, (stats.departments.get(dept) || 0) + 1);

      // Count locations
      const location = employee.location;
      stats.locations.set(location, (stats.locations.get(location) || 0) + 1);

      // Count grades
      const grade = employee.grade;
      stats.grades.set(grade, (stats.grades.get(grade) || 0) + 1);
    });

    return {
      total: stats.total,
      departments: Array.from(stats.departments.entries()).map(([name, count]) => ({ name, count })),
      locations: Array.from(stats.locations.entries()).map(([name, count]) => ({ name, count })),
      grades: Array.from(stats.grades.entries()).map(([name, count]) => ({ name, count })),
    };
  }
}
