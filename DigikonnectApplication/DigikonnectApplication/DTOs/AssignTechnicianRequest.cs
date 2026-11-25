namespace DigikonnectApplication.DTOs;

// Holds the technician ID selected when assigning a job.
// A null TechnicianId means the job should be unassigned.
public record AssignTechnicianRequest(int? TechnicianId);