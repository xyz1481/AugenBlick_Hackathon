# AugenBlick MERN Boilerplate

A modern, premium MERN stack boilerplate with React (Vite) and Node.js (Express) + MongoDB.

## Project Structure

```bash
AugenBlick/
├── backend/          # Node.js + Express API
│   ├── .env          # Environment variables
│   ├── server.js     # Entry point
│   └── package.json  # Backend dependencies
└── frontend/         # React + Vite Client
    ├── src/          # Frontend source code
    ├── index.css     # Premium styling system
    └── package.json  # Frontend dependencies
```

## Getting Started

### 1. Backend

```bash
cd backend
npm run dev
```
*Port: 5000*

### 2. Frontend

```bash
cd frontend
npm run dev
```
*Port: 5173 (standard Vite port)*

## Tech Stack
-   **Frontend**: React, Vite, Vanilla CSS (Premium & Glassmorphism)
-   **Backend**: Express.js, Mongoose (MongoDB ODM)
-   **Utilities**: CORS, Dotenv, Nodemon

## Features
-   **Premium UI**: Custom design with Google Fonts (Outfit) and modern gradients.
-   **Health Polling**: Frontend automatically checks backend connectivity on load.
-   **Modular**: Clearly separated concerns for scalability.
