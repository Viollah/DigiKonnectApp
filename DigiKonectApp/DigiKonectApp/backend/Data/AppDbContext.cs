using DigiKonect.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DigiKonect.Api.Data;

// Entity Framework maps these C# classes to relational database tables.
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>(); // Users table.
    public DbSet<Job> Jobs => Set<Job>();    // Jobs table.

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasIndex(user => user.Email).IsUnique(); // Prevent duplicate email accounts.
        modelBuilder.Entity<Job>()
            .HasOne(job => job.Technician)               // A job can have one assigned technician.
            .WithMany(user => user.AssignedJobs)         // A technician can have many jobs.
            .HasForeignKey(job => job.TechnicianId)      // TechnicianId is the foreign key.
            .OnDelete(DeleteBehavior.SetNull);          // Keep the job if its technician is removed.
    }
}
