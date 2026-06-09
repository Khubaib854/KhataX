import { useEffect, useState, useMemo } from 'react';
import { db, Worker, Design, Assignment, CompletedWork, Payment } from '../db';
import { Button, Card, Input, Label, Badge } from './ui';
import { ArrowLeft, Edit2, Trash2, Package, CheckCircle2, CreditCard, BookOpen, History, Calendar, Tag, TrendingUp, AlertCircle } from 'lucide-react';
import { formatDate, formatCurrency, dateToISO } from '../utils/format';

interface Props {
  workerId: number;
  onBack: () => void;
}

type LedgerEntry = {
  date: string;
  type: 'Completed' | 'Payment';
  description: string;
  credit: number;
  debit: number;
  balance: number;
};

export function WorkerProfile({ workerId, onBack }: Props) {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [completed, setCompleted] = useState<CompletedWork[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showEditWorker, setShowEditWorker] = useState(false);
  const [workerForm, setWorkerForm] = useState({ name: '', mobile: '', address: '', notes: '' });

  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({ designId: '', assignedSets: '', date: new Date().toISOString().slice(0,10), notes: '' });

  const [showComplete, setShowComplete] = useState(false);
  const [completeForm, setCompleteForm] = useState({ designId: '', completedSets: '', date: new Date().toISOString().slice(0,10), notes: '' });

  const [showPayment, setShowPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: new Date().toISOString().slice(0,10), method: 'Cash' as Payment['method'], notes: '' });
  
  const [selectedTab, setSelectedTab] = useState<'pending' | 'assigned' | 'completed'>('pending');

  useEffect(() => {
    load();
  }, [workerId]);

  const load = async () => {
    const w = await db.workers.get(workerId);
    if (!w) return;
    setWorker(w);
    setWorkerForm({ name: w.name, mobile: w.mobile || '', address: w.address || '', notes: w.notes || '' });
    const [ds, as, cs, ps] = await Promise.all([
      db.designs.toArray(),
      db.assignments.where('workerId').equals(workerId).toArray(),
      db.completedWorks.where('workerId').equals(workerId).toArray(),
      db.payments.where('workerId').equals(workerId).toArray(),
    ]);
    setDesigns(ds);
    setAssignments(as.sort((a,b) => b.assignmentDate.localeCompare(a.assignmentDate)));
    setCompleted(cs.sort((a,b) => b.completionDate.localeCompare(a.completionDate)));
    setPayments(ps.sort((a,b) => b.paymentDate.localeCompare(a.paymentDate)));
  };

  const designMap = useMemo(() => {
    const m = new Map<number, Design>();
    designs.forEach(d => m.set(d.id!, d));
    return m;
  }, [designs]);

  const summary = useMemo(() => {
    const totalAssigned = assignments.reduce((s,a) => s + a.assignedSets, 0);
    const totalCompleted = completed.reduce((s,c) => s + c.completedSets, 0);
    const pending = Math.max(0, totalAssigned - totalCompleted);
    const completedValue = completed.reduce((s,c) => {
      const d = designMap.get(c.designId);
      return s + c.completedSets * (d?.ratePerSet || 0);
    }, 0);
    const totalPaid = payments.reduce((s,p) => s + p.amount, 0);
    const balance = completedValue - totalPaid;
    return { totalAssigned, totalCompleted, pending, completedValue, totalPaid, balance };
  }, [assignments, completed, payments, designMap]);

  const pendingWork = useMemo(() => {
    // Create a map of completed sets per design
    const completedMap = new Map<number, number>();
    completed.forEach(c => {
      completedMap.set(c.designId, (completedMap.get(c.designId) || 0) + c.completedSets);
    });
    
    // Get assignments with pending work
    return assignments.map(a => {
      const completedSets = completedMap.get(a.designId) || 0;
      const pendingSets = Math.max(0, a.assignedSets - completedSets);
      return { ...a, completedSets, pendingSets };
    }).filter(a => a.pendingSets > 0);
  }, [assignments, completed]);

  const ledger: LedgerEntry[] = useMemo(() => {
    const entries: Omit<LedgerEntry, 'balance'>[] = [];
    completed.forEach(c => {
      const d = designMap.get(c.designId);
      const value = c.completedSets * (d?.ratePerSet || 0);
      entries.push({
        date: c.completionDate,
        type: 'Completed',
        description: `${c.designNumber} - ${c.completedSets} sets`,
        credit: value,
        debit: 0,
      });
    });
    payments.forEach(p => {
      entries.push({
        date: p.paymentDate,
        type: 'Payment',
        description: `${p.method}`,
        credit: 0,
        debit: p.amount,
      });
    });
    entries.sort((a,b) => a.date.localeCompare(b.date));
    let bal = 0;
    return entries.map(e => {
      bal += e.credit - e.debit;
      return { ...e, balance: bal };
    });
  }, [completed, payments, designMap]);

  const saveWorker = async () => {
    if (!worker || !workerForm.name.trim()) return;
    await db.workers.update(worker.id!, {
      name: workerForm.name.trim(),
      mobile: workerForm.mobile.trim() || undefined,
      address: workerForm.address.trim() || undefined,
      notes: workerForm.notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
    setShowEditWorker(false);
    load();
  };

  const deleteWorker = async () => {
    if (!worker) return;
    if (!confirm('Are you sure you want to delete this worker? This action cannot be undone.')) return;
    await db.workers.delete(worker.id!);
    await db.assignments.where('workerId').equals(worker.id!).delete();
    await db.completedWorks.where('workerId').equals(worker.id!).delete();
    await db.payments.where('workerId').equals(worker.id!).delete();
    onBack();
  };

  const saveAssignment = async () => {
    if (!assignForm.designId || !assignForm.assignedSets) return;
    const design = designMap.get(parseInt(assignForm.designId));
    if (!design) return;
    await db.assignments.add({
      workerId,
      designId: design.id!,
      designNumber: design.designNumber,
      assignedSets: parseInt(assignForm.assignedSets),
      assignmentDate: dateToISO(new Date(assignForm.date)),
      notes: assignForm.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    setShowAssign(false);
    setAssignForm({ designId: '', assignedSets: '', date: new Date().toISOString().slice(0,10), notes: '' });
    load();
  };

  const saveCompleted = async () => {
    if (!completeForm.designId || !completeForm.completedSets) return;
    const design = designMap.get(parseInt(completeForm.designId));
    if (!design) return;
    await db.completedWorks.add({
      workerId,
      designId: design.id!,
      designNumber: design.designNumber,
      completedSets: parseInt(completeForm.completedSets),
      completionDate: dateToISO(new Date(completeForm.date)),
      notes: completeForm.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    setShowComplete(false);
    setCompleteForm({ designId: '', completedSets: '', date: new Date().toISOString().slice(0,10), notes: '' });
    load();
  };

  const savePayment = async () => {
    if (!paymentForm.amount) return;
    await db.payments.add({
      workerId,
      amount: parseFloat(paymentForm.amount),
      paymentDate: dateToISO(new Date(paymentForm.date)),
      method: paymentForm.method,
      notes: paymentForm.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    setShowPayment(false);
    setPaymentForm({ amount: '', date: new Date().toISOString().slice(0,10), method: 'Cash', notes: '' });
    load();
  };

  const deleteAssignment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) return;
    await db.assignments.delete(id);
    load();
  };
  const deleteCompleted = async (id: number) => {
    if (!confirm('Are you sure you want to delete this completed work? This action cannot be undone.')) return;
    await db.completedWorks.delete(id);
    load();
  };
  const deletePayment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment? This action cannot be undone.')) return;
    await db.payments.delete(id);
    load();
  };

  if (!worker) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-background to-background dark:from-emerald-950/10">
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-10 w-10 p-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{worker.name}</h1>
            <p className="text-xs text-muted-foreground">Worker Profile & Khata</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowEditWorker(true)} className="h-10 w-10 p-0">
            <Edit2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 pb-28 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-0">
            <div className="flex items-center gap-2 mb-1 opacity-90">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Balance</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(summary.balance)}</div>
            <div className="text-xs opacity-80 mt-0.5">Remaining</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Pending</span>
            </div>
            <div className="text-2xl font-bold">{summary.pending}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Sets</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Assigned</div>
            <div className="text-xl font-bold">{summary.totalAssigned}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Completed</div>
            <div className="text-xl font-bold">{summary.totalCompleted}</div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Total Earned</div>
            <div className="font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(summary.completedValue)}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Total Paid</div>
            <div className="font-semibold">{formatCurrency(summary.totalPaid)}</div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" onClick={() => setShowAssign(true)} className="flex-col h-auto py-3 gap-1">
            <Package className="h-5 w-5 text-amber-600" />
            <span className="text-xs">Assign</span>
          </Button>
          <Button variant="outline" onClick={() => setShowComplete(true)} className="flex-col h-auto py-3 gap-1">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="text-xs">Complete</span>
          </Button>
          <Button variant="outline" onClick={() => setShowPayment(true)} className="flex-col h-auto py-3 gap-1">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <span className="text-xs">Payment</span>
          </Button>
        </div>

        {/* Assign Form */}
        {showAssign && (
          <Card className="p-5 space-y-4 animate-in fade-in">
            <h3 className="font-semibold flex items-center gap-2"><Package className="h-5 w-5 text-amber-600" /> Assign Work</h3>
            <div className="space-y-3">
              <div>
                <Label>Design *</Label>
                <select value={assignForm.designId} onChange={e => setAssignForm({...assignForm, designId: e.target.value})} className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white dark:bg-slate-900 text-black dark:text-white px-4 text-[15px] outline-none focus:ring-2 focus:ring-emerald-500/30">
                  <option value="">Select Design</option>
                  {designs.map(d => <option key={d.id} value={d.id}>#{d.designNumber} - {d.designName} ({formatCurrency(d.ratePerSet)})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Sets *</Label>
                  <Input type="number" value={assignForm.assignedSets} onChange={e => setAssignForm({...assignForm, assignedSets: e.target.value})} className="mt-1.5" />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={assignForm.date} onChange={e => setAssignForm({...assignForm, date: e.target.value})} className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={assignForm.notes} onChange={e => setAssignForm({...assignForm, notes: e.target.value})} placeholder="Optional" className="mt-1.5" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAssign(false)} className="flex-1">Cancel</Button>
              <Button onClick={saveAssignment} className="flex-1">Save Assignment</Button>
            </div>
          </Card>
        )}

        {/* Complete Form */}
        {showComplete && (
          <Card className="p-5 space-y-4 animate-in fade-in">
            <h3 className="font-semibold flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Record Completed Work</h3>
            <div className="space-y-3">
              <div>
                <Label>Design *</Label>
                <select value={completeForm.designId} onChange={e => setCompleteForm({...completeForm, designId: e.target.value})} className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white dark:bg-slate-900 text-black dark:text-white px-4 text-[15px] outline-none focus:ring-2 focus:ring-emerald-500/30">
                  <option value="">Select Design</option>
                  {designs.map(d => <option key={d.id} value={d.id}>#{d.designNumber} - {d.designName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Sets *</Label>
                  <Input type="number" value={completeForm.completedSets} onChange={e => setCompleteForm({...completeForm, completedSets: e.target.value})} className="mt-1.5" />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={completeForm.date} onChange={e => setCompleteForm({...completeForm, date: e.target.value})} className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={completeForm.notes} onChange={e => setCompleteForm({...completeForm, notes: e.target.value})} placeholder="Optional" className="mt-1.5" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowComplete(false)} className="flex-1">Cancel</Button>
              <Button onClick={saveCompleted} className="flex-1">Save Completed</Button>
            </div>
          </Card>
        )}

        {/* Payment Form */}
        {showPayment && (
          <Card className="p-5 space-y-4 animate-in fade-in">
            <h3 className="font-semibold flex items-center gap-2"><CreditCard className="h-5 w-5 text-blue-600" /> Record Payment</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Amount (Rs.) *</Label>
                  <Input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} className="mt-1.5" />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label>Method</Label>
                <select value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value as any})} className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white dark:bg-slate-900 text-black dark:text-white px-4 text-[15px] outline-none focus:ring-2 focus:ring-emerald-500/30">
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>EasyPaisa</option>
                  <option>JazzCash</option>
                </select>
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} placeholder="Optional" className="mt-1.5" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPayment(false)} className="flex-1">Cancel</Button>
              <Button onClick={savePayment} className="flex-1">Save Payment</Button>
            </div>
          </Card>
        )}

        {/* Ledger */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b bg-muted/30 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-700" />
            <h3 className="font-semibold">Running Khata (Ledger)</h3>
          </div>
          <div className="divide-y">
            {ledger.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">No transactions yet</div>}
            {ledger.slice().reverse().map((e, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={e.type === 'Completed' ? 'success' : 'warning'}>{e.type}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(e.date)}</span>
                  </div>
                  <p className="text-sm mt-1 truncate">{e.description}</p>
                </div>
                <div className="text-right ml-4">
                  {e.credit > 0 && <div className="font-semibold text-emerald-700">+{formatCurrency(e.credit)}</div>}
                  {e.debit > 0 && <div className="font-semibold text-red-600">-{formatCurrency(e.debit)}</div>}
                  <div className="text-xs text-muted-foreground">Bal: {formatCurrency(e.balance)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Histories */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><History className="h-5 w-5" /> Work Status</h3>
          
          {/* Tabs */}
          <div className="flex gap-2 bg-muted/30 p-2 rounded-lg">
            <button
              onClick={() => setSelectedTab('pending')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                selectedTab === 'pending'
                  ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Pending ({pendingWork.length})
            </button>
            <button
              onClick={() => setSelectedTab('assigned')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                selectedTab === 'assigned'
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Assigned ({assignments.length})
            </button>
            <button
              onClick={() => setSelectedTab('completed')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                selectedTab === 'completed'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Completed ({completed.length})
            </button>
          </div>

          {/* Pending Work Tab */}
          {selectedTab === 'pending' && (
            <Card>
              <div className="p-3 border-b flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-sm">Pending Work ({pendingWork.length})</span>
              </div>
              <div className="divide-y max-h-96 overflow-auto">
                {pendingWork.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">All work completed!</div>}
                {pendingWork.map(p => (
                  <div key={p.id} className="p-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-sm">#{p.designNumber}</span>
                        <Badge variant="destructive">{p.pendingSets}/{p.assignedSets} sets pending</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />Assigned: {formatDate(p.assignmentDate)}
                        {p.notes && ` • ${p.notes}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Assigned Tab */}
          {selectedTab === 'assigned' && (
            <Card>
              <div className="p-3 border-b flex items-center gap-2">
                <Package className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-sm">Assignments ({assignments.length})</span>
              </div>
              <div className="divide-y max-h-96 overflow-auto">
                {assignments.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No assignments</div>}
                {assignments.map(a => (
                  <div key={a.id} className="p-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-sm">#{a.designNumber}</span>
                        <Badge variant="default">{a.assignedSets} sets</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{formatDate(a.assignmentDate)}
                        {a.notes && ` • ${a.notes}`}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteAssignment(a.id!)} className="h-8 w-8 p-0 text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Completed Tab */}
          {selectedTab === 'completed' && (
            <Card>
              <div className="p-3 border-b flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-sm">Completed Work ({completed.length})</span>
              </div>
              <div className="divide-y max-h-96 overflow-auto">
                {completed.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No completed work</div>}
                {completed.map(c => {
                  const d = designMap.get(c.designId);
                  const value = c.completedSets * (d?.ratePerSet || 0);
                  return (
                    <div key={c.id} className="p-4 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium text-sm">#{c.designNumber}</span>
                          <Badge variant="success">{c.completedSets} sets</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{formatDate(c.completionDate)} • {formatCurrency(value)}
                          {c.notes && ` • ${c.notes}`}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => deleteCompleted(c.id!)} className="h-8 w-8 p-0 text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Payments */}
          <Card>
            <div className="p-3 border-b flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Payments ({payments.length})</span>
            </div>
            <div className="divide-y max-h-64 overflow-auto">
              {payments.map(p => (
                <div key={p.id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{formatCurrency(p.amount)}</span>
                      <Badge variant="warning">{p.method}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />{formatDate(p.paymentDate)}
                      {p.notes && ` • ${p.notes}`}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deletePayment(p.id!)} className="h-8 w-8 p-0 text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {payments.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">No payments</div>}
            </div>
          </Card>
        </div>

        {/* Edit Worker Modal */}
        {showEditWorker && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <Card className="w-full max-w-md p-5 space-y-4 animate-in slide-in-from-bottom">
              <h3 className="font-semibold text-lg">Edit Worker</h3>
              <div className="space-y-3">
                <div>
                  <Label>Name *</Label>
                  <Input value={workerForm.name} onChange={e => setWorkerForm({...workerForm, name: e.target.value})} className="mt-1.5" />
                </div>
                <div>
                  <Label>Mobile</Label>
                  <Input value={workerForm.mobile} onChange={e => setWorkerForm({...workerForm, mobile: e.target.value})} className="mt-1.5" />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input value={workerForm.address} onChange={e => setWorkerForm({...workerForm, address: e.target.value})} className="mt-1.5" />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input value={workerForm.notes} onChange={e => setWorkerForm({...workerForm, notes: e.target.value})} className="mt-1.5" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowEditWorker(false)} className="flex-1">Cancel</Button>
                <Button onClick={saveWorker} className="flex-1">Save</Button>
              </div>
              <Button variant="danger" onClick={deleteWorker} className="w-full">
                <Trash2 className="h-4 w-4" />
                Delete Worker
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
