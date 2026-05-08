# BookFlow

> A minimalist online appointment booking system designed for small service-based businesses.

[![Status](https://img.shields.io/badge/status-completed-green.svg)]()
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen.svg)]()
[![MySQL](https://img.shields.io/badge/MySQL-WAMP-blue.svg)]()
[![License](https://img.shields.io/badge/license-Academic-orange.svg)]()

---

## Author

**Ali Saadaoui**  
Student ID: st20290527  
BSc Software Engineering, Final Year Project  
Cardiff Metropolitan University  
Academic Year 2025/2026

---

## About the Project

**BookFlow** is an online appointment booking system developed as a final-year undergraduate project. Unlike commercial booking platforms such as Calendly, Acuity Scheduling, and Square Appointments, which are designed for medium-to-large organisations with complex workflows, BookFlow is built specifically for the smallest service businesses: sole traders and one-to-three-person operations such as barbers, mobile hairdressers, beauty therapists, and freelance tutors.

The project deliberately prioritises **simplicity, minimalism, and ease of use** over feature richness. It was developed using an iterative prototyping methodology and evaluated against **Nielsen's ten usability heuristics**.

The full dissertation discussing the design decisions, implementation challenges, and evaluation results can be found in the project submission documents.

---

## Features

### Customer-facing
- 📅 Browse available services with pricing and duration
- 🕐 Step-by-step booking flow (Service → Date & Time → Details)
- ✅ Real-time slot availability check
- 📧 Booking confirmation with full details

### Admin Panel
- 📊 Dashboard with key business statistics (today's appointments, weekly bookings, monthly revenue, total clients)
- 📅 Weekly calendar view with appointment details
- 🔍 Search and filter appointments by client, service, or status
- ➕ Create, edit, and cancel appointments
- ⚙️ Manage services (add, edit, delete with custom pricing and colour-coding)
- 👥 Automatic client directory with visit tracking

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Styling | TailwindCSS v3 |
| Backend | Node.js, Express.js |
| Database | MySQL (via WAMP, port 3308) |
| Architecture | Three-tier (Presentation / Application / Data) |
| API Style | RESTful with parameterised queries |

---

## Prerequisites

Before setting up BookFlow locally, ensure you have the following installed:

| Software | Version | Purpose |
|---|---|---|
| Node.js | 18.x or higher | Runtime environment |
| npm | 9.x or higher | Package manager (comes with Node.js) |
| WAMP | Latest | Local MySQL server (Windows) |
| Git | Latest | Cloning the repository |
| A web browser | Modern (Chrome/Firefox/Edge) | Running the application |

> **Note for non-Windows users:** WAMP is Windows-only. On macOS or Linux, you can use MAMP (macOS) or set up MySQL directly. The application connects to MySQL on port 3308 by default, adjust as needed.

---

## Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/alisaadaoui/booking-system.git
cd booking-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up the Database

1. Start WAMP and ensure MySQL is running on **port 3308**.
2. Open phpMyAdmin (typically at `http://localhost:8080/phpmyadmin`).
3. Create a new database named `booking_system`.
4. Import the SQL schema located at `schema.sql` in the root of the repository. This file contains both the table structure and sample seed data, so the system is ready to use immediately after import.
   
### 4. Configure Database Connection (if needed)

If your MySQL setup uses different credentials, update the connection details in `server/db.js`:

```javascript
const pool = mysql.createPool({
  host: 'localhost',
  port: 3308,
  user: 'root',
  password: '',  // your MySQL password
  database: 'booking_system'
});
```

---

## Running the System

Start the Express server from the project root:

```bash
node server/server.js
```

You should see:
```
Server running on http://localhost:3000
Connected to MySQL database
```

---

## Access URLs

Once the server is running, the system is accessible at:

| Page | URL | Purpose |
|---|---|---|
| **Landing Page** | `http://localhost:3000/` | Public-facing introduction |
| **Booking Page** | `http://localhost:3000/booking.html` | Customer booking flow |
| **Admin Panel** | `http://localhost:3000/admin.html` | Business owner dashboard |

> ⚠️ **Important for Markers:** The admin panel is intentionally accessed via direct URL (rather than a login screen). This is a deliberate scope decision discussed in **Chapter 4** of the dissertation, with authentication identified as a priority for Future Work (**Chapter 7**). To evaluate the admin functionality, navigate directly to **`http://localhost:3000/admin.html`**.

---

## Database Schema

BookFlow uses four tables:

| Table | Purpose |
| --- | --- |
| `services` | Stores business offerings (name, description, duration, price, colour) |
| `clients` | Stores customer contact details for client-list management |
| `appointments` | Central entity linking services, clients, dates, times, and status |
| `business_hours` | Stores opening and closing times per day of the week |

Full schema with foreign key relationships is shown in the **Entity-Relationship Diagram (Figure 4.2)** of the dissertation.

---

## Project Structure

```
booking-system/
│
├── public/                  # Frontend files (served statically)
│   ├── index.html           # Landing page
│   ├── booking.html         # Customer booking page
│   ├── admin.html           # Admin panel
│   ├── css/                 # Stylesheets
│   └── js/                  # Client-side JavaScript
│
├── server/                  # Backend
│   ├── server.js            # Express server entry point
│   ├── routes/              # API route definitions
│   │   ├── appointments.js
│   │   ├── services.js
│   │   └── clients.js
│   ├── controllers/         # Business logic
│   └── db.js                # MySQL connection pool
│
├── schema.sql               # MySQL database schema and seed data
│
├── package.json             # npm dependencies
└── README.md                # This file
```

---

## API Endpoints

The Express server exposes a RESTful API for the frontend:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/services` | Retrieve all services |
| POST | `/api/services` | Create a new service |
| PUT | `/api/services/:id` | Update an existing service |
| DELETE | `/api/services/:id` | Delete a service |
| GET | `/api/clients` | Retrieve all clients |
| GET | `/api/appointments` | Retrieve appointments (with optional filters) |
| POST | `/api/appointments` | Create a new appointment |
| PUT | `/api/appointments/:id` | Update an appointment |
| DELETE | `/api/appointments/:id` | Cancel an appointment |

All endpoints return appropriate HTTP status codes (200, 201, 400, 500) and JSON responses.

---

## Evaluation

BookFlow was evaluated against **Nielsen's ten usability heuristics** (Nielsen, 1994), using the same severity rating scale (0–4) applied by Aldekhyyel, Almulhem, and Binkheder (2021) in their telemedicine evaluation. The full evaluation, including findings, severity ratings, and screenshot evidence, is presented in **Chapter 5** of the dissertation.

**Summary of findings:**
- 8 out of 10 heuristics: cosmetic or compliant (Severity 0–1)
- 1 minor problem: Error Prevention (Severity 2)
- 1 major problem: Help and Documentation (Severity 3)
- No catastrophic violations

---

## Known Limitations

The following limitations are documented in the dissertation and acknowledged as scope decisions rather than oversights:

- **No authentication on the admin panel** — accessed via direct URL. Production use would require a login system.
- **No embedded help or documentation** — identified as the most significant usability gap (Heuristic 10, Severity 3).
- **No confirmation dialogs** on destructive actions (Cancel, Delete) in the admin panel.
- **Single-evaluator usability assessment** — ethics restrictions prevented user testing.
- **No deployment infrastructure** — runs locally only.

---

## Future Work

Priority areas for future development, drawn from the heuristic evaluation:

1. **Embedded help system** — onboarding tutorial, tooltips, and FAQ
2. **Authentication** — login system with hashed passwords and session management
3. **Smarter client-matching** — fuzzy matching to prevent duplicate client records
4. **Confirmation dialogs** on destructive admin actions
5. **Cloud deployment** — making the system accessible without local setup
6. **Automated reminders** — email and SMS notifications for upcoming appointments

A full discussion is provided in **Chapter 7** of the dissertation.

---

## Acknowledgements

This project was developed as part of the BSc Software Engineering programme at Cardiff Metropolitan University. The author thanks the project supervisor and module leader for their guidance throughout the academic year.

---

## License

This project is submitted for academic assessment as part of an undergraduate dissertation. All rights reserved by the author. Code is provided for evaluation purposes only.

---

## Contact

**Ali Saadaoui**  
Student ID: st20290527  
Cardiff Metropolitan University  
GitHub: [@alisaadaoui](https://github.com/alisaadaoui)

---

*Last updated: May 2026*
