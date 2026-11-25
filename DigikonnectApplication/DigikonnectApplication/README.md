# DigiKonnectApplication – Backend API

## 1. Overview

The DigiKonnect backend is an ASP.NET Core Web API that provides server-side functionality for the job and maintenance management application.

It handles user authentication, role-based authorisation, job management, technician assignment, technician progress updates and dashboard statistics. It validates incoming requests and stores application data in SQLite through Entity Framework Core.

The backend is consumed by the React frontend through HTTP requests.

### Main responsibilities

- Register and authenticate users.
- Issue and validate JSON Web Tokens (JWTs).
- Enforce access for Administrators and Technicians.
- Create, retrieve, update and delete jobs.
- Assign jobs to technicians and remove assignments.
- Allow assigned technicians to update job progress and notes.
- Return dashboard statistics for administrators.
- Store users and jobs in a SQLite database.

##  Technologies

Technology 
 C# - Backend programming language. 
 ASP.NET Core Web API - Builds HTTP endpoints for the frontend. 
 Entity Framework Core - Object-relational mapper used to access the database. 
 SQLite - Relational database used to store application data. 
 EF Core Migrations - Tracks and applies database schema changes. 
 JWT Bearer Authentication - Authenticates API requests using bearer tokens. 
 BCrypt | Hashes passwords and verifies submitted passwords. 
 Swagger / OpenAPI - Documents and allows testing of API endpoints. 
 CORS - Allows the React development server to call the API. 

 ##  Backend architecture

The backend uses a controller-based Web API structure.


React Frontend
      |
      | HTTP requests (JSON)
      | Authorization: Bearer <JWT>
      v
ASP.NET Core Web API
      |
      +------------------------------+
      |                              |
      v                              v
Authentication &                API Controllers
Authorisation                    |
      |                          +-- AuthController
      |                          +-- JobsController
      |                          +-- DashboardController
      |                          +-- TechniciansController 
      |                              |
      +------------------------------+
                     |
                     v
                DTOs / Validation
                     |
                     v
                 AppDbContext
              (Entity Framework Core)
                     |
                     v
                   SQLite
###  Controllers

Controllers receive HTTP requests, apply endpoint authorisation, validate input and coordinate database operations.

- AuthController** – handles user registration and login. It verifies password hashes and returns a JWT after successful authentication.
- JobsController** – handles job retrieval and administration, technician assignment, and technician progress updates.
- DashboardController** – returns job and technician summary counts for the administrator dashboard.
- TechniciansController** – provides technician-related dashboard

### Models

Models represent the main entities stored in the database.

- User – represents an application account. Administrator and Technician accounts are distinguished by the Role property.
- Job – represents a maintenance job, including its title, description, customer, location, assigned technician, priority, status, dates and notes.

###  DTOs

Data Transfer Objects define the data accepted by API requests. They separate incoming request data from database entities.

Examples include:

- JobRequest – data used when an administrator creates or edits a job.
- TechnicianUpdateRequest – status and notes submitted by a technician when updating job progress.
- AssignTechnicianRequest – technician ID used to assign or unassign a job.

###  Data access

AppDbContext is the Entity Framework Core database context. It exposes the Users and Jobs entity sets and configures the relationship between jobs and technicians.

Controllers use this context to query and save records in SQLite.

###  Authentication and authorisation

The API uses JWT bearer authentication.

1. A user submits login details to the login endpoint.
2. The API finds the user and verifies the password hash with BCrypt.
3. If the credentials are valid, the API creates a signed JWT.
4. The frontend sends the token in the Authorization header on protected requests.
5. ASP.NET Core validates the token and makes its claims available to controllers.

The token includes the user's identifier and role claims. Role-based attributes restrict administrator-only and technician-only actions.

Examples:

- [Authorize] – requires an authenticated user.
- [Authorize(Roles = "Administrator")] – restricts an endpoint to administrators.
- [Authorize(Roles = "Technician")] – restricts an endpoint to technicians.

The API must enforce access rules even when the frontend hides buttons or pages from a user.

##  Database design

