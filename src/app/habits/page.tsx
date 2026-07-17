'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useHabitStore } from '../../store/useHabitStore';
import { Habit } from '../../types';
import { 
  Plus, 
  Search, 
  Trash2, 
  Archive, 
  Sparkles, 
  X, 
  Check, 
  SlidersHorizontal,
  FolderHeart,
  AlarmClock,
  Briefcase,
  Layers,
  FileText,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJIS = ['🎯', '💪', '💧', '🍎', '🧘', '📚', '💻', '🚶', '🏃', '🚴', '🚭', '🛌', '🥗', '🔋', '✍️', '🥦', '☕', '🧠'];
const COLORS = [
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#10b981' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Rose', hex: '#f43f5e' }
];
const CATEGORIES = ['Fitness', 'Health', 'Learning', 'Productivity', 'Mind', 'Routine', 'Finance'];

function HabitsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { 
    habits, 
    addHabit, 
    editHabit, 
    deleteHabit, 
    archiveHabit, 
    isLoading: storeLoading 
  } = useHabitStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'archived'>('active');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState('#a855f7');
  const [category, setCategory] = useState('Productivity');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [startDate, setStartDate] = useState('');
  const [targetDays, setTargetDays] = useState(30);
  const [reminderTime, setReminderTime] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openAddModal();
    }
  }, [searchParams]);

  const openAddModal = () => {
    setEditingHabit(null);
    setName('');
    setIcon('🎯');
    setColor('#a855f7');
    setCategory('Productivity');
    setPriority('medium');
    setFrequency('daily');
    
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setStartDate(`${today.getFullYear()}-${month}-${day}`);
    
    setTargetDays(30);
    setReminderTime('08:00');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setName(habit.name);
    setIcon(habit.icon);
    setColor(habit.color);
    setCategory(habit.category);
    setPriority(habit.priority);
    setFrequency(habit.frequency);
    setStartDate(habit.startDate);
    setTargetDays(habit.targetDays || 30);
    setReminderTime(habit.reminderTime || '08:00');
    setDescription(habit.description || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const habitData = {
      name,
      icon,
      color,
      category,
      priority,
      frequency,
      startDate,
      targetDays,
      reminderTime: reminderTime || undefined,
      description: description || undefined
    };

    if (editingHabit) {
      await editHabit(editingHabit.id, habitData);
    } else {
      await addHabit(habitData);
    }
    setIsModalOpen(false);
  };

  if (authLoading || storeLoading || !user) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Filter Habits based on searches/filters
  const filteredHabits = habits.filter((habit) => {
    const matchesSearch = habit.name.toLowerCase().includes(search.toLowerCase()) ||
      (habit.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesCategory = selectedCategory === 'All' || habit.category === selectedCategory;
    const matchesPriority = selectedPriority === 'All' || habit.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'active' ? habit.active : !habit.active;

    return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-1">
            <FolderHeart className="w-3.5 h-3.5" /> Habit Repository
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
            Manage Habits
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure, edit, archive or remove your daily activities.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-accent to-accent-hover hover:scale-[1.02] active:scale-95 text-sm font-extrabold text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-accent/20 transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          Create New Habit
        </button>
      </div>

      {/* FILTER PANEL */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search habits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center justify-end w-full md:w-auto">
          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-accent font-semibold text-slate-600 dark:text-slate-300 transition"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Priority */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-accent font-semibold text-slate-600 dark:text-slate-300 transition"
          >
            <option value="All">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          {/* Archive status toggle */}
          <div className="flex rounded-2xl bg-slate-50 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setSelectedStatus('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition ${
                selectedStatus === 'active' ? 'bg-accent text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setSelectedStatus('archived')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition ${
                selectedStatus === 'archived' ? 'bg-accent text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Archived
            </button>
          </div>
        </div>
      </div>

      {/* HABITS GRID DISPLAY */}
      {filteredHabits.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-400">
          <Search className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 animate-pulse mb-3" />
          <p className="text-sm font-semibold">No habits matching criteria found.</p>
          <button
            onClick={openAddModal}
            className="mt-3 px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold shadow-md hover:scale-[1.02] active:scale-95 transition"
          >
            Create a Habit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHabits.map((habit) => (
            <motion.div
              layout
              key={habit.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              {/* CARD HEADER */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                    style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                  >
                    {habit.icon || '🎯'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white leading-snug">
                      {habit.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                        style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                      >
                        {habit.category}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                        {habit.priority} priority
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(habit)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                    title="Edit Habit"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                  {habit.active ? (
                    <button
                      onClick={() => archiveHabit(habit.id)}
                      className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition cursor-pointer"
                      title="Archive Habit"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => editHabit(habit.id, { active: true })}
                      className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-500 transition cursor-pointer"
                      title="Unarchive Habit"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to permanently delete "${habit.name}"? This removes all completion history.`)) {
                        deleteHabit(habit.id);
                      }
                    }}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                    title="Delete Habit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* CARD DETAILS */}
              <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50 text-xs text-slate-500 space-y-2">
                {habit.description && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic line-clamp-2">
                    "{habit.description}"
                  </p>
                )}
                <div className="flex justify-between font-medium">
                  <span>Frequency:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">{habit.frequency}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Goal Challenge:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{habit.targetDays || 30} days</span>
                </div>
                {habit.reminderTime && (
                  <div className="flex justify-between font-medium">
                    <span>Daily Reminder:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <AlarmClock className="w-3 h-3 text-slate-400" />
                      {habit.reminderTime}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* CREATE/EDIT MODAL OVERLAY */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-y-auto max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {editingHabit ? `Edit Habit: ${editingHabit.name}` : 'Create a New Habit'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form fields */}
              <form onSubmit={handleSave} className="space-y-4">
                {/* Habit Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Habit Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Read, Gym, Meditate..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700"
                  />
                </div>

                {/* Emoji & Accent Color selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Emojis selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Choose Icon</label>
                    <div className="flex items-center gap-2">
                      <span className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-2xl shadow-inner">
                        {icon}
                      </span>
                      <div className="flex-1 flex flex-wrap gap-1 max-h-[80px] overflow-y-auto p-1.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                        {EMOJIS.map((e) => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => setIcon(e)}
                            className={`w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-sm cursor-pointer transition ${
                              icon === e ? 'bg-slate-200 dark:bg-slate-800 scale-110' : ''
                            }`}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Colors Presets */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Choose Color</label>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner"
                        style={{ backgroundColor: color }}
                      >
                        <Check className="w-5 h-5 text-white" />
                      </span>
                      <div className="flex-1 flex flex-wrap gap-1.5 p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                        {COLORS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setColor(c.hex)}
                            className="w-5.5 h-5.5 rounded-full border border-white dark:border-slate-900 cursor-pointer shadow-sm relative transition hover:scale-110"
                            style={{ backgroundColor: c.hex }}
                          >
                            {color === c.hex && (
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category & Priority Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-accent transition"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-accent transition"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {/* Start Date & Target Days */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-accent transition-all text-slate-700 dark:text-slate-300"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Days Challenge</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={365}
                      value={targetDays}
                      onChange={(e) => setTargetDays(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-accent transition-all"
                    />
                  </div>
                </div>

                {/* Description & Reminder */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Frequency */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Frequency</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-accent transition"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  {/* Reminder time */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reminder Time (Daily)</label>
                    <div className="relative">
                      <AlarmClock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="time"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-accent transition-all text-slate-700 dark:text-slate-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Description text */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description / Note</label>
                  <textarea
                    placeholder="Why are you building this habit? (e.g. read 10 pages, gym cardio sessions)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-750"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-accent to-accent-hover text-sm font-extrabold text-white shadow-lg shadow-accent/25 hover:scale-[1.01] active:scale-95 transition cursor-pointer"
                >
                  {editingHabit ? 'Save Habit Changes' : 'Create Habit'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HabitsPage() {
  return (
    <React.Suspense fallback={
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        </div>
      </div>
    }>
      <HabitsContent />
    </React.Suspense>
  );
}
