### Installation

#### Create Secrets

Create the secrets from the project root as follows
```
chmod +x make_secrets.sh
./make_secrets.sh
```

#### Build Docker Images

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


### Building frontend

To build the frontend you need a local installation of node and npm.
Change into the `/frontend` directory and install all npm dependencies with
```
npm install
```
Now, you can build the frontend in production mode with
```
npm run build
```
Or, to build in development (with live reload on file changes)
```
npm run dev
```
This creates JS bundles in `static/dist`.
