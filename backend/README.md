# Real Estate CRM Backend

Production-ready FastAPI backend with Cloudflare D1 database and R2 storage integration.

## Architecture

- **FastAPI**: Python web framework with automatic OpenAPI docs
- **Cloudflare D1**: SQLite database on the edge via Worker proxy
- **Cloudflare R2**: S3-compatible object storage for documents
- **RBAC**: Role-based access control with pending actions workflow
- **Security**: HMAC-signed Worker requests, bcrypt passwords, JWT cookies

## Quick Start

### 1. Setup Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your Cloudflare credentials
```

### 2. Install Dependencies

```bash
pip install -e .
# Or with poetry:
poetry install
```

### 3. Setup Cloudflare Worker

```bash
cd ../cloudflare-worker
npm install
cp wrangler.toml.example wrangler.toml
# Edit wrangler.toml with your database ID

# Create D1 database
wrangler d1 create real_estate_db
# Copy the database_id to wrangler.toml

# Apply migrations
wrangler d1 migrations apply real_estate_db --local
wrangler d1 execute real_estate_db --local --file ../db/seed.sql

# Deploy worker
wrangler deploy
```

### 4. Run Backend

```bash
cd ../backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Authentication

The system uses 6 hardcoded accounts:
- **Admin**: `boss` / `password123`
- **Employees**: `emp1`, `emp2`, `emp3`, `emp4`, `emp5` / `password123`

## RBAC Workflow

### Admin Users
- Full CRUD access to all entities
- Can approve/reject pending actions
- Can manage users and system settings

### Employee Users
- Read access to owned/assigned records
- Create/Update/Delete operations create pending actions
- Cannot directly modify data

### Pending Actions
1. Employee submits create/update/delete request
2. System creates pending action record
3. Admin reviews and approves/rejects
4. Approved actions are applied atomically

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout

### Entities
Each entity (users, leads, developers, projects, inventory, land, contacts) has:
- `GET /api/v1/{entity}` - List with filters and pagination
- `POST /api/v1/{entity}` - Create (admin only)
- `GET /api/v1/{entity}/{id}` - Get by ID
- `PATCH /api/v1/{entity}/{id}` - Update (admin only)
- `DELETE /api/v1/{entity}/{id}` - Delete (admin only)

### Pending Actions
- `GET /api/v1/pending-actions` - List pending actions
- `POST /api/v1/pending-actions/{id}/approve` - Approve action
- `POST /api/v1/pending-actions/{id}/reject` - Reject action

### Documents
- `GET /api/v1/documents` - List documents
- `POST /api/v1/upload` - Upload file to R2
- `DELETE /api/v1/documents/{id}` - Delete document

## Deployment

### Docker

```bash
docker build -t real-estate-crm-backend .
docker run -p 8000:8000 --env-file .env real-estate-crm-backend
```

### Production Environment Variables

```bash
DEBUG=false
ENVIRONMENT=production
JWT_SECRET=your-production-jwt-secret-min-32-chars
WORKER_BASE=https://your-worker.your-subdomain.workers.dev
WORKER_HMAC_SECRET=your-production-hmac-secret
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
CORS_ORIGINS=["https://your-frontend.com"]
```

## Testing

```bash
pytest tests/ -v
```

## Security Features

- **HMAC Authentication**: All Worker requests are HMAC-signed
- **Prepared Statements**: SQL injection prevention
- **Rate Limiting**: Login and mutation rate limits
- **Input Validation**: Pydantic schemas for all inputs
- **Secure Cookies**: HttpOnly, Secure, SameSite cookies
- **CORS**: Configurable allowed origins
- **Audit Logging**: Structured JSON logs with request IDs

## Monitoring

The application provides structured JSON logs with:
- Request IDs for tracing
- User IDs for audit trails
- Performance metrics
- Error details

Logs can be ingested by any log aggregation system (ELK, Splunk, etc.).