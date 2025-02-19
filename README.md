npm install
```

2. Configure environment variables in `.env`:
```env
DATABASE_URL=postgres://postgres:postgres@0.0.0.0:5432/upi_payment_db
ADMIN_USERNAME=admin
ADMIN_PASSWORD=adminSecurePass123!
SESSION_SECRET=upi-payment-session-secret-key-2024
UPI_MERCHANT_ID=test_merchant_id
UPI_API_KEY=test_api_key_123
UPI_MERCHANT_NAME=Test Merchant
UPI_CALLBACK_URL=https://api.merchant.com/callback
WS_PORT=5001
```

3. Start development server:
```bash
npm run dev
```

The application will be available at `http://0.0.0.0:5000`

## API Endpoints

- `GET /api/upi` - Get UPI payment details
- `POST /api/payment` - Process new payment
- `GET /api/transactions` - Get transaction history
- `POST /api/admin/login` - Admin authentication

## WebSocket Events

- `payment_status` - Real-time payment status updates
- `transaction_update` - Transaction notifications

## Security Features

- Secure session management
- Environment variable encryption
- Input validation and sanitization
- Rate limiting
- CORS protection

## Project Structure

```
├── client/          # Frontend React application
├── server/          # Backend Express application
├── shared/          # Shared TypeScript types
└── .env            # Environment configuration