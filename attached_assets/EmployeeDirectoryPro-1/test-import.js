import { Pool, neonConfig } from '@neondatabase/serverless';
import { v4 as uuidv4 } from 'uuid';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testImport() {
  const client = await pool.connect();
  
  try {
    // Insert a test employee
    await client.query(`
      INSERT INTO employees (
        id, employee_id, name, email, designation, department, 
        location, role, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      uuidv4(),
      'TEST001',
      'Test Employee',
      'test@example.com',
      'Software Engineer',
      'IT',
      'Head Office',
      'employee',
      new Date(),
      new Date()
    ]);
    
    console.log('✓ Test employee inserted successfully');
    
    // Check count
    const result = await client.query('SELECT COUNT(*) FROM employees');
    console.log(`Total employees: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
  }
}

testImport().then(() => process.exit(0));