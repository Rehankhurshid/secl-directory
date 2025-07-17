import { Pool, neonConfig } from '@neondatabase/serverless';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import csv from 'csv-parser';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function clearEmployees() {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM employees');
    console.log('✓ Cleared existing employees');
  } finally {
    client.release();
  }
}

async function importEmployees() {
  return new Promise((resolve, reject) => {
    const employees = [];
    
    fs.createReadStream('attached_assets/employees_1752586823148.csv')
      .pipe(csv())
      .on('data', (row) => {
        // Only import first 100 employees for faster testing
        if (employees.length >= 100) return;
        
        const employee = {
          id: uuidv4(),
          employee_id: row.employee_id,
          name: row.name,
          email: row.email || null,
          phone: row.phno_1 || null,
          designation: row.designation,
          department: row.department,
          location: row.location,
          category: row.category || null,
          grade: row.grade || null,
          gender: row.gender || null,
          blood_group: row.blood_group || null,
          joining_date: null,
          profile_image: null,
          address: row.present_address || null,
          emergency_contact: null,
          manager: null,
          skills: null,
          is_active: true,
          role: 'employee',
          created_at: new Date(),
          updated_at: new Date(),
          area_name: row.area_name || null,
          birth_date: null,
          unit_name: row.unit_name || null,
          dob: row.dob || null,
          father_name: row.father_name || null,
          date_of_birth: row.dob || null,
          phone_number: row.phno_1 || null,
          phone_number_2: row.phno_2 || null,
          present_address: row.present_address || null,
          permanent_address: row.permanent_address || null,
          discipline: row.discipline || null,
          bank_acc_no: row.bank_acc_no || null,
          bank: row.bank || null,
          aadhaar: row.aadhaar || null,
          pan_no: row.pan_no || null,
          caste: row.caste_code || null,
          religion: row.religion_code || null,
          marital_status: row.marital_status_code || null,
          spouse_name: row.spouse_name || null,
          spouse_emp_code: row.spouse_emp_code || null,
          basic_salary: row.basic || null
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
    
    // Use batch insert for better performance
    const batchSize = 10;
    for (let i = 0; i < employees.length; i += batchSize) {
      const batch = employees.slice(i, i + batchSize);
      
      for (const employee of batch) {
        const query = `
          INSERT INTO employees (
            id, employee_id, name, email, phone, designation, department, location,
            category, grade, gender, blood_group, joining_date, profile_image,
            address, emergency_contact, manager, skills, is_active, role,
            created_at, updated_at, area_name, birth_date, unit_name, dob,
            father_name, date_of_birth, phone_number, phone_number_2,
            present_address, permanent_address, discipline, bank_acc_no,
            bank, aadhaar, pan_no, caste, religion, marital_status,
            spouse_name, spouse_emp_code, basic_salary
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
            $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43
          )
        `;
        
        await client.query(query, [
          employee.id, employee.employee_id, employee.name, employee.email,
          employee.phone, employee.designation, employee.department, employee.location,
          employee.category, employee.grade, employee.gender, employee.blood_group,
          employee.joining_date, employee.profile_image, employee.address,
          employee.emergency_contact, employee.manager, employee.skills,
          employee.is_active, employee.role, employee.created_at, employee.updated_at,
          employee.area_name, employee.birth_date, employee.unit_name, employee.dob,
          employee.father_name, employee.date_of_birth, employee.phone_number,
          employee.phone_number_2, employee.present_address, employee.permanent_address,
          employee.discipline, employee.bank_acc_no, employee.bank, employee.aadhaar,
          employee.pan_no, employee.caste, employee.religion, employee.marital_status,
          employee.spouse_name, employee.spouse_emp_code, employee.basic_salary
        ]);
      }
      
      console.log(`✓ Imported batch ${Math.ceil((i + batchSize) / batchSize)} of ${Math.ceil(employees.length / batchSize)}`);
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