namespace DigiKonect.Api.Models;

// Stores the maintenance work that administrators create and technicians complete.
public class Job
{
    public int Id { get; set; }                         // Unique system-generated job ID.
    public string Title { get; set; } = "";             // Short job description.
    public string Description { get; set; } = "";       // Detailed scope of work.
    public string Customer { get; set; } = "";          // Customer or organisation name.
    public string Location { get; set; } = "";           // Where the work must happen.
    public int? TechnicianId { get; set; }               // Foreign key; nullable until a technician is assigned.
    public User? Technician { get; set; }                // Related technician record.
    public string Priority { get; set; } = "Medium";    // Low, Medium, High or Critical.
    public string Status { get; set; } = "Pending";     // Pending, In Progress or Completed.
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow; // Creation timestamp.
    public DateTime DueDate { get; set; }                 // Expected completion date.
    public DateTime? CompletionDate { get; set; }         // Actual completion timestamp.
    public string Notes { get; set; } = "";              // Latest progress notes.
}
