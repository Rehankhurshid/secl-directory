import fs from 'fs';
import csv from 'csv-parser';
import pkg from 'pg';
const { Pool } = pkg;
import { v4 as uuidv4 } from 'uuid';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function clearEmployees() {
  try {
    await pool.query('DELETE FROM employees');
    console.log('✓ Cleared existing employees');
  } catch (error) {
    console.error('Error clearing employees:', error);
  }
}

async function importEmployees() {
  const employees = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('attached_assets/employees_1752586823148.csv')
      .pipe(csv())
      .on('data', (row) => {
        // Map CSV fields to database schema
        const employee = {
          id: uuidv4(),
          employeeId: row.employee_id,
          name: row.name,
          email: row.email_id || row.email || null,
          designation: row.designation,
          department: row.department,
          location: row.location,
          areaName: row.area_name,
          unitName: row.unit_name,
          dateOfBirth: row.dob || null,
          fatherName: row.father_name,
          phoneNumber: row.phno_1 || null,
          phoneNumber2: row.phno_2 || null,
          gender: row.gender,
          presentAddress: row.present_address || null,
          permanentAddress: row.permanent_address || null,
          bloodGroup: row.blood_group || null,
          grade: row.grade,
          category: row.category,
          discipline: row.discipline,
          bankAccNo: row.bank_acc_no || null,
          bank: row.bank || null,
          aadhaar: row.aadhaar || null,
          panNo: row.pan_no || null,
          caste: row.caste_code || null,
          religion: row.religion_code || null,
          maritalStatus: row.marital_status_code || null,
          spouseName: row.spouse_name || null,
          spouseEmpCode: row.spouse_emp_code || null,
          basicSalary: row.basic ? parseFloat(row.basic) : null,
          role: row.employee_id === 'ADMIN001' ? 'admin' : 'employee',
          profileImage: row.profile_image || null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        employees.push(employee);
      })
      .on('end', () => {
        console.log(`✓ Parsed ${employees.length} employees from CSV`);
        resolve(employees);
      })
      .on('error', reject);
  });
}

async function insertEmployees(employees) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const employee of employees) {
      const query = `
        INSERT INTO employees (
          id, employee_id, name, email, designation, department, location,
          area_name, unit_name, date_of_birth, father_name, phone_number,
          phone_number_2, gender, present_address, permanent_address,
          blood_group, grade, category, discipline, bank_acc_no, bank,
          aadhaar, pan_no, caste, religion, marital_status, spouse_name,
          spouse_emp_code, basic_salary, role, profile_image, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
          $29, $30, $31, $32, $33, $34
        )
      `;
      
      await client.query(query, [
        employee.id, employee.employeeId, employee.name, employee.email,
        employee.designation, employee.department, employee.location,
        employee.areaName, employee.unitName, employee.dateOfBirth,
        employee.fatherName, employee.phoneNumber, employee.phoneNumber2,
        employee.gender, employee.presentAddress, employee.permanentAddress,
        employee.bloodGroup, employee.grade, employee.category,
        employee.discipline, employee.bankAccNo, employee.bank,
        employee.aadhaar, employee.panNo, employee.caste, employee.religion,
        employee.maritalStatus, employee.spouseName, employee.spouseEmpCode,
        employee.basicSalary, employee.role, employee.profileImage,
        employee.createdAt, employee.updatedAt
      ]);
    }
    
    await client.query('COMMIT');
    console.log(`✓ Successfully imported ${employees.length} employees`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error importing employees:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('Starting employee import...');
    
    await clearEmployees();
    const employees = await importEmployees();
    await insertEmployees(employees);
    
    console.log('✓ Employee import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

main();