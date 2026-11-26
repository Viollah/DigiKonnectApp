import { useEffect, useState } from 'react'; // React hooks store page data and form state.
import api from '../services/api'; // Shared authenticated HTTP client.
import { useAuth } from '../context/AuthContext'; // Provides role information for conditional actions.

const emptyForm = { title: '', description: '', customer: '', location: '', technicianId: '', priority: 'Medium', status: 'Pending', dueDate: '', notes: '' }; // Default job form values.

export default function Jobs() {
  const { user } = useAuth(); // Identify the current user and role.
  const isAdmin = user?.role === 'Administrator'; // Admins can manage jobs; technicians can update assigned jobs.
  const [jobs, setJobs] = useState([]); // List returned by the jobs API.
  const [technicians, setTechnicians] = useState([]); // Technician options for assignment.
  const [statusFilter, setStatusFilter] = useState(''); // Selected status filter.
  const [technicianFilter, setTechnicianFilter] = useState(''); // Selected technician filter.
  const [form, setForm] = useState(emptyForm); // Current create/edit form values.
  const [editingId, setEditingId] = useState(null); // Null means create; a number means edit.
  const [showForm, setShowForm] = useState(false); // Controls whether the job form is visible.
  const [message, setMessage] = useState(''); // Success and error feedback.
  const [loading, setLoading] = useState(true); // Loading indicator for job list.

  async function loadJobs() {
    setLoading(true); // Show progress while the API request runs.
    try { const response = await api.get('/jobs', { params: { status: statusFilter || undefined, technicianId: technicianFilter || undefined } }); setJobs(response.data); }
    catch (error) { setMessage(error.response?.data?.message || 'Unable to load jobs.'); }
    finally { setLoading(false); } // Hide progress whether the request succeeds or fails.
  }

  useEffect(() => { loadJobs(); }, [statusFilter, technicianFilter]); // Reload whenever a filter changes.
  useEffect(() => { if (isAdmin) api.get('/technicians').then(response => setTechnicians(response.data)).catch(() => setMessage('Could not load technicians.')); }, [isAdmin]); // Load assignment options only for admins.

  function changeField(event) { setForm({ ...form, [event.target.name]: event.target.value }); } // Update only the edited form field.
  function startCreate() { setEditingId(null); setForm(emptyForm); setShowForm(true); setMessage(''); } // Open a clean create form.
  function startEdit(job) { setEditingId(job.id); setForm({ ...job, technicianId: job.technicianId || '', dueDate: job.dueDate.slice(0, 10) }); setShowForm(true); setMessage(''); } // Copy selected job into form.

  async function saveJob(event) {
    event.preventDefault(); setMessage(''); // Stop page reload and clear previous feedback.
    const payload = { ...form, technicianId: form.technicianId ? Number(form.technicianId) : null, dueDate: new Date(`${form.dueDate}T12:00:00`).toISOString() }; // Convert browser form values to API types.
    try {
      if (editingId) await api.put(`/jobs/${editingId}`, payload); // Update existing job.
      else await api.post('/jobs', payload); // Create a new job.
      setShowForm(false); setMessage(editingId ? 'Job updated successfully.' : 'Job created successfully.'); await loadJobs(); // Refresh visible data.
    } catch (error) { setMessage(error.response?.data?.message || 'Could not save the job.'); }
  }

  async function deleteJob(id) {
    if (!window.confirm('Delete this job? This cannot be undone.')) return; // Ask before destructive action.
    try { await api.delete(`/jobs/${id}`); setMessage('Job deleted.'); await loadJobs(); }
    catch { setMessage('Could not delete this job.'); }
  }

  async function updateProgress(job) {
    const status = window.prompt('Enter status: Pending, In Progress or Completed', job.status); // Simple assessment-friendly update UI.
    if (!status) return; // Cancel means make no change.
    const notes = window.prompt('Add progress notes:', job.notes || ''); // Ask technician for an update note.
    if (notes === null) return; // Cancel means do not submit.
    try { await api.patch(`/jobs/${job.id}/progress`, { status, notes }); setMessage('Progress updated.'); await loadJobs(); }
    catch (error) { setMessage(error.response?.data?.message || 'Could not update progress.'); }
  }

  return <section className="page">
    <div className="page-heading"><div><p className="eyebrow">FIELD OPERATIONS</p><h1>{isAdmin ? 'Job management' : 'My assigned jobs'}</h1><p className="muted">{isAdmin ? 'Create, assign and monitor maintenance work.' : 'View your assignments and keep job progress up to date.'}</p></div>{isAdmin && <button className="primary" onClick={startCreate}>＋ Create job</button>}</div>
    {message && <p className="notice">{message}</p>}
    <div className="filters"><label>Filter by status<select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">All statuses</option><option>Pending</option><option>In Progress</option><option>Completed</option></select></label>{isAdmin && <label>Filter by technician<select value={technicianFilter} onChange={e => setTechnicianFilter(e.target.value)}><option value="">All technicians</option>{technicians.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}</select></label>}</div>
    {showForm && isAdmin && <form className="job-form" onSubmit={saveJob}><div className="form-heading"><h2>{editingId ? 'Edit job' : 'Create a job'}</h2><button type="button" className="icon-button" onClick={() => setShowForm(false)}>✕</button></div>
      <div className="form-grid"><label>Job title<input name="title" value={form.title} onChange={changeField} required /></label><label>Customer<input name="customer" value={form.customer} onChange={changeField} required /></label><label>Location<input name="location" value={form.location} onChange={changeField} required /></label><label>Due date<input type="date" name="dueDate" value={form.dueDate} onChange={changeField} required /></label><label>Technician<select name="technicianId" value={form.technicianId} onChange={changeField}><option value="">Unassigned</option>{technicians.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}</select></label><label>Priority<select name="priority" value={form.priority} onChange={changeField}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label><label>Status<select name="status" value={form.status} onChange={changeField}><option>Pending</option><option>In Progress</option><option>Completed</option></select></label><label className="wide">Description<textarea name="description" value={form.description} onChange={changeField} rows="2" /></label><label className="wide">Notes<textarea name="notes" value={form.notes} onChange={changeField} rows="2" /></label></div>
      <div className="form-actions"><button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="primary">{editingId ? 'Save changes' : 'Create job'}</button></div>
    </form>}
    {loading ? <p>Loading jobs…</p> : jobs.length === 0 ? <div className="empty-state"><h2>No jobs found</h2><p>There are no jobs matching the selected filters.</p></div> : <div className="job-list">{jobs.map(job => <article className="job-card" key={job.id}><div className="job-top"><div><span className="job-id">JOB #{job.id}</span><h2>{job.title}</h2><p className="muted">{job.customer} · {job.location}</p></div><span className={`status status-${job.status.toLowerCase().replace(' ', '-')}`}>{job.status}</span></div><p>{job.description || 'No detailed description provided.'}</p><div className="job-meta"><span><b>Technician</b>{job.technicianName}</span><span><b>Priority</b><em className={`priority priority-${job.priority.toLowerCase()}`}>{job.priority}</em></span><span><b>Due date</b>{new Date(job.dueDate).toLocaleDateString()}</span><span><b>Notes</b>{job.notes || '—'}</span></div><div className="job-actions">{isAdmin ? <><button className="secondary small" onClick={() => startEdit(job)}>Edit</button><button className="danger small" onClick={() => deleteJob(job.id)}>Delete</button></> : <button className="primary small" onClick={() => updateProgress(job)}>Update progress</button>}</div></article>)}</div>}
  </section>;
}
