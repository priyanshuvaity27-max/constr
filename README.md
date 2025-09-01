# Real Estate CRM - Complete System

A production-ready Real Estate CRM system with React frontend, FastAPI backend, and Supabase integration.

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   FastAPI       │    │   Supabase      │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Database)    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                               ┌─────────────────┐
                                               │ AWS S3/R2       │
                                               │ (File Storage)  │
                                               └─────────────────┘
```

## ✨ Features

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
- **File Uploads**: Document management with cloud storage
- **Real-time Updates**: Live data synchronization

### Entities Supported
- **Leads**: Lead tracking and management
- **Developers**: Corporate, Coworking, Warehouse, Mall developers
- **Contacts**: Clients, Developer contacts, Brokers, Individual owners
- **Inventory**: Corporate buildings, Coworking spaces, Warehouses, Retail malls
- **Land Parcels**: Land inventory management
- **Documents**: File upload and management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase account (or PostgreSQL)
- AWS S3/Cloudflare R2 account (for file storage)

### 1. Setup Database

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and anon key

2. **Run Migrations**:
   ```bash
   # The migrations will be applied automatically when you connect to Supabase
   ```

### 2. Setup Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Supabase and storage credentials

# Run backend
uvicorn app.main:app --reload
```

### 3. Setup Frontend

```bash
# Install dependencies (if not already done)
npm install

# Configure environment
cp .env.example .env
# Edit .env with backend URL

# Run frontend
npm run dev
```

### 4. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🔐 Default Accounts

| Username | Password    | Role     | Description |
|----------|-------------|----------|-------------|
| boss     | password123 | admin    | Full access, can approve actions |
| emp1     | password123 | employee | Can create pending actions |
| emp2     | password123 | employee | Can create pending actions |
| emp3     | password123 | employee | Can create pending actions |
| emp4     | password123 | employee | Can create pending actions |
| emp5     | password123 | employee | Can create pending actions |

## 📋 Usage Guide

### For Admins
1. **Login** as "boss" with password "password123"
2. **Manage all data** directly without approval
3. **Review pending actions** from employees
4. **Import/Export** CSV data for all modules
5. **Upload documents** for any entity

### For Employees
1. **Login** as "emp1-emp5" with password "password123"
2. **View own leads** and assigned leads
3. **Create new leads** directly
4. **Request updates/deletes** (creates pending actions)
5. **Upload documents** for own leads only

### Approval Workflow
1. **Employee** submits update/delete request
2. **System** creates pending action
3. **Admin** reviews in "Pending Actions" section
4. **Admin** approves or rejects with notes
5. **System** applies changes and logs audit trail

## 🛠️ Development

### Adding New Entity Types

1. **Create Model** in `app/models/`
2. **Create Schema** in `app/schemas/`
3. **Create Router** in `app/api/v1/endpoints/`
4. **Add to API Router** in `app/api/v1/api.py`
5. **Create Frontend Component** in `src/components/`
6. **Add to Navigation** in `src/components/Layout/Sidebar.tsx`

### Database Migrations

```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
npm test
```

## 🚀 Deployment

### Backend (Render)
1. **Connect GitHub** repository to Render
2. **Set Environment Variables** from `.env.example`
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `python main.py`

### Frontend (Vercel)
1. **Connect GitHub** repository to Vercel
2. **Set Environment Variables**: `VITE_API_BASE=https://your-backend.render.com`
3. **Deploy** automatically on push

### Database (Supabase)
1. **Create Project** on Supabase
2. **Run Migrations** (automatic with RLS policies)
3. **Update** `DATABASE_URL` in backend environment

## 📊 API Usage Examples

### Authentication
```javascript
// Login
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'boss', password: 'password123' })
});

// Get current user
const user = await fetch('/api/v1/auth/me', { credentials: 'include' });
```

### Data Operations
```javascript
// List leads with filters
const leads = await fetch('/api/v1/leads?city=Mumbai&type_of_space=Office', {
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

## 🔧 Configuration

### Database Tables
The system includes 18 tables covering all aspects of real estate CRM:

- **Core**: employees, leads, pending_actions, audit_log, documents
- **Developers**: corporate_developers, coworking_developers, warehouse_developers, mall_developers
- **Contacts**: clients, developer_contacts, brokers, individual_owners
- **Inventory**: corporate_buildings, coworking_spaces, warehouses, retail_malls, land_parcels

### RBAC Implementation
- **Row Level Security** enabled on all tables
- **Ownership-based access** for employees
- **Full access** for admins
- **Pending actions** for employee mutations

## 📚 Documentation

- **API Docs**: Available at `/docs` when running backend
- **Database Schema**: See `supabase/migrations/` for complete schema
- **Frontend Components**: Documented in component files

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection**: Check `DATABASE_URL` format
2. **Authentication Failures**: Verify `SECRET_KEY` and cookie settings
3. **File Upload Issues**: Check storage credentials and bucket permissions
4. **CORS Errors**: Ensure frontend URL is in `CORS_ORIGINS`

### Debug Mode

Enable debug logging:
```bash
DEBUG=true uvicorn app.main:app --reload --log-level debug
```

## 📄 License

MIT License - see LICENSE file for details.