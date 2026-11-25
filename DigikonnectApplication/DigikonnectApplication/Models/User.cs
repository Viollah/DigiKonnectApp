namespace DigikonnectApplication.Models;


// Represents a person who can sign in to the application.
public class User
{
    public int Id { get; set; }                         // Database-generated primary key.
    public string FullName { get; set; } = "";          // Name displayed in the user interface.
    public string Email { get; set; } = "";             // Unique sign-in identifier.
    public string PasswordHash { get; set; } = "";      // Hashed password; never store plain-text passwords.
    public string Role { get; set; } = "Technician";    // Either Administrator or Technician.
    public ICollection<Job> AssignedJobs { get; set; } = new List<Job>(); // Jobs assigned to this technician.
}
