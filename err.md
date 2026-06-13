Locals — Full Project Analysis
Locals (internally also referenced as “Zomato Clothing”) is a hyperlocal fashion/clothing marketplace with three client surfaces and one API backend. There is no separate marketing website — the customer-facing product is a React Native (Expo) mobile app (with optional web via Expo), and operations run through a Vite admin dashboard.

High-Level Architecture
Client Apps
Backend API
External Services
/api/v1/*
/api/v1/admin/*
Expo Mobile AppCustomer / Merchant / Delivery
Admin DashboardReact + Vite
Express 5 + TypeScriptPort 5000
MongoDB
Assignment Schedulerevery 60s
Cloudflare R2
Razorpay
Google Maps
2Factor.in SMS
Layer	Tech	Location	Default URL
Backend
Express 5, Mongoose, Bun/Node
backend/
http://localhost:5000
Mobile app
Expo 53, React Native, Expo Router
frontend/
Expo dev server
Admin
React 19, Vite, Tailwind, Zustand
admin/
http://localhost:3001
Start everything with start-all.sh or run each service separately via setup.sh instructions.

What the Product Does
Locals connects three roles in a local clothing delivery loop:

Customers (User) — Browse stores/products, cart, checkout (COD or Razorpay), track orders, rate stores after delivery.
Merchants (Merchant) — Onboard a store, manage catalog, accept/reject orders, mark ready for pickup.
Delivery partners (Delivery) — Go online, get auto-assigned nearby orders, navigate with maps, update status, collect COD.
Admins use a web dashboard for analytics, revenue, orders, users, delivery partners, and store performance — mostly read-only.

Backend (backend/)
Entry point
backend/src/index.ts — mounts all routes under /api/v1, connects MongoDB, starts the delivery assignment scheduler, initializes Razorpay.

Data models (9 MongoDB collections)
Model	Purpose	Key relationships
User
All app users
Roles: User, Merchant, Delivery; delivery GPS, isBusy, currentOrder
Store
Merchant shop
merchantId → User; rating, isActive
Product
Clothing items
storeId, merchantId; sizes, categories, inventory
Order
Purchase
Multi-store carts split into separate orders; 11 statuses
Delivery
Fulfillment record
Links delivery partner + order
Payment
COD / Razorpay
Gateway IDs, refund fields, COD settlement
Favorite
Saved products
User + product
Notification
In-app events
Written to DB only — no read API yet
Admin
Separate admin auth
Username/password + phone OTP
API route groups
Prefix	Domain
/api/v1/user
Auth (OTP, email), profile, account
/api/v1/store
CRUD, search, bestsellers
/api/v1/product
Catalog CRUD
/api/v1/order
Create, list, status updates
/api/v1/merchant-order
Accept / reject / ready
/api/v1/delivery
Partner ops, location, status
/api/v1/delivery-assignment
Auto/manual assign
/api/v1/payment
Razorpay create, verify, webhook
/api/v1/cod
COD collect & submit
/api/v1/favorite
Favorites
/api/v1/stores
Store ratings/reviews
/api/v1/upload
Presigned R2 URLs
/api/v1/geocode, /api/v1/directions
Google Maps proxy
/api/v1/admin
Admin auth + dashboard data
Auth (two separate systems)
App users — JWT via JWT_SECRET, 365-day expiry, Authorization: Bearer header. Roles enforced by roleAuth.ts middleware.

Admins — Separate Admin collection, JWT_ADMIN_SECRET, 7-day expiry, password or phone OTP login.

Core business flows
Order lifecycle:

Pending → Accepted → Processing → ReadyForPickup → Assigned → PickedUp → OnTheWay → Delivered
         ↘ Rejected / Cancelled (at various stages)
Payments:

Online: Create order → Razorpay → verify signature → merchant can accept
COD: Payment record at order time; delivery partner collects before marking delivered
Delivery assignment (orderAssignmentService.ts + 60s scheduler):

Finds nearest available partner within 5 km (expands to 10 km, then closest)
Triggered by scheduler, merchant “ready”, or partner going online
Merchant onboarding: Phone/email auth → profile completion (pick Merchant role) → StoreDetails screen → POST /store/create → products

External integrations
Service	Status	Used for
Cloudflare R2
Active
Image uploads
Google Maps
Active
Geocoding, directions, assignment
Razorpay
Active
Online payments, refunds
2Factor.in
Active
SMS OTP (users + admins)
Firebase, Resend, Agora, Google AI
In package.json only
Not wired in source
Required env vars
See backend/.env.example: DB_URL, JWT_SECRET, JWT_ADMIN_SECRET, Razorpay keys, TWO_FACTOR_API_KEY, R2 credentials, GOOGLE_MAPS_API_KEY.

Frontend Mobile App (frontend/)
Stack
Expo SDK 53, React Native 0.79, Expo Router 5, TypeScript. App name: Locals v1.0.2.

Navigation structure
app/index.tsx          → Auth gate (role-based redirect)
├── auth/              → Login, OTP, profile, store setup
├── (tabs)/            → Customer: Home, Orders, Cart, Account
├── (merchantTabs)/    → Merchant: Dashboard, Orders, Products, Profile
├── (deliveryTabs)/    → Delivery: Home, Deliveries, Profile + map screens
├── store/[id]         → Store detail
├── product/[id]       → Product detail
├── category/[category]→ Category browse
├── search/            → Store search
└── order/[id]/rate    → Post-delivery rating
Role routing
Role	After auth	Tab group
User
Profile complete
(tabs)
Merchant
Profile + store created
(merchantTabs)
Delivery
Profile complete
(deliveryTabs)
Each tab layout enforces role guards and redirects unauthorized users.

State management (React Context — no Redux)
Context	Purpose
AuthContext
User, token, login/logout; persisted in AsyncStorage
CartContext
In-memory cart (size-aware)
LocationContext
GPS, city selection
OnlineStatusContext
Delivery partner online/offline
PendingStoreReviewsContext
Post-delivery rating prompts
API client
frontend/api/client.ts — Axios, base URL from EXPO_PUBLIC_BACKEND_URL, auto-attaches JWT from AsyncStorage.

Key features by role
Customer: Browse stores/products, filters, favorites, multi-store cart, Razorpay/COD checkout, order tracking, store ratings.

Merchant: Dashboard stats, order accept/reject/ready, product CRUD, store active toggle.

Delivery: Online toggle, live GPS to backend (~5s), order accept/status updates, Google Maps navigation, COD collection.

Key dependencies
react-native-maps, react-native-razorpay, expo-location, expo-image-picker, axios.

Admin Dashboard (admin/)
Stack
React 19, Vite 8, Tailwind 4, Zustand, Recharts, Radix UI primitives.

Routes
Path	Section
/login, /signup
Admin auth
/dashboard/analytics
Platform KPIs, charts
/dashboard/revenue
GMV, commission, transactions
/dashboard/orders
Order list + force cancel (only write action)
/dashboard/users
User directory + stats
/dashboard/delivery
Delivery partner monitoring
/dashboard/stores
Store performance list
/dashboard/stores/:storeId
Store detail + customer reviews
Auth
Zustand authStore → localStorage (adminToken, adminUser). Password or phone OTP via /api/v1/admin/auth/*.

Important clarification
“Store review” in admin = customer post-delivery ratings, not merchant approval. There is no store onboarding approval workflow in admin today.

How the Pieces Connect
Customer places order (mobile)
    → POST /api/v1/order/multiple
    → Payment (COD or Razorpay)
    → Merchant accepts (mobile merchant tabs)
    → Merchant marks ready → triggers delivery assignment
    → Delivery partner gets order (mobile delivery tabs)
    → Status updates sync order + delivery models
    → Customer rates store
    → Admin sees everything in dashboard (read-only analytics)
Known Gaps & Likely Bug Areas
These are worth watching when fixing issues or adding features:

Area	Issue
Port mismatch
start-all.sh says backend on port 80; code defaults to 3000, .env.example uses 5000
CORS
CORS_ORIGIN in env is unused; backend allows origin: "*"
Notifications
Written to DB but no API to fetch/mark read; push (FCM) not implemented
Unused deps
Firebase, Resend, Agora, Google AI in backend package.json but not used
Merchant profile
isProfileComplete set locally on frontend after store create — can drift from backend
Admin limitations
No store activate/deactivate, user suspend, or merchant approval UI
Type duplication
User only in AuthContext; CartItem differs between context and types/order.ts
Camera deps
expo-camera / vision-camera in package.json but app uses image picker only
No website
Only Expo web target; no dedicated marketing/landing site
Sanitization
Input sanitization only in production (NODE_ENV=production)
Search
MongoDB regex only — NLP libs in deps unused
Project Layout Reference
locals/
├── backend/          # Express API + MongoDB
│   └── src/
│       ├── Models/       # Mongoose schemas
│       ├── controllers/  # Business logic
│       ├── routes/       # Route definitions
│       ├── admin/        # Admin module (separate auth)
│       ├── services/     # Assignment scheduler
│       ├── middleware/     # Auth, roles, timeout, sanitize
│       └── utils/          # OTP, SMS, uploads, location
├── frontend/         # Expo mobile app
│   ├── app/              # Expo Router screens
│   ├── components/       # UI by role (user/merchant/delivery)
│   ├── contexts/         # Global state
│   ├── api/              # Axios client
│   └── types/            # TypeScript models
├── admin/            # Vite admin SPA
│   └── src/
│       ├── pages/sections/   # Dashboard sections
│       ├── services/         # API layer
│       └── store/            # Auth state
├── start-all.sh      # Start all services
└── setup.sh          # Install dependencies
Ready for Next Steps
With this map in place, we can work effectively on:

Bug fixes — auth edge cases, order/payment flow, delivery assignment, port/env mismatches
New features — push notifications, store approval in admin, merchant tools, etc.
Hardening — CORS, sanitization, type consistency, unused dependency cleanup
Tell me what you want to tackle first — a specific bug, a feature, or a deep dive into one flow (checkout, delivery assignment, merchant onboarding, etc.).