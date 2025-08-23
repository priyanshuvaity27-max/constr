#!/usr/bin/env python3
"""
Initialize the database with sample data
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.core.database import engine, SessionLocal
from app.core.security import get_password_hash
from app.models import Base, User
from app.models.user import UserRole, UserStatus
import uuid


def init_db():
    """Initialize database with sample data"""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if admin user already exists
        admin_user = db.query(User).filter(User.email == "admin@construction.com").first()
        
        if not admin_user:
            # Create admin user
            admin_user = User(
                id=str(uuid.uuid4()),
                name="Admin User",
                email="admin@construction.com",
                username="admin",
                password=get_password_hash("admin123"),
                mobile_no="9876543210",
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE
            )
            db.add(admin_user)
            
            # Create sample employee
            employee_user = User(
                id=str(uuid.uuid4()),
                name="John Manager",
                email="john@construction.com",
                username="john",
                password=get_password_hash("john123"),
                mobile_no="9876543211",
                role=UserRole.EMPLOYEE,
                status=UserStatus.ACTIVE
            )
            db.add(employee_user)
            
            # Create another sample employee
            employee_user2 = User(
                id=str(uuid.uuid4()),
                name="Sarah Employee",
                email="sarah@construction.com",
                username="sarah",
                password=get_password_hash("sarah123"),
                mobile_no="9876543212",
                role=UserRole.EMPLOYEE,
                status=UserStatus.ACTIVE
            )
            db.add(employee_user2)
            
            db.commit()
            print("✅ Database initialized with sample users:")
            print("   Admin: admin@construction.com / admin123")
            print("   Employee: john@construction.com / john123")
            print("   Employee: sarah@construction.com / sarah123")
        else:
            print("✅ Database already initialized")
            
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()