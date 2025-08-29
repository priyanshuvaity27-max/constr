import uuid
from datetime import datetime

def generate_id() -> str:
    """Generate a unique ID"""
    return str(uuid.uuid4())

def generate_inquiry_no(prefix: str = "LEAD") -> str:
    """Generate inquiry number with timestamp"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"{prefix}-{timestamp}"