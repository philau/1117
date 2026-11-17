import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  BLUEPRINT_LIMITS,
  Client,
  ClientInput,
  CurrencyCode,
  CURRENCIES,
  ProfileInput,
  Project,
  ProjectInput,
  ProjectStatus,
  Task,
  TaskInput,
  TaskStatus,
  UserProfile,
  WorkLog,
  WorkLogInput,
} from '../types';

function clampString(val: string | undefined | null, max: number): string {
  return (val ?? '').trim().slice(0, max);
}

function sanitizeOptionalId(id: string | undefined | null): string {
  const cleaned = clampString(id, BLUEPRINT_LIMITS.ID_MAX);
  return BLUEPRINT_LIMITS.OPTIONAL_ID_PATTERN.test(cleaned) ? cleaned : '';
}

function sanitizeDate(dateStr: string | undefined | null): string {
  const cleaned = clampString(dateStr, BLUEPRINT_LIMITS.DATE_MAX);
  return BLUEPRINT_LIMITS.DATE_PATTERN.test(cleaned) ? cleaned : '';
}

function clampNumber(val: number | undefined | null, min: number, max: number): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, num));
}

function sanitizeCurrency(val: string | undefined | null): CurrencyCode {
  if (val && (CURRENCIES as string[]).includes(val)) {
    return val as CurrencyCode;
  }
  return 'TWD';
}

export function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function timestampToMs(ts?: Timestamp): number {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  return 0;
}

// --- User Profile ---

export async function ensureUserProfile(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const displayName =
        clampString(user.displayName, BLUEPRINT_LIMITS.DISPLAY_NAME_MAX) || '自由接案工作者';
      const email = clampString(user.email, BLUEPRINT_LIMITS.EMAIL_MAX);
      const photoURL = clampString(user.photoURL, BLUEPRINT_LIMITS.PHOTO_URL_MAX);

      await setDoc(ref, {
        uid: user.uid,
        displayName,
        email,
        title: '獨立接案工作者',
        phone: '',
        location: '台灣',
        website: '',
        hourlyRate: 1500,
        currency: 'TWD',
        bio: '',
        photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void,
  onError: (err: unknown) => void
): () => void {
  const path = `users/${uid}`;
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as UserProfile);
      } else {
        onData(null);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        onError(wrapped);
      }
    }
  );
}

export async function updateUserProfile(uid: string, input: ProfileInput): Promise<void> {
  const path = `users/${uid}`;
  const displayName = clampString(input.displayName, BLUEPRINT_LIMITS.DISPLAY_NAME_MAX);
  if (!displayName) {
    throw new Error('顯示名稱不可為空。');
  }

  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName,
      email: clampString(input.email, BLUEPRINT_LIMITS.EMAIL_MAX),
      title: clampString(input.title, BLUEPRINT_LIMITS.TITLE_ROLE_MAX),
      phone: clampString(input.phone, BLUEPRINT_LIMITS.PHONE_MAX),
      location: clampString(input.location, BLUEPRINT_LIMITS.LOCATION_MAX),
      website: clampString(input.website, BLUEPRINT_LIMITS.WEBSITE_MAX),
      hourlyRate: clampNumber(input.hourlyRate, 0, BLUEPRINT_LIMITS.HOURLY_RATE_MAX),
      currency: sanitizeCurrency(input.currency),
      bio: clampString(input.bio, BLUEPRINT_LIMITS.BIO_MAX),
      photoURL: clampString(input.photoURL, BLUEPRINT_LIMITS.PHOTO_URL_MAX),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// --- Clients ---

export function subscribeClients(
  uid: string,
  onData: (clients: Client[]) => void,
  onError: (err: unknown) => void
): () => void {
  const path = 'clients';
  const q = query(collection(db, path), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const items: Client[] = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Client, 'id'>),
        }))
        .sort((a, b) => timestampToMs(b.updatedAt) - timestampToMs(a.updatedAt));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped);
      }
    }
  );
}

