# Real Estate CRM Backend

A production-ready FastAPI backend for Real Estate CRM with RBAC, JWT authentication, and approval workflow.

## Features

- **Authentication**: JWT-based auth with secure cookies
- **RBAC**: Admin and Employee roles with different permissions
- **Approval Workflow**: Employee actions require admin approval
- **File Upload**: Support for AWS S3, Cloudflare R2, or Supabase Storage
- **CSV Import/Export**: Bulk operations with validation
- **Audit Trail**: Complete logging of all changes
- **Rate Limiting**: Protection against abuse

## Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL (or Supabase account)
- AWS S3/Cloudflare R2/Supabase Storage account

### Installation

1. **Clone and setup**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database and storage credentials
   ```

3. **Setup database**:
   ```bash
   # Run migrations
   alembic upgrade head
   
   # Seed initial data
   python scripts/seed_users.py
   ```

4. **Run the application**:
   ```bash
   uvicorn app.main:app --reload
   ```

The API will be available at `http://localhost:8000`

## Default Accounts

| Username | Password    | Role     |
|----------|-------------|----------|
| boss     | password123 | admin    |
| emp1     | password123 | employee |
| emp2     | password123 | employee |
| emp3     | password123 | employee |
| emp4     | password123 | employee |
| emp5     | password123 | employee |

## API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Key Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login with username/password
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/logout` - Logout

### Leads
- `GET /api/v1/leads` - List leads (with filters)
- `POST /api/v1/leads` - Create lead (admin) or pending action (employee)
- `PATCH /api/v1/leads/{id}` - Update lead (admin) or pending action (employee)
- `DELETE /api/v1/leads/{id}` - Delete lead (admin) or pending action (employee)

### Pending Actions (Admin only)
- `GET /api/v1/pending-actions` - List pending actions
- `POST /api/v1/pending-actions/{id}/approve` - Approve action
- `POST /api/v1/pending-actions/{id}/reject` - Reject action

### File Upload
- `POST /api/v1/upload` - Upload file to configured storage

## RBAC Rules

### Admin
- Full CRUD access to all entities
- Can approve/reject pending actions
- Can import/export CSV for all modules
- Can manage user accounts

### Employee
- Can view own leads and assigned leads
- Can create new leads
- Update/delete operations create pending actions
- Can upload documents for own leads
- Can export own data only

## Deployment

### Using Docker
```bash
docker build -t real-estate-crm-backend .
docker run -p 8000:8000 --env-file .env real-estate-crm-backend
```

### Using Render
1. Connect your GitHub repository
2. Set environment variables from `.env.example`
3. Deploy with build command: `pip install -r requirements.txt`
4. Start command: `python main.py`

## Environment Variables

See `.env.example` for all required environment variables.

## Testing

```bash
pytest tests/ -v
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request