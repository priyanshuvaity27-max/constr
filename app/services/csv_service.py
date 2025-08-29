import csv
import io
from typing import List, Dict, Any, Type
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ValidationError

def export_to_csv(data: List[Dict[str, Any]], filename: str) -> StreamingResponse:
    """Export data to CSV format"""
    if not data:
        # Return empty CSV with headers
        output = io.StringIO()
        output.write("# No data available\n")
        output.seek(0)
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}.csv"}
        )
    
    # Get headers from first row
    headers = list(data[0].keys())
    
    # Create CSV content
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=headers)
    writer.writeheader()
    
    for row in data:
        # Convert complex types to strings
        csv_row = {}
        for key, value in row.items():
            if isinstance(value, (dict, list)):
                csv_row[key] = str(value)
            elif value is None:
                csv_row[key] = ""
            else:
                csv_row[key] = str(value)
        writer.writerow(csv_row)
    
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}.csv"}
    )

def import_from_csv(csv_content: str, model_class: Type[BaseModel]) -> Dict[str, Any]:
    """Import data from CSV content with validation"""
    try:
        reader = csv.DictReader(io.StringIO(csv_content))
        
        # Validate headers
        if not reader.fieldnames:
            raise ValueError("CSV file has no headers")
        
        # Parse rows
        valid_rows = []
        errors = []
        
        for i, row in enumerate(reader, 1):
            try:
                # Clean empty values
                cleaned_row = {k: v.strip() if v else None for k, v in row.items()}
                
                # Validate with Pydantic model
                validated_data = model_class(**cleaned_row)
                valid_rows.append(validated_data.dict())
                
            except ValidationError as e:
                error_details = []
                for error in e.errors():
                    field = ".".join(str(x) for x in error["loc"])
                    error_details.append(f"{field}: {error['msg']}")
                errors.append(f"Row {i}: {'; '.join(error_details)}")
            except Exception as e:
                errors.append(f"Row {i}: {str(e)}")
        
        return {
            "valid_rows": valid_rows,
            "errors": errors,
            "total_rows": len(valid_rows),
            "error_count": len(errors)
        }
        
    except Exception as e:
        raise ValueError(f"Failed to parse CSV: {str(e)}")