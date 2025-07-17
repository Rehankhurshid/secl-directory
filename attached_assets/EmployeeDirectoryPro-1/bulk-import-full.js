import fs from 'fs';
import csvParser from 'csv-parser';
import { db } from './server/db.ts';
import { employees } from './shared/schema.ts';
import { v4 as uuidv4 } from 'uuid';

const csvPath = './attached_assets/employees_1752588492501.csv';

async function clearEmployees() {
  console.log('Clearing existing employees...');
  await db.delete(employees);
  console.log('Employees cleared');
}

async function importEmployees() {
  console.log('Starting employee import...');
  
  const employeeData = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csvParser({
        skipEmptyLines: true,
        skipLinesWithError: true
      }))
      .on('data', (row) => {
        // Skip header row (first row)
        if (row.id === 'id' || row[0] === 'id') {
          return;
        }
        
        // Get values by index since headers aren't working
        const id = row.id || row[0];
        const name = row.name || row[1];
        const employeeId = row.employee_id || row[2];
        const designation = row.designation || row[3];
        const department = row.department || row[4];
        const email = row.email || row[5];
        const location = row.location || row[6];
        const areaName = row.area_name || row[8];
        const unitName = row.unit_name || row[9];
        const dateOfBirth = row.dob || row[10];
        const fatherName = row.father_name || row[11];
        const category = row.category || row[12];
        const grade = row.grade || row[13];
        const discipline = row.discipline || row[14];
        const phno1 = row.phno_1 || row[29];
        const phno2 = row.phno_2 || row[30];
        const gender = row.gender || row[31];
        const presentAddress = row.present_address || row[32];
        const permanentAddress = row.permanent_address || row[33];
        const bloodGroup = row.blood_group || row[48];
        
        // Skip empty rows
        if (!employeeId || !name) {
          return;
        }
        
        // Transform CSV data to match our schema
        const employee = {
          id: uuidv4(), // Generate new UUID
          employeeId: employeeId,
          name: name,
          email: email || null,
          designation: designation || 'Employee',
          department: department || 'General',
          location: location || 'Unknown',
          areaName: areaName,
          unitName: unitName,
          dateOfBirth: dateOfBirth,
          fatherName: fatherName,
          category: category,
          grade: grade,
          discipline: discipline,
          phno1: phno1,
          phno2: phno2,
          gender: gender,
          presentAddress: presentAddress,
          permanentAddress: permanentAddress,
          bloodGroup: bloodGroup,
          role: 'employee',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        employeeData.push(employee);
      })
      .on('end', async () => {
        try {
          console.log(`Processing ${employeeData.length} employees...`);
          
          // Insert in batches of 100
          const batchSize = 100;
          for (let i = 0; i < employeeData.length; i += batchSize) {
            const batch = employeeData.slice(i, i + batchSize);
            await db.insert(employees).values(batch);
            console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(employeeData.length / batchSize)}`);
          }
          
          console.log('Employee import completed successfully!');
          resolve();
        } catch (error) {
          console.error('Error during import:', error);
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function createAdminUser() {
  console.log('Creating ADMIN001 user...');
  
  const adminUser = {
    id: uuidv4(),
    employeeId: 'ADMIN001',
    name: 'System Administrator',
    email: 'admin@company.com',
    designation: 'System Administrator',
    department: 'IT',
    location: 'Head Office',
    areaName: 'Head Office',
    unitName: 'IT Department',
    dateOfBirth: '1980-01-01',
    fatherName: 'System Admin',
    category: 'ADMIN',
    grade: 'A+',
    discipline: 'System Administration',
    gender: 'M',
    role: 'admin',
    phno1: '9999999999',
    presentAddress: 'Head Office',
    permanentAddress: 'Head Office',
    bloodGroup: 'O+',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  await db.insert(employees).values(adminUser);
  console.log('ADMIN001 user created successfully!');
}

async function main() {
  try {
    await clearEmployees();
    await importEmployees();
    await createAdminUser();
    console.log('Full import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

main();