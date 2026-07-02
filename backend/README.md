# 🏥 SmartQ - Hospital Queue & Patient Management System (Backend)

> A highly scalable, production-ready backend designed to streamline hospital queues, patient registrations, and revenue management.

This repository contains the robust backend architecture for the **SmartQ** system. It is built to handle real-world hospital workflows, integrating intelligent queue management, real-time updates, and an ML-based consultation duration predictor.

---

## 🚀 Key Features

*   **Intelligent Queue Management:** Real-time patient queuing system utilizing WebSockets for live status updates.
*   **Production-Grade Architecture:** Designed with resilience in mind, featuring circuit breakers for external ML service calls and comprehensive error handling.
*   **Robust Security:** Fully secured API with JWT-based authentication, bcrypt password hashing, CORS configuration, and Helmet.js headers.
*   **Data Validation:** Strict runtime type-checking and schema validation for all API inputs using Zod.
*   **Automated Jobs:** Background chron-jobs (`node-cron`) for tasks like queue resets and drift detection.
*   **Advanced Caching:** Redis caching layer implemented to reduce database load and optimize high-traffic endpoints.
*   **Detailed Logging:** Winston and Morgan integrated for persistent, structured server and request logging.
*   **Containerized:** Fully Dockerized with a multi-stage `Dockerfile` and `docker-compose` setup for seamless deployment across environments.

---

## 🛠️ Tech Stack & Technologies

I selected a modern, highly efficient technology stack to ensure performance, type safety, and scalability:

### Core Framework
*   **Node.js & Express.js (v5)** - Fast, unopinionated, minimalist web framework.
*   **JavaScript (ES Modules)** - Clean, modern syntax.

### Database & ORM
*   **PostgreSQL** - Powerful, open-source object-relational database.
*   **Prisma ORM** - Next-generation Node.js ORM for type-safe database queries and migrations.

### Caching & Real-Time
*   **Redis (`ioredis`)** - In-memory data structure store, used as a database, cache, and message broker.
*   **WebSockets (`ws`)** - Bidirectional communication for live queue dashboard updates.

### Security & Validation
*   **JSON Web Tokens (JWT)** - Stateless authentication.
*   **Bcrypt** - Secure password hashing.
*   **Zod** - TypeScript/JavaScript-first schema declaration and validation.
*   **Helmet & CORS** - HTTP header security and cross-origin resource sharing configuration.

### DevOps & Tooling
*   **Docker & Docker Compose** - Containerization for isolated, predictable deployments.
*   **Winston & Morgan** - Production-grade logging pipelines.
*   **Dotenv** - Environment variable management.

---

## 🏗️ Architecture Highlights (Showcasing Production Readiness)

As a developer, I focused heavily on ensuring this application behaves like a true production system, rather than just a prototype:

1.  **Circuit Breaker Pattern:** Implemented a custom circuit breaker around external ML API calls. If the external ML service fails or times out repeatedly, the circuit opens, preventing cascading failures and ensuring the main hospital system stays online.
2.  **Graceful Error Handling:** Centralized error handling middlewares catch unexpected crashes, logging them structurally without leaking sensitive stack traces to the client.
3.  **Database Seeding & Migrations:** Automated database initialization scripts via Prisma to easily spin up mock data and schema structures in new environments.
4.  **Optimized Docker Builds:** Utilized multi-stage Docker builds and Alpine Linux base images to drastically reduce container size and improve deployment speed.

---

## ⚙️ Local Development & Setup

### Prerequisites
*   Node.js (v20+)
*   Docker & Docker Compose (optional but recommended)
*   PostgreSQL & Redis

### 1. Clone & Install
```bash
git clone https://github.com/Ankit-Mohanty-23/SmartQ.git
cd SmartQ/backend
npm install
```

### 2. Environment Variables
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```
Ensure you provide a valid `DATABASE_URL`, `REDIS_URL`, and `JWT_SECRET`.

### 3. Database Setup (Prisma)
Run migrations and seed the database with initial hospital data:
```bash
npx prisma migrate dev
npx prisma db seed
```

### 4. Start the Server
**For Development:**
```bash
npm run dev
```

**Using Docker Compose (Starts App, Postgres, & Redis automatically):**
```bash
docker-compose up --build
```

---

## 👨‍💻 About the Developer

Built by **Ankit Mohanty**. 
I built this project to demonstrate my ability to design, develop, and deploy a complete backend system from scratch. My focus was on writing clean, maintainable code while incorporating industry best practices like caching, containerization, and resilience patterns.
