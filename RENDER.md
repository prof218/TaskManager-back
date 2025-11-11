# Deploying Backend (Express + MongoDB) to Render

This guide assumes your backend code is in a GitHub repo. Render will pull, build, and run it.

## 1) Create a Render Web Service
1. Sign in to https://render.com and click "New" → "Web Service".
2. Connect your GitHub repo and select the backend service folder (root or `backend/`).
3. For Environment, choose "Node".
4. Build Command: `npm install && npm run build`  (if you don't have a build step, just `npm install`)
5. Start Command: `npm run start` or `npm run dev` (for dev; prefer `npm start` for production).
6. Branch: choose the branch you want to deploy (e.g., `main`).

## 2) Environment Variables (Render → Service → Environment)
Set the following environment variables (securely):
- `MONGO_URI` = your MongoDB Atlas connection string (mongodb+srv://...)
- `JWT_SECRET` = a long random secret
- `CLIENT_URL` = https://<your-netlify-site>.netlify.app
- Optional SMTP (for email verification):
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` ("true" or "false"), `FROM_EMAIL`

## 3) Add a Persistent MongoDB (MongoDB Atlas)
1. Create an Atlas cluster.
2. Create a database user and whitelist Render's IPs or allow access from anywhere (not recommended).
3. Copy the connection string and set it as `MONGO_URI`.

## 4) Seed Admin
After the service is deployed:
- You can use Render's Web Shell (Dashboard → Shell) to run:
  ```
  cd /opt/render/project/src/backend
  npm run seed
  ```
  or call the seed script however your repo is structured. This creates `admin@taskapp.local` with password `Admin@123`.

## 5) CORS
Ensure `CLIENT_URL` equals your Netlify site URL so the backend's CORS middleware accepts calls from the frontend.

## 6) Logs & Debugging
Use Render's log view to see stdout/stderr, which helps to debug startup errors. If emails don't send, check SMTP env vars.

## Notes
- For production, make sure `JWT_SECRET` is strong and never checked into git.
- Consider setting up automatic deploys on push to `main`.
