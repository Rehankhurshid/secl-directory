export class Conversation {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public readonly type: ConversationType = ConversationType.GROUP,
    public readonly members: ConversationMember[] = [],
    public readonly isArchived: boolean = false,
    public readonly description?: string,
    public readonly lastMessageId?: string,
    public readonly lastMessageAt?: Date,
    public readonly avatar?: string
  ) {}

  addMember(employeeId: string, addedBy: string, role: MemberRole = MemberRole.MEMBER): Conversation {
    if (this.isMember(employeeId)) {
      return this; // Already a member
    }

    const newMember: ConversationMember = {
      employeeId,
      role,
      joinedAt: new Date(),
      addedBy
    };

    return new Conversation(
      this.id,
      this.name,
      this.createdBy,
      this.createdAt,
      this.type,
      [...this.members, newMember],
      this.isArchived,
      this.description,
      this.lastMessageId,
      this.lastMessageAt,
      this.avatar
    );
  }

  removeMember(employeeId: string): Conversation {
    return new Conversation(
      this.id,
      this.name,
      this.createdBy,
      this.createdAt,
      this.type,
      this.members.filter(m => m.employeeId !== employeeId),
      this.isArchived,
      this.description,
      this.lastMessageId,
      this.lastMessageAt,
      this.avatar
    );
  }

  updateLastMessage(messageId: string, timestamp: Date): Conversation {
    return new Conversation(
      this.id,
      this.name,
      this.createdBy,
      this.createdAt,
      this.type,
      this.members,
      this.isArchived,
      this.description,
      messageId, // This is now string, not undefined
      timestamp, // This is now Date, not undefined
      this.avatar
    );
  }

  isMember(employeeId: string): boolean {
    return this.members.some(m => m.employeeId === employeeId);
  }

  isAdmin(employeeId: string): boolean {
    const member = this.members.find(m => m.employeeId === employeeId);
    return member?.role === MemberRole.ADMIN || this.createdBy === employeeId;
  }

  canAddMembers(employeeId: string): boolean {
    return this.isAdmin(employeeId);
  }

  canRemoveMembers(employeeId: string): boolean {
    return this.isAdmin(employeeId);
  }

  getMemberCount(): number {
    return this.members.length;
  }

  getActiveMembers(): ConversationMember[] {
    return this.members.filter(m => !m.leftAt);
  }
}

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
  BROADCAST = 'broadcast'
}

export enum MemberRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MEMBER = 'member'
}

export interface ConversationMember {
  employeeId: string;
  role: MemberRole;
  joinedAt: Date;
  leftAt?: Date;
  addedBy: string;
  lastSeenAt?: Date;
}