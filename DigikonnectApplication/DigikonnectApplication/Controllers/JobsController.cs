
using Microsoft.EntityFrameworkCore;
using DigikonnectApplication.Data;
using DigikonnectApplication.DTOs;
using DigikonnectApplication.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DigikonnectApplication.Controllers;

// All endpoints in this controller require authentication.
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class JobsController(AppDbContext db) : ControllerBase
{
    // Get the logged-in user's ID from the JWT token.
    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // Check whether the logged-in user is an administrator.
    private bool IsAdmin => User.IsInRole("Administrator");

    // GET: api/jobs
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status,
        [FromQuery] int? technicianId)
    {
        var query = db.Jobs
            .Include(j => j.Technician)
            .AsQueryable();

        if (!IsAdmin)
            query = query.Where(j => j.TechnicianId == CurrentUserId);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(j => j.Status == status);

        if (technicianId.HasValue && IsAdmin)
            query = query.Where(j => j.TechnicianId == technicianId);

        var jobs = await query
            .OrderBy(j => j.DueDate)
            .Select(j => new
            {
                id = j.JobId,
                title = j.JobTitle,
                j.Description,
                j.Customer,
                j.Location,
                j.TechnicianId,
                technicianName = j.Technician == null
                    ? "Unassigned"
                    : j.Technician.FullName,
                j.Priority,
                j.Status,
                j.CreatedDate,
                j.DueDate,
                j.CompletionDate,
                j.Notes
            })
            .ToListAsync();

        return Ok(jobs);
    }

    // GET: api/jobs/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetOne(int id)
    {
        var job = await db.Jobs
            .Include(j => j.Technician)
            .FirstOrDefaultAsync(j => j.JobId == id);

        if (job is null)
            return NotFound();

        if (!IsAdmin && job.TechnicianId != CurrentUserId)
            return Forbid();

        return Ok(job);
    }
    // Assigns a job to a technician or removes the assignment.
    // Only Administrators are allowed to perform this action.
    [HttpPatch("{id:int}/assign")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> AssignTechnician(
        int id,
        AssignTechnicianRequest request)
    {
        // Find the job that needs to be assigned.
        var job = await db.Jobs.FindAsync(id);

        // Return 404 if the job does not exist.
        if (job is null)
            return NotFound(new { message = "Job not found." });

        // If a technician ID was supplied, check that the user exists
        // and that their role is Technician.
        if (request.TechnicianId.HasValue)
        {
            var technicianExists = await db.Users.AnyAsync(user =>
                user.Id == request.TechnicianId.Value &&
                user.Role == "Technician");

            if (!technicianExists)
            {
                return BadRequest(new
                {
                    message = "Selected technician does not exist."
                });
            }
        }

        // Update the foreign key.
        // If TechnicianId is null, the job becomes unassigned.
        job.TechnicianId = request.TechnicianId;

        // Save the changes to the SQLite database.
        await db.SaveChangesAsync();

        return Ok(new
        {
            message = request.TechnicianId.HasValue
                ? "Technician assigned successfully."
                : "Technician assignment removed successfully.",
            jobId = job.JobId,
            technicianId = job.TechnicianId
        });
    }

    // POST: api/jobs
    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Create(JobRequest request)
    {
        var validation = Validate(request);

        if (validation != null)
            return BadRequest(new { message = validation });

        // Check whether the selected technician exists.
        if (request.TechnicianId.HasValue &&
            !await db.Users.AnyAsync(u =>
                u.Id == request.TechnicianId.Value &&
                u.Role == "Technician"))
        {
            return BadRequest(new
            {
                message = "Select a valid technician."
            });
        }

        var job = new Job();

        Apply(job, request);

        db.Jobs.Add(job);

        
        try
        {
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine("JOB CREATION ERROR:");
            Console.WriteLine(ex.ToString());

            return StatusCode(500, new
            {
                message = ex.Message,
                details = ex.InnerException?.Message
            });
        }

        return CreatedAtAction(
            nameof(GetOne),
            new { id = job.JobId },
            job
        );
    }

    // PUT: api/jobs/{id}
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Update(
        int id,
        JobRequest request)
    {
        var job = await db.Jobs.FindAsync(id);

        if (job is null)
            return NotFound();

        var validation = Validate(request);

        if (validation != null)
            return BadRequest(new { message = validation });

        // Check whether the selected technician exists.
        if (request.TechnicianId.HasValue &&
            !await db.Users.AnyAsync(u =>
                u.Id == request.TechnicianId.Value &&
                u.Role == "Technician"))
        {
            return BadRequest(new
            {
                message = "Select a valid technician."
            });
        }

        Apply(job, request);

     
        try
        {
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine("JOB UPDATE ERROR:");
            Console.WriteLine(ex.ToString());

            return StatusCode(500, new
            {
                message = ex.Message,
                details = ex.InnerException?.Message
            });
        }

        return Ok(job);
    }

    // DELETE: api/jobs/{id}
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(int id)
    {
        var job = await db.Jobs.FindAsync(id);

        if (job is null)
            return NotFound();

        db.Jobs.Remove(job);

        await db.SaveChangesAsync();

        return NoContent();
    }

    // PATCH: api/jobs/{id}/progress
    [HttpPatch("{id:int}/progress")]
    [Authorize(Roles = "Technician")]
    public async Task<IActionResult> UpdateProgress(
        int id,
        TechnicianUpdateRequest request)
    {
        var job = await db.Jobs.FindAsync(id);

        if (job is null)
            return NotFound();

        if (job.TechnicianId != CurrentUserId)
            return Forbid();

        if (!new[] { "Pending", "In Progress", "Completed" }
            .Contains(request.Status))
        {
            return BadRequest(new
            {
                message = "Invalid job status."
            });
        }

        job.Status = request.Status;
        job.Notes = request.Notes ?? "";

        job.CompletionDate =
            request.Status == "Completed"
                ? DateTime.UtcNow
                : null;

        await db.SaveChangesAsync();

        return Ok(job);
    }

    // Validate job information before saving.
    private static string? Validate(JobRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return "Job title is required.";

        if (string.IsNullOrWhiteSpace(request.Customer))
            return "Customer is required.";

        if (string.IsNullOrWhiteSpace(request.Location))
            return "Location is required.";

        if (request.DueDate.Date < DateTime.UtcNow.Date)
            return "Due date cannot be in the past.";

        if (!new[] { "Low", "Medium", "High", "Critical" } //if the priority is not found in the allowed list,return an error message
            .Contains(request.Priority))
            return "Invalid priority.";

        if (!new[] { "Pending", "In Progress", "Completed" } 
            .Contains(request.Status))
            return "Invalid status.";

        return null;
    }

    // Apply the request values to the Job entity.
    private static void Apply(Job job, JobRequest request)
    {
        job.JobTitle = request.Title.Trim();
        job.Description = request.Description ?? "";
        job.Customer = request.Customer.Trim();
        job.Location = request.Location.Trim();

        job.TechnicianId = request.TechnicianId;
        job.Priority = request.Priority;
        job.Status = request.Status;

        job.DueDate = request.DueDate;
        job.Notes = request.Notes ?? "";

        job.CompletionDate =
            request.Status == "Completed"
                ? job.CompletionDate ?? DateTime.UtcNow
                : null;
    }
}
