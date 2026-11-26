using DigiKonect.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DigiKonect.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize(Roles = "Administrator")] // Dashboard statistics are administrator-only.
public class DashboardController(AppDbContext db) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var today = DateTime.UtcNow.Date; // Use UTC consistently for overdue comparisons.
        var jobs = db.Jobs; // Reuse the jobs query for the dashboard counts.
        return Ok(new
        {
            totalJobs = await jobs.CountAsync(),
            pendingJobs = await jobs.CountAsync(j => j.Status == "Pending"),
            inProgressJobs = await jobs.CountAsync(j => j.Status == "In Progress"),
            completedJobs = await jobs.CountAsync(j => j.Status == "Completed"),
            overdueJobs = await jobs.CountAsync(j => j.Status != "Completed" && j.DueDate < today),
            technicians = await db.Users.CountAsync(u => u.Role == "Technician")
        }); // Each value is calculated from the database, not hard-coded.
    }
}
