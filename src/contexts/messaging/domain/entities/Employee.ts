export class Employee {
  constructor(
    public readonly empCode: string,
    public readonly name: string,
    public readonly designation: string,
    public readonly department: string,
    public readonly location: string,
    public readonly email: string,
    public readonly phone?: string,
    public readonly profileImage?: string,
    public readonly grade?: string,
    public readonly category?: string,
    public readonly gender?: string,
    public readonly bloodGroup?: string,
    public readonly isActive: boolean = true,
    public readonly lastSeenAt?: Date,
    public readonly status: EmployeeStatus = EmployeeStatus.OFFLINE
  ) {}

  getDisplayName(): string {
    return this.name;
  }

  getInitials(): string {
    return this.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  isOnline(): boolean {
    return this.status === EmployeeStatus.ONLINE;
  }

  isAvailable(): boolean {
    return this.status === EmployeeStatus.ONLINE || this.status === EmployeeStatus.AWAY;
  }

  updateStatus(status: EmployeeStatus): Employee {
    return new Employee(
      this.empCode,
      this.name,
      this.designation,
      this.department,
      this.location,
      this.email,
      this.phone,
      this.profileImage,
      this.grade,
      this.category,
      this.gender,
      this.bloodGroup,
      this.isActive,
      new Date(),
      status
    );
  }

  updateLastSeen(): Employee {
    return new Employee(
      this.empCode,
      this.name,
      this.designation,
      this.department,
      this.location,
      this.email,
      this.phone,
      this.profileImage,
      this.grade,
      this.category,
      this.gender,
      this.bloodGroup,
      this.isActive,
      new Date(),
      this.status
    );
  }

  canCreateGroups(): boolean {
    // Business logic for who can create groups
    return this.isActive;
  }

  canManageGroups(): boolean {
    // Business logic for group management permissions
    return this.isActive && (this.grade === 'A' || this.designation.includes('Manager'));
  }
}

export enum EmployeeStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  OFFLINE = 'offline'
}

// Type for integrating with existing employee data
export interface EmployeeData {
  empCode: string;
  name: string;
  designation: string;
  department: string;
  location: string;
  email: string;
  phone?: string;
  profileImage?: string;
  grade?: string;
  category?: string;
  gender?: string;
  bloodGroup?: string;
}

export function fromEmployeeData(data: EmployeeData): Employee {
  return new Employee(
    data.empCode,
    data.name,
    data.designation,
    data.department,
    data.location,
    data.email,
    data.phone,
    data.profileImage,
    data.grade,
    data.category,
    data.gender,
    data.bloodGroup
  );
} 