
namespace DigikonnectApplication.DTOs;

// Data accepted when an administrator creates or edits a job.
public record JobRequest(string Title, string Description, string Customer, string Location,
    int? TechnicianId, string Priority, string Status, DateTime DueDate, string Notes);

// Data accepted when a technician updates their own job.
public record TechnicianUpdateRequest(string Status, string Notes);


