# DigiKonnectApp

DigiKonnect is a job and maintenance management application. It provides an administrator with the ability to create and manage jobs, assign jobs to technicians, and monitor job statistics. Technicians can log in, view jobs assigned to them, and update their job progress.

The frontend is built with **React**, **Vite**, **React Router** and **Axios**. It communicates with the DigiKonnectApplication ASP.NET Core Web API.

Admin Login:
Email: "admin@digikonect.local,
Password: "AdminSecure123!

1. Technologies
   React - Builds the user interface using reusable components.
   Vite - Provides the development server and production build tooling.
   JavaScript - Implements frontend functionality.
   React Router DOM - Handles navigation between application pages.
   Axios - Sends HTTP requests to the backend API.
   CSS - Styles the application interface.

2. Prerequisites

- Node.js – JavaScript runtime.
- npm – package manager installed with Node.js.
- Visual Studio Code or another code editor.

3. Frontend folder structure
   frontend/

── public/ # Static files served directly

── src/

── components/ # Reusable UI components

── context/ # Shared React context
└── AuthContext.jsx # Authentication state and functions

── pages/ # Main application screens
└── Jobs.jsx,
Dashboard.jsx
Login.jsx
register.jsx

── services/ # Services used to communicate with the API
└── api.js # Shared Axios configuration

── App.jsx # Main application component and routes
── main.jsx # React application entry point
── index.css # Global styles, if used

── index.html # HTML page where React is mounted
── package.json # Project metadata, dependencies and scripts
── package-lock.json # Exact dependency versions
── vite.config.js # Vite configuration

4. Frontend Architecture
   The frontend uses a component-based structure. Each folder has a separate responsibility, making the application easier to maintain and extend.

src/pages/ – application pages

The pages folder contains the main screens that users navigate to.

Examples of application pages include:

- Login – allows users to sign in.
- Register – allows a technician to create an account.
- Jobs – displays job information and provides job-related actions.
- Dashboard – displays summary information and job statistics.

Pages combine reusable components, React state and API service calls to display application functionality.

src/context/` – shared state

AuthContext.jsx - manages authentication information that needs to be accessed by different parts of the application.

Depending on the implementation, it can provide:

- The logged-in user.
- The user's role, such as `Administrator` or `Technician`.
- Login and logout functions.

src/services/ – API communication

The services folder contains the code responsible for communicating with the backend.

api.js provides a shared Axios instance. It can configure:

- The backend API base URL.
- Common request settings.
- An Axios request interceptor to attach the JWT bearer token.

Example of using the shared API service in a page:

javascript
import api from "../services/api";

// Request the jobs from the backend API.
const response = await api.get("/jobs");

// The returned data can then be stored in React state.
console.log(response.data);

The API base URL in api.js must match the address and port used by the running backend.

App.jsx – main application component

App.jsx brings the frontend together. It typically defines the application's routes and wraps pages in shared providers such as the authentication context.

main.jsx – React entry point

main.jsx is the starting point of the React application. It renders the main App component into the root HTML element.

5. Dependencies
   The project dependencies are declared in package.json.

vite - Development server and production build tool.
@vitejs/plugin-react - Adds React support to Vite.
eslint - Checks JavaScript code for common problems.
@eslint/js - JavaScript ESLint recommended configuration.
eslint-plugin-react-hooks - Checks React Hooks usage.
eslint-plugin-react-refresh - Provides linting support for React Fast Refresh.
globals - Defines common JavaScript global variables for ESLint.
@types/react - React type definitions used by development tooling.
@types/react-dom - React DOM type definitions used by development tooling.

6. Install the frontend dependencies

Open a terminal in the project root and navigate to the frontend folder:

bash
cd frontend
Install the dependencies declared in package.json:
bash
npm install
This command reads package.json and package-lock.json, then installs the packages into the node_modules/ directory.

If you are creating the frontend from scratch rather than setting up the existing project, the main packages can be installed with:
bash
npm install react react-dom react-router-dom axios
Install the development tools with:
bash
npm install -D vite @vitejs/plugin-react eslint @eslint/js eslint-plugin-react-hooks eslint-plugin-react-refresh globals
For the existing DigiKonnect frontend, use `npm install` first. There is normally no need to install each package individually.

7. Run the React application
   Make sure the terminal is in the `frontend/` directory.

Start the Vite development server:
bash
npm run dev
Vite displays a local URL in the terminal:
http://localhost:5173

Open the displayed URL in your browser.

The backend API must also be running for features that load or save application data.

Quick start

After cloning or downloading the project:

bash

# Navigate to the React frontend

cd frontend

# Install dependencies

npm install

# Start the development server

npm run dev

Open the local URL shown by Vite in your browser.
