using System.Security.Claims;
using DigiKonect.Api.Data;
using DigiKonect.Api.DTOs;
using DigiKonect.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DigiKonect.Api.Controllers;

[ApiController] // Enables API behavior and model binding.
[Route("api/[controller]")] // Produces /api/jobs.
[Authorize] // All job endpoints require a valid login by default.
public class JobsController(AppDbContext db) : ControllerBase
{
    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!); // ID from signed token.
    private bool IsAdmin => User.IsInRole("Administrator"); // Checks the role claim.

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] int? technicianId)
    {
        var query = db.Jobs.Include(j => j.Technician).AsQueryable(); // Start with jobs and related technician details.
        if (!IsAdmin) query = query.Where(j => j.TechnicianId == CurrentUserId); // Technicians see only their jobs.
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(j => j.Status == status); // Optional status filter.
        if (technicianId.HasValue && IsAdmin) query = query.Where(j => j.TechnicianId == technicianId); // Admin-only filter.
        return Ok(await query.OrderBy(j => j.DueDate).Select(j => new {
            j.Id, j.Title, j.Description, j.Customer, j.Location, j.TechnicianId,
            TechnicianName = j.Technician == null ? "Unassigned" : j.Technician.FullName,
            j.Priority, j.Status, j.CreatedDate, j.DueDate, j.CompletionDate, j.Notes
        }).ToListAsync()); // Return a safe, UI-friendly job shape.
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetOne(int id)
    {
        var job = await db.Jobs.Include(j => j.Technician).FirstOrDefaultAsync(j => j.Id == id); // Find requested job.
        if (job is null) return NotFound(); // 404 when the job does not exist.
        if (!IsAdmin && job.TechnicianId != CurrentUserId) return Forbid(); // Prevent access to another technician's job.
        return Ok(job);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")] // Only administrators can create jobs.
    public async Task<IActionResult> Create(JobRequest request)
    {
        var validation = Validate(request); // Apply business validation before saving.
        if (validation != null) return BadRequest(new { message = validation });
        if (request.TechnicianId.HasValue && !await db.Users.AnyAsync(u => u.Id == request.TechnicianId && u.Role == "Technician"))
            return BadRequest(new { message = "Select a valid technician." }); // Ensure the foreign key points to a technician.
        var job = new Job(); Apply(job, request); // Map incoming DTO fields to the entity.
        db.Jobs.Add(job); await db.SaveChangesAsync(); // Insert into SQLite.
        return CreatedAtAction(nameof(GetOne), new { id = job.Id }, job); // Return HTTP 201 and the created resource.
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrator")] // Only administrators can edit job details and assignment.
    public async Task<IActionResult> Update(int id, JobRequest request)
    {
        var job = await db.Jobs.FindAsync(id); // Load the existing database record.
        if (job is null) return NotFound();
        var validation = Validate(request); if (validation != null) return BadRequest(new { message = validation });
        if (request.TechnicianId.HasValue && !await db.Users.AnyAsync(u => u.Id == request.TechnicianId && u.Role == "Technician"))
            return BadRequest(new { message = "Select a valid technician." });
        Apply(job, request); await db.SaveChangesAsync(); // EF tracks and updates the changed fields.
        return Ok(job);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrator")] // Only administrators can delete jobs.
    public async Task<IActionResult> Delete(int id)
    {
        var job = await db.Jobs.FindAsync(id); if (job is null) return NotFound();
        db.Jobs.Remove(job); await db.SaveChangesAsync(); // Delete the selected record.
        return NoContent(); // HTTP 204 indicates successful deletion without a response body.
    }

    [HttpPatch("{id:int}/progress")]
    [Authorize(Roles = "Technician")] // Technicians may update progress, not administrative job fields.
    public async Task<IActionResult> UpdateProgress(int id, TechnicianUpdateRequest request)
    {
        var job = await db.Jobs.FindAsync(id); if (job is null) return NotFound();
        if (job.TechnicianId != CurrentUserId) return Forbid(); // A technician can update only assigned work.
        if (!new[] { "Pending", "In Progress", "Completed" }.Contains(request.Status))
            return BadRequest(new { message = "Invalid job status." });
        job.Status = request.Status; job.Notes = request.Notes ?? ""; // Save status and progress notes.
        job.CompletionDate = request.Status == "Completed" ? DateTime.UtcNow : null; // Set/clear completion date.
        await db.SaveChangesAsync(); return Ok(job);
    }

    private static string? Validate(JobRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title)) return "Job title is required.";
        if (string.IsNullOrWhiteSpace(request.Customer)) return "Customer is required.";
        if (string.IsNullOrWhiteSpace(request.Location)) return "Location is required.";
        if (request.DueDate.Date < DateTime.UtcNow.Date) return "Due date cannot be in the past.";
        if (!new[] { "Low", "Medium", "High", "Critical" }.Contains(request.Priority)) return "Invalid priority.";
        if (!new[] { "Pending", "In Progress", "Completed" }.Contains(request.Status)) return "Invalid status.";
        return null; // Null means all validation rules passed.
    }

    private static void Apply(Job job, JobRequest request)
    {
        job.Title = request.Title.Trim(); job.Description = request.Description ?? "";
        job.Customer = request.Customer.Trim(); job.Location = request.Location.Trim();
        job.TechnicianId = request.TechnicianId; job.Priority = request.Priority; job.Status = request.Status;
        job.DueDate = request.DueDate; job.Notes = request.Notes ?? "";
        job.CompletionDate = request.Status == "Completed" ? job.CompletionDate ?? DateTime.UtcNow : null;
    }
}
