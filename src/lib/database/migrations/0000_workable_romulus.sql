CREATE TABLE IF NOT EXISTS "areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"unit_code" varchar(10) NOT NULL,
	"area_name" varchar(100) NOT NULL,
	"unit_name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "areas_unit_code_unique" UNIQUE("unit_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"dept_code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"parent_dept_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "departments_dept_code_unique" UNIQUE("dept_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "designations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(100) NOT NULL,
	"grade" varchar(20),
	"category" varchar(50),
	"discipline" varchar(50),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "designations_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "employee_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"action" varchar(20) NOT NULL,
	"changed_fields" text,
	"old_values" text,
	"new_values" text,
	"changed_by" varchar(50),
	"changed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"emp_code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"father_name" varchar(255),
	"dob" date,
	"gender" varchar(1),
	"email_id" varchar(255),
	"phone_1" varchar(20),
	"phone_2" varchar(20),
	"permanent_address" text,
	"present_address" text,
	"designation" varchar(100),
	"category" varchar(50),
	"grade" varchar(20),
	"discipline" varchar(50),
	"dt_appt" date,
	"area_joining_date" date,
	"grade_joining_date" date,
	"incr_date" date,
	"expected_exit_date" date,
	"company_posting_date" date,
	"area_name" varchar(100),
	"unit_code" varchar(10),
	"unit_name" varchar(100),
	"dept_code" varchar(10),
	"dept" varchar(100),
	"sub_dept" varchar(100),
	"blood_group" varchar(5),
	"caste_code" varchar(10),
	"religion_code" varchar(10),
	"marital_status_code" varchar(10),
	"spouse_name" varchar(255),
	"spouse_emp_code" varchar(50),
	"bank_acc_no" varchar(50),
	"bank" varchar(100),
	"basic_salary" numeric(10, 2),
	"hra" numeric(10, 2),
	"ncwa_basic" numeric(10, 2),
	"aadhaar_no" varchar(20),
	"pan_no" varchar(15),
	"is_active" boolean DEFAULT true,
	"pay_flag" varchar(1) DEFAULT 'Y',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "employees_emp_code_unique" UNIQUE("emp_code")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employee_audit_log" ADD CONSTRAINT "employee_audit_log_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emp_code_idx" ON "employees" USING btree ("emp_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "name_idx" ON "employees" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "department_idx" ON "employees" USING btree ("dept");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "designation_idx" ON "employees" USING btree ("designation");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "area_idx" ON "employees" USING btree ("area_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_idx" ON "employees" USING btree ("email_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "search_idx" ON "employees" USING btree ("name","emp_code","designation");