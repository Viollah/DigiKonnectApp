using DigikonnectApplication.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DigikonnectApplication.Controllers;

[ApiController]
[Route("api/technicians")]
[Authorize(Roles = "Administrator")] // Only administrators need the technician directory.
public class TechniciansController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await db.Users
        .Where(u => u.Role == "Technician") // Exclude administrator accounts.
        .Select(u => new { u.Id, u.FullName, u.Email }) // Never return password hashes.
        .ToListAsync());
}

