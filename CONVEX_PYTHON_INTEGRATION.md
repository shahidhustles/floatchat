# Python Server Integration for Convex File Storage

This document provides complete implementation code for integrating your Python server with Convex file storage system.

## Overview

**New Architecture:**

1. **Frontend uploads** NC files directly to Convex file storage
2. **Frontend** sends fileId to Python server at `/ingestion/v1`
3. **Python server** downloads file directly from Convex using REST API
4. **Python server** processes the file and updates status in Convex

## Complete Implementation Code

Copy this complete implementation to your Python server:

### Dependencies

First, install required packages:

```bash
pip install fastapi uvicorn requests xarray netcdf4 python-dotenv
```

### Complete app.py Implementation

```python
# app.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import xarray as xr
import tempfile
import os
import asyncio
from datetime import datetime
from typing import List, Dict, Any
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="NetCDF Processing Server", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProcessFileRequest(BaseModel):
    fileId: str

class ProcessResponse(BaseModel):
    success: bool
    processed_records: int = 0
    message: str = ""
    error: str = ""
    fileId: str = ""

def determine_region(lat: float, lon: float) -> str:
    """Determine oceanic region based on coordinates"""
    # Add your region determination logic here
    if lat > 0:
        if lon > 0:
            return "North Pacific" if lon > 180 else "North Atlantic"
        else:
            return "North Atlantic"
    else:
        if lon > 0:
            return "South Pacific" if lon > 180 else "South Atlantic"
        else:
            return "South Atlantic"

async def store_in_database(data: List[Dict[Any, Any]]) -> bool:
    """Store extracted data in your database (implement your logic)"""
    # TODO: Implement your database storage logic here
    # Example for Supabase/PostgreSQL:
    #
    # from supabase import create_client
    # supabase = create_client(url, key)
    # result = supabase.table("ocean_data").insert(data).execute()
    # return len(data) == len(result.data)

    logger.info(f"Storing {len(data)} records in database")
    # Simulate async database operation
    await asyncio.sleep(0.1)
    return True

def update_convex_status(convex_url: str, file_id: str, status: str,
                        record_count: int = None, log: str = None):
    """Update file processing status in Convex"""
    try:
        payload = {
            "path": "files:updateFileStatus",
            "args": {
                "fileId": file_id,
                "status": status
            },
            "format": "json"
        }

        if record_count is not None:
            payload["args"]["recordCount"] = record_count
        if log is not None:
            payload["args"]["processingLog"] = log

        response = requests.post(
            f"{convex_url}/api/mutation",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )

        if not response.ok:
            logger.warning(f"Failed to update Convex status: {response.text}")

    except Exception as e:
        logger.error(f"Error updating Convex status: {e}")

@app.get("/")
async def root():
    return {"message": "NetCDF Processing Server", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/ingestion/v1", response_model=ProcessResponse)
async def process_netcdf_convex(request: ProcessFileRequest):
    """Process NetCDF file from Convex storage"""
    convex_url = os.getenv("CONVEX_URL")
    if not convex_url:
        raise HTTPException(status_code=500, detail="CONVEX_URL environment variable not set")

    temp_path = None

    try:
        logger.info(f"Processing file ID: {request.fileId}")

        # Step 1: Get file info from Convex
        response = requests.post(
            f"{convex_url}/api/query",
            json={
                "path": "files:getFileWithUrl",
                "args": {"fileId": request.fileId},
                "format": "json"
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )

        if not response.ok:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to get file info from Convex: {response.text}"
            )

        file_data = response.json()["value"]
        download_url = file_data["url"]
        filename = file_data["filename"]
        logger.info(f"Retrieved file info for: {filename}")

        # Step 2: Update status to processing
        update_convex_status(convex_url, request.fileId, "processing",
                           log="Starting NetCDF processing")

        # Step 3: Download the file
        logger.info("Downloading file from Convex storage")
        file_response = requests.get(download_url, timeout=30)
        if not file_response.ok:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to download file from Convex: {file_response.text}"
            )

        # Step 4: Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.nc') as temp_file:
            temp_file.write(file_response.content)
            temp_path = temp_file.name

        logger.info(f"File saved to temporary path: {temp_path}")

        # Step 5: Process the NetCDF file
        logger.info("Processing NetCDF file with xarray")
        dataset = xr.open_dataset(temp_path)

        # Validate required variables exist
        required_vars = ['latitude', 'longitude', 'depth', 'temperature', 'salinity', 'time']
        missing_vars = [var for var in required_vars if var not in dataset.variables]
        if missing_vars:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required variables in NetCDF: {missing_vars}"
            )

        # Extract data
        extracted_data = []
        total_records = len(dataset.latitude)

        for i in range(total_records):
            try:
                lat = float(dataset.latitude[i])
                lon = float(dataset.longitude[i])

                extracted_data.append({
                    'latitude': lat,
                    'longitude': lon,
                    'depth': float(dataset.depth[i]),
                    'temperature': float(dataset.temperature[i]),
                    'salinity': float(dataset.salinity[i]),
                    'date': str(dataset.time[i].values),
                    'region': determine_region(lat, lon),
                    'fileId': request.fileId,
                    'filename': filename,
                    'processed_at': datetime.now().isoformat()
                })
            except Exception as row_error:
                logger.warning(f"Error processing row {i}: {row_error}")
                continue

        logger.info(f"Extracted {len(extracted_data)} records from NetCDF file")

        # Step 6: Store in your database
        logger.info("Storing data in database")
        store_success = await store_in_database(extracted_data)

        if not store_success:
            raise HTTPException(status_code=500, detail="Failed to store data in database")

        # Step 7: Clean up temp file
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
            logger.info("Temporary file cleaned up")

        # Step 8: Update status to completed
        success_message = f"Successfully processed {len(extracted_data)} records from {filename}"
        update_convex_status(convex_url, request.fileId, "completed",
                           len(extracted_data), success_message)

        logger.info(f"Processing completed successfully for file ID: {request.fileId}")

        return ProcessResponse(
            success=True,
            processed_records=len(extracted_data),
            message=success_message,
            fileId=request.fileId
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        error_msg = f"Error processing NetCDF file: {str(e)}"
        logger.error(error_msg)

        # Clean up temp file if it exists
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass

        # Update status to failed
        update_convex_status(convex_url, request.fileId, "failed", log=error_msg)

        return ProcessResponse(
            success=False,
            error=error_msg,
            fileId=request.fileId
        )

# Additional endpoints for monitoring
@app.get("/ingestion/status/{file_id}")
async def get_processing_status(file_id: str):
    """Get processing status of a file"""
    convex_url = os.getenv("CONVEX_URL")
    if not convex_url:
        raise HTTPException(status_code=500, detail="CONVEX_URL not configured")

    try:
        response = requests.post(
            f"{convex_url}/api/query",
            json={
                "path": "files:getFileWithUrl",
                "args": {"fileId": file_id},
                "format": "json"
            },
            headers={"Content-Type": "application/json"}
        )

        if not response.ok:
            raise HTTPException(status_code=404, detail="File not found")

        file_data = response.json()["value"]
        return {
            "fileId": file_id,
            "filename": file_data["filename"],
            "status": file_data["status"],
            "recordCount": file_data.get("recordCount"),
            "processingLog": file_data.get("processingLog")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Environment Configuration

Create a `.env` file in your Python server root:

```bash
# .env
CONVEX_URL=https://your-deployment.convex.cloud
DATABASE_URL=your-database-connection-string
PORT=8000
```

### Database Integration Example

Add your database connection logic to the `store_in_database` function:

```python
# For Supabase
async def store_in_database(data: List[Dict[Any, Any]]) -> bool:
    from supabase import create_client

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    supabase = create_client(url, key)

    try:
        result = supabase.table("ocean_data").insert(data).execute()
        return len(data) == len(result.data)
    except Exception as e:
        logger.error(f"Database error: {e}")
        return False

