
# Backend (Express + MongoDB)

1. Copy `.env.example` to `.env` and update variables.
2. Install dependencies: `npm install`
3. Run seed (optional): `npm run seed`
4. Start server: `npm run dev` (development) or `npm start` (production)
5. API endpoints:
   - POST /api/auth/signup
   - POST /api/auth/signin
   - GET /api/tasks?page=1&limit=10
   - POST /api/tasks
   - GET /api/tasks/:id
   - PUT /api/tasks/:id
   - DELETE /api/tasks/:id  (admin only)
