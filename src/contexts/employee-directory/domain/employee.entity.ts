import { EmployeeId, DepartmentId } from '@/types';

export class Employee {
  constructor(
    private readonly id: EmployeeId,
    private readonly employeeId: string,
    private readonly name: string,
    private readonly email: string,
    private readonly department: string,
    private readonly designation: string,
    private readonly isActive: boolean = true,
    private readonly phoneNumber?: string,
    private readonly profileImage?: string,
    private readonly managerId?: EmployeeId,
    private readonly location?: string,
    private readonly grade?: string,
    private readonly joinDate?: Date,
    private readonly createdAt: Date = new Date(),
    private readonly updatedAt: Date = new Date()
  ) {
    this.validateEmployee();
  }

  // Getters
  getId(): EmployeeId {
    return this.id;
  }

  getEmployeeId(): string {
    return this.employeeId;
  }

  getName(): string {
    return this.name;
  }

  getEmail(): string {
    return this.email;
  }

  getDepartment(): string {
    return this.department;
  }

  getDesignation(): string {
    return this.designation;
  }

  getPhoneNumber(): string | undefined {
    return this.phoneNumber;
  }

  getProfileImage(): string | undefined {
    return this.profileImage;
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  getManagerId(): EmployeeId | undefined {
    return this.managerId;
  }

  getLocation(): string | undefined {
    return this.location;
  }

  getGrade(): string | undefined {
    return this.grade;
  }

  getJoinDate(): Date | undefined {
    return this.joinDate;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Business logic methods
  getDisplayName(): string {
    return this.name.toUpperCase();
  }

  getInitials(): string {
    return this.name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  canSendMessageTo(recipient: Employee): boolean {
    // Business rule: Active employees can send messages to other active employees
    return this.isActive && recipient.getIsActive();
  }

  canManage(employee: Employee): boolean {
    // Business rule: An employee can manage if they are the manager of the given employee
    return employee.getManagerId() === this.id;
  }

  isInSameDepartment(employee: Employee): boolean {
    return this.department === employee.getDepartment();
  }

  isSeniorTo(employee: Employee): boolean {
    // Simple seniority check based on join date
    const employeeJoinDate = employee.getJoinDate();
    if (!this.joinDate || !employeeJoinDate) {
      return false;
    }
    return this.joinDate < employeeJoinDate;
  }

  getYearsOfExperience(): number {
    if (!this.joinDate) return 0;
    
    const now = new Date();
    const diff = now.getTime() - this.joinDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  }

  // Validation methods
  private validateEmployee(): void {
    if (!this.name.trim()) {
      throw new Error('Employee name cannot be empty');
    }

    if (!this.isValidEmail(this.email)) {
      throw new Error('Invalid email format');
    }

    if (!this.employeeId.trim()) {
      throw new Error('Employee ID cannot be empty');
    }

    if (!this.department.trim()) {
      throw new Error('Department cannot be empty');
    }

    if (!this.designation.trim()) {
      throw new Error('Designation cannot be empty');
    }

    if (this.phoneNumber && !this.isValidPhoneNumber(this.phoneNumber)) {
      throw new Error('Invalid phone number format');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhoneNumber(phone: string): boolean {
    // Remove all non-digits and check if it's 10 digits
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10;
  }

  // Factory methods
  static create(data: {
    id: EmployeeId;
    employeeId: string;
    name: string;
    email: string;
    department: string;
    designation: string;
    isActive?: boolean;
    phoneNumber?: string;
    profileImage?: string;
    managerId?: EmployeeId;
    location?: string;
    grade?: string;
    joinDate?: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }): Employee {
    return new Employee(
      data.id,
      data.employeeId,
      data.name,
      data.email,
      data.department,
      data.designation,
      data.isActive,
      data.phoneNumber,
      data.profileImage,
      data.managerId,
      data.location,
      data.grade,
      data.joinDate,
      data.createdAt,
      data.updatedAt
    );
  }

  // Serialization
  toJSON() {
    return {
      id: this.id,
      employeeId: this.employeeId,
      name: this.name,
      email: this.email,
      department: this.department,
      designation: this.designation,
      isActive: this.isActive,
      phoneNumber: this.phoneNumber,
      profileImage: this.profileImage,
      managerId: this.managerId,
      location: this.location,
      grade: this.grade,
      joinDate: this.joinDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
} 