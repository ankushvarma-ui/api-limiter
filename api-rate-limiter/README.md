# 🛡️ API Rate Limiter & Abuse Detection System

A production-ready Node.js + Express backend with intelligent rate limiting, abuse detection, JWT authentication, and full request logging — deployable as a serverless function on Vercel.

---

## ✨ Features

- **Rate Limiting** — 100 requests per IP per 15-minute window (configurable)
- **Abuse Detection** — IPs that violate the limit 3+ times are auto-blocked for 1 hour
- **Request Logging** — Every request is logged with IP, endpoint, method, status code, and timestamp
- **JWT Authentication** — Stateless auth via signed tokens
- **Admin Dashboard Routes** — View logs, blocked IPs, unblock IPs, and traffic stats
- **MongoDB Storage** — Users, request logs, violations, and blocked IPs stored in MongoDB
- **Auto-Expiry** — Logs auto-delete after 7 days; blocked IPs auto-unblock via MongoDB TTL indexes
- **Vercel-Ready** — Exported as a serverless handler with `vercel.json` config

---

## 📁 Project Structure

```
api-rate-limiter/
├── app.js                    # Express app (exported for Vercel)
├── server.js                 # Local server entry point
├── vercel.json               # Vercel deployment config
├── .env.example              # Environment variable template
├── package.json
├── models/
│   ├── User.js               # User schema (bcrypt password hashing)
│   ├── RequestLog.js         # Per-request log (TTL: 7 days)
│   ├── BlockedIP.js          # Currently blocked IPs (TTL: auto-expires)
│   └── RateLimitViolation.js # Violation counter per IP (TTL: 24h)
├── middleware/
│   ├── rateLimiter.js        # Core rate limiting + abuse detection
│   ├── auth.js               # JWT verification middleware
│   └── errorHandler.js       # Global error handler
├── controllers/
│   ├── authController.js     # Register + Login logic
│   └── dataController.js     # Protected data + admin endpoints
└── routes/
    ├── authRoutes.js         # POST /register, POST /login
    └── dataRoutes.js         # GET /protected-data, /admin/*
```

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd api-rate-limiter
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/rate_limiter_db
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

RATE_LIMIT_WINDOW_MS=900000       # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100       # requests per window
ABUSE_BLOCK_THRESHOLD=3           # violations before block
ABUSE_BLOCK_DURATION_MS=3600000   # 1 hour block
```

### 3. Run Locally

```bash
npm run dev    # development (nodemon)
npm start      # production
```

---

## 📡 API Endpoints

### Public

| Method | Endpoint    | Description              | Body                              |
|--------|-------------|--------------------------|-----------------------------------|
| GET    | `/`         | Health / welcome         | —                                 |
| GET    | `/health`   | DB + uptime status       | —                                 |
| POST   | `/register` | Register a new user      | `{ username, email, password }`   |
| POST   | `/login`    | Login and receive JWT    | `{ email, password }`             |

### Protected (requires `Authorization: Bearer <token>`)

| Method | Endpoint           | Description                   |
|--------|--------------------|-------------------------------|
| GET    | `/protected-data`  | Access protected resource     |

### Admin (requires JWT + `role: "admin"`)

| Method | Endpoint                    | Description                          |
|--------|-----------------------------|--------------------------------------|
| GET    | `/admin/logs`               | Paginated request logs               |
| GET    | `/admin/blocked-ips`        | List currently blocked IPs           |
| DELETE | `/admin/blocked-ips/:ip`    | Manually unblock an IP               |
| GET    | `/admin/stats`              | Aggregated traffic & abuse stats     |

#### Admin log query params:
`?ip=1.2.3.4&endpoint=/login&from=2024-01-01&to=2024-12-31&page=1&limit=20`

---

## 🔒 Rate Limit Headers

Every response includes:

```
X-RateLimit-Limit:     100
X-RateLimit-Remaining: 73
X-RateLimit-Reset:     2024-06-01T12:15:00.000Z
```

---

## ⚠️ Rate Limit Exceeded (429)

```json
{
  "success": false,
  "message": "Too many requests",
  "detail": "Rate limit of 100 requests per 15 minutes exceeded.",
  "retryAfter": "2024-06-01T12:15:00.000Z"
}
```

## 🚫 IP Blocked (403)

```json
{
  "success": false,
  "message": "Your IP has been temporarily blocked due to repeated abuse.",
  "reason": "Rate limit exceeded 3 times",
  "retryAfterMinutes": 58,
  "blockedUntil": "2024-06-01T13:00:00.000Z"
}
```

---

## ☁️ Deploying to Vercel

1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
4. Deploy — Vercel uses `vercel.json` to route all traffic to `app.js`

> **Note:** The in-memory rate limit counter resets on each cold start (serverless limitation). For persistent cross-instance rate limiting, replace the in-memory Map with a Redis store (e.g. Upstash).

---

## 🧩 Making an Admin User

Connect to your MongoDB instance and update a user's role:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

---

## 🔧 Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js 4
- **Database:** MongoDB via Mongoose
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Deployment:** Vercel (serverless)
