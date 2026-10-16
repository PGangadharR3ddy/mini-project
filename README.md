# Smart Classroom Management System — README

---

## Prerequisites

Make sure you have the following installed before running the project:

- Node.js (v18 or above)
- Java 17 or above
- Maven
- Python 3.10 or above
- PostgreSQL (or a Neon cloud database)
- Ollama (for local AI models)
- Git

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/yourusername/your-repo.git
cd smart-classroom
```

---

## Step 2 — Set Up Ollama and AI Models

Install Ollama from https://ollama.com and then pull the required models:

```bash
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

Start Ollama (it runs on port 11434 by default):

```bash
ollama serve
```

---

## Step 3 — Set Up the Database

Create a PostgreSQL database:

```sql
CREATE DATABASE smart_classroom;
```

Or use your Neon cloud database URL directly — no setup needed if you already have one.

---

## Step 4 — Configure the Spring Boot Backend

Navigate to the classroom-service folder:

```bash
cd backend/classroom_service
```

Create a `.env` file in the project root (same level as `pom.xml`):

```
DB_URL=jdbc:postgresql://your-db-host:5432/smart_classroom
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
JWT_SECRET=your_base64_encoded_secret
```

To generate a JWT secret, run this in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

The `application.properties` file is already configured to read from these environment variables. No changes needed there.

---

## Step 5 — Run the Spring Boot Backend

```bash
cd backend/classroom_service
mvn clean spring-boot:run
```

The backend will start on **http://localhost:8082**

You should see:
```
Tomcat started on port 8082
Started ClassroomServiceApplication
```

Spring Boot will automatically create all database tables on first run using `ddl-auto=update`.

---

## Step 6 — Run the FastAPI AI Backend

Navigate to the PDF Study Assistant folder:

```bash
cd PDFStudyAssistant
```

Create a virtual environment and install dependencies:

```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On Mac/Linux
source venv/bin/activate

pip install fastapi uvicorn httpx pymupdf numpy faiss-cpu
```

Start the FastAPI server:

```bash
uvicorn main:app --reload --port 8000
```

The AI backend will start on **http://localhost:8000**

To verify Ollama and the AI models are working:

```bash
curl http://localhost:8082/api/study/health
```

---

## Step 7 — Run the React Frontend

Navigate to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the frontend root:

```
VITE_BACKEND_URL=http://localhost:8082
```

Start the development server:

```bash
npm run dev
```

The frontend will start on **http://localhost:3000** or **http://localhost:5173**

---

## Step 8 — Generate a Test JWT (Development Only)

Since the auth service is not yet built, use this to generate a test token. Open your browser console (F12) and run:

```javascript
const base64url = str => btoa(String.fromCharCode(...new TextEncoder().encode(str)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

const header = base64url(JSON.stringify({alg:"HS256",typ:"JWT"}));
const payload = base64url(JSON.stringify({
  sub: "1",
  name: "Test Admin",
  role: "ADMIN",
  department: "CSE",
  classroomId: 1,
  exp: 9999999999
}));

const secret = "YOUR_JWT_SECRET_HERE";
const keyData = Uint8Array.from(atob(secret), c => c.charCodeAt(0));
const key = await crypto.subtle.importKey("raw", keyData, {name:"HMAC",hash:"SHA-256"}, false, ["sign"]);
const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(header+"."+payload));
const signature = btoa(String.fromCharCode(...new Uint8Array(sig)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

console.log(header+"."+payload+"."+signature);
```

Replace `YOUR_JWT_SECRET_HERE` with the base64 value from your `.env` file. Store the generated token in your browser's localStorage:

```javascript
localStorage.setItem('token', 'paste_token_here')
```

---

## Running All Services Together

You need three terminal windows running simultaneously:

| Terminal | Command | Port |
|---|---|---|
| 1 — Spring Boot | `mvn spring-boot:run` (inside classroom_service) | 8082 |
| 2 — FastAPI | `uvicorn main:app --reload --port 8000` (inside PDFStudyAssistant) | 8000 |
| 3 — React | `npm run dev` (inside frontend) | 3000 or 5173 |

Ollama must also be running in the background.

---

## Project Structure

```
smart-classroom/
├── backend/
│   └── classroom_service/          Spring Boot backend
│       ├── src/main/java/com/example/classroom_service/
│       │   ├── config/             CORS, Security, RestTemplate
│       │   ├── controller/         REST controllers
│       │   ├── dto/                Request and response DTOs
│       │   ├── exception/          Custom exceptions and global handler
│       │   ├── mapper/             Entity to DTO mappers
│       │   ├── model/              JPA entities
│       │   ├── repository/         Spring Data JPA repositories
│       │   ├── security/           JWT filter and user principal
│       │   ├── service/            Business logic
│       │   └── client/             FastAPI HTTP client
│       ├── src/main/resources/
│       │   └── application.properties
│       └── pom.xml
│
├── PDFStudyAssistant/
│   └── main.py                     FastAPI AI backend
│
├── frontend/                       React.js frontend
│   ├── src/
│   │   ├── api/                    Axios instance and API calls
│   │   ├── components/             Reusable UI components
│   │   ├── context/                Auth context
│   │   ├── hooks/                  Custom hooks
│   │   ├── pages/                  Page components
│   │   └── utils/                  Helpers and utilities
│   ├── .env
│   └── package.json
│
└── README.md
```

---

## API Overview

| Service | Base URL | Description |
|---|---|---|
| Spring Boot | http://localhost:8082 | Main backend — all /api/** endpoints |
| FastAPI | http://localhost:8000 | AI backend — PDF processing and LLM inference |

Key Spring Boot endpoints:

| Endpoint | Description |
|---|---|
| GET /api/classrooms | List all classrooms |
| GET /api/timetable/classroom/{id}/weekly | Weekly timetable |
| GET /api/announcements/feed | Student announcement feed |
| GET /api/resources/classroom/{id} | Learning resources |
| GET /api/events/classroom/{id}/upcoming | Upcoming events |
| GET /api/projects | Discover projects |
| POST /api/projects/join-request | Send join request |
| POST /api/study/documents | Upload PDF for Q&A |
| POST /api/study/documents/{id}/ask | Ask a question |
| POST /api/study/study-mode | Generate summary and quiz |
| GET /api/study/health | Check AI service status |

---

## Environment Variables Summary

**Backend `.env`:**
```
DB_URL=jdbc:postgresql://host:5432/smart_classroom
DB_USERNAME=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_base64_secret
```

**Frontend `.env`:**
```
VITE_BACKEND_URL=http://localhost:8082
```

---

## Known Limitations

- Authentication service is not yet built — JWT tokens must be generated manually for testing
- FAISS indexes are in-memory and reset when FastAPI restarts — re-upload PDFs after restart
- Security is currently disabled for development — re-enable before production deployment
- Google Calendar integration is stubbed — the field exists in the database but sync is not implemented
- AI response times can be slow depending on hardware — study mode may take several minutes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Tailwind CSS, Axios, React Router v6 |
| Backend | Spring Boot, Java, Spring Security, JJWT |
| AI Backend | FastAPI, Python, PyMuPDF, FAISS, Ollama |
| Database | PostgreSQL (Neon cloud) |
| LLM | llama3.2:3b via Ollama |
| Embeddings | nomic-embed-text via Ollama |
| Auth | JWT (development mode — no auth service yet) |