DigiKonnectApplication uses SQLite with Entity Framework Core.

### Main tables

| Table | Purpose |
|---|---|
| Users | Stores administrator and technician accounts. |
| Jobs | Stores maintenance jobs and assignment details. |

### Relationship: Users and Jobs

One technician can be assigned multiple jobs. A job can have one assigned technician or remain unassigned.


Users

Id (Primary Key)
FullName
Email
PasswordHash
Role
   |
   | 1
   |
   | many

Jobs

JobId (Primary Key)
JobTitle
Description
Customer
Location
TechnicianId (Nullable Foreign Key)
Priority
Status
CreatedDate
DueDate
CompletionDate
Notes


Jobs.TechnicianId references Users.Id. The foreign key is nullable so that jobs can be created before a technician is assigned or can be unassigned later.

The application checks that an assigned user exists and has the Technician role.

## Project structure

The structure below reflects the backend files and features discussed for DigiKonnect. Adjust it to match the actual files in your project.


DigikonnectApplication/
│
├── Controllers/
│   ├── AuthController.cs
│   ├── JobsController.cs
│   ├── DashboardController.cs
│   └── TechniciansController.cs
│
├── Data/
│   └── AppDbContext.cs
│
├── DTOs/
│   ├── JobRequest.cs
│   ├── TechnicianUpdateRequest.cs
│   └── AssignTechnicianRequest.cs
│
├── Models/
│   ├── User.cs
│   └── Job.cs
│
├── Migrations/
│   └── ...                         # Generated EF Core migrations
│
├── Properties/
│   └── launchSettings.json
│
├── appsettings.json
├── Program.cs
└── DigikonnectApplication.csproj


### Folder responsibilities

- Controllers/ – API endpoints and request handling.
- Data/ – database context and EF Core configuration.
- DTOs/ – request data contracts.
- Models/ – database entity classes.
- Migrations/ – generated database schema changes.
- Program.cs – application services, database configuration, authentication, CORS, middleware and startup configuration.
- appsettings.json – application settings and connection strings. Do not commit real secrets.

##  Prerequisites

Install the following before running the backend:

- .NET SDK – use the version targeted in DigikonnectApplication.csproj.
- Visual Studio 2022 with the ASP.NET and web development workload, or Visual Studio Code with C# tooling.
- Git – optional, for cloning and source control.
- DB Browser for SQLite – optional, for inspecting the SQLite database.

Check the installed .NET SDK:

bash
dotnet --version
dotnet --list-sdks

## Installation

###  Open the backend project

Open the solution in Visual Studio, or open a terminal in the directory containing:

text
DigikonnectApplication.csproj


Run the dotnet commands below from this backend project directory unless stated otherwise.

###  Restore NuGet packages

bash
dotnet restore

This reads the project file and downloads the NuGet dependencies required by the backend.

###  Backend package dependencies

The backend uses the following package capabilities. Check DigikonnectApplication.csproj first; do not add a package that is already referenced.

NuGet package

Microsoft.EntityFrameworkCore.Sqlite - Entity Framework Core provider for SQLite. 
Microsoft.EntityFrameworkCore.Design - Design-time support for EF Core migrations. 
Microsoft.EntityFrameworkCore.Tools - Entity Framework Core tooling support. 
Microsoft.AspNetCore.Authentication.JwtBearer - JWT bearer token authentication. 
BCrypt.Net-Next - Password hashing and verification. 
Swashbuckle.AspNetCore  Swagger/OpenAPI documentation. 

If a required package is missing, add it from the backend project directory:

bash
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package BCrypt.Net-Next
dotnet add package Swashbuckle.AspNetCore


Package versions must be compatible with the project's target .NET and Entity Framework Core versions.

### Build the project

bash
dotnet build

Resolve build errors before starting the API.

##  Configuration

### Database connection string

The SQLite connection string is configured in appsettings.json.

Example:
json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=Digikonnect.db"
  }
}


The database filename and location must match the configuration used by Program.cs.

