# Construction CRM Backend API

A comprehensive FastAPI backend for construction and real estate CRM management with PostgreSQL database, JWT authentication, and file upload capabilities.

## Features

- 🔐 **JWT Authentication** - Secure user authentication with role-based access
- 👥 **User Management** - Admin and employee roles with different permissions
- 📊 **Lead Management** - Track and manage sales leads
- 🏗️ **Developer Management** - Manage construction developers and contractors
- 📞 **Contact Management** - Organize business contacts across categories
- 🏢 **Project Management** - Handle different types of construction projects
- 📦 **Inventory Management** - Track properties and assets
- 🏞️ **Land Management** - Manage land parcels with document tracking
- ⏳ **Pending Actions** - Employee request approval system
- 📁 **File Upload** - Support for AWS S3 or local file storage
- 🗄️ **PostgreSQL Database** - Production-ready database with migrations
- 📚 **API Documentation** - Auto-generated OpenAPI/Swagger docs

## Tech Stack

- **FastAPI** - Modern, fast web framework for building APIs
- **PostgreSQL** - Robust relational database
- **SQLAlchemy** - Python SQL toolkit and ORM
- **Alembic** - Database migration tool
- **JWT** - JSON Web Tokens for authentication
- **Pydantic** - Data validation using Python type annotations
- **Boto3** - AWS SDK for file uploads (optional)

## Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo>
cd construction-crm-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Database Setup (Supabase PostgreSQL)

#### Option A: Supabase (Recommended)

