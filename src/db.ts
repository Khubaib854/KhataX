import Dexie, { Table } from 'dexie';

export interface Worker {
  id?: number;
  name: string;
  mobile?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Design {
  id?: number;
  designNumber: string;
  designName?: string;
  ratePerSet: number;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id?: number;
  workerId: number;
  designId: number;
  designNumber: string;
  assignedSets: number;
  assignmentDate: string;
  notes?: string;
  createdAt: string;
}

export interface CompletedWork {
  id?: number;
  workerId: number;
  designId: number;
  designNumber: string;
  completedSets: number;
  completionDate: string;
  notes?: string;
  createdAt: string;
}

export interface Payment {
  id?: number;
  workerId: number;
  amount: number;
  paymentDate: string;
  method: 'Cash' | 'Bank Transfer' | 'EasyPaisa' | 'JazzCash';
  notes?: string;
  createdAt: string;
}

export interface Reminder {
  id?: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export class KhataDB extends Dexie {
  workers!: Table<Worker, number>;
  designs!: Table<Design, number>;
  assignments!: Table<Assignment, number>;
  completedWorks!: Table<CompletedWork, number>;
  payments!: Table<Payment, number>;
  reminders!: Table<Reminder, number>;

  constructor() {
    super('KhataXDB');
    this.version(1).stores({
      workers: '++id, name, mobile, createdAt',
      designs: '++id, &designNumber, designName, ratePerSet',
      assignments: '++id, workerId, designId, assignmentDate, createdAt',
      completedWorks: '++id, workerId, designId, completionDate, createdAt',
      payments: '++id, workerId, paymentDate, createdAt',
      reminders: '++id, createdAt',
    });
  }
}

export const db = new KhataDB();

// Seed initial data if empty
export async function seedIfEmpty() {
  const workerCount = await db.workers.count();
  if (workerCount === 0) {
    const now = new Date().toISOString();
    const workers: Worker[] = [
      {
        name: 'Aisha Bibi',
        mobile: '0300-1234567',
        address: 'Model Town, Lahore',
        notes: 'Expert in heavy bridal work',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Fatima Noor',
        mobile: '0321-7654321',
        address: 'Gulberg, Lahore',
        notes: 'Fast worker',
        createdAt: now,
        updatedAt: now,
      },
    ];
    await db.workers.bulkAdd(workers);

    const designs: Design[] = [
      {
        designNumber: '101',
        designName: 'Royal Bridal Lehnga',
        ratePerSet: 500,
        createdAt: now,
        updatedAt: now,
      },
      {
        designNumber: '102',
        designName: 'Heavy Zardozi',
        ratePerSet: 700,
        createdAt: now,
        updatedAt: now,
      },
      {
        designNumber: '103',
        designName: 'Classic Red',
        ratePerSet: 600,
        createdAt: now,
        updatedAt: now,
      },
    ];
    await db.designs.bulkAdd(designs);
  }
}
