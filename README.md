<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# NaijaMove - AI-Powered Ride Hailing & Logistics Platform

A comprehensive transportation platform for Nigeria featuring AI-powered ride matching, real-time tracking, and voice-enabled customer support.

## Features

- 🚗 Multi-vehicle support (Okada, Keke, Mini-bus, Trucks)
- 🤖 AI-powered voice assistant with Google Gemini
- 📍 Real-time GPS tracking
- 💳 Secure payments (Paystack, Flutterwave)
- 📱 Cross-platform mobile apps
- 🗣️ Voice-enabled support in English & Hausa
- 📊 Admin dashboard with analytics
- 🔐 NIN verification system

## Setup

### Prerequisites
- Node.js (v18+)
- Supabase account
- Google Gemini API key

### 1. Clone and Install
```bash
git clone <repository-url>
cd naijamove
npm install
```

### 2. Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `schema.sql`
3. Copy your project URL and anon key from Settings > API
4. Create a `.env.local` file:
```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Run Locally
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm run preview
```

## Database Schema

The `schema.sql` file contains all necessary tables and demo data. Key tables:
- `users` - User accounts and profiles
- `rides` - Ride requests and logistics
- `chat_messages` - In-app messaging
- `payment_transactions` - Payment records
- `support_tickets` - Customer support
- `system_settings` - Platform configuration

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **AI:** Google Gemini 1.5 Pro
- **Maps:** Leaflet + React-Leaflet
- **Styling:** Tailwind CSS
- **Charts:** Recharts

## Demo Accounts

- **Admin:** admin@naijamove.ng / password
- **Driver:** musa@naijamove.ng (quick login)
- **Passenger:** tola@gmail.com (quick login)
- **Staff:** staff@naijamove.ng / password123

## Deployment

### Netlify
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

### Environment Variables
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
