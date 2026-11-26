import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [calculatedOverdue, setCalculatedOverdue] = useState(null);
  const [dashboardJobs, setDashboardJobs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const isAdmin = String(user.role || "")
          .toLowerCase()
          .includes("admin");

        if (isAdmin) {
          const [statsResult, jobsResult] = await Promise.allSettled([
            api.get("/dashboard/stats"),
            api.get("/jobs"),
          ]);

          if (!isMounted) return;

          if (statsResult.status === "fulfilled") {
            setStats(statsResult.value.data);
          }

          if (jobsResult.status === "fulfilled") {
            const allJobs = Array.isArray(jobsResult.value.data)
              ? jobsResult.value.data
              : [];
            setDashboardJobs(allJobs);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const overdueCount = allJobs.filter((job) => {
              if (!job.dueDate) return false;
              if (String(job.status || "").toLowerCase() === "completed") {
                return false;
              }

              const dueDate = new Date(job.dueDate);
              if (Number.isNaN(dueDate.getTime())) return false;

              dueDate.setHours(0, 0, 0, 0);
              return dueDate < today;
            }).length;

            setCalculatedOverdue(overdueCount);
          }

          if (
            statsResult.status === "rejected" &&
            jobsResult.status === "rejected"
          ) {
            setError("Could not load dashboard statistics.");
          }
        } else {
          const response = await api.get("/jobs");

          if (!isMounted) return;

          setDashboardJobs(Array.isArray(response.data) ? response.data : []);
        }
      } catch {
        if (isMounted) {
          setError(
            String(user.role || "")
              .toLowerCase()
              .includes("admin")
              ? "Could not load dashboard statistics."
              : "Could not load assigned job statistics.",
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const isAdmin = String(user?.role || "")
    .toLowerCase()
    .includes("admin");

  if (!isAdmin) {
    const totalJobs = dashboardJobs.length;
    const pendingJobs = dashboardJobs.filter(
      (job) => String(job.status || "").toLowerCase() === "pending",
    ).length;
    const inProgressJobs = dashboardJobs.filter(
      (job) => String(job.status || "").toLowerCase() === "in progress",
    ).length;
    const completedJobs = dashboardJobs.filter(
      (job) => String(job.status || "").toLowerCase() === "completed",
    ).length;

    const technicianCards = [
      ["Total jobs", totalJobs, "Jobs assigned to you"],
      ["Pending", pendingJobs, "Awaiting your work"],
      ["In progress", inProgressJobs, "Currently being handled"],
      ["Completed", completedJobs, "Successfully finished"],
    ];

    return (
      <section className="page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">OVERVIEW</p>
            <h1>Dashboard</h1>
            <p className="muted">Monitor your assigned maintenance work.</p>
          </div>
          <button
            className="secondary"
            onClick={() => window.location.reload()}
          >
            Refresh data ↻
          </button>
        </div>

        {loading && <p>Loading dashboard…</p>}
        {error && <p className="error-message">{error}</p>}

        <div className="info-panel">
          <div>
            <p className="eyebrow">QUICK ACTION</p>
            <h2>Keep field work moving</h2>
            <p className="muted">
              Create a maintenance job, assign a technician and monitor progress
              from one place.
            </p>
          </div>
          <a className="primary link-button" href="/jobs">
            Manage jobs →
          </a>
        </div>
        <div className="stats-grid stats-grid-technician">
          {technicianCards.map(([label, value, description]) => (
            <article className="stat-card" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{description}</small>
            </article>
          ))}
        </div>
      </section>
    );
  }

  const cards = stats
    ? [
        ["Total jobs", stats.totalJobs, "All recorded work"],
        ["Pending", stats.pendingJobs, "Awaiting work"],
        ["In progress", stats.inProgressJobs, "Currently being handled"],
        ["Completed", stats.completedJobs, "Successfully finished"],
        [
          "Overdue",
          calculatedOverdue ?? stats.overdueJobs ?? 0,
          "Past due date and not complete",
        ],
        ["Technicians", stats.technicians, "Available user accounts"],
      ]
    : [];

  const statusAnalytics = [
    [
      "Pending",
      dashboardJobs.filter(
        (job) => String(job.status || "").toLowerCase() === "pending",
      ).length,
    ],
    [
      "In progress",
      dashboardJobs.filter(
        (job) => String(job.status || "").toLowerCase() === "in progress",
      ).length,
    ],
    [
      "Completed",
      dashboardJobs.filter(
        (job) => String(job.status || "").toLowerCase() === "completed",
      ).length,
    ],
  ];

  const priorityAnalytics = [
    [
      "Low",
      dashboardJobs.filter(
        (job) => String(job.priority || "").toLowerCase() === "low",
      ).length,
    ],
    [
      "Medium",
      dashboardJobs.filter(
        (job) => String(job.priority || "").toLowerCase() === "medium",
      ).length,
    ],
    [
      "High",
      dashboardJobs.filter(
        (job) => String(job.priority || "").toLowerCase() === "high",
      ).length,
    ],
    [
      "Critical",
      dashboardJobs.filter(
        (job) => String(job.priority || "").toLowerCase() === "critical",
      ).length,
    ],
  ];

  const statusTotal = statusAnalytics.reduce(
    (sum, [, count]) => sum + count,
    0,
  );
  const pendingPercent = statusTotal
    ? (statusAnalytics[0][1] / statusTotal) * 100
    : 0;
  const inProgressPercent = statusTotal
    ? (statusAnalytics[1][1] / statusTotal) * 100
    : 0;
  const statusGradient = `conic-gradient(
    #f0b429 0 ${pendingPercent}%,
    #4b84d4 ${pendingPercent}% ${pendingPercent + inProgressPercent}%,
    #39a66f ${pendingPercent + inProgressPercent}% 100%
  )`;

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">OVERVIEW</p>
          <h1>Dashboard</h1>
          <p className="muted">
            Monitor maintenance jobs and technician activity.
          </p>
        </div>
        <button className="secondary" onClick={() => window.location.reload()}>
          Refresh data ↻
        </button>
      </div>
      {loading && <p>Loading dashboard…</p>}
      {error && <p className="error-message">{error}</p>}
      <div className="info-panel">
        <div>
          <p className="eyebrow">QUICK ACTION</p>
          <h2>Keep field work moving</h2>
          <p className="muted">
            Create a maintenance job, assign a technician and monitor progress
            from one place.
          </p>
        </div>
        <a className="primary link-button" href="/jobs">
          Manage jobs →
        </a>
      </div>
      <div className="stats-grid">
        {cards.map(([label, value, description]) => (
          <article className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{description}</small>
          </article>
        ))}
      </div>
      <div className="ai-insight info-panel">
        <div>
          <p className="eyebrow">AI WORKLOAD INSIGHT</p>
          <h2>Work requiring attention</h2>
          <p className="muted">
            {(() => {
              const activeJobs = dashboardJobs.filter(
                (job) => String(job.status || "").toLowerCase() !== "completed",
              );
              const urgentJobs = activeJobs.filter((job) => {
                const priority = String(job.priority || "").toLowerCase();
                const text =
                  `${job.title || ""} ${job.description || ""}`.toLowerCase();
                return (
                  priority === "critical" ||
                  priority === "high" ||
                  text.includes("urgent") ||
                  text.includes("critical") ||
                  text.includes("emergency") ||
                  text.includes("safety")
                );
              }).length;

              return `${activeJobs.length} active jobs · ${urgentJobs} urgent or high-priority jobs · ${calculatedOverdue ?? 0} overdue jobs.`;
            })()}
          </p>
        </div>
      </div>
      {isAdmin && (
        <div className="analytics-grid">
          <article className="analytics-card">
            <p className="eyebrow">JOB STATUS</p>
            <h2>Status distribution</h2>
            <div className="status-chart-layout">
              <div
                className="status-doughnut"
                style={{ background: statusGradient }}
                role="img"
                aria-label="Job status distribution chart"
              >
                <div>
                  <strong>{statusTotal}</strong>
                  <span>Total</span>
                </div>
              </div>
              <div className="chart-legend">
                {statusAnalytics.map(([label, count]) => (
                  <div key={label}>
                    <span
                      className={`legend-dot legend-${label.toLowerCase().replace(" ", "-")}`}
                    />
                    <span>{label}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="analytics-card">
            <p className="eyebrow">PRIORITY</p>
            <h2>Priority workload</h2>
            <div className="priority-chart">
              {priorityAnalytics.map(([label, count]) => {
                const maxPriorityCount = Math.max(
                  1,
                  ...priorityAnalytics.map(([, value]) => value),
                );
                return (
                  <div className="priority-bar-row" key={label}>
                    <div>
                      <span>{label}</span>
                      <strong>{count}</strong>
                    </div>
                    <div className="priority-bar-track">
                      <span
                        className={`priority-bar priority-bar-${label.toLowerCase()}`}
                        style={{
                          width: `${(count / maxPriorityCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </div>
      )}
      <div className="charts-panel" hidden>
        <article className="chart-card">
          <p className="eyebrow">JOB STATUS</p>
          <h2>Status distribution</h2>
          <div className="status-chart-layout">
            <div
              className="status-doughnut"
              style={{ background: statusGradient }}
              role="img"
              aria-label="Job status distribution chart"
            >
              <div>
                <strong>{statusTotal}</strong>
                <span>Total</span>
              </div>
            </div>
            <div className="chart-legend">
              {statusAnalytics.map(([label, count]) => (
                <div key={label}>
                  <span
                    className={`legend-dot legend-${label.toLowerCase().replace(" ", "-")}`}
                  />
                  <span>{label}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="chart-card">
          <p className="eyebrow">PRIORITY</p>
          <h2>Priority workload</h2>
          <div className="priority-chart">
            {priorityAnalytics.map(([label, count]) => {
              const maxPriorityCount = Math.max(
                1,
                ...priorityAnalytics.map(([, value]) => value),
              );
              return (
                <div className="priority-bar-row" key={label}>
                  <div>
                    <span>{label}</span>
                    <strong>{count}</strong>
                  </div>
                  <div className="priority-bar-track">
                    <span
                      className={`priority-bar priority-bar-${label.toLowerCase()}`}
                      style={{
                        width: `${(count / maxPriorityCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </div>
    </section>
  );
}
