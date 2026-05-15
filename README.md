# Task Pulse

Task Pulse is a full-stack task management system built for the FSD intern assignment. It uses React + Vite on the frontend, Express + MongoDB on the backend, JWT authentication, PDF task attachments, Swagger API docs, Docker, and automated tests.

## Features

- User registration and login with JWT authentication and password hashing.
- Role-based access control for `user` and `admin` accounts.
- CRUD APIs for users and tasks.
- Task assignment to different users.
- Upload and view up to 3 PDF documents per task.
- Filter, sort, and paginate users and tasks.
- Real-time task refresh using Socket.IO.
- Swagger UI documentation.
- Jest + Supertest integration tests.
- Docker Compose setup for MongoDB, backend, and frontend.

## Project Structure

- [backend](backend) - Express API, MongoDB models, auth, uploads, tests, and Swagger.
- [frontend](frontend) - React app with Redux, React Router, Material UI, and Socket.IO client.
- [docker-compose.yml](docker-compose.yml) - local multi-container setup.

## Local Setup

1. Install dependencies from the repository root:

```bash
npm install
npm install --workspace backend
npm install --workspace frontend
```

2. Create environment files:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

3. Start MongoDB locally or use Docker.

4. Run both apps:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Swagger UI: http://localhost:5000/api-docs

## Docker

Run the whole stack with one command:

```bash
docker compose up --build
```

Then open:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Swagger UI: http://localhost:5000/api-docs

## Tests

Run backend tests with coverage:

```bash
npm test --workspace backend
```

Troubleshooting tests and `mongodb-memory-server`:

- If tests hang while mongodb-memory-server downloads a MongoDB binary, you can either:
	- Disable the automatic postinstall binary download when installing and let tests download at runtime:

		```powershell
		$env:MONGOMS_DISABLE_POSTINSTALL=1
		npm install
		npm install --workspace backend
		npm install --workspace frontend
		npm test --workspace backend
		```

	- Or run a local Docker MongoDB and point tests to it by setting `TEST_MONGO_URI` before running tests:

		```powershell
		docker compose up -d mongo
		$env:TEST_MONGO_URI='mongodb://localhost:27017/fsd_test'
		npm test --workspace backend
		```

	- If you see lockfile errors for the binary cache, remove the binary cache and retry (Windows example):

		```powershell
		Remove-Item -Recurse -Force $env:USERPROFILE\\.cache\\mongodb-binaries\\*
		npm test --workspace backend
		```

## API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users`
- `POST /api/users`
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `GET /api/tasks/:id/documents/:documentId`
- `DELETE /api/tasks/:id/documents/:documentId`

## Design Notes

- MongoDB stores the user/task data and task document metadata.
- The backend stores uploaded PDF files on the local filesystem inside `uploads/`.
- JWTs are used for authentication, while route guards enforce admin-only and owner-only behavior.
- React Redux is used for app state, and React Router handles navigation.

## Default Roles

- `user`: can manage their own tasks.
- `admin`: can manage all users and tasks.

## Submission Checklist

- GitHub repository link
- README with setup steps
- Automated tests
- API docs through Swagger
- Dockerfiles and Docker Compose

## Packaging & Deliverables

- Initialize a local git repository, commit the current project, and push to GitHub:

```bash
git init
git add .
git commit -m "Initial project snapshot: backend, frontend, tests, Dockerfiles, Swagger"
# create a GitHub repo and then:
git remote add origin git@github.com:<your-username>/task-pulse.git
git branch -M main
git push -u origin main
```

- Exporting API docs / OpenAPI (two options):

	1. Start the backend server and use the Swagger UI at `http://localhost:5000/api-docs` to export the OpenAPI JSON/ YAML and import into Postman.

	2. Generate the OpenAPI JSON from the project (when `backend/src/config/swagger.js` exports the spec):

```bash
# from the repo root
node -e "console.log(JSON.stringify(require('./backend/src/config/swagger'), null, 2))" > openapi.json
```

- Import `openapi.json` into Postman: File → Import → choose `openapi.json`.

## Deployment Notes

- Local Docker (recommended for end-to-end verification):

```bash
docker compose up --build
# frontend: http://localhost:3000, backend: http://localhost:5000, swagger: http://localhost:5000/api-docs
```

- CI suggestion (GitHub Actions):
	- Steps: checkout, setup Node, install dependencies, run `npm test --workspace backend`, build frontend, build docker images (optional), and publish to a registry.

## Next Steps I Can Do

- Initialize the git repo here and make the first commit.
- Generate `openapi.json` from the backend and produce a Postman collection.
- Add a sample GitHub Actions workflow to `.github/workflows/ci.yml`.

Tell me which of the above you want me to run now and I will proceed.
