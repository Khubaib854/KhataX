import { useEffect, useState, useMemo } from 'react';
import { db, Design } from '../db';
import { Button, Card, Input, Label } from './ui';
import { ArrowLeft, Plus, Search, Edit2, Trash2, Palette, Tag } from 'lucide-react';
import { formatCurrency } from '../utils/format';

interface Props {
  onBack: () => void;
}

export function DesignManagement({ onBack }: Props) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Design | null>(null);
  const [form, setForm] = useState({ designNumber: '', designName: '', ratePerSet: '' });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const list = await db.designs.orderBy('designNumber').toArray();
    setDesigns(list);
  };

  const filtered = useMemo(() => {
    if (!search) return designs;
    const q = search.toLowerCase();
    return designs.filter(d =>
      d.designNumber.toLowerCase().includes(q) ||
      d.designName?.toLowerCase().includes(q)
    );
  }, [designs, search]);

  const openAdd = () => {
    setEditing(null);
    setForm({ designNumber: '', designName: '', ratePerSet: '' });
    setShowForm(true);
  };

  const openEdit = (d: Design) => {
    setEditing(d);
    setForm({
      designNumber: d.designNumber,
      designName: d.designName || '',
      ratePerSet: d.ratePerSet.toString(),
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.designNumber.trim() || !form.ratePerSet) return;
    const now = new Date().toISOString();
    const rate = parseFloat(form.ratePerSet);
    if (editing) {
      await db.designs.update(editing.id!, {
        designNumber: form.designNumber.trim(),
        designName: form.designName.trim() || undefined,
        ratePerSet: rate,
        updatedAt: now,
      });
    } else {
      await db.designs.add({
        designNumber: form.designNumber.trim(),
        designName: form.designName.trim() || undefined,
        ratePerSet: rate,
        createdAt: now,
        updatedAt: now,
      });
    }
    setShowForm(false);
    load();
  };

  const remove = async (d: Design) => {
    if (!confirm('Are you sure you want to delete this design? This action cannot be undone.')) return;
    await db.designs.delete(d.id!);
    load();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-background to-background dark:from-amber-950/10">
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-10 w-10 p-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <Palette className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none">Design Management</h1>
              <p className="text-xs text-muted-foreground">{designs.length} designs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 pb-28 space-y-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search design number or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 bg-card"
          />
        </div>

        <Button onClick={openAdd} className="w-full">
          <Plus className="h-5 w-5" />
          Add New Design
        </Button>

        {showForm && (
          <Card className="p-5 space-y-4 animate-in fade-in">
            <h3 className="font-semibold text-lg">{editing ? 'Edit Design' : 'Add Design'}</h3>
            <div className="space-y-4">
              <div>
                <Label>Design Number *</Label>
                <Input
                  placeholder="e.g., 101"
                  value={form.designNumber}
                  onChange={(e) => setForm({ ...form, designNumber: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Design Name</Label>
                <Input
                  placeholder="e.g., Royal Bridal Lehnga"
                  value={form.designName}
                  onChange={(e) => setForm({ ...form, designName: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Rate Per Set (Rs.) *</Label>
                <Input
                  type="number"
                  placeholder="500"
                  value={form.ratePerSet}
                  onChange={(e) => setForm({ ...form, ratePerSet: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={save} className="flex-1">
                {editing ? 'Update' : 'Save'} Design
              </Button>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          {filtered.map((d) => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 flex items-center justify-center shrink-0">
                    <Tag className="h-6 w-6 text-amber-700 dark:text-amber-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-bold text-lg">#{d.designNumber}</h3>
                      {d.designName && <span className="text-sm text-muted-foreground truncate">{d.designName}</span>}
                    </div>
                    <p className="text-[15px] font-semibold text-emerald-700 dark:text-emerald-400 mt-1">
                      {formatCurrency(d.ratePerSet)} per set
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(d)} className="h-9 w-9 p-0">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(d)} className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <Card className="p-8 text-center">
              <Palette className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No designs found</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
