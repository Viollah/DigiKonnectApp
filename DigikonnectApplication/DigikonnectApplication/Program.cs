
using DigikonnectApplication.Data;
using DigikonnectApplication.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. ADD SERVICES
// ==========================================

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ==========================================
// 2. CONFIGURE JWT AUTHENTICATION
// ==========================================

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            // Must match AuthController JWT settings.
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],

            // Secret key used to validate JWT tokens.
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)
            ),

            // Identifies the user's role.
            RoleClaimType = ClaimTypes.Role
        };
    });

// ==========================================
// 3. CONFIGURE CORS FOR REACT
// ==========================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// ==========================================
// 4. REGISTER SQLITE DATABASE
// ==========================================

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqliteOptions => sqliteOptions.CommandTimeout(30)
    )
);

// Build the application.
var app = builder.Build();

// ==========================================
// 5. CREATE OR UPDATE ADMINISTRATOR
// ==========================================

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();

    // Get administrator details from appsettings.json.
    var adminEmail = configuration["Admin:Email"];

    if (string.IsNullOrWhiteSpace(adminEmail) ||
        string.IsNullOrWhiteSpace(configuration["Admin:FullName"]) ||
        string.IsNullOrWhiteSpace(configuration["Admin:Password"]))
    {
        throw new InvalidOperationException(
            "Administrator configuration is missing from appsettings.json."
        );
    }

    // Find the existing administrator.
    var admin = await db.Users
        .FirstOrDefaultAsync(user => user.Email == adminEmail);

    if (admin == null)
    {
        // Create a new administrator account.
        admin = new User
        {
            FullName = configuration["Admin:FullName"]!,
            Email = adminEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(
                configuration["Admin:Password"]!
            ),
            Role = "Administrator"
        };

        db.Users.Add(admin);

        Console.WriteLine("Administrator account created successfully.");
    }
    else
    {
        // Update the existing administrator's name.
        admin.FullName = configuration["Admin:FullName"]!;

        Console.WriteLine("Administrator account updated successfully.");
    }

    // Save changes to SQLite.
    await db.SaveChangesAsync();
}

// ==========================================
// 6. CONFIGURE HTTP REQUEST PIPELINE
// ==========================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Allow React frontend to communicate with the API.
app.UseCors("ReactPolicy");

// Authenticate users using JWT tokens.
app.UseAuthentication();

// Check user permissions and roles.
app.UseAuthorization();

// Map API controllers.
app.MapControllers();

// Start the application.
app.Run();