A relative SQLite path is resolved from the application's working directory. If the application appears to create or use a different database, check the resolved data source through the EF Core database connection.

### JWT settings

The API needs matching JWT settings when creating and validating tokens. Configure the signing key, issuer, audience and token expiry according to the names used in Program.cs and AuthController.cs.

Example configuration shape (use the exact section and property names expected by your code):

json
{
  "Jwt": {
    "Key": "REPLACE-WITH-A-SECURE-SECRET",
    "Issuer": "DigikonnectApplication",
    "Audience": "DigikonnectFrontend",
    "ExpiryHours": 8
  }
}


The example values are illustrative. The issuer, audience and signing key used to generate a token must match the validation configuration.

Security: Do not commit real signing keys, administrator passwords or production secrets. Use .NET User Secrets for local development or environment variables / a secure secrets provider for deployment. Use a strong, randomly generated signing key.

### Administrator seed configuration

If Program.cs creates or updates an administrator account from an Admin section in appsettings.json, provide the required local values using the exact property names expected by the code.

### CORS configuration

The backend must allow the React development server to make cross-origin requests.

The frontend development origin used by the project is:

text
http://localhost:5173


Make sure the CORS policy in Program.cs allows this origin. If Vite runs on a different port, update the allowed origin to match.

CORS controls which browser origins can call the API; it does not replace authentication or authorisation.

## Database configuration

The application uses SQLite as its relational database and Entity Framework Core (EF Core) to manage database operations.

The database connection string is configured in appsettings.json:

json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=Digikonnect.db"
  }
}


Do this for each command instead of writing `bash` as plain text.

###  Add Database schema

markdown
## Database schema

The application uses two main tables:

### Users
Stores administrator and technician accounts.

- Id (Primary Key)
- FullName
- Email
- PasswordHash
- Role

### Jobs
Stores maintenance job information.

- JobId (Primary Key)
- JobTitle
- Description
- Customer
- Location
- TechnicianId (Nullable Foreign Key)
- Priority
- Status
- CreatedDate
- DueDate
- CompletionDate
- Notes

### Relationships

One technician can have multiple assigned jobs. Each job can be assigned to one technician or remain unassigned.

The TechnicianId foreign key references the Users table.

### 4. Add Sample test data

