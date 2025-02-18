
# UPI Payment Application

A modern web application for handling UPI payments with real-time transaction tracking and admin controls.

## Prerequisites

- Node.js 20 or higher
- PostgreSQL 16 or higher

## Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Configure environment variables by creating a `.env` file:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/upi_payment_db
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
SESSION_SECRET=your-secret-key-here
UPI_MERCHANT_ID=test_merchant
UPI_API_KEY=test_api_key
```

3. Initialize the database:
```bash
npm run db:push
```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://0.0.0.0:5000`

## Build

Build the application for production:
```bash
npm run build
```

## Production

Start the production server:
```bash
npm run start
```

## Project Structure

- `/client` - Frontend React application
  - `/src/components` - React components
  - `/src/pages` - Page components
  - `/src/hooks` - Custom React hooks
  - `/src/lib` - Utility functions and configurations
- `/server` - Backend Express application
  - `auth.ts` - Authentication logic
  - `routes.ts` - API routes
  - `websocket.ts` - WebSocket server
- `/shared` - Shared TypeScript types and schemas

## Features

- Real-time payment tracking with WebSocket
- Admin panel for transaction management
- QR code generation for payments
- Transaction history and analytics
- Secure authentication system
- Mobile-responsive design

## Technologies

- React + Vite
- TypeScript
- Express.js
- PostgreSQL with Drizzle ORM
- Tailwind CSS
- WebSocket for real-time updates
- Shadcn UI components

## API Routes

- `GET /api/upi` - Get UPI payment details
- `GET /api/transactions` - Get transaction history
- `POST /api/payment` - Create new payment
- `POST /api/admin/login` - Admin authentication

## WebSocket Events

- `connected` - Connection established
- `payment_status` - Payment status updates
- `transaction_update` - Real-time transaction updates

## Security Features

- Session-based authentication
- Environment variable configuration
- CORS protection
- Rate limiting
- Input validation

## Error Handling

The application includes comprehensive error handling for:
- Database connection issues
- Payment processing errors
- Authentication failures
- Invalid input validation
- WebSocket connection problems