export async function createClient(uid: string, input: ClientInput): Promise<string> {
  const path = 'clients';
  const name = clampString(input.name, BLUEPRINT_LIMITS.CLIENT_NAME_MAX);
  if (!name) throw new Error('請輸入客戶名稱。');

  try {
    const docRef = await addDoc(collection(db, path), {
      ownerId: uid,
      name,
      company: clampString(input.company, BLUEPRINT_LIMITS.COMPANY_MAX),
      email: clampString(input.email, BLUEPRINT_LIMITS.EMAIL_MAX),
      phone: clampString(input.phone, BLUEPRINT_LIMITS.PHONE_MAX),
      notes: clampString(input.notes, BLUEPRINT_LIMITS.NOTES_MAX),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateClient(clientId: string, input: ClientInput): Promise<void> {
  const path = `clients/${clientId}`;
  const name = clampString(input.name, BLUEPRINT_LIMITS.CLIENT_NAME_MAX);
  if (!name) throw new Error('請輸入客戶名稱。');

  try {
    await updateDoc(doc(db, 'clients', clientId), {
      name,
      company: clampString(input.company, BLUEPRINT_LIMITS.COMPANY_MAX),
      email: clampString(input.email, BLUEPRINT_LIMITS.EMAIL_MAX),
      phone: clampString(input.phone, BLUEPRINT_LIMITS.PHONE_MAX),
      notes: clampString(input.notes, BLUEPRINT_LIMITS.NOTES_MAX),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteClient(clientId: string): Promise<void> {
  const path = `clients/${clientId}`;
  try {
    await deleteDoc(doc(db, 'clients', clientId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- Projects ---

export function subscribeProjects(
  uid: string,
  onData: (projects: Project[]) => void,
  onError: (err: unknown) => void
): () => void {
  const path = 'projects';
  const q = query(collection(db, path), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const items: Project[] = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Project, 'id'>),
        }))
        .sort((a, b) => timestampToMs(b.updatedAt) - timestampToMs(a.updatedAt));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped);
      }
    }
  );
}

export async function createProject(uid: string, input: ProjectInput): Promise<string> {
  const path = 'projects';
  const name = clampString(input.name, BLUEPRINT_LIMITS.PROJECT_NAME_MAX);
  if (!name) throw new Error('請輸入專案名稱。');

  try {
    const docRef = await addDoc(collection(db, path), {
      ownerId: uid,
      name,
      clientId: sanitizeOptionalId(input.clientId),
      clientName: clampString(input.clientName, BLUEPRINT_LIMITS.CLIENT_NAME_MAX),
      status: input.status === 'completed' ? 'completed' : 'in_progress',
      dueDate: sanitizeDate(input.dueDate),
      budget: clampNumber(input.budget, 0, BLUEPRINT_LIMITS.BUDGET_MAX),
      description: clampString(input.description, BLUEPRINT_LIMITS.DESCRIPTION_MAX),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateProject(projectId: string, input: ProjectInput): Promise<void> {
  const path = `projects/${projectId}`;
  const name = clampString(input.name, BLUEPRINT_LIMITS.PROJECT_NAME_MAX);
  if (!name) throw new Error('請輸入專案名稱。');

  try {
    await updateDoc(doc(db, 'projects', projectId), {
      name,
      clientId: sanitizeOptionalId(input.clientId),
      clientName: clampString(input.clientName, BLUEPRINT_LIMITS.CLIENT_NAME_MAX),
      status: input.status === 'completed' ? 'completed' : 'in_progress',
      dueDate: sanitizeDate(input.dueDate),
      budget: clampNumber(input.budget, 0, BLUEPRINT_LIMITS.BUDGET_MAX),
      description: clampString(input.description, BLUEPRINT_LIMITS.DESCRIPTION_MAX),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleProjectStatus(
  projectId: string,
  nextStatus: ProjectStatus
): Promise<void> {
  const path = `projects/${projectId}`;
  try {
    await updateDoc(doc(db, 'projects', projectId), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  const path = `projects/${projectId}`;
  try {
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- Tasks ---

export function subscribeTasks(
  uid: string,
  onData: (tasks: Task[]) => void,
  onError: (err: unknown) => void
): () => void {
  const path = 'tasks';
  const q = query(collection(db, path), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const items: Task[] = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Task, 'id'>),
        }))
        .sort((a, b) => timestampToMs(b.updatedAt) - timestampToMs(a.updatedAt));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped);
      }
    }
  );
}

export async function createTask(uid: string, input: TaskInput): Promise<string> {
  const path = 'tasks';
  const title = clampString(input.title, BLUEPRINT_LIMITS.TASK_TITLE_MAX);
  if (!title) throw new Error('請輸入任務標題。');

  try {
    const docRef = await addDoc(collection(db, path), {
      ownerId: uid,
      projectId: sanitizeOptionalId(input.projectId),
      projectName: clampString(input.projectName, BLUEPRINT_LIMITS.PROJECT_NAME_MAX),
      title,
      status: input.status === 'completed' ? 'completed' : 'todo',
      dueDate: sanitizeDate(input.dueDate),
      notes: clampString(input.notes, BLUEPRINT_LIMITS.NOTES_MAX),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateTask(taskId: string, input: TaskInput): Promise<void> {
  const path = `tasks/${taskId}`;
  const title = clampString(input.title, BLUEPRINT_LIMITS.TASK_TITLE_MAX);
  if (!title) throw new Error('請輸入任務標題。');

  try {
    await updateDoc(doc(db, 'tasks', taskId), {
      projectId: sanitizeOptionalId(input.projectId),
      projectName: clampString(input.projectName, BLUEPRINT_LIMITS.PROJECT_NAME_MAX),
      title,
      status: input.status === 'completed' ? 'completed' : 'todo',
      dueDate: sanitizeDate(input.dueDate),
      notes: clampString(input.notes, BLUEPRINT_LIMITS.NOTES_MAX),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleTaskStatus(taskId: string, nextStatus: TaskStatus): Promise<void> {
  const path = `tasks/${taskId}`;
  try {
    await updateDoc(doc(db, 'tasks', taskId), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  const path = `tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- Work Logs (新增工作) ---

export function subscribeWorkLogs(
  uid: string,
  onData: (logs: WorkLog[]) => void,
  onError: (err: unknown) => void
): () => void {
  const path = 'workLogs';
  const q = query(collection(db, path), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const items: WorkLog[] = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<WorkLog, 'id'>),
        }))
        .sort((a, b) => timestampToMs(b.updatedAt) - timestampToMs(a.updatedAt));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped);
      }
    }
  );
}

export async function createWorkLog(uid: string, input: WorkLogInput): Promise<string> {
  const path = 'workLogs';
  const title = clampString(input.title, BLUEPRINT_LIMITS.WORKLOG_TITLE_MAX);
  if (!title) throw new Error('請輸入工作項目名稱。');

  try {
    const docRef = await addDoc(collection(db, path), {
      ownerId: uid,
      title,
      projectId: sanitizeOptionalId(input.projectId),
      projectName: clampString(input.projectName, BLUEPRINT_LIMITS.PROJECT_NAME_MAX),
      clientName: clampString(input.clientName, BLUEPRINT_LIMITS.CLIENT_NAME_MAX),
      hours: clampNumber(input.hours, 0, BLUEPRINT_LIMITS.HOURS_MAX),
      workDate: sanitizeDate(input.workDate) || getTodayIsoDate(),
      notes: clampString(input.notes, BLUEPRINT_LIMITS.NOTES_MAX),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateWorkLog(workLogId: string, input: WorkLogInput): Promise<void> {
  const path = `workLogs/${workLogId}`;
  const title = clampString(input.title, BLUEPRINT_LIMITS.WORKLOG_TITLE_MAX);
  if (!title) throw new Error('請輸入工作項目名稱。');

  try {
    await updateDoc(doc(db, 'workLogs', workLogId), {
      title,
      projectId: sanitizeOptionalId(input.projectId),
      projectName: clampString(input.projectName, BLUEPRINT_LIMITS.PROJECT_NAME_MAX),
      clientName: clampString(input.clientName, BLUEPRINT_LIMITS.CLIENT_NAME_MAX),
      hours: clampNumber(input.hours, 0, BLUEPRINT_LIMITS.HOURS_MAX),
      workDate: sanitizeDate(input.workDate) || getTodayIsoDate(),
      notes: clampString(input.notes, BLUEPRINT_LIMITS.NOTES_MAX),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteWorkLog(workLogId: string): Promise<void> {
  const path = `workLogs/${workLogId}`;
  try {
    await deleteDoc(doc(db, 'workLogs', workLogId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
