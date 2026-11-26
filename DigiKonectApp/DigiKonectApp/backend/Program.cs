using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DigiKonect.Api.Data;
using DigiKonect.Api.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args); // Creates the application and loads configuration.
builder.Services.AddControllers();                 // Enables attribute-routed API controllers.
builder.Services.AddEndpointsApiExplorer();        // Makes endpoint metadata available to API tools.
builder.Services.AddSwaggerGen();                 // Adds Swagger documentation in development.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"))); // Uses SQLite.

var jwtKey = builder.Configuration["Jwt:Key"]!; // Reads the signing key from configuration.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true, // Reject tokens from unknown issuers.
            ValidateAudience = true, // Reject tokens intended for another application.
            ValidateLifetime = true, // Reject expired tokens.
            ValidateIssuerSigningKey = true, // Verify the token signature.
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddAuthorization(); // Enables [Authorize] and role checks.
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy =>
    policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod())); // Allows the local React app.

var app = builder.Build(); // Builds the configured middleware pipeline.
if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); } // Swagger is development-only.
app.UseCors("Frontend"); // Handles cross-origin browser requests.
app.UseAuthentication(); // Reads and validates the bearer token before authorization.
app.UseAuthorization(); // Enforces role and authentication rules.
app.MapControllers(); // Maps controller routes such as /api/jobs.

// Create the database and demo accounts the first time the API starts.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated(); // Convenient assessment setup; use EF migrations for production.
    if (!db.Users.Any())
    {
        db.Users.AddRange(
            new User { FullName = "Demo Administrator", Email = "admin@digikonect.local", Role = "Administrator", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!") },
            new User { FullName = "Demo Technician", Email = "tech@digikonect.local", Role = "Technician", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Tech123!") }
        );
        db.SaveChanges(); // Persists the demo users.
    }
}
app.Run(); // Starts listening for HTTP requests.
