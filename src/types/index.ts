import { Timestamp } from 'firebase/firestore';

export type ViewKey = 'dashboard' | 'projects' | 'tasks' | 'clients_work' | 'profile';

export type ProjectStatus = 'in_progress' | 'completed';
export type TaskStatus = 'todo' | 'completed';
export type CurrencyCode = 'TWD' | 'USD' | 'HKD' | 'JPY';

export const CURRENCIES: CurrencyCode[] = ['TWD', 'USD', 'HKD', 'JPY'];

// Synchronized verbatim with firebase-blueprint.json
export const BLUEPRINT_LIMITS = {
  ID_MAX: 128,
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  OPTIONAL_ID_PATTERN: /^[a-zA-Z0-9_-]*$/,
  DATE_MAX: 20,
  DATE_PATTERN: /^(\d{4}-\d{2}-\d{2})?$/,
  DISPLAY_NAME_MIN: 1,
  DISPLAY_NAME_MAX: 80,
  EMAIL_MAX: 160,
  TITLE_ROLE_MAX: 80,
  PHONE_MAX: 40,
  LOCATION_MAX: 80,
  WEBSITE_MAX: 200,
  BIO_MAX: 500,
  PHOTO_URL_MAX: 500,
  CLIENT_NAME_MIN: 1,
  CLIENT_NAME_MAX: 100,
  COMPANY_MAX: 100,
  NOTES_MAX: 500,
  PROJECT_NAME_MIN: 1,
  PROJECT_NAME_MAX: 120,
  TASK_TITLE_MIN: 1,
  TASK_TITLE_MAX: 140,
  WORKLOG_TITLE_MIN: 1,
  WORKLOG_TITLE_MAX: 140,
  DESCRIPTION_MAX: 500,
  STATUS_MAX: 20,
  HOURLY_RATE_MAX: 1000000,
  BUDGET_MAX: 100000000,
  HOURS_MAX: 1000,
} as const;

export const DEFAULT_AVATAR_PATH = '/src/assets/images/avatar_freelancer_default_1794908034915.jpg';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  title?: string;
  phone?: string;
  location?: string;
  website?: string;
  hourlyRate?: number;
  currency?: CurrencyCode;
  bio?: string;
  photoURL?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Client {
  id: string;
  ownerId: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  clientId?: string;
  clientName?: string;
  status: ProjectStatus;
  dueDate: string;
  budget?: number;
  description?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Task {
  id: string;
  ownerId: string;
  projectId?: string;
  projectName?: string;
  title: string;
  status: TaskStatus;
  dueDate: string;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface WorkLog {
  id: string;
  ownerId: string;
  title: string;
  projectId?: string;
  projectName?: string;
  clientName?: string;
  hours: number;
  workDate: string;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type ProjectInput = {
  name: string;
  clientId?: string;
  clientName?: string;
  status: ProjectStatus;
  dueDate: string;
  budget?: number;
  description?: string;
};

export type TaskInput = {
  projectId?: string;
  projectName?: string;
  title: string;
  status: TaskStatus;
  dueDate: string;
  notes?: string;
};

export type WorkLogInput = {
  title: string;
  projectId?: string;
  projectName?: string;
  clientName?: string;
  hours: number;
  workDate: string;
  notes?: string;
};

export type ClientInput = {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
};

export type ProfileInput = {
  displayName: string;
  email: string;
  title?: string;
  phone?: string;
  location?: string;
  website?: string;
  hourlyRate?: number;
  currency?: CurrencyCode;
  bio?: string;
  photoURL?: string;
};
