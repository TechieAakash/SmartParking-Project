
# Smart Parking Management System

A comprehensive, production-ready Smart Parking Management System with a robust Node.js backend and a modern, visually stunning frontend.

## 🚀 Features

### Dashboard Features
- ✅ Real-time statistics display
- ✅ Interactive map with zone markers
- ✅ Color-coded status (Normal/Warning/Critical)
- ✅ Live violation tracking
- ✅ Weather and time widget ready

### Zone Management
- ✅ Add/Edit/Delete parking zones
- ✅ Real-time occupancy updates
- ✅ Contractor information management
- ✅ Capacity monitoring
- ✅ Location mapping with coordinates

### Violation System
- ✅ Automatic violation detection
- ✅ Manual violation creation
- ✅ Penalty calculation
- ✅ Resolution tracking
- ✅ Notification system

### Reporting & Analytics
- ✅ Zone occupancy statistics
- ✅ Violation trends
- ✅ Revenue tracking
- ✅ Contractor performance
- ✅ Export capabilities ready

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (LTS)
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Sequelize
- **Authentication**: JWT + bcrypt
- **Validation**: express-validator
- **Security**: CORS, Input sanitization

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern design system with variables, gradients, animations
- **Vanilla JavaScript** - ES6+ modules
- **Leaflet.js** - Interactive maps
- **Font**: Google Fonts (Inter)

## 📁 Project Structure

```
folder12/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── env.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── ParkingZone.js
│   │   │   ├── ParkingSlot.js
│   │   │   ├── Booking.js
│   │   │   ├── Penalty.js
│   │   │   ├── Pass.js
│   │   │   ├── Payment.js
│   │   │   ├── SupportTicket.js
│   │   │   └── index.js
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env
│   ├── package.json
│   └── nodemon.json
├── frontend/
│   ├── css/
│   │   ├── variables.css
│   │   ├── reset.css
│   │   ├── utilities.css
│   │   ├── components.css
│   │   ├── layout.css
│   │   ├── animations.css
│   │   └── main.css
│   ├── js/
│   │   ├── config.js
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── ui.js
│   │   ├── map.js
│   │   └── i18n.js
│   ├── pages/
│   │   ├── login.html
│   │   └── dashboard.html
│   └── index.html
├── DATABASE_SCHEMA.sql
└── README.md
```
=======
# SmartParking 🚗 - Full Stack Web Application

[GitHub](https://github.com/your-username) | [LinkedIn](https://linkedin.com/in/your-linkedin)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


## 🌟 Features

### User Roles
- **Admin**: Full access to manage users, parking zones, and violations.  
- **Officer**: Can manage zones and violations, but cannot manage users.  
- **Contractor**: Can view and update only their assigned zones.  

### Authentication & Security
- JWT-based authentication  
- Password hashing with bcrypt  
- Role-based route protection  
- Logout functionality and profile management

### Frontend
- Login modal and token storage in localStorage  
- Role-based UI visibility  
- User profile display in navbar  

### Backend
- Node.js + Express API  
- MySQL database for persistent storage  
- APIs: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`, `/api/auth/profile`  
- Protected routes with authentication and role-based authorization  

---

## 🛠 Tech Stack

| Layer      | Technology                  |
|-----------|-----------------------------|
| Backend   | Node.js, Express, MySQL      |
| Frontend  | HTML, CSS, JavaScript        |
| Auth      | JWT, bcrypt                  |
| Security  | Role-based authorization     |

---
>>>>>>> 0597540901bd0a10e63f8771a240148e4979b97d

## 🌐 Deployment

This project is optimized for deployment on **Vercel**. 

### Quick Deploy to Vercel
1.  **GitHub**: Push your code to GitHub (done).
2.  **Vercel Dashboard**: Import the repository.
3.  **Config**: The project includes `vercel.json` and `api/index.js` for automatic serverless routing.
4.  **Full Instructions**: See the [Vercel Deployment Guide](file:///c:/Users/AAKASH/OneDrive/Desktop/folder12/VERCEL_DEPLOYMENT_GUIDE.md) for environment variable setup and database configuration.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ 
- MySQL Database (Local or Cloud)

### Local Setup
1. **Database**: Run `finalized_schema.sql` in your MySQL instance to set up the `smartparking` database.
2. **Backend**: 
   ```bash
   cd backend
   npm install
   npm run dev
   ```
3. **Frontend**: Open `frontend/index.html` in your browser.

---

## 👨‍💻 Support
For issues or questions, check console logs or the [Vercel Deployment Guide](file:///c:/Users/AAKASH/OneDrive/Desktop/folder12/VERCEL_DEPLOYMENT_GUIDE.md).

**Built with ❤️ for Smart Cities**
cd smart-parking

