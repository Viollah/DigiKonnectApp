git clone https://github.com/Viollah/DigikonnectApp.git
cd DigikonnectApp

Backend – ASP.NET Core Web API
cd DigikonnectApplication
- Restore NuGet packages
dotnet restore
- Check existing migrations
dotnet ef migrations list
- Apply database migrations
dotnet ef database update
- Build the application
dotnet build
- Run the backend API
dotnet run

Test API endpoints : https://localhost:7226/swagger

Frontend – React + Vite
cd frontend
- Install dependencies
npm install
- Start the React development server
npm run dev
Open the application: http://localhost:5173

Database migration
- Install EF Core CLI tool (if not installed)
dotnet tool install --global dotnet-ef
- Create a new migration
dotnet ef migrations add MigrationName
- Apply database changes
dotnet ef database update
- List migrations
dotnet ef migrations list

Technician registers before login
