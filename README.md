# API Rate Limiter & Abuse Detection System

A backend system that protects APIs from abuse by limiting the number of requests a user or IP address can make within a specific time window.

This project demonstrates backend concepts such as middleware, request tracking, authentication, and API security.

---

## Features

- Rate limiting for API requests
- IP-based request tracking
- Abuse detection for excessive API calls
- RESTful API architecture
- Modular backend structure

---

## Tech Stack

- Node.js
- Express.js
- MongoDB
- JWT Authentication

---

## Project Structure

api-rate-limiter/

├── middleware/  
│   └── rateLimiter.js  

├── routes/  

├── models/  

├── server.js  

├── package.json  

└── README.md

---

## Example API

### Protected Route

GET /protected-data

Response:

{
  "message": "This is protected data"
}

If request limit exceeds:

Status Code: 429

{
  "message": "Too many requests. Please try again later."
}

---

## Installation

1. Clone the repository

git clone https://github.com/yourusername/api-rate-limiter.git

2. Install dependencies

npm install

3. Start the server

npm start

---

## Deployment

This project can be deployed on platforms such as Vercel by connecting the GitHub repository and configuring environment variables.

---

## Learning Outcomes

- Implementing rate limiting in backend systems
- Middleware design in Express.js
- Protecting APIs from abuse and excessive traffic
- Building scalable backend architecture

---

## Author

Ankush Varma  
B.Tech Computer Science (Data Science)