1. Go to [Supabase](https://supabase.com) and create a new project
2. Go to Settings → Database
3. Copy your connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

#### Option B: Render PostgreSQL

1. Go to [Render](https://render.com) and create a PostgreSQL database
2. Copy the External Database URL

#### Option C: Local PostgreSQL

```bash
# Install PostgreSQL locally
# Create database
createdb construction_crm
```

### 3. Environment Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres

# JWT Configuration
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AWS S3 (Optional - for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_BUCKET_NAME=your-bucket-name
AWS_REGION=us-east-1

# Environment
ENVIRONMENT=development
DEBUG=True
```

### 4. Database Migration

```bash
# Initialize Alembic (first time only)
alembic revision --autogenerate -m "Initial migration"

# Run migrations
alembic upgrade head

# Initialize with sample data
python scripts/init_db.py
```

### 5. Run the Application

```bash
# Development
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production
python main.py
```

The API will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## Default Users

After running `python scripts/init_db.py`, you'll have these test accounts:

| Role | Email | Password | Username |
|------|-------|----------|----------|
| Admin | admin@construction.com | admin123 | admin |
| Employee | john@construction.com | john123 | john |
| Employee | sarah@construction.com | sarah123 | sarah |

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/token` - OAuth2 compatible token endpoint

### Users
- `GET /api/v1/users/` - List users (Admin only)
- `POST /api/v1/users/` - Create user (Admin only)
- `GET /api/v1/users/{user_id}` - Get user details
- `PUT /api/v1/users/{user_id}` - Update user
- `DELETE /api/v1/users/{user_id}` - Delete user (Admin only)
- `GET /api/v1/users/me/` - Get current user profile

### Leads
- `GET /api/v1/leads/` - List leads (filtered by user role)
- `POST /api/v1/leads/` - Create lead
- `GET /api/v1/leads/{lead_id}` - Get lead details
- `PUT /api/v1/leads/{lead_id}` - Update lead
- `DELETE /api/v1/leads/{lead_id}` - Delete lead

### Developers
- `GET /api/v1/developers/` - List developers
- `POST /api/v1/developers/` - Create developer
- `GET /api/v1/developers/{developer_id}` - Get developer details
- `PUT /api/v1/developers/{developer_id}` - Update developer
- `DELETE /api/v1/developers/{developer_id}` - Delete developer

### Contacts
- `GET /api/v1/contacts/` - List contacts
- `POST /api/v1/contacts/` - Create contact
- `GET /api/v1/contacts/{contact_id}` - Get contact details
- `PUT /api/v1/contacts/{contact_id}` - Update contact
- `DELETE /api/v1/contacts/{contact_id}` - Delete contact

### Projects
- `GET /api/v1/projects/` - List projects
- `POST /api/v1/projects/` - Create project
- `GET /api/v1/projects/{project_id}` - Get project details
- `PUT /api/v1/projects/{project_id}` - Update project
- `DELETE /api/v1/projects/{project_id}` - Delete project

### Inventory
- `GET /api/v1/inventory/` - List inventory items
- `POST /api/v1/inventory/` - Create inventory item
- `GET /api/v1/inventory/{inventory_id}` - Get inventory details
- `PUT /api/v1/inventory/{inventory_id}` - Update inventory item
- `DELETE /api/v1/inventory/{inventory_id}` - Delete inventory item

### Land Parcels
- `GET /api/v1/land/` - List land parcels
- `POST /api/v1/land/` - Create land parcel
- `GET /api/v1/land/{land_id}` - Get land parcel details
- `PUT /api/v1/land/{land_id}` - Update land parcel
- `DELETE /api/v1/land/{land_id}` - Delete land parcel

### Pending Actions
- `GET /api/v1/pending-actions/` - List pending actions (Admin only)
- `GET /api/v1/pending-actions/my-requests` - List user's requests
- `GET /api/v1/pending-actions/{action_id}` - Get action details
- `PUT /api/v1/pending-actions/{action_id}` - Approve/reject action (Admin only)
- `DELETE /api/v1/pending-actions/{action_id}` - Delete action (Admin only)

## Authentication

All endpoints (except login) require JWT authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Example Login Request

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@construction.com",
    "password": "admin123"
  }'
```

## File Upload Configuration

### AWS S3 Setup (Recommended for Production)

1. Create an AWS S3 bucket
2. Create an IAM user with S3 permissions
3. Add AWS credentials to your `.env` file:

```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_BUCKET_NAME=your-bucket-name
AWS_REGION=us-east-1
```

### Local File Storage (Development)

If AWS credentials are not provided, files will be stored locally in the `uploads/` directory.

## Deployment

### Deploy to Render

1. Fork this repository
2. Connect your GitHub account to Render
3. Create a new Web Service
4. Set environment variables in Render dashboard
5. Deploy!

**Render Environment Variables:**
```
DATABASE_URL=<your-render-postgresql-url>
SECRET_KEY=<your-secret-key>
ENVIRONMENT=production
DEBUG=False
```

### Deploy to Railway

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Add PostgreSQL: `railway add postgresql`
5. Set environment variables: `railway variables set SECRET_KEY=your-secret-key`
6. Deploy: `railway up`

### Deploy to Heroku

1. Install Heroku CLI
2. Create app: `heroku create your-app-name`
3. Add PostgreSQL: `heroku addons:create heroku-postgresql:hobby-dev`
4. Set environment variables:
   ```bash
   heroku config:set SECRET_KEY=your-secret-key
   heroku config:set ENVIRONMENT=production
   heroku config:set DEBUG=False
   ```
5. Deploy: `git push heroku main`

## Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# View migration history
alembic history
```

## Development

### Project Structure

```
construction-crm-backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── endpoints/
│   ├── core/
│   ├── models/
│   ├── schemas/
│   └── services/
├── alembic/
├── scripts/
├── main.py
├── requirements.txt
└── README.md
```

### Adding New Features

1. **Models**: Add database models in `app/models/`
2. **Schemas**: Add Pydantic schemas in `app/schemas/`
3. **Endpoints**: Add API routes in `app/api/v1/endpoints/`
4. **Services**: Add business logic in `app/services/`
5. **Migration**: Create migration with `alembic revision --autogenerate`

### Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest

# Run with coverage
pytest --cov=app
```

## Security Considerations

- Change the `SECRET_KEY` in production
- Use HTTPS in production
- Implement rate limiting
- Validate all inputs
- Use environment variables for sensitive data
- Regular security updates

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check your `DATABASE_URL` in `.env`
   - Ensure PostgreSQL is running
   - Verify network connectivity

2. **Migration Errors**
   - Check if database exists
   - Ensure proper permissions
   - Run `alembic upgrade head`

3. **Authentication Issues**
   - Verify JWT token format
   - Check token expiration
   - Ensure user is active

4. **File Upload Issues**
   - Check AWS credentials
   - Verify bucket permissions
   - Ensure proper file types

### Getting Help

- Check the API documentation at `/docs`
- Review the logs for error details
- Ensure all environment variables are set correctly

## License

This project is licensed under the MIT License.#   c o n s t r  
 