# For PostgreSQL with asyncpg
async def store_in_database(data: List[Dict[Any, Any]]) -> bool:
    import asyncpg

    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    try:
        # Batch insert
        await conn.executemany("""
            INSERT INTO ocean_data (latitude, longitude, depth, temperature,
                                  salinity, date, region, file_id, filename, processed_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        """, [(d['latitude'], d['longitude'], d['depth'], d['temperature'],
               d['salinity'], d['date'], d['region'], d['fileId'],
               d['filename'], d['processed_at']) for d in data])
        return True
    except Exception as e:
        logger.error(f"Database error: {e}")
        return False
    finally:
        await conn.close()
```

## Environment Variables

Add these to your Python server environment:

```bash
# .env
CONVEX_URL=https://your-deployment.convex.cloud
```

And add this to your Next.js environment:

```bash
# .env.local
NEXT_PUBLIC_PYTHON_SERVER_URL=http://localhost:8000  # or your deployed Python server URL
```

## Deployment Notes

1. **Railway/Render**: Your existing deployment should work with minimal changes
2. **File Size**: No more 20MB limit issues since files are stored in Convex
3. **Error Handling**: Better error tracking through Convex database
4. **Authentication**: Convex handles auth, no need to validate users in Python

## Running the Server

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
python app.py

# Or with uvicorn directly
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## Testing

```bash
# Health check
curl http://localhost:8000/health

# Test the ingestion endpoint
curl -X POST "http://localhost:8000/ingestion/v1" \
  -H "Content-Type: application/json" \
  -d '{"fileId": "your-convex-file-id"}'

# Check processing status
curl http://localhost:8000/ingestion/status/your-convex-file-id
```

## Requirements.txt

Create this file for your Python server:

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
requests==2.31.0
xarray==2023.10.1
netcdf4==1.6.5
python-dotenv==1.0.0
supabase==1.3.0
asyncpg==0.29.0
pydantic==2.5.0
```

## Benefits of This Approach

✅ **No file size limits** (vs 20MB API route limit)
✅ **Better error handling** with status tracking
✅ **Type-safe operations** with Convex
✅ **Automatic authentication** through Convex
✅ **Reliable file storage** with Convex infrastructure
✅ **Easy file downloads** from Python server
