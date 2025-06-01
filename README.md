# UPI Payment Processing Platform

A comprehensive UPI payment processing platform with advanced user management, real-time transaction tracking, and professional user experience.

## Features

- **User Authentication**: Role-based access control with admin approval system
- **UPI Management**: Add, manage, and monitor UPI IDs with audit logging
- **Real-time Transactions**: Live transaction tracking with WebSocket notifications
- **Admin Panel**: Comprehensive admin interface for user and transaction management
- **Professional UI**: Modern, responsive design with shadcn/ui components

## Tech Stack

- **Frontend**: React.js, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket connections
- **Authentication**: Passport.js with session management

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env` file)
4. Push database schema: `npm run db:push`
5. Start development server: `npm run dev`

## Environment Variables

Create a `.env` file with the following variables:

```env
DATABASE_URL=your_postgresql_database_url
SESSION_SECRET=your_session_secret_key
NODE_ENV=development
PORT=5000
ADMIN_PIN=Khushi
```

## Deployment on Vercel

### Prerequisites

1. A Vercel account
2. A PostgreSQL database (recommend Neon, Supabase, or Vercel Postgres)

### Deployment Steps

1. **Connect Repository**: Connect your GitHub repository to Vercel

2. **Environment Variables**: Add the following environment variables in Vercel dashboard:
   - `DATABASE_URL`: Your production PostgreSQL database URL
   - `SESSION_SECRET`: A secure random string for session encryption
   - `NODE_ENV`: Set to "production"
   - `ADMIN_PIN`: Your admin PIN (default: "Khushi")

3. **Database Setup**: 
   - Create a PostgreSQL database on your preferred provider
   - Run database migrations: `npm run db:push` (you can do this locally pointing to production DB)

4. **Deploy**: Push your code to the main branch or manually trigger deployment in Vercel

### Vercel Configuration

The project includes a `vercel.json` file that handles:
- Serverless function configuration for the API
- Static file serving for the React app
- Proper routing for single-page application
- Client-side routing fallback to `index.html`

### Common Deployment Issues

1. **Page Not Found**: The `vercel.json` configuration ensures all routes fallback to `index.html` for client-side routing
2. **API Routes**: All API calls are routed through the serverless function at `/api/index.ts`
3. **Database Connection**: Ensure your production `DATABASE_URL` is correctly set in Vercel environment variables

## Database Schema

The application uses the following main tables:
- `users`: User management with approval workflow
- `upi_ids`: UPI ID management with status tracking
- `transactions`: Transaction records with real-time updates
- `user_audit_logs`: User activity logging
- `upi_audit_logs`: UPI management audit trail

## API Endpoints

- `POST /api/auth/login` - User authentication
- `POST /api/admin/login` - Admin authentication
- `GET /api/upi` - Get UPI IDs
- `POST /api/upi` - Add new UPI ID
- `GET /api/transactions` - Get transactions
- `POST /api/transactions` - Create transaction
- `PATCH /api/transactions/:reference` - Update transaction status

## Security Features

- Session-based authentication
- Password hashing with bcrypt
- SQL injection prevention with Drizzle ORM
- Input validation with Zod schemas
- CORS protection
- Rate limiting ready (can be implemented)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License