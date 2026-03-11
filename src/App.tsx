/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Calendar, Clock, Plus, Trash2, Edit2, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Meeting {
  id: number;
  title: string;
  date: string;
  time: string;
  description: string;
}

export default function App() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    description: "",
  });

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/meetings");
      if (!response.ok) throw new Error("Failed to fetch meetings");
      const data = await response.json();
      setMeetings(data);
    } catch (err) {
      setError("Could not load meetings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (meeting?: Meeting) => {
    if (meeting) {
      setEditingMeeting(meeting);
      setFormData({
        title: meeting.title,
        date: meeting.date,
        time: meeting.time,
        description: meeting.description,
      });
    } else {
      setEditingMeeting(null);
      setFormData({ title: "", date: "", time: "", description: "" });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMeeting(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingMeeting ? `/api/meetings/${editingMeeting.id}` : "/api/meetings";
      const method = editingMeeting ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save meeting");
      
      await fetchMeetings();
      handleCloseForm();
    } catch (err) {
      setError("Failed to save meeting. Please try again.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this meeting?")) return;
    try {
      const response = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete meeting");
      await fetchMeetings();
    } catch (err) {
      setError("Failed to delete meeting. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Meeting Scheduler</h1>
            <p className="text-zinc-500">Manage your upcoming appointments and schedules.</p>
          </div>
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span className="font-medium">New Meeting</span>
          </button>
        </header>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-8 flex items-center gap-3">
            <AlertCircle size={20} />
            <p>{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <X size={20} />
            </button>
          </div>
        )}

        {/* Meetings List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900"></div>
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-20 bg-white border border-zinc-200 rounded-2xl border-dashed">
            <Calendar className="mx-auto text-zinc-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-zinc-900">No meetings scheduled</h3>
            <p className="text-zinc-500 mt-1">Click the "New Meeting" button to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {meetings.map((meeting) => (
                <motion.div
                  key={meeting.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{meeting.title}</h3>
                    <div className="flex flex-wrap gap-4 text-zinc-500 text-sm mb-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={16} className="text-zinc-400" />
                        {new Date(meeting.date).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={16} className="text-zinc-400" />
                        {meeting.time}
                      </div>
                    </div>
                    {meeting.description && (
                      <p className="text-zinc-600 line-clamp-2">{meeting.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenForm(meeting)}
                      className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                      title="Edit meeting"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(meeting.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Cancel meeting"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Form Modal */}
        <AnimatePresence>
          {isFormOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold">
                      {editingMeeting ? "Edit Meeting" : "New Meeting"}
                    </h2>
                    <button
                      onClick={handleCloseForm}
                      className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-zinc-700">Title</label>
                      <input
                        required
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                        placeholder="Project Sync, Client Call, etc."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-zinc-700">Date</label>
                        <input
                          required
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-zinc-700">Time</label>
                        <input
                          required
                          type="time"
                          value={formData.time}
                          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-zinc-700">Description (Optional)</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all min-h-[100px]"
                        placeholder="What's this meeting about?"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={handleCloseForm}
                        className="flex-1 px-6 py-3 rounded-xl border border-zinc-200 font-semibold hover:bg-zinc-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800 transition-colors shadow-sm"
                      >
                        {editingMeeting ? "Update Meeting" : "Schedule Meeting"}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
