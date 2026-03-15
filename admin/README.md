# Zomato Clothing - Admin Dashboard

A minimal admin dashboard for managing the Zomato Clothing e-commerce platform.

## Features

- Admin authentication with username/password and OTP login
- Protected routes with JWT authentication
- Clean and modern UI with Tailwind CSS and shadcn/ui components
- Responsive sidebar navigation
- Dashboard with placeholder statistics

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend server running on port 5000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:5000
```

3. Start the development server:
```bash
npm run dev
```

The admin dashboard will be available at `http://localhost:3001`

### Default Admin Account

After setting up the backend, run the seed script to create the default admin account:

```bash
cd ../backend
npm run seed-admin
```

Default credentials:
- Username: `admin`
- Email: `admin@zomatoclothing.com`
- Password: `admin123`

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI based)
- **State Management**: Zustand
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   └── sidebar.tsx   # Main sidebar navigation
├── layouts/
│   └── AdminLayout.tsx # Main layout wrapper
├── pages/
│   ├── login.tsx     # Login page
│   ├── signup.tsx    # Signup page
│   └── dashboard.tsx # Dashboard page
├── services/
│   └── api.ts        # Axios configuration
├── store/
│   └── authStore.ts  # Zustand auth store
├── lib/
│   └── utils.ts      # Utility functions
└── App.tsx           # Main app with routing
```

## Authentication

The admin dashboard supports two authentication methods:

1. **Username/Password Login**: Traditional login with credentials
2. **OTP Login**: Phone number based OTP authentication

Both methods use JWT tokens for session management. Tokens are stored in localStorage and automatically included in API requests.

## Development

### Adding New Pages

1. Create a new page component in `src/pages/`
2. Add the route in `src/App.tsx`
3. Add navigation item in `src/components/sidebar.tsx`

### API Integration

All API calls are made through the configured Axios instance in `src/services/api.ts`. The JWT token is automatically added to requests.

### Styling

The project uses Tailwind CSS with the shadcn/ui component library. Customize the theme by modifying `tailwind.config.js` and `src/index.css`.

## Build

To create a production build:

```bash
npm run build
```

The build output will be in the `dist` directory.
