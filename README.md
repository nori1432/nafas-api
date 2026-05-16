# NAFAS API

Flask REST backend for the NAFAS national healthcare platform (Algeria).

## Setup

```powershell
cd nafas_api
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

`.env` already contains the Aiven MySQL URI (SSL disabled per spec) and a JWT secret.

## Database migration

```powershell
flask db init        # first time only
flask db migrate -m "initial"
flask db upgrade
python -m scripts.seed   # loads 58 wilayas + national_admin (0555000000 / Admin@2025)
```

## Run

```powershell
flask run --host=0.0.0.0 --port=5000
```

Health check: `GET http://localhost:5000/api/health`

## Auth

- `POST /api/auth/register` — citizens/donors/doctors/engineers
- `POST /api/auth/login` — body: `{ "phone_number", "password" }` → returns `access_token`
- Send `Authorization: Bearer <token>` on protected routes.

## Response shape

```json
{ "success": true, "message": "OK", "data": {...}, "pagination": {...} }
```

## Roles

`citizen`, `doctor`, `engineer`, `donor`, `hospital_admin`, `national_admin`.
`national_admin` bypasses all role checks.

## Production

```powershell
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```
