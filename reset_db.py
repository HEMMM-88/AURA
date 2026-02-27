"""
Quick script to reset the database for testing.
Deletes the database file and recreates tables with sample data.
"""
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.database.connection import create_tables
from backend.database.init_db import create_sample_data

def reset_database():
    """Reset the database."""
    db_file = "aura_vip.db"
    
    # Delete existing database
    if os.path.exists(db_file):
        os.remove(db_file)
        print(f"Deleted {db_file}")
    
    # Recreate tables
    create_tables()
    print("Created database tables")
    
    # Add sample data (escorts, buggies, flights)
    create_sample_data()
    print("Added sample data (escorts, buggies, flights)")
    
    print("\nDatabase reset complete!")
    print("You can now:")
    print("1. Register a VIP via Face Registration page")
    print("2. Detect the VIP via Face Detection page")
    print("3. Watch the orchestration workflow")

if __name__ == "__main__":
    reset_database()
