import { useState, useEffect } from 'react';
import { workersApi, projectsApi } from '../../services/taskOrbitApi';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { LoadingState, Spinner } from '../../components/Spinner';
import { ErrorAlert } from '../../components/Alert';
import { Modal } from '../../components/Modal';
import { formatDate } from '../../utils/format';
import { NewTaskModal } from './NewTaskModal';
import { AddMemberModal } from './AddMemberModal';
import {
  Users, Search, Filter, CheckCircle2, Clock, Calendar,
  Briefcase, Plus, AlertTriangle, Layers, Star, ExternalLink
} from 'lucide-react';

export function WorkerDirectoryPage() {
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [assigningWorker, setAssigningWorker] = useState(null);
  const [addingMember, setAddingMember] = useState(false);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [workerRes, projectRes] = await Promise.all([
        workersApi.list(),
        projectsApi.list(),
      ]);
      setWorkers(workerRes.data?.data || []);
      setProjects(projectRes.data?.data || []);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load worker directory data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredWorkers = workers.filter((w) => {
    const matchesSearch =
      w.display_name.toLowerCase().includes(search.toLowerCase()) ||
      (w.email && w.email.toLowerCase().includes(search.toLowerCase())) ||
      (w.skills && w.skills.some((s) => s.toLowerCase().includes(search.toLowerCase())));
    const matchesAvailability =
      availabilityFilter === 'all' || w.availability === availabilityFilter;
    return matchesSearch && matchesAvailability;
  });

  const totalWorkers = workers.length;
  const availableCount = workers.filter((w) => w.availability === 'available').length;
  const activeAssignmentsTotal = workers.reduce(
    (sum, w) => sum + (w.workload?.active_tasks_count || 0),
    0
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="text-xl font-semibold text-ink">Worker Directory</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Manage developer workload, inspect skills, and assign project tasks with deadline-conflict protection
          </p>
        </div>
        <button className="btn-primary btn" onClick={() => setAddingMember(true)}>
          <Plus size={14} /> Add team member
        </button>
      </div>

      <div className="page-body space-y-6">
        <ErrorAlert message={error} />

        {/* Workload Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="panel p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <span className="text-2xs uppercase tracking-wide text-ink-muted font-medium">Total Assignees</span>
              <p className="text-xl font-bold text-ink mt-0.5">{totalWorkers}</p>
            </div>
          </div>

          <div className="panel p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span className="text-2xs uppercase tracking-wide text-ink-muted font-medium">Available Workers</span>
              <p className="text-xl font-bold text-ink mt-0.5">{availableCount}</p>
            </div>
          </div>

          <div className="panel p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Briefcase size={20} />
            </div>
            <div>
              <span className="text-2xs uppercase tracking-wide text-ink-muted font-medium">Active Task Pool</span>
              <p className="text-xl font-bold text-ink mt-0.5">{activeAssignmentsTotal}</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              placeholder="Search by worker name, skill (e.g. React, Node.js), or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-ink-muted shrink-0" />
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="form-input text-xs w-40"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>
        </div>

        {/* Worker Cards Grid */}
        {loading ? (
          <LoadingState />
        ) : filteredWorkers.length === 0 ? (
          <div className="empty-state panel p-12 text-center">
            <Users size={32} className="mx-auto mb-2 text-ink-muted" />
            <p className="text-sm font-semibold text-ink">No workers found</p>
            <p className="text-xs text-ink-muted mt-1">Try adjusting your search query or availability filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkers.map((worker) => {
              const activeCount = worker.workload?.active_tasks_count || 0;
              const inReviewCount = worker.workload?.in_review_count || 0;
              const approvedCount = worker.workload?.approved_count || 0;
              const totalCount = worker.workload?.total_tasks || 0;

              return (
                <div key={worker.id} className="panel p-5 flex flex-col justify-between hover:border-surface-3 transition-colors">
                  <div>
                    {/* Header: Name, Status, Role */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h2 className="text-sm font-semibold text-ink">{worker.display_name}</h2>
                        <span className="text-2xs text-ink-muted">{worker.email || 'developer@taskorbit.io'}</span>
                      </div>
                      <span
                        className={`text-2xs px-2 py-0.5 rounded-full font-medium ${
                          worker.availability === 'available'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : worker.availability === 'busy'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {worker.availability === 'available' ? 'Available' : worker.availability === 'busy' ? 'Busy' : 'On Leave'}
                      </span>
                    </div>

                    {/* Skills Pills */}
                    {worker.skills && worker.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {worker.skills.map((skill) => (
                          <span
                            key={skill}
                            className="text-2xs px-1.5 py-0.5 bg-surface-2 text-ink-light rounded font-mono"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Workload Breakdown */}
                    <div className="bg-surface-1 p-3 rounded border border-surface-2 mb-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-muted">Active Tasks</span>
                        <span className="font-semibold text-ink">{activeCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-muted">Awaiting Review</span>
                        <span className="font-semibold text-amber-600">{inReviewCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-muted">Approved & Completed</span>
                        <span className="font-semibold text-emerald-600">{approvedCount}</span>
                      </div>

                      {/* Mini visual bar */}
                      <div className="w-full bg-surface-2 rounded-full h-1.5 overflow-hidden flex mt-2">
                        <div
                          className="bg-accent h-1.5"
                          style={{ width: `${totalCount > 0 ? (activeCount / totalCount) * 100 : 0}%` }}
                          title={`Active: ${activeCount}`}
                        />
                        <div
                          className="bg-amber-500 h-1.5"
                          style={{ width: `${totalCount > 0 ? (inReviewCount / totalCount) * 100 : 0}%` }}
                          title={`In Review: ${inReviewCount}`}
                        />
                        <div
                          className="bg-emerald-500 h-1.5"
                          style={{ width: `${totalCount > 0 ? (approvedCount / totalCount) * 100 : 0}%` }}
                          title={`Approved: ${approvedCount}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-surface-2">
                    <button
                      type="button"
                      className="btn-secondary btn btn-xs flex-1 flex items-center justify-center gap-1.5"
                      onClick={() => setSelectedWorker(worker)}
                    >
                      <Briefcase size={12} /> Inspect Workload
                    </button>
                    <button
                      type="button"
                      className="btn-primary btn btn-xs flex items-center gap-1"
                      onClick={() => setAssigningWorker(worker)}
                    >
                      <Plus size={12} /> Assign Task
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inspect Workload Modal */}
      {selectedWorker && (
        <Modal
          title={`Active Assignments — ${selectedWorker.display_name}`}
          onClose={() => setSelectedWorker(null)}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-2xs text-ink-muted">
                {selectedWorker.active_tasks?.length || 0} active task(s) on schedule
              </span>
              <button
                type="button"
                className="btn-secondary btn btn-sm"
                onClick={() => setSelectedWorker(null)}
              >
                Close
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-surface-1 rounded border border-surface-2">
              <div>
                <span className="text-xs font-semibold text-ink">{selectedWorker.display_name}</span>
                <p className="text-2xs text-ink-muted">{selectedWorker.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xs text-ink-muted">Availability:</span>
                <span className="text-xs font-medium capitalize text-ink">{selectedWorker.availability}</span>
              </div>
            </div>

            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Current Assigned Tasks
            </h3>

            {(!selectedWorker.all_tasks || selectedWorker.all_tasks.length === 0) ? (
              <p className="text-xs text-ink-muted italic py-3">No tasks currently assigned to this worker.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {selectedWorker.all_tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-white rounded border border-surface-2 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-semibold text-ink">{task.title}</h4>
                        <span className="text-2xs text-ink-muted">Project: {task.project?.title || '—'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-2xs text-ink-muted pt-1 border-t border-surface-2">
                      <div className="flex items-center gap-2">
                        <Calendar size={11} />
                        <span>{formatDate(task.start_date)} → {formatDate(task.due_date)}</span>
                      </div>
                      {task.has_conflict_override && (
                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                          <AlertTriangle size={10} /> Override Active
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {addingMember && (
        <AddMemberModal
          onClose={() => setAddingMember(false)}
          onCreated={() => {
            setAddingMember(false);
            loadData();
          }}
        />
      )}

      {/* Assign New Task Modal */}
      {assigningWorker && (
        <NewTaskModal
          projects={projects}
          defaults={{
            assignee_id: assigningWorker.id,
            start_date: new Date().toISOString().slice(0, 10),
            due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
          }}
          onClose={() => {
            setAssigningWorker(null);
            loadData();
          }}
        />
      )}
    </>
  );
}
