using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DigiKonect.Api.Data;
using DigiKonect.Api.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace DigiKonect.Api.Controllers;

[ApiController] // Enables automatic request validation and API-specific behavior.
[Route("api/auth")] // Base URL for authentication endpoints.
public class AuthController(AppDbContext db, IConfiguration configuration) : ControllerBase
{
    [HttpPost("login")] // POST /api/auth/login.
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await db.Users.SingleOrDefaultAsync(x => x.Email == request.Email); // Find account by email.
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Email or password is incorrect." }); // Do not reveal which value failed.

        var claims = new[] // Claims are facts stored inside the signed token.
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!)); // Signing key.
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256); // Token signature algorithm.
        var token = new JwtSecurityToken(configuration["Jwt:Issuer"], configuration["Jwt:Audience"],
            claims, expires: DateTime.UtcNow.AddHours(8), signingCredentials: credentials); // Eight-hour demo token.
        return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token), user = new { user.Id, user.FullName, user.Email, user.Role } });
    }
}
