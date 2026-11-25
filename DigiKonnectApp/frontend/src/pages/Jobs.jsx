import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// Default values for creating a new job.
const emptyForm = {
  title: "",
  description: "",
  customer: "",
  location: "",
  technicianId: "",
  priority: "",
  status: "Pending",
  dueDate: "",
  notes: "",
};

const JOB_ACTIVITY_KEY = "digikonnect-job-activity";

function getJobActivity(jobId) {
  try {
    const allActivity = JSON.parse(
      localStorage.getItem(JOB_ACTIVITY_KEY) || "[]",
    );
    return allActivity
      .filter((entry) => String(entry.jobId) === String(jobId))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch {
    return [];
  }
}

function addJobActivity(jobId, action, details) {
  try {
    const allActivity = JSON.parse(
      localStorage.getItem(JOB_ACTIVITY_KEY) || "[]",
    );
    allActivity.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      jobId: String(jobId),
      action,
      details,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(
      JOB_ACTIVITY_KEY,
      JSON.stringify(allActivity.slice(0, 500)),
    );
  } catch {
    // Activity history should not prevent a job action from completing.
  }
}

export default function Jobs() {
  const { user } = useAuth();
  const isAdmin = String(user?.role || "")
    .toLowerCase()
    .includes("admin");

  // Store jobs, technicians and form information.
  const [jobs, setJobs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [technicianFilter, setTechnicianFilter] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [progressJob, setProgressJob] = useState(null);
  const [progressStatus, setProgressStatus] = useState("Pending");
  const [progressNotes, setProgressNotes] = useState("");
  const [progressSaving, setProgressSaving] = useState(false);
  const [completingJob, setCompletingJob] = useState(null);
  const [completionSaving, setCompletionSaving] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const prioritySuggestion = showForm ? suggestJobPriority(form) : null;

  // Reusable function to load jobs from the backend API.
  const loadJobs = useCallback(async () => {
    try {
      const response = await api.get("/jobs", {
        params: {
          status: statusFilter || undefined,
          technicianId: technicianFilter || undefined,
        },
      });

      setJobs(response.data);
      setMessage("");
    } catch (error) {
      console.error("Error loading jobs:", error);
      setMessage(error.response?.data?.message || "Unable to load jobs.");
    }
  }, [statusFilter, technicianFilter]);

  // Load jobs when the page opens or filters change.
  useEffect(() => {
    let isMounted = true;

    const fetchJobs = async () => {
      try {
        setLoading(true);

        const response = await api.get("/jobs", {
          params: {
            status: statusFilter || undefined,
            technicianId: technicianFilter || undefined,
          },
        });

        if (isMounted) {
          setJobs(response.data);
          setMessage("");
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error loading jobs:", error);
          setMessage(error.response?.data?.message || "Unable to load jobs.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchJobs();

    return () => {
      isMounted = false;
    };
  }, [statusFilter, technicianFilter]);

  // Load technicians for the administrator's dropdown.
  useEffect(() => {
    if (!isAdmin) return;

    let isMounted = true;

    const fetchTechnicians = async () => {
      try {
        const response = await api.get("/technicians");

        if (isMounted) {
          setTechnicians(response.data);
        }
      } catch (error) {
        if (isMounted) {
          setMessage(
            error.response?.data?.message || "Could not load technicians.",
          );
        }
      }
    };

    fetchTechnicians();

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  // Update a form field when the user changes its value.
  function changeField(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  // Open a blank form to create a job.
  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setSelectedJob(null);
    setMessage("");
    scrollToJobForm();
  }

  // Smoothly move the page to the create, edit or view panel after it renders.
  function scrollToJobForm() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.querySelector(".job-form")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  }

  // Load the selected job into the form for editing.
  function startEdit(job) {
    setEditingId(job.id);

    const dueDateValue = job.dueDate ? new Date(job.dueDate) : null;
    const dueDate =
      dueDateValue && !Number.isNaN(dueDateValue.getTime())
        ? dueDateValue.toISOString().slice(0, 10)
        : "";

    setForm({
      title: job.title || "",
      description: job.description || "",
      customer: job.customer || "",
      location: job.location || "",
      technicianId:
        job.technicianId !== null && job.technicianId !== undefined
          ? String(job.technicianId)
          : "",
      priority: job.priority || "",
      status: job.status || "Pending",
      dueDate,
      notes: job.notes || "",
    });

    setSelectedJob(null);
    setShowForm(true);
    setMessage("");
    scrollToJobForm();
  }

  // Display job details in read-only mode.
  function viewJob(job) {
    setSelectedJob(job);
    setShowForm(false);
    setMessage("");
    scrollToJobForm();
  }

  // Create a new job or update an existing job.
  async function saveJob(event) {
    event.preventDefault();
    setMessage("");

    if (savingJob) return;

    if (!form.priority) {
      setMessage("Please select a priority.");
      return;
    }

    if (!form.dueDate) {
      setMessage("Please select a due date.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      customer: form.customer.trim(),
      location: form.location.trim(),
      technicianId: form.technicianId ? Number(form.technicianId) : null,
      priority: form.priority,
      status: form.status,
      dueDate: new Date(`${form.dueDate}T12:00:00`).toISOString(),
      notes: form.notes.trim(),
    };

    setSavingJob(true);

    try {
      if (editingId !== null) {
        await api.put(`/jobs/${editingId}`, payload);
        addJobActivity(
          editingId,
          "Job updated",
          `Priority: ${payload.priority}; Status: ${payload.status}`,
        );
        setMessage("Job updated successfully.");
      } else {
        const response = await api.post("/jobs", payload);
        const createdJobId = response.data?.id;
        if (createdJobId) {
          addJobActivity(
            createdJobId,
            "Job created",
            `Status: ${payload.status}; Priority: ${payload.priority}`,
          );
        }
        setMessage("Job created successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      await loadJobs();
    } catch (error) {
      const responseData = error.response?.data;
      const validationErrors = responseData?.errors
        ? Object.values(responseData.errors).flat().join(" ")
        : "";

      setMessage(
        validationErrors ||
          responseData?.message ||
          responseData?.title ||
          "Could not save the job.",
      );
    } finally {
      setSavingJob(false);
    }
  }

  // Delete a job.
  async function deleteJob(id) {
    if (!window.confirm("Delete this job? This cannot be undone.")) {
      return;
    }

    try {
      await api.delete(`/jobs/${id}`);

      addJobActivity(id, "Job deleted", "The job was removed.");
      setMessage("Job deleted.");

      await loadJobs();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not delete the job.");
    }
  }

  // Open the technician progress update panel.
  function openProgressUpdate(job) {
    setProgressJob(job);
    setProgressStatus(job.status || "Pending");
    setProgressNotes(job.notes || "");
  }

  // Submit technician progress without using browser prompt dialogs.
  async function submitProgress(event) {
    event.preventDefault();
    if (!progressJob) return;

    setProgressSaving(true);
    setMessage("");

    try {
      await api.patch(`/jobs/${progressJob.id}/progress`, {
        status: progressStatus,
        notes: progressNotes,
      });

      addJobActivity(
        progressJob.id,
        "Progress updated",
        `Status: ${progressStatus}${progressNotes ? "; Notes updated" : ""}`,
      );
      setProgressJob(null);
      setMessage("Progress updated.");
      await loadJobs();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update progress.");
    } finally {
      setProgressSaving(false);
    }
  }

  // Mark a technician's job as completed after confirmation.
  async function confirmMarkCompleted() {
    if (!completingJob) return;

    setCompletionSaving(true);
    setMessage("");

    try {
      await api.patch(`/jobs/${completingJob.id}/progress`, {
        status: "Completed",
        notes: completingJob.notes || "",
      });

      setCompletingJob(null);
      setMessage("Job marked as completed.");
      addJobActivity(
        completingJob.id,
        "Job completed",
        "Status changed to Completed.",
      );
      await loadJobs();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not mark the job as completed.",
      );
    } finally {
      setCompletionSaving(false);
    }
  }

  // Format dates safely for display.
  function formatDate(date) {
    return date ? new Date(date).toLocaleDateString() : "Not available";
  }

  function summariseProgressNotes(notes) {
    const cleanNotes = String(notes || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!cleanNotes) return "";

    const sentences = cleanNotes
      .split(/[.!?]+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    if (sentences.length <= 2) return cleanNotes;
    return `${sentences[0]}. ${sentences[sentences.length - 1]}.`;
  }

  function suggestJobPriority(form) {
    const text =
      `${form.title} ${form.description} ${form.notes}`.toLowerCase();
    const urgentWords = [
      "urgent",
      "critical",
      "emergency",
      "safety",
      "fire",
      "water leak",
      "no power",
      "not working",
    ];

    if (urgentWords.some((word) => text.includes(word))) {
      return {
        priority: "Critical",
        reason: "Urgent or operational-risk keywords were detected.",
      };
    }

    if (form.dueDate) {
      const due = new Date(`${form.dueDate}T23:59:59`);
      const today = new Date();
      const hoursUntilDue = (due.getTime() - today.getTime()) / 36e5;

      if (hoursUntilDue >= 0 && hoursUntilDue <= 48) {
        return {
          priority: "High",
          reason: "The due date is within the next 48 hours.",
        };
      }

      if (hoursUntilDue >= 0 && hoursUntilDue <= 168) {
        return {
          priority: "Medium",
          reason: "The due date is within the next week.",
        };
      }
    }

    return {
      priority: "Low",
      reason: "No urgent keywords or near-term due date were detected.",
    };
  }

  return (
    <section className="page">
      {/* Page heading */}
      <div className="page-heading">
        <div>
          <p className="eyebrow">FIELD OPERATIONS</p>

          <h1>{isAdmin ? "Job management" : "My assigned jobs"}</h1>

          <p className="muted">
            {isAdmin
              ? "Create, assign and monitor maintenance work."
              : "View your assignments and keep job progress up to date."}
          </p>
        </div>

        {isAdmin && !showForm && !selectedJob && (
          <button type="button" className="primary" onClick={startCreate}>
            ＋ Create job
          </button>
        )}
      </div>

      {/* Display success or error messages */}
      {message && <p className="notice">{message}</p>}

      {/* Job filters */}
      <div className="filters">
        <label>
          Filter by status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All statuses</option>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
        </label>

        {isAdmin && (
          <label>
            Filter by technician
            <select
              value={technicianFilter}
              onChange={(event) => setTechnicianFilter(event.target.value)}
            >
              <option value="">All technicians</option>

              {technicians.map((technician) => (
                <option key={technician.id} value={technician.id}>
                  {technician.fullName}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Create and edit job form */}
      {showForm && isAdmin && (
        <form className="job-form" onSubmit={saveJob}>
          <div className="form-heading">
            <h2>{editingId !== null ? "Edit job" : "Create a job"}</h2>

            <button
              type="button"
              className="icon-button"
              onClick={() => setShowForm(false)}
            >
              ✕
            </button>
          </div>

          <div className="form-grid">
            <label>
              Job title
              <input
                name="title"
                value={form.title}
                onChange={changeField}
                required
              />
            </label>

            <label>
              Customer
              <input
                name="customer"
                value={form.customer}
                onChange={changeField}
                required
              />
            </label>

            <label>
              Location
              <input
                name="location"
                value={form.location}
                onChange={changeField}
                required
              />
            </label>

            <label>
              Due date
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={changeField}
                required
              />
            </label>

            <label>
              Technician
              <select
                name="technicianId"
                value={form.technicianId}
                onChange={changeField}
              >
                <option value="">Unassigned</option>

                {technicians.map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.fullName}
                  </option>
                ))}
              </select>
            </label>

            {editingId !== null && form.technicianId && (
              <div className="wide technician-unassign">
                <button
                  type="button"
                  className="secondary small"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      technicianId: "",
                    }))
                  }
                >
                  Unassign technician
                </button>
              </div>
            )}

            <label>
              Priority
              <select
                name="priority"
                value={form.priority}
                onChange={changeField}
                required
              >
                <option value="">Select priority</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </label>

            <label>
              Status
              <select name="status" value={form.status} onChange={changeField}>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </label>

            <label className="wide">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={changeField}
                rows="2"
              />
            </label>

            <label className="wide">
              Notes
              <textarea
                name="notes"
                value={form.notes}
                onChange={changeField}
                rows="2"
              />
            </label>
          </div>

          {prioritySuggestion && (
            <div className="ai-suggestion" role="status">
              <div>
                <p className="eyebrow">AI ASSIST</p>
                <strong>
                  Suggested priority: {prioritySuggestion.priority}
                </strong>
                <p className="muted">{prioritySuggestion.reason}</p>
              </div>
              <button
                type="button"
                className="secondary small"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    priority: prioritySuggestion.priority,
                  }))
                }
              >
                Apply suggestion
              </button>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>

            <button className="primary" type="submit" disabled={savingJob}>
              {savingJob
                ? "Saving..."
                : editingId !== null
                  ? "Save changes"
                  : "Create job"}
            </button>
          </div>
        </form>
      )}

      {/* View job details - disabled and read-only */}
      {selectedJob && isAdmin && (
        <div className="job-form">
          <div className="form-heading">
            <div>
              <p className="eyebrow">JOB #{selectedJob.id}</p>
              <h2>View job details</h2>
              <p className="muted">
                These details cannot be edited in view mode.
              </p>
            </div>

            <button
              type="button"
              className="icon-button"
              onClick={() => setSelectedJob(null)}
            >
              ✕
            </button>
          </div>

          <div className="form-grid">
            <label>
              Job title
              <input value={selectedJob.title || ""} disabled />
            </label>

            <label>
              Customer
              <input value={selectedJob.customer || ""} disabled />
            </label>

            <label>
              Location
              <input value={selectedJob.location || ""} disabled />
            </label>

            <label>
              Technician
              <input
                value={selectedJob.technicianName || "Unassigned"}
                disabled
              />
            </label>

            <label>
              Priority
              <input value={selectedJob.priority || ""} disabled />
            </label>

            <label>
              Status
              <input value={selectedJob.status || ""} disabled />
            </label>

            <label>
              Created date
              <input value={formatDate(selectedJob.createdDate)} disabled />
            </label>

            <label>
              Due date
              <input value={formatDate(selectedJob.dueDate)} disabled />
            </label>

            <label>
              Completion date
              <input
                value={
                  selectedJob.completionDate
                    ? formatDate(selectedJob.completionDate)
                    : "Not completed"
                }
                disabled
              />
            </label>

            <label className="wide">
              Description
              <textarea
                value={selectedJob.description || ""}
                rows="3"
                disabled
              />
            </label>

            <label className="wide">
              Notes
              <textarea value={selectedJob.notes || ""} rows="3" disabled />
              {selectedJob.notes && (
                <div className="ai-summary ai-summary-view">
                  <b>AI summary:</b> {summariseProgressNotes(selectedJob.notes)}
                </div>
              )}
            </label>
          </div>

          <div className="activity-section">
            <div className="activity-heading">
              <p className="eyebrow">ACTIVITY & AUDIT HISTORY</p>
              <h3>Recent changes</h3>
            </div>

            {getJobActivity(selectedJob.id).length > 0 ? (
              <ol className="activity-timeline">
                {getJobActivity(selectedJob.id).map((entry) => (
                  <li key={entry.id}>
                    <span className="activity-dot" />
                    <div>
                      <strong>{entry.action}</strong>
                      <p>{entry.details}</p>
                      <time>{new Date(entry.timestamp).toLocaleString()}</time>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted">No recorded activity for this job yet.</p>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => setSelectedJob(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Display loading, empty state or job cards */}
      {loading ? (
        <p>Loading jobs…</p>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <h2>No jobs found</h2>
          <p>There are no jobs matching the selected filters.</p>
        </div>
      ) : (
        <div className="job-list">
          {jobs.map((job) => (
            <article className="job-card" key={job.id}>
              <div className="job-top">
                <div>
                  <span className="job-id">JOB #{job.id}</span>

                  <h2>{job.title}</h2>

                  <p className="muted">
                    {job.customer} · {job.location}
                  </p>
                </div>

                <span
                  className={`status status-${job.status
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {job.status}
                </span>
              </div>

              <p>{job.description || "No detailed description provided."}</p>

              <div className="job-meta">
                <span>
                  <b>Technician</b>
                  {job.technicianName || "Unassigned"}
                </span>

                <span>
                  <b>Priority</b>
                  <em
                    className={`priority priority-${job.priority.toLowerCase()}`}
                  >
                    {job.priority}
                  </em>
                </span>

                <span>
                  <b>Due date</b>
                  {formatDate(job.dueDate)}
                </span>

                <span className="job-notes">
                  <b>Notes</b>
                  {job.notes || "—"}
                  {job.notes && (
                    <small className="ai-summary">
                      <b>AI summary:</b> {summariseProgressNotes(job.notes)}
                    </small>
                  )}
                </span>
              </div>

              <div className="job-actions">
                {isAdmin ? (
                  <>
                    <button
                      className="secondary small"
                      onClick={() => startEdit(job)}
                    >
                      Edit
                    </button>

                    <button
                      className="secondary small"
                      onClick={() => viewJob(job)}
                    >
                      View
                    </button>

                    <button
                      className="danger small"
                      onClick={() => deleteJob(job.id)}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="primary small"
                      onClick={() => openProgressUpdate(job)}
                    >
                      Update progress
                    </button>

                    {job.status !== "Completed" && (
                      <button
                        type="button"
                        className="secondary small"
                        onClick={() => setCompletingJob(job)}
                      >
                        Mark as Completed
                      </button>
                    )}
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Technician progress update modal */}
      {progressJob && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Update job progress</h2>

              <button
                className="icon-button"
                onClick={() => setProgressJob(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitProgress}>
              <div className="modal-body">
                <label>
                  Status
                  <select
                    value={progressStatus}
                    onChange={(e) => setProgressStatus(e.target.value)}
                    required
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </label>

                <label>
                  Notes
                  <textarea
                    value={progressNotes}
                    onChange={(e) => setProgressNotes(e.target.value)}
                    rows="3"
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setProgressJob(null)}
                >
                  Cancel
                </button>

                <button
                  className="primary"
                  type="submit"
                  disabled={progressSaving}
                >
                  {progressSaving ? "Saving..." : "Save progress"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Technician completion confirmation */}
      {completingJob && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Confirm completion</h2>

              <button
                type="button"
                className="icon-button"
                onClick={() => setCompletingJob(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p>
                Are you sure you want to mark{" "}
                <strong>{completingJob.title}</strong> as completed?
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setCompletingJob(null)}
                disabled={completionSaving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary"
                onClick={confirmMarkCompleted}
                disabled={completionSaving}
              >
                {completionSaving ? "Saving..." : "Yes, mark completed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
