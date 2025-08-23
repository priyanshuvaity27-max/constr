# Real Estate CRM - Full Stack Application

A production-ready Real Estate CRM system with React frontend, FastAPI backend, Cloudflare D1 database, and R2 storage.

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   FastAPI       │    │ Cloudflare      │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│ Worker          │
│                 │    │                 │    │ (DB Proxy)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                               ┌─────────────────┐
                                               │ Cloudflare D1   │
                                               │ (Database)      │
                                               └─────────────────┘
                                                        │
                                               ┌─────────────────┐
                                               │ Cloudflare R2   │
                                               │ (File Storage)  │
                                               └─────────────────┘
```

## Features

### Authentication & Authorization
- **6 Hardcoded Users**: 1 admin ("boss") + 5 employees ("emp1-emp5")
- **Role-Based Access Control**: Admin vs Employee permissions
- **Secure Sessions**: JWT tokens in HttpOnly cookies
- **No Self-Registration**: Only predefined accounts can login

### Approval Workflow
- **Employee Actions**: Create/Update/Delete requests become pending actions
- **Admin Approval**: Review and approve/reject employee requests
- **Atomic Operations**: Approved changes applied transactionally
- **Audit Trail**: Complete history of all changes

### Data Management
- **Advanced Filtering**: Per-column filters with global search
- **CSV Import/Export**: Bulk data operations with validation
- **File Uploads**: Document management with R2 storage
- **Real-time Updates**: Live data synchronization

### Security
- **HMAC-Signed Requests**: All database calls cryptographically signed
- **Prepared Statements**: SQL injection prevention
- **Rate Limiting**: Login and API rate limits
- **Input Validation**: Comprehensive data validation

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Cloudflare account with D1 and R2 enabled

### 1. Setup Cloudflare Services

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create real_estate_db
# Note the database_id for later

# Create R2 bucket
wrangler r2 bucket create real-estate-documents
```

### 2. Deploy Database Worker

```bash
cd cloudflare-worker
npm install

# Update wrangler.toml with your database_id
# Set HMAC secret
wrangler secret put HMAC_SECRET

# Apply database schema
wrangler d1 migrations apply real_estate_db
wrangler d1 execute real_estate_db --file ../db/seed.sql

# Deploy worker
wrangler deploy
# Note the worker URL for backend configuration
```

### 3. Setup Backend

```bash
cd backend
pip install -e .

# Configure environment
cp .env.example .env
# Edit .env with your Cloudflare credentials and worker URL

# Run backend
uvicorn app.main:app --reload
```

### 4. Setup Frontend

```bash
# Install dependencies (if not already done)
npm install

# Configure environment
cp .env.example .env
# Edit .env with backend URL

# Run frontend
npm run dev
```

### 5. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Default Accounts

| Username | Password    | Role     |
|----------|-------------|----------|
| boss     | password123 | admin    |
| emp1     | password123 | employee |
| emp2     | password123 | employee |
| emp3     | password123 | employee |
| emp4     | password123 | employee |
| emp5     | password123 | employee |

## Development Workflow

### Adding New Features

1. **Database Changes**: Update migrations in `/db/migrations/`
2. **Worker Updates**: Add new endpoints in `cloudflare-worker/src/index.ts`
3. **Backend Changes**: Add schemas, routers, and services
4. **Frontend Updates**: Update components and API calls

### Testing Changes

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
npm test

# Integration tests
# Test with real Cloudflare services in staging
```

### Deployment

#### Production Backend
```bash
# Build and deploy container
docker build -t real-estate-crm-backend .
# Deploy to your container platform (Render, Fly.io, etc.)
```

#### Production Worker
```bash
cd cloudflare-worker
wrangler deploy --env production
```

#### Production Frontend
```bash
# Build for production
npm run build
# Deploy to your hosting platform (Vercel, Netlify, etc.)
```

## Configuration

### Environment Variables

#### Backend (.env)
```bash
DEBUG=false
JWT_SECRET=your-production-secret
WORKER_BASE=https://your-worker.workers.dev
WORKER_HMAC_SECRET=your-hmac-secret
R2_ENDPOINT=https://account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
CORS_ORIGINS=["https://your-frontend.com"]
```

#### Frontend (.env)
```bash
VITE_API_BASE=https://your-api.com
```

#### Worker (wrangler.toml)
```toml
[vars]
ALLOWED_ORIGINS = "https://your-frontend.com"

[env.production.vars]
ALLOWED_ORIGINS = "https://your-frontend.com"
```

## API Usage Examples

### Authentication
```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'boss', password: 'password123' })
});

// Get current user
const user = await fetch('/api/auth/me', { credentials: 'include' });
```

### Data Operations
```javascript
// List leads with filters
const leads = await fetch('/api/v1/leads?city=Mumbai&type_of_place=Office', {
  credentials: 'include'
});

// Create lead (admin) or pending action (employee)
const newLead = await fetch('/api/v1/leads', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    inquiry_no: 'LEAD-001',
    client_company: 'ABC Corp',
    contact_person: 'John Doe',
    // ... other fields
  })
});
```

### File Upload
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('entity', 'leads');
formData.append('entity_id', 'lead-123');
formData.append('label', 'Property Card');

const upload = await fetch('/api/v1/upload', {
  method: 'POST',
  credentials: 'include',
  body: formData
});
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure CORS_ORIGINS includes your frontend URL
2. **Authentication Failures**: Check JWT_SECRET matches and cookies are enabled
3. **Database Errors**: Verify Worker is deployed and D1 database exists
4. **File Upload Issues**: Check R2 credentials and bucket permissions

### Debug Mode

Enable debug logging:
```bash
DEBUG=true uvicorn app.main:app --reload --log-level debug
```

### Health Checks

- **Backend**: `GET /health`
- **Worker**: `GET https://your-worker.workers.dev/health`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details.