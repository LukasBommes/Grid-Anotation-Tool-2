### Activate Python Virtual Environment

source env/bin/activate

### Run backend API (development server)

Activate virtual environment.

```
Grid-Annotation-Tool-v3$ uvicorn api.main:app --reload
```

### Run backend API Tests

Activate virtual environment.

```
Grid-Annotation-Tool-v3/api/tests$ pytest
```

### Run frontend (development server)

Activate virtual environment.

```
Grid-Annotation-Tool-v3/frontend$ python main.py
```
