import uuid
from datetime import datetime

def generate_id() -> str:
    """Generate a unique ID"""
    return str(uuid.uuid4())

def generate_inquiry_no(prefix: str = "LEAD") -> str:
    """Generate inquiry number with timestamp"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"{prefix}-{timestamp}"

def generate_ulid() -> str:
    """Generate ULID-style ID (timestamp + random)"""
    timestamp = int(datetime.now().timestamp() * 1000)
    random_part = str(uuid.uuid4()).replace("-", "")[:10]
    return f"{timestamp:013x}{random_part}"