#!/usr/bin/env python3
"""
Seed the database with hardcoded users
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

def seed_users():
    """Seed database with hardcoded users"""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Hardcoded users with their details
        users_data = [
            {
                "username": "boss",
                "name": "Admin Boss",
                "email": "boss@realestate.com",
                "mobile_no": "+91-9876543210",
                "role": UserRole.ADMIN,
                "password": "password123"
            },
            {
                "username": "emp1",
                "name": "Employee One",
                "email": "emp1@realestate.com",
                "mobile_no": "+91-9876543211",
                "role": UserRole.EMPLOYEE,
                "password": "password123"
            },
            {
                "username": "emp2",
                "name": "Employee Two",
                "email": "emp2@realestate.com",
                "mobile_no": "+91-9876543212",
                "role": UserRole.EMPLOYEE,
                "password": "password123"
            },
            {
                "username": "emp3",
                "name": "Employee Three",
                "email": "emp3@realestate.com",
                "mobile_no": "+91-9876543213",
                "role": UserRole.EMPLOYEE,
                "password": "password123"
            },
            {
                "username": "emp4",
                "name": "Employee Four",
                "email": "emp4@realestate.com",
                "mobile_no": "+91-9876543214",
                "role": UserRole.EMPLOYEE,
                "password": "password123"
            },
            {
                "username": "emp5",
                "name": "Employee Five",
                "email": "emp5@realestate.com",
                "mobile_no": "+91-9876543215",
                "role": UserRole.EMPLOYEE,
                "password": "password123"
            }
        ]
        
        for user_data in users_data:
            # Check if user already exists
            existing_user = db.query(User).filter(User.username == user_data["username"]).first()
            
            if not existing_user:
                # Create new user
                password = user_data.pop("password")
                user = User(
                    id=str(uuid.uuid4()),
                    password=get_password_hash(password),
                    status=UserStatus.ACTIVE,
                    **user_data
                )
                db.add(user)
                print(f"✅ Created user: {user_data['username']}")
            else:
                print(f"⚠️  User already exists: {user_data['username']}")
        
        db.commit()
        print("\n✅ Database seeded successfully!")
        print("Login credentials:")
        print("  Admin: boss / password123")
        print("  Employees: emp1, emp2, emp3, emp4, emp5 / password123")
            
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()