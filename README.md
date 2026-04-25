# UrbanNest — Multi-Tenant Society Management Platform

## Tech Stack
- **Backend**: Node.js · Express.js · MongoDB/Mongoose
- **Frontend**: React.js · Tailwind CSS
- **Auth**: OTP (residents) · JWT (admin/superadmin)
- **Storage**: Cloudinary (images)
- **Email**: Nodemailer (SMTP)

---

## Project Structure

```
urbannest/
├── backend/
│   ├── config/          # DB, Cloudinary
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth, error handler
│   ├── models/          # index.js re-exports your Mongoose models
│   ├── routes/          # Express routers
│   ├── utils/           # Email, response helpers
│   └── server.js
└── frontend/
    └── src/
        ├── api/         # Axios instance + service functions
        ├── components/  # ui/ and layout/
        ├── context/     # AuthContext
        └── pages/
            ├── auth/    # UserLogin, AdminLogin, ChangePassword
            ├── user/    # Dashboard, Marketplace, Complaints, Services, Notifications
            └── admin/   # Dashboard, Residents, Flats, Complaints, Services, Notifications
```

---

## Backend Setup

```bash
cd backend
cp .env.example .env          # fill in all values
npm install
npm run dev
```

### Required `.env` variables
| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Min 32-char random string |
| `SMTP_*` | Gmail or any SMTP credentials |
| `CLOUDINARY_*` | Cloudinary account credentials |
| `OTP_EXPIRES_MINUTES` | OTP validity (default: 10) |

### IMPORTANT — Models
The `backend/models/index.js` imports from sibling model files.
Copy your existing model files (SuperAdmin.js, Society.js, User.js, etc.) into `backend/models/`.

---

## Frontend Setup

```bash
cd frontend
npm install
npm start            # proxies /api → http://localhost:5000
```

---

## API Routes Reference

### Auth
| Method | Endpoint | Role |
|--------|----------|------|
| POST | `/api/auth/superadmin/login` | Public |
| POST | `/api/auth/admin/login` | Public |
| POST | `/api/auth/otp/send` | Public |
| POST | `/api/auth/otp/verify` | Public |
| PUT | `/api/auth/change-password` | Any |
| GET | `/api/auth/me` | Any |

### Societies
| Method | Endpoint | Role |
|--------|----------|------|
| GET | `/api/societies` | SUPER_ADMIN |
| POST | `/api/societies` | SUPER_ADMIN |
| PUT | `/api/societies/:id` | SUPER_ADMIN |
| POST | `/api/societies/:id/assign-admin` | SUPER_ADMIN |

### Users · Flats · Listings · Complaints · Services · Reviews · Notifications
All scoped by `societyId` automatically via the `enforceSociety` middleware.

---

## Core Security Rules
1. Every non-SuperAdmin query is automatically scoped to `req.societyId`
2. The `enforceSociety` middleware prevents cross-society access at the route level
3. Users cannot query another society's data — ever
4. Passwords are bcrypt-hashed (cost factor 12)
5. OTPs are bcrypt-hashed before storage and auto-expire via MongoDB TTL index
6. Rate limiting on all `/api/*` routes (100/15min) and stricter on `/api/auth` (20/15min)
