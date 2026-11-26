# DigiKonect Field Service & Job Management

A learning-focused full-stack implementation of the supplied DigiKonect Junior Software Developer assessment.

## Technology
- React 18 + Vite (JavaScript)
- ASP.NET Core Web API (.NET 8)
- Entity Framework Core + SQLite
- JWT bearer authentication and role-based authorization
- BCrypt password hashing

## Features implemented
- Administrator and Technician demo accounts
- Role-protected API endpoints and technician record-level access
- Database-driven dashboard counts: total, pending, in progress, completed, overdue and technicians
- Administrator job create, view, edit, delete, assignment and status/technician filtering
- Technician assigned-job view, status update and progress notes
- Responsive layout, loading feedback, empty state and error/success messages

## Requirements
Install the .NET 8 SDK and Node.js 20 or later.

## Run the backend
Open a terminal in `backend` and run:

```bash
dotnet restore
dotnet run --urls http://localhost:5000
```

The API creates `digikonect.db` automatically and inserts the two demo accounts on first run. Swagger is available at `http://localhost:5000/swagger` when running in Development.

## Run the frontend
Open a second terminal in `frontend` and run:

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). The frontend calls the API at `http://localhost:5000/api`.

## Demonstration credentials
| Role | Email | Password |
|---|---|---|
| Administrator | admin@digikonect.local | Admin123! |
| Technician | tech@digikonect.local | Tech123! |

These credentials are for local demonstration only. Change the JWT key, remove seeded accounts and use secrets management before deployment.

## Architecture
1. React pages render the dashboard, job list and login form.
2. React components call `src/services/api.js` using Axios.
3. Axios adds the JWT bearer token from browser local storage.
4. ASP.NET controllers authenticate and authorize requests, validate input and apply business rules.
5. Entity Framework Core maps `User` and `Job` entities to SQLite tables. `Job.TechnicianId` is a nullable foreign key to `User.Id`.

## Important implementation notes / limitations
- `EnsureCreated()` is used to make local setup quick for an assessment. For a production system, replace it with EF Core migrations.
- The technician progress form uses browser prompts to keep the assessment implementation compact; a dedicated modal would improve the experience.
- The frontend stores the JWT in local storage for demonstration simplicity. A production application should consider secure, HttpOnly cookies and stronger session protections.
- The demo seed contains one technician. Add more technician accounts through a protected user-management feature if extending the assessment.
- Dates are stored in UTC by the API; display formatting uses the browser's local timezone.
- Add automated tests, audit history, pagination, structured logging, rate limiting and production secrets before enterprise use.

## Assessment coverage
The core implementation follows the assessment's requested React frontend, C# ASP.NET Core REST API and relational database. It includes role separation, administrator dashboard statistics, job CRUD and technician progress updates. AI tools were used to assist with the initial code; review, run and understand every file before submitting, and disclose AI assistance as requested in the assessment.