```markdown
## Sample test data

The following records can be used to test the application:

Record: 

Administrator - admin@digikonect.local 
Technician - reqister first, the login

##  Database migrations

The project uses Entity Framework Core migrations to create and update the SQLite schema.

### Install the EF Core command-line tool

If dotnet-ef is not installed:

bash
dotnet tool install --global dotnet-ef

If it is already installed, check its version:

bash
dotnet ef --version

Use a tool version compatible with the project's EF Core packages.

### List existing migrations

bash
dotnet ef migrations list

###  Create a migration

Only create an initial migration if the project does not already have one:

bash
dotnet ef migrations add InitialCreate

For later model changes, use a descriptive migration name, for example:

bash
dotnet ef migrations add AddJobFields

###  Apply migrations

bash
dotnet ef database update

This applies pending migrations to the configured SQLite database.

Do not create a second initial migration if migrations already exist. Do not mix EnsureCreated() with an existing migrations workflow.

If the application seeds an administrator by querying the Users table during startup, ensure migrations are applied before that query runs.

## Running the backend

From the directory containing DigikonnectApplication.csproj:

bash
dotnet run

The terminal displays the HTTP and/or HTTPS addresses on which the API is listening.

Open the Swagger URL using the actual port shown in the terminal. It commonly has this format:

https://localhost:<port>/swagger

The port may differ depending on Properties/launchSettings.json and the local environment.

To stop the API, press Ctrl+C in the terminal.

## API endpoints

The endpoints below reflect the API functionality implemented or discussed for DigiKonnectApplication. Confirm the exact routes in the controller attributes in your current source code.

Method 

POST - /api/auth/register | Register a technician account 
POST  - /api/auth/login | Authenticate and return a JWT  
GET - /api/jobs | Retrieve jobs; supports status and technician filters | Authenticated 
GET  - /api/jobs/{id} | Retrieve a job | Administrator or assigned technician 
POST - /api/jobs | Create a job | Administrator 
PUT - /api/jobs/{id} | Update a job | Administrator 
DELETE - /api/jobs/{id} | Delete a job | Administrator 
PATCH - /api/jobs/{id}/assign | Assign or unassign a technician | Administrator 
PATCH - /api/jobs/{id}/progress | Update job status and notes | Assigned Technician 
GET - /api/dashboard/stats | Retrieve dashboard statistics | Administrator 
GET - /api/technicians | Retrieve technicians, if implemented | As configured by controller 

### Assign a technician

Example request:

http
PATCH /api/jobs/1/assign
Content-Type: application/json
Authorization: Bearer <token>

json
{
  "technicianId": 2
}

To remove the assignment:

json
{
  "technicianId": null
}

### Retrieve dashboard statistics

http
GET /api/dashboard/stats
Authorization: Bearer <token>

Example response:

json
{
  "totalJobs": 10,
  "pendingJobs": 3,
  "inProgressJobs": 4,
  "completedJobs": 3,
  "unassignedJobs": 2,
  "totalTechnicians": 5
}

The values above are examples; the API calculates actual values from the database.

##  Testing with Swagger

1. Start the backend using dotnet run.
2. Open the Swagger URL printed in the terminal.
3. Use POST /api/auth/login with a valid account.
4. Copy the JWT returned by the login endpoint.
5. Select **Authorize** in Swagger.
6. Enter the token in this format:

Bearer <your-token>

7. Select Authorize*and close the dialog.
8. Test the protected endpoints.

Administrator endpoints require a token belonging to a user with the Administrator role. Technician progress updates require a technician token, and the job must be assigned to that technician.

## HTTP response codes and validation

The API uses HTTP status codes to indicate the outcome of a request.
 Status code

200 OK - Request succeeded | Job retrieved or updated.
201 Created - Resource created | Job successfully created. |
204 No Content - Request succeeded with no response body | Job deleted.
400 Bad Request - Submitted data is invalid | Invalid priority or technician ID. 
401 Unauthorized -Authentication is missing or invalid | Missing, expired or invalid JWT. 
403 Forbidden - User is authenticated but not permitted | Technician tries to use an administrator-only endpoint. 
404 Not Found - Requested resource does not exist | Job ID does not exist. 

Incoming job data is validated by the API. Examples include required job title, customer and location, valid priority and status values, a due date that is not in the past, and a valid technician account when assigning a job.

##  Troubleshooting

### 401 Unauthorized

- Log in again and obtain a valid token.
- Confirm the frontend or Swagger sends Authorization: Bearer <token>.
- Check that the token has not expired.
- Confirm the signing key, issuer and audience match between token creation and validation.

### 403 Forbidden

The token may be valid, but the user does not have the required role or permission to access the resource. Check the account's role and the endpoint's authorisation attributes.

### SQLite reports `no such table`

- Run dotnet ef migrations list.
- Apply migrations using dotnet ef database update.
- Confirm that the API is using the intended SQLite file.
- If startup seeding queries Users, ensure migrations run before that query.

### SQLite reports `database is locked`

- Close DB Browser for SQLite or other applications that may be writing to the same database.
- Stop duplicate instances of the API.
- Retry after the database is no longer locked.

SQLite supports concurrent readers but has more limited write concurrency than a server database.

### Swagger cannot be opened

- Confirm the API is running.
- Use the exact URL and port shown in the terminal.
- Check that Swagger is enabled for the current environment.

### Frontend requests fail because of CORS

- Confirm the frontend origin is correct.
- Check the CORS policy in Program.cs.
- Confirm the API is running and that the frontend uses the correct API URL.

##  Quick start

After cloning or downloading the project:

bash
# Move into the backend project directory
cd DigikonnectApplication

# Restore NuGet dependencies
dotnet restore

# Build the API
dotnet build

# Apply existing database migrations
dotnet ef database update

# Start the API
dotnet run


Open the Swagger URL shown in the terminal to explore and test the API.




