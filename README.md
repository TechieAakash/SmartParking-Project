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

## 🚀 Getting Started

### Prerequisites
- Node.js & npm installed  
- MySQL database

### Installation
1. Clone the repository:
```bash
git clone https://github.com/your-username/smart-parking.git
cd smart-parking
