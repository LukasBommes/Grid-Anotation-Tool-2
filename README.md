### Activate Python Virtual Environment

source env/bin/activate

### Run backend API (development server)

Activate virtual environment.

```
Grid-Annotation-Tool-v3$ uvicorn backend.main:app --reload
```

### Run backend API Tests

Activate virtual environment.

```
Grid-Annotation-Tool-v3$ pytest
```

### Run frontend (development server)

Activate virtual environment.

```
Grid-Annotation-Tool-v3$ uvicorn frontend.main:app --port 9999 --reload
```
