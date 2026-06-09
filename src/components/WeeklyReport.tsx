import { useEffect, useState, useMemo } from 'react';
import { db, Worker, Design, Assignment, CompletedWork, Payment } from '../db';
import { Button, Card } from './ui';
import { ArrowLeft, Calendar, Download, Printer, TrendingUp, Package, CheckCircle2, CreditCard, AlertCircle } from 'lucide-react';
import { formatDate, formatCurrency, dateToISO } from '../utils/format';
import { startOfWeek, endOfWeek, addWeeks, subWeeks, parseISO, isWithinInterval } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  onBack: () => void;
}

export function WeeklyReport({ onBack }: Props) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [completed, setCompleted] = useState<CompletedWork[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [ws, ds, as, cs, ps] = await Promise.all([
      db.workers.toArray(),
      db.designs.toArray(),
      db.assignments.toArray(),
      db.completedWorks.toArray(),
      db.payments.toArray(),
    ]);
    setWorkers(ws);
    setDesigns(ds);
    setAssignments(as);
    setCompleted(cs);
    setPayments(ps);
  };

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  const designMap = useMemo(() => {
    const m = new Map<number, Design>();
    designs.forEach(d => m.set(d.id!, d));
    return m;
  }, [designs]);

  const inWeek = (dateStr: string) => {
    const d = parseISO(dateStr);
    return isWithinInterval(d, { start: weekStart, end: weekEnd });
  };

  const weekAssignments = assignments.filter(a => inWeek(a.assignmentDate));
  const weekCompleted = completed.filter(c => inWeek(c.completionDate));
  const weekPayments = payments.filter(p => inWeek(p.paymentDate));

  const totals = useMemo(() => {
    const assigned = weekAssignments.reduce((s,a) => s + a.assignedSets, 0);
    const completedSets = weekCompleted.reduce((s,c) => s + c.completedSets, 0);
    const pending = Math.max(0, assigned - completedSets);
    const paymentsTotal = weekPayments.reduce((s,p) => s + p.amount, 0);
    const outstanding = workers.reduce((sum,w) => {
      const wCompleted = completed.filter(c => c.workerId === w.id);
      const wPayments = payments.filter(p => p.workerId === w.id);
      const earned = wCompleted.reduce((s,c) => {
        const d = designMap.get(c.designId);
        return s + c.completedSets * (d?.ratePerSet || 0);
      }, 0);
      const paid = wPayments.reduce((s,p) => s + p.amount, 0);
      return sum + Math.max(0, earned - paid);
    }, 0);
    return { assigned, completedSets, pending, paymentsTotal, outstanding };
  }, [weekAssignments, weekCompleted, weekPayments, workers, completed, payments, designMap]);

  const workerBreakdown = useMemo(() => {
    return workers.map(w => {
      const wAssignments = assignments.filter(a => a.workerId === w.id);
      const wCompletedAll = completed.filter(c => c.workerId === w.id);
      const wCompletedWeek = wCompletedAll.filter(c => inWeek(c.completionDate));
      const wPaymentsWeek = payments.filter(p => p.workerId === w.id && inWeek(p.paymentDate));
      const wPaymentsAll = payments.filter(p => p.workerId === w.id);
      
      const totalAssigned = wAssignments.reduce((s,a) => s + a.assignedSets, 0);
      const totalCompleted = wCompletedAll.reduce((s,c) => s + c.completedSets, 0);
      const pending = Math.max(0, totalAssigned - totalCompleted);
      
      const completedWeekSets = wCompletedWeek.reduce((s,c) => s + c.completedSets, 0);
      const paymentsWeek = wPaymentsWeek.reduce((s,p) => s + p.amount, 0);
      
      const earned = wCompletedAll.reduce((s,c) => {
        const d = designMap.get(c.designId);
        return s + c.completedSets * (d?.ratePerSet || 0);
      }, 0);
      const paid = wPaymentsAll.reduce((s,p) => s + p.amount, 0);
      const balance = earned - paid;
      
      return {
        worker: w,
        completedWeekSets,
        pending,
        paymentsWeek,
        balance,
      };
    }).filter(w => w.completedWeekSets > 0 || w.paymentsWeek > 0 || w.pending > 0);
  }, [workers, assignments, completed, payments, designMap, weekStart, weekEnd]);

  const exportPDF = () => {
    const doc = new jsPDF();
    const weekLabel = `${formatDate(dateToISO(weekStart))} - ${formatDate(dateToISO(weekEnd))}`;
    
    doc.setFontSize(18);
    doc.setTextColor(16, 185, 129);
    doc.text('KhataX Weekly Report', 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Week: ${weekLabel}`, 14, 28);
    doc.text('by Muhammad Khubaib', 14, 34);
    
    // Summary
    autoTable(doc, {
      startY: 42,
      head: [['Metric', 'Value']],
      body: [
        ['Total Assigned Sets', totals.assigned.toString()],
        ['Total Completed Sets', totals.completedSets.toString()],
        ['Total Pending Sets', totals.pending.toString()],
        ['Total Payments', formatCurrency(totals.paymentsTotal)],
        ['Total Outstanding Balance', formatCurrency(totals.outstanding)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
    });
    
    // Worker breakdown
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Worker Breakdown', 14, finalY);
    
    autoTable(doc, {
      startY: finalY + 4,
      head: [['Worker', 'Completed', 'Pending', 'Payments', 'Balance']],
      body: workerBreakdown.map(w => [
        w.worker.name,
        w.completedWeekSets.toString(),
        w.pending.toString(),
        formatCurrency(w.paymentsWeek),
        formatCurrency(w.balance),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] },
    });
    
    doc.save(`KhataX-Weekly-${weekStart.toISOString().slice(0,10)}.pdf`);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-blue-950/10">
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50 print:hidden">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-10 w-10 p-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold leading-none">Weekly Report</h1>
            <p className="text-xs text-muted-foreground">Production & Payments</p>
          </div>
          <Button variant="outline" size="sm" onClick={printReport} className="gap-1.5">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 pb-28 space-y-6 print:pb-6">
        {/* Week Selector */}
        <Card className="p-4 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-semibold">{formatDate(dateToISO(weekStart))} - {formatDate(dateToISO(weekEnd))}</div>
                <div className="text-xs text-muted-foreground">Current Week</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>Next</Button>
            </div>
          </div>
        </Card>

        {/* Print Header */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-2xl font-bold text-emerald-700">KhataX Weekly Report</h1>
          <p className="text-sm text-muted-foreground">by Muhammad Khubaib</p>
          <p className="text-sm mt-2">{formatDate(dateToISO(weekStart))} - {formatDate(dateToISO(weekEnd))}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
            <div className="flex items-center gap-2 mb-1 opacity-90">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Completed</span>
            </div>
            <div className="text-2xl font-bold">{totals.completedSets}</div>
            <div className="text-xs opacity-80">Sets this week</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-0">
            <div className="flex items-center gap-2 mb-1 opacity-90">
              <CreditCard className="h-4 w-4" />
              <span className="text-xs font-medium">Payments</span>
            </div>
            <div className="text-xl font-bold">{formatCurrency(totals.paymentsTotal)}</div>
            <div className="text-xs opacity-80">This week</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Assigned</div>
            <div className="text-xl font-bold">{totals.assigned}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Pending</div>
            <div className="text-xl font-bold">{totals.pending}</div>
          </Card>
        </div>

        <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-amber-800 dark:text-amber-300 font-medium">Total Outstanding Balance</div>
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-200">{formatCurrency(totals.outstanding)}</div>
            </div>
            <TrendingUp className="h-8 w-8 text-amber-600" />
          </div>
        </Card>

        {/* Worker Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Worker Breakdown</h2>
            <Button variant="secondary" size="sm" onClick={exportPDF} className="gap-1.5 print:hidden">
              <Download className="h-4 w-4" />
              PDF
            </Button>
          </div>
          <div className="space-y-3">
            {workerBreakdown.map((w) => (
              <Card key={w.worker.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[17px]">{w.worker.name}</h3>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </div>
                        <div className="font-semibold">{w.completedWeekSets} sets</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Pending
                        </div>
                        <div className="font-semibold">{w.pending} sets</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          Payments
                        </div>
                        <div className="font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(w.paymentsWeek)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Balance</div>
                        <div className="font-semibold">{formatCurrency(w.balance)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {workerBreakdown.length === 0 && (
              <Card className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No activity this week</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
