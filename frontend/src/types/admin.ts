export interface Team {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  subteam?: SubTeam[];
  user?: User[];
}

export interface SubTeam {
  id: number;
  name: string;
  description?: string;
  teamId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  teams?: Team;
  user?: User[];
}

export interface Position {
  id: number;
  name: string;
  description?: string;
  roleId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  user?: User[];
}

export interface User {
  id: string;
  userId: string;
  name: string;
  email: string;
  roleId?: number;
  teamId?: number;
  subTeamId?: number;
  positionId?: number;
  leadId?: string;
  hrId?: string;
  profilePhoto?: string;
  createdAt: string;
  role?: Role;
  position?: Position;
  Team?: Team;
  SubTeam?: SubTeam;
}

export interface Role {
  id: number;
  name: string;
}

export interface OrganizationStats {
  teams: {
    active: number;
    deleted: number;
    total: number;
  };
  subTeams: {
    active: number;
    deleted: number;
    total: number;
  };
  positions: {
    active: number;
    deleted: number;
    total: number;
  };
  users: {
    active: number;
    inactive: number;
    total: number;
  };
  skills: {
    active: number;
    total: number;
  };
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
}

export interface CreateSubTeamRequest {
  name: string;
  description?: string;
  teamId: number;
}

export interface UpdateSubTeamRequest {
  name?: string;
  description?: string;
  teamId?: number;
}

export interface CreatePositionRequest {
  name: string;
  roleId?: number;
}

export interface UpdatePositionRequest {
  name?: string;
  description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface UserData {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  profilePhoto?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  role?: {
    id: number;
    name: string;
  };
  position?: {
    id: number;
    name: string;
  };
  Team?: {
    id: number;
    name: string;
  };
  subTeam?: {
    id: number;
    name: string;
  };
  lead?: {
    id: number;
    name: string;
    userId: string;
  };
  hr?: {
    id: number;
    name: string;
    userId: string;
  };
  leadId?: number;
  hrId?: number;
  roleId: number;
  positionId: number;
  teamId: number;
  subTeamId?: number;
  skills?: Array<{
    id: number;
    name: string;
    level: number;
    lastAssessed?: string;
  }>;
}

export interface Team {
  id: number;
  name: string;
}

export interface SubTeam {
  id: number;
  name: string;
  teamId: number;
}

export interface Role {
  id: number;
  name: string;
}

export interface CreateUserRequest {
  userId: string;
  name: string;
  email?: string;
  roleId: number;
  positionId: number;
  teamId: number;
  subTeamId?: number;
  leadId?: number;
  hrId?: number;
  isActive?: boolean;
}

export interface UserData {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  profilePhoto?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  role?: {
    id: number;
    name: string;
  };
  position?: {
    id: number;
    name: string;
  };
  Team?: {
    id: number;
    name: string;
  };
  subTeam?: {
    id: number;
    name: string;
  };
  lead?: {
    id: number;
    name: string;
    userId: string;
  };
  hr?: {
    id: number;
    name: string;
    userId: string;
  };
  skills?: Array<{
    id: number;
    name: string;
    level: number;
    lastAssessed?: string;
  }>;
}

export interface Skill {
  id: number;
  name: string;
  basic: string;
  low: string;
  medium: string;
  high: string;
  expert: string;
  positionId: number;
}