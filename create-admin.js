import { db } from './server/db.ts';
import { employees } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

async function createAdminUser() {
  try {
    // First, check if an admin user already exists
    const existingAdmin = await db.select().from(employees).where(eq(employees.role, 'admin')).limit(1);
    
    if (existingAdmin.length > 0) {
      console.log('Admin user already exists:', existingAdmin[0].name);
      return existingAdmin[0];
    }

    // Create admin user
    const adminUser = {
      employeeId: 'ADMIN001',
      name: 'System Administrator',
      designation: 'System Administrator',
      department: 'IT',
      location: 'Head Office',
      areaName: 'Administration',
      unitName: 'IT Department',
      email: 'admin@secl.com',
      phone1: '9876543210',
      phone2: null,
      grade: 'E-9',
      category: 'Executive',
      discipline: 'Information Technology',
      bankAccNo: null,
      bank: null,
      deptCode: 'IT',
      subDept: 'System Administration',
      dob: null,
      fatherName: null,
      permanentAddress: null,
      presentAddress: null,
      spouseName: null,
      gender: null,
      bloodGroup: null,
      profileImage: null,
      role: 'admin',
      createdAt: new Date()
    };

    const result = await db.insert(employees).values(adminUser).returning();
    console.log('Admin user created successfully:', result[0]);
    return result[0];
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

async function main() {
  try {
    await createAdminUser();
    console.log('Admin user setup completed');
    process.exit(0);
  } catch (error) {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  }
}

main();