import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import fs from "fs";
import { parse } from "csv-parse/sync";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Function to parse dates safely
function parseDate(dateStr) {
  if (!dateStr || dateStr === "null" || dateStr.trim() === "") return null;

  try {
    // Handle MM/DD/YYYY format
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const [month, day, year] = parts;
      return new Date(year, month - 1, day);
    }
    return new Date(dateStr);
  } catch (error) {
    return null;
  }
}

// Function to safely parse numbers
function parseNumber(numStr) {
  if (!numStr || numStr === "null" || numStr.trim() === "") return null;
  const parsed = parseFloat(numStr);
  return isNaN(parsed) ? null : parsed;
}

async function analyzeAndUpdateEmployees() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL not found in environment variables");
    process.exit(1);
  }

  const client = postgres(connectionString, {
    max: 1, // Use single connection for transactions
    idle_timeout: 20,
    connect_timeout: 10,
  });

  const db = drizzle(client);

  try {
    console.log("📊 Step 1: Reading CSV file...\n");

    // Read and parse CSV file
    const csvPath =
      "/Users/nayyarkhurshid/Desktop/SECL Cursor/instructions/employee-sheet.csv";
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`✅ CSV loaded: ${records.length} employee records`);

    // Check current database state
    console.log("\n📊 Step 2: Checking current database...\n");
    const currentCount = await db.execute(
      sql`SELECT COUNT(*) as count FROM employees`
    );
    console.log(`📈 Current database: ${currentCount[0].count} employees`);

    // Check for blood group data in CSV
    console.log("\n🩸 Step 3: Blood Group Analysis in CSV...\n");
    const bloodGroupAnalysis = {};
    let totalWithBloodGroup = 0;

    records.forEach((record) => {
      const bloodGroup = record.blood;
      if (bloodGroup && bloodGroup.trim() !== "" && bloodGroup !== "null") {
        const cleanBloodGroup = bloodGroup.trim();
        bloodGroupAnalysis[cleanBloodGroup] =
          (bloodGroupAnalysis[cleanBloodGroup] || 0) + 1;
        totalWithBloodGroup++;
      }
    });

    console.log("Blood Group Distribution in CSV:");
    Object.entries(bloodGroupAnalysis)
      .sort(([, a], [, b]) => b - a)
      .forEach(([group, count]) => {
        console.log(`  ${group}: ${count} employees`);
      });

    console.log(
      `\nTotal employees with blood group: ${totalWithBloodGroup}/${records.length}`
    );

    // Check if we should proceed with update
    console.log("\n⚠️  Ready to update database...");
    console.log(
      `This will replace ${currentCount[0].count} records with ${records.length} new records.`
    );
    console.log("This will significantly improve blood group data!");
    console.log("Continuing in 5 seconds...");

    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log("\n🔄 Step 4: Updating database...\n");

    // Use drizzle transaction
    await db.transaction(async (tx) => {
      // First, clear existing data
      console.log("🗑️  Clearing existing employee data...");
      await tx.execute(sql`TRUNCATE TABLE employees RESTART IDENTITY CASCADE`);

      console.log("📥 Inserting new employee data...");

      // Process records in smaller batches
      const batchSize = 50;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        for (const record of batch) {
          // Clean and validate data
          const cleanRecord = {
            empCode: record.emp_code || null,
            name: record.name || null,
            fatherName:
              record.father_name === "null" ? null : record.father_name,
            dob: parseDate(record.dob),
            gender: record.gender === "null" ? null : record.gender,
            emailId: record.email_id === "null" ? null : record.email_id,
            phoneNumber1: record.phno_1 === "null" ? null : record.phno_1,
            phoneNumber2: record.phno_2 === "null" ? null : record.phno_2,
            permanentAddress:
              record.permanent_address === "null"
                ? null
                : record.permanent_address,
            presentAddress:
              record.present_address === "null" ? null : record.present_address,
            designation: record.designation || null,
            category: record.category || null,
            grade: record.grade || null,
            discipline: record.discipline || null,
            dateOfAppointment: parseDate(record.dt_appt),
            areaJoiningDate: parseDate(record.area_joining_date),
            gradeJoiningDate: parseDate(record.grade_joining_date),
            incrementDate: parseDate(record.incr_date),
            expectedExitDate: parseDate(record.expected_exit_date),
            companyPostingDate: parseDate(record.company_posting_date),
            areaName: record.area_name || null,
            unitCode: record.unit_code || null,
            unitName: record.unit_name || null,
            deptCode: record.dept_code || null,
            department: record.dept || null,
            subDepartment: record.sub_dept === "null" ? null : record.sub_dept,
            bloodGroup: record.blood === "null" ? null : record.blood,
            casteCode: record.caste_code === "null" ? null : record.caste_code,
            religionCode:
              record.religion_code === "null" ? null : record.religion_code,
            maritalStatusCode:
              record.marital_status_code === "null"
                ? null
                : record.marital_status_code,
            spouseName:
              record.spouse_name === "null" ? null : record.spouse_name,
            spouseEmpCode:
              record.spouse_emp_code === "null" ? null : record.spouse_emp_code,
            bankAccountNo: record.bank_acc_no || null,
            bankName: record.bank || null,
            aadhaar: record.aadhaar || null,
            panNo: record.pan_no || null,
            hra: parseNumber(record.hra),
            basic: parseNumber(record.basic),
            ncwaBasic: parseNumber(record.ncwa_basic),
          };

          // Insert record using parameterized query
          await tx.execute(sql`
            INSERT INTO employees (
              emp_code, name, father_name, dob, gender, email_id, phone_1, phone_2,
              permanent_address, present_address, designation, category, grade, discipline,
              dt_appt, area_joining_date, grade_joining_date, incr_date, expected_exit_date,
              company_posting_date, area_name, unit_code, unit_name, dept_code, dept,
              sub_dept, blood_group, caste_code, religion_code, marital_status_code,
              spouse_name, spouse_emp_code, bank_acc_no, bank, aadhaar_no, pan_no,
              hra, basic_salary, ncwa_basic
            ) VALUES (
              ${cleanRecord.empCode}, ${cleanRecord.name}, ${cleanRecord.fatherName},
              ${cleanRecord.dob}, ${cleanRecord.gender}, ${cleanRecord.emailId},
              ${cleanRecord.phoneNumber1}, ${cleanRecord.phoneNumber2},
              ${cleanRecord.permanentAddress}, ${cleanRecord.presentAddress},
              ${cleanRecord.designation}, ${cleanRecord.category}, ${cleanRecord.grade},
              ${cleanRecord.discipline}, ${cleanRecord.dateOfAppointment},
              ${cleanRecord.areaJoiningDate}, ${cleanRecord.gradeJoiningDate},
              ${cleanRecord.incrementDate}, ${cleanRecord.expectedExitDate},
              ${cleanRecord.companyPostingDate}, ${cleanRecord.areaName},
              ${cleanRecord.unitCode}, ${cleanRecord.unitName}, ${cleanRecord.deptCode},
              ${cleanRecord.department}, ${cleanRecord.subDepartment},
              ${cleanRecord.bloodGroup}, ${cleanRecord.casteCode},
              ${cleanRecord.religionCode}, ${cleanRecord.maritalStatusCode},
              ${cleanRecord.spouseName}, ${cleanRecord.spouseEmpCode},
              ${cleanRecord.bankAccountNo}, ${cleanRecord.bankName},
              ${cleanRecord.aadhaar}, ${cleanRecord.panNo}, ${cleanRecord.hra},
              ${cleanRecord.basic}, ${cleanRecord.ncwaBasic}
            )
          `);
        }

        console.log(
          `  ✅ Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)} (${Math.min(i + batchSize, records.length)}/${records.length} records)`
        );
      }
    });

    console.log("\n✅ Database update completed successfully!");

    // Verify the update
    const newCount = await db.execute(
      sql`SELECT COUNT(*) as count FROM employees`
    );
    console.log(`📊 New database count: ${newCount[0].count} employees`);

    // Re-analyze blood groups in database
    console.log("\n🩸 Updated Blood Group Distribution in Database:");
    const bloodGroupResult = await db.execute(sql`
      SELECT blood_group, COUNT(*) as count
      FROM employees 
      WHERE blood_group IS NOT NULL AND blood_group != ''
      GROUP BY blood_group 
      ORDER BY count DESC
    `);

    let dbBloodGroupTotal = 0;
    bloodGroupResult.forEach((row) => {
      dbBloodGroupTotal += parseInt(row.count);
      console.log(`  ${row.blood_group}: ${row.count} employees`);
    });

    console.log(`\n📈 Summary:`);
    console.log(`  - Total employees: ${newCount[0].count}`);
    console.log(`  - Employees with blood group: ${dbBloodGroupTotal}`);
    console.log(
      `  - Blood group coverage: ${((dbBloodGroupTotal / newCount[0].count) * 100).toFixed(2)}%`
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.end();
  }
}

analyzeAndUpdateEmployees();
