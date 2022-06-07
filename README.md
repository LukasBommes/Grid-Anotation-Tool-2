### Installation

From project root run

```
sudo docker-compose build
```

### Run Grid Annotation Tool

From project root run

```
sudo docker-compose up
```

### Run tests

Make sure the Grid Annotation Tool is running. Then, from project root, run

```
sudo docker exec -it grid-annotation-tool-v3_backend_1 pytest
```