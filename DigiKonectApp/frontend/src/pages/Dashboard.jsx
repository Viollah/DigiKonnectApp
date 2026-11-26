import { useEffect, useState } from 'react'; // Hooks manage data and run API calls after rendering.
import api from '../services/api'; // API client with the login token attached.
import { useAuth } from '../context/AuthContext'; // Determines whether this is an administrator.

export default function Dashboard() {
  const { user } = useAuth(); // Read the current role.
  const [stats, setStats] = useState(null); // Holds database-driven dashboard totals.
  const [error, setError] = useState(''); // Holds a readable API error.
  const [loading, setLoading] = useState(true); // Controls the initial loading message.

  useEffect(() => { // Runs when this page first appears or the role changes.
    if (user?.role !== 'Administrator') return; // Technicians do not have dashboard-statistics access.
    api.get('/dashboard/stats').then(response => setStats(response.data)) // Fetch live counts from backend.
      .catch(() => setError('Could not load dashboard statistics.')) // Show an error instead of a blank screen.
      .finally(() => setLoading(false)); // Stop the loading state after success or failure.
  }, [user]); // Re-run if the signed-in user changes.

  if (user?.role !== 'Administrator') return <section className="page"><p className="eyebrow">TECHNICIAN WORKSPACE</p><h1>Your assigned work</h1><p className="muted">Open Jobs to view assignments, update progress and add notes.</p><a className="primary link-button" href="/jobs">View my jobs</a></section>;
  const cards = stats ? [ // Turn API values into reusable dashboard cards.
    ['Total jobs', stats.totalJobs, 'All recorded work'], ['Pending', stats.pendingJobs, 'Awaiting work'],
    ['In progress', stats.inProgressJobs, 'Currently being handled'], ['Completed', stats.completedJobs, 'Successfully finished'],
    ['Overdue', stats.overdueJobs, 'Past due date and not complete'], ['Technicians', stats.technicians, 'Available user accounts']
  ] : [];

  return <section className="page"><div className="page-heading"><div><p className="eyebrow">OVERVIEW</p><h1>Dashboard</h1><p className="muted">Monitor maintenance jobs and technician activity.</p></div><button className="secondary" onClick={() => window.location.reload()}>Refresh data ↻</button></div>
    {loading && <p>Loading dashboard…</p>}{error && <p className="error-message">{error}</p>}
    <div className="stats-grid">{cards.map(([label, value, description]) => <article className="stat-card" key={label}><span>{label}</span><strong>{value}</strong><small>{description}</small></article>)}</div>
    <div className="info-panel"><div><p className="eyebrow">QUICK ACTION</p><h2>Keep field work moving</h2><p className="muted">Create a maintenance job, assign a technician and monitor progress from one place.</p></div><a className="primary link-button" href="/jobs">Manage jobs →</a></div>
  </section>;
}
