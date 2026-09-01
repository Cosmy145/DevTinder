# DevTinder API Routes (v1)

Base URL: `/api/v1`

---

## 1. Auth Module (`/auth`)
- **POST** `/auth/signup` - Register a new user
- **POST** `/auth/login` - Authenticate user & receive cookie
- **POST** `/auth/logout` - Clear cookie session

---

## 2. Profile Module (`/profile`)
- **GET** `/profile/view` - View logged-in user's profile
- **PATCH** `/profile/edit` - Update logged-in user's profile
- **PATCH** `/profile/password` - Change password
- **DELETE** `/profile` - Delete logged-in user's account

---

## 3. Connection Requests Module (`/requests`)
- **POST** `/requests/send/interested/:userId` - Send interest request (Right swipe)
- **POST** `/requests/send/ignored/:userId` - Ignore user (Left swipe)
- **POST** `/requests/review/accepted/:requestId` - Accept incoming request
- **POST** `/requests/review/rejected/:requestId` - Reject incoming request

---

## 4. User Relations & Discovery (`/users`)
- **GET** `/users/requests/received` - View received pending requests
- **GET** `/users/requests/sent` - View sent pending requests
- **GET** `/users/connections` - View connected users (matches)
- **GET** `/users/feed` - Return candidates excluding self, passed, accepted, and rejected profiles
