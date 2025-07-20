const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

(async () => {
  try {
    // Get total count
    const total = await sql`SELECT COUNT(*) as count FROM employees`;
    console.log('✅ Total employees in database:', total[0].count);
    
    // Check by department
    const deptCounts = await sql`
      SELECT dept, COUNT(*) as count 
      FROM employees 
      GROUP BY dept 
      ORDER BY count DESC
      LIMIT 10
    `;
    
    console.log('\n📊 Top 10 departments by employee count:');
    deptCounts.forEach(d => {
      console.log(`  ${d.dept || 'No Department'}: ${d.count} employees`);
    });
    
    // Check areas
    const areaCounts = await sql`
      SELECT area_name, unit_name, COUNT(*) as count 
      FROM employees 
      GROUP BY area_name, unit_name
      ORDER BY count DESC
    `;
    
    console.log('\n🏢 Employees by area:');
    areaCounts.forEach(a => {
      console.log(`  ${a.area_name} - ${a.unit_name}: ${a.count} employees`);
    });
    
    // Check HRA field handling
    const hraStats = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE hra IS NULL) as null_hra,
        COUNT(*) FILTER (WHERE hra IS NOT NULL) as has_hra,
        COUNT(*) as total
      FROM employees
    `;
    
    console.log('\n💰 HRA field statistics:');
    console.log(`  Employees with numeric HRA: ${hraStats[0].has_hra}`);
    console.log(`  Employees with text HRA (stored as NULL): ${hraStats[0].null_hra}`);
    console.log(`  Total: ${hraStats[0].total}`);
    
    // Check date fields
    const dateStats = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE dob IS NOT NULL) as has_dob,
        COUNT(*) FILTER (WHERE date_of_appointment IS NOT NULL) as has_appointment
      FROM employees
    `;
    
    console.log('\n📅 Date field statistics:');
    console.log(`  Employees with DOB: ${dateStats[0].has_dob}`);
    console.log(`  Employees with appointment date: ${dateStats[0].has_appointment}`);
    
    // Sample data
    const samples = await sql`
      SELECT emp_code, name, designation, dept, area_name
      FROM employees 
      ORDER BY emp_code
      LIMIT 5
    `;
    
    console.log('\n👥 First 5 employees (by emp_code):');
    samples.forEach(e => {
      console.log(`  ${e.emp_code}: ${e.name}`);
      console.log(`    ${e.designation} | ${e.dept} | ${e.area_name}`);
    });
    
    // Check for duplicates
    const duplicates = await sql`
      SELECT emp_code, COUNT(*) as count
      FROM employees
      GROUP BY emp_code
      HAVING COUNT(*) > 1
    `;
    
    console.log('\n🔍 Duplicate check:');
    if (duplicates.length === 0) {
      console.log('  ✅ No duplicate employee codes found!');
    } else {
      console.log('  ❌ Found duplicates:', duplicates);
    }
    
    await sql.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();