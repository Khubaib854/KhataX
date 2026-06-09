import { useEffect, useState, useMemo } from 'react';
import { db, Worker } from '../db';
import { Button, Card, Input } from './ui';
import { Search, Plus, User, Phone, MapPin, ChevronRight, Sparkles, Palette, BarChart3, Lightbulb } from 'lucide-react';

interface Props {
  onOpenWorker: (id: number) => void;
  onOpenDesigns: () => void;
  onOpenReports: () => void;
  onOpenNotes: () => void;
}

export function HomeScreen({ onOpenWorker, onOpenDesigns, onOpenReports, onOpenNotes }: Props) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', mobile: '', address: '', notes: '' });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const list = await db.workers.orderBy('name').toArray();
    setWorkers(list);
  };

  const filtered = useMemo(() => {
    if (!search) return workers;
    const q = search.toLowerCase();
    return workers.filter(w =>
      w.name.toLowerCase().includes(q) ||
      w.mobile?.toLowerCase().includes(q) ||
      w.address?.toLowerCase().includes(q)
    );
  }, [workers, search]);

  const addWorker = async () => {
    if (!form.name.trim()) return;
    const now = new Date().toISOString();
    await db.workers.add({
      name: form.name.trim(),
      mobile: form.mobile.trim() || undefined,
      address: form.address.trim() || undefined,
      notes: form.notes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    });
    setForm({ name: '', mobile: '', address: '', notes: '' });
    setShowAdd(false);
    load();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-background to-background dark:from-emerald-950/20">
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-[22px] font-bold tracking-tight leading-none">KhataX</h1>
                <p className="text-xs text-muted-foreground">by Muhammad Khubaib</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onOpenNotes} className="h-10 w-10 p-0">
                <Lightbulb className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onOpenReports} className="h-10 w-10 p-0">
                <BarChart3 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onOpenDesigns} className="h-10 w-10 p-0">
                <Palette className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 pb-28 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search worker by name, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-13 bg-card shadow-sm"
          />
        </div>

        {/* Add Worker */}
        {!showAdd ? (
          <Button onClick={() => setShowAdd(true)} className="w-full h-13 text-base">
            <Plus className="h-5 w-5" />
            Add New Worker
          </Button>
        ) : (
          <Card className="p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
            <h3 className="font-semibold">Add Worker</h3>
            <div className="space-y-3">
              <Input
                placeholder="Worker Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                placeholder="Mobile Number"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              />
              <Input
                placeholder="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <textarea
                placeholder="Notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-[15px] outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition min-h-[80px]"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAdd(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={addWorker} className="flex-1">
                Save Worker
              </Button>
            </div>
          </Card>
        )}

        {/* Workers List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Workers ({filtered.length})</h2>
          </div>
          <div className="space-y-3">
            {filtered.map((worker) => (
              <Card
                key={worker.id}
                className="p-4 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
                onClick={() => onOpenWorker(worker.id!)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center">
                    <User className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[17px] truncate">{worker.name}</h3>
                    <div className="flex items-center gap-3 mt-0.5 text-sm text-muted-foreground">
                      {worker.mobile && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {worker.mobile}
                        </span>
                      )}
                      {worker.address && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3.5 w-3.5" />
                          {worker.address}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 transition" />
                </div>
              </Card>
            ))}
            {filtered.length === 0 && (
              <Card className="p-8 text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No workers found</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
