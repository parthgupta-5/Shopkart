# 🛒 ShopKart - Full-Stack E-Commerce Platform

ShopKart is a modern, full-featured MERN stack e-commerce web application built across Engineering Labs 1 through 6. It includes customer authentication, product catalog browsing, cart and wishlist management, order processing with Razorpay payment gateway integration, and a responsive React frontend.

---

## 🚀 Features & Lab Overview

- **Lab 1: Core Architecture & Setup**
  - Modular Node.js / Express backend with ES modules.
  - MongoDB database connection with Mongoose ODM.
  - Centralized error handling and clean architecture.

- **Lab 2: Authentication & Customer Management**
  - User registration and login with secure password hashing (`bcrypt`).
  - Stateless JWT-based authentication using HTTP-only cookies.
  - Auth middlewares for route protection and role-based access.

- **Lab 3: Product Catalog & Management**
  - Product listing with category filters, search, and sorting.
  - Detailed product view with stock indicators and pricing.

- **Lab 4: Cart & Wishlist System**
  - Persistent user cart with quantity adjustments and real-time total calculations.
  - Wishlist management for saving favorite items.

- **Lab 5: Orders & Razorpay Payment Integration**
  - End-to-end checkout workflow with shipping address management.
  - Razorpay order creation and cryptographic signature verification.
  - Order history tracking and order status management.

- **Lab 6: Modern React Frontend & Integration**
  - Built with React 19, Vite, React Router v7, and Lucide icons.
  - Global state management using React Context (`AuthContext`, `CartContext`, `WishlistContext`).
  - Interactive, responsive UI with notification feedback and protected routes.
  - Postman API collections included for testing.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** React 19 (Vite)
- **Routing:** React Router v7
- **HTTP Client:** Axios (with cookie credentials)
- **Icons:** Lucide React
- **Styling:** Modern Responsive Vanilla CSS

### **Backend**
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express 5
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT) & HTTP-Only Cookies
- **Security:** bcrypt password hashing & CORS
- **Payments:** Razorpay Node SDK & HMAC SHA256 signature verification

---

## 📁 Project Structure

```text
ShopCart/
├── backend/
│   ├── controllers/         # Request handlers (auth, cart, order, product, wishlist)
│   ├── middlewares/         # Auth & validation middlewares
│   ├── models/              # Mongoose schemas (Customer, Product, Cart, Order, Wishlist)
│   ├── routes/              # Express API route definitions
│   ├── utils/               # Database connection & helpers
│   ├── .env.example         # Template for environment variables
│   ├── index.js             # Express entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components (Navbar, Footer, ProtectedRoute, etc.)
│   │   ├── context/         # Context providers (Auth, Cart, Wishlist)
│   │   ├── pages/           # Page views (Products, Details, Cart, Wishlist, Checkout, Orders)
│   │   ├── services/        # Axios API client & services
│   │   ├── App.jsx          # Root layout & route configuration
│   │   └── main.jsx         # App mounting
│   ├── .env.example         # Template for frontend environment variables
│   ├── index.html
│   └── package.json
├── postman/                 # Postman collections & environment files
├── .gitignore               # Root gitignore rules
└── README.md                # Project documentation
```

---

## ⚙️ Getting Started

### **Prerequisites**
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas connection string)
- [Razorpay Account](https://razorpay.com/) (Test API Keys)

---

### **1. Backend Setup**

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure the environment variables in `.env`:
   ```env
   PORT=4000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```

5. Start the backend server:
   ```bash
   npm start
   ```
   *Backend runs on `http://localhost:4000` by default.*

---

### **2. Frontend Setup**

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Configure environment variables in `.env` if custom API URL is needed:
   ```env
   VITE_API_URL=http://localhost:4000/api
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Frontend runs on `http://localhost:5173` by default.*

---

## 📡 API Endpoints Overview

| Module | Method | Endpoint | Description | Auth Required |
|---|---|---|---|:---:|
| **Auth** | `POST` | `/api/customer/register` | Register a new customer | No |
| | `POST` | `/api/customer/login` | Login customer & set JWT cookie | No |
| | `POST` | `/api/customer/logout` | Clear auth cookie | Yes |
| | `GET` | `/api/customer/profile` | Get current customer profile | Yes |
| **Products** | `GET` | `/api/products` | Fetch all products (supports query params) | No |
| | `GET` | `/api/products/:id` | Fetch product details by ID | No |
| **Cart** | `GET` | `/api/cart` | Get user's cart | Yes |
| | `POST` | `/api/cart` | Add / update item in cart | Yes |
| | `DELETE` | `/api/cart/:productId`| Remove item from cart | Yes |
| **Wishlist** | `GET` | `/api/wishlist` | Get user's wishlist | Yes |
| | `POST` | `/api/wishlist` | Add / toggle item in wishlist | Yes |
| | `DELETE` | `/api/wishlist/:id` | Remove item from wishlist | Yes |
| **Orders** | `POST` | `/api/orders/create` | Create Razorpay order | Yes |
| | `POST` | `/api/orders/verify` | Verify payment signature & place order | Yes |
| | `GET` | `/api/orders` | Fetch user's order history | Yes |
| | `GET` | `/api/orders/:id` | Fetch specific order details | Yes |

---

## 🌐 Production Deployment (Netlify + Render)

### **1. Backend Deployment on Render**
1. Create a new **Web Service** on [Render](https://render.com/) and connect your repository.
2. Set the following build and start configurations:
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. Configure the following **Environment Variables** in Render dashboard:
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = `https://<your-app-name>.netlify.app` *(your Netlify frontend domain)*
   - `MONGODB_URI` = `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>`
   - `JWT_SECRET` = `<your-production-jwt-secret>`
   - `RAZORPAY_KEY_ID` = `<your-razorpay-key-id>`
   - `RAZORPAY_KEY_SECRET` = `<your-razorpay-key-secret>`

> **Note:** In production (`NODE_ENV=production`), authentication cookies are automatically configured with `secure: true` and `sameSite: 'none'` to enable cross-origin cookie sharing between Netlify and Render.

---

### **2. Frontend Deployment on Netlify**
1. Create a new site on [Netlify](https://www.netlify.com/) and link your repository.
2. Set the build settings:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist` (or `frontend/dist`)
3. Add the **Environment Variable** in Netlify dashboard:
   - `VITE_API_URL` = `https://<your-backend-service>.onrender.com` *(your deployed Render backend URL)*
4. Single-Page Application (SPA) routing is handled automatically by [`frontend/public/_redirects`](./frontend/public/_redirects).

---

## 🧪 Testing with Postman

Postman API collections and environment templates are available in the [`postman/`](./postman/) directory for automated and manual endpoint verification.

---

## 📄 License

This project is created for educational and laboratory learning purposes.

