import csv
import io
from typing import List, Dict, Any
from fastapi.responses import StreamingResponse

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

def import_from_csv(csv_content: str, expected_headers: List[str]) -> Dict[str, Any]:
    """Import data from CSV content"""
    try:
        reader = csv.DictReader(io.StringIO(csv_content))
        
        # Validate headers
        if not reader.fieldnames:
            raise ValueError("CSV file has no headers")
        
        missing_headers = set(expected_headers) - set(reader.fieldnames)
        if missing_headers:
            raise ValueError(f"Missing required headers: {missing_headers}")
        
        # Parse rows
        rows = []
        errors = []
        
        for i, row in enumerate(reader, 1):
            try:
                # Clean empty values
                cleaned_row = {k: v.strip() if v else None for k, v in row.items()}
                rows.append(cleaned_row)
            except Exception as e:
                errors.append(f"Row {i}: {str(e)}")
        
        return {
            "rows": rows,
            "errors": errors,
            "total_rows": len(rows),
            "error_count": len(errors)
        }
        
    except Exception as e:
        raise ValueError(f"Failed to parse CSV: {str(e)}")