import { useEffect, useState } from 'react';
import { db, Reminder } from '../db';
import { Button, Card, Input, Badge } from './ui';
import { ArrowLeft, Plus, Trash2, Lightbulb, Calendar } from 'lucide-react';
import { formatDate } from '../utils/format';

interface Props {
  onBack: () => void;
}

export function Notes({ onBack }: Props) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const notes = await db.reminders.orderBy('createdAt').reverse().toArray();
    setReminders(notes);
  };

  const addReminder = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    const now = new Date().toISOString();
    await db.reminders.add({
      title: form.title.trim(),
      content: form.content.trim(),
      createdAt: now,
      updatedAt: now,
    });
    setForm({ title: '', content: '' });
    setShowAdd(false);
    load();
  };

  const deleteReminder = async (id: number) => {
    if (!confirm('Delete this note?')) return;
    await db.reminders.delete(id);
    load();
  };

  const updateReminder = async (id: number, title: string, content: string) => {
    await db.reminders.update(id, {
      title: title.trim(),
      content: content.trim(),
      updatedAt: new Date().toISOString(),
    });
    load();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-background to-background dark:from-amber-950/10">
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-10 w-10 p-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-amber-500" />
              Quick Notes
            </h1>
            <p className="text-xs text-muted-foreground">Save reminders & important notes</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 pb-28 space-y-4">
        {/* Add Note Button */}
        {!showAdd ? (
          <Button onClick={() => setShowAdd(true)} className="w-full h-12 text-base">
            <Plus className="h-5 w-5" />
            Add New Note
          </Button>
        ) : (
          <Card className="p-5 space-y-4 animate-in fade-in bg-gradient-to-br from-amber-50 dark:from-amber-950/20">
            <h3 className="font-semibold flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              New Note
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  placeholder="e.g., Buy Thread Stock"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Note *</label>
                <textarea
                  placeholder="Write your reminder here..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="mt-1.5 w-full h-24 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAdd(false);
                  setForm({ title: '', content: '' });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={addReminder} className="flex-1">
                Save Note
              </Button>
            </div>
          </Card>
        )}

        {/* Notes List */}
        <div className="space-y-3">
          {reminders.length === 0 ? (
            <Card className="p-8 text-center">
              <Lightbulb className="h-12 w-12 text-amber-200 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No notes yet. Add your first reminder!</p>
            </Card>
          ) : (
            reminders.map((reminder) => (
              <Card
                key={reminder.id}
                className="p-4 bg-gradient-to-br from-amber-50/50 dark:from-amber-950/20 border-amber-200/50 dark:border-amber-900/30 hover:border-amber-300/70 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground break-words">
                        {reminder.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(reminder.createdAt)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteReminder(reminder.id!)}
                      className="h-8 w-8 p-0 text-red-600 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Editable Content */}
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <textarea
                      value={reminder.content}
                      onChange={(e) => {
                        const title = reminder.title;
                        const content = e.target.value;
                        updateReminder(reminder.id!, title, content);
                      }}
                      className="w-full text-sm bg-transparent text-muted-foreground outline-none resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
