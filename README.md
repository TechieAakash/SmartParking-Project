<<<<<<< HEAD
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

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ installed
- MySQL 8.0+ installed
- MySQL Workbench (optional but recommended)

### Step 1: Database Setup

1. **Open MySQL Workbench** and connect to your MySQL server
2. **Run the SQL schema**:
   - Open `DATABASE_SCHEMA.sql`
   - Execute the entire script
   - This will create the `smartpark` database with all tables and sample data

### Step 2: Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment** (`.env` file is already created with correct credentials):
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=smartpark
   DB_USER=root
   DB_PASSWORD=admin123
   JWT_SECRET=your-secret-key
   PORT=5000
   ```

4. **Start the server**:
   ```bash
   npm run dev
   ```

   You should see:
   ```
   🚀 ============================================
      Smart Parking Management System
   ============================================ 🚀
   
   📡 Server running in development mode
   🌐 URL: http://localhost:5000
   📊 API: http://localhost:5000/api
   💚 Health: http://localhost:5000/api/health
   ```

### Step 3: Frontend Setup

1. **Open frontend** in your browser:
   - Simply open `frontend/index.html` in a web browser
   - Or use a local server (recommended):
     ```bash
     cd frontend
     npx http-server -p 3000
     ```
   - Access at `http://localhost:3000`

2. **Default login credentials**:
   - **Username**: `admin`
   - **Password**: `admin123`

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (Protected)

### Parking Zones
- `GET /api/zones` - Get all zones
- `GET /api/zones/stats` - Get zone statistics
- `GET /api/zones/:id` - Get zone by ID
- `GET /api/zones/:zoneId/slots` - Get slots for zone
- `POST /api/zones` - Create zone (Admin/Officer)
- `PUT /api/zones/:id` - Update zone (Admin/Officer)
- `DELETE /api/zones/:id` - Delete zone (Admin)

### Bookings
- `POST /api/bookings` - Create booking (Protected)
- `GET /api/bookings` - Get user bookings (Protected)
- `GET /api/bookings/:id` - Get booking details (Protected)
- `PUT /api/bookings/:id/cancel` - Cancel booking (Protected)
- `PUT /api/bookings/:id/complete` - Complete booking (Officer/Admin)

### Penalties
- `GET /api/penalties` - Get penalties (Protected)
- `GET /api/penalties/stats` - Get penalty stats (Officer/Admin)
- `GET /api/penalties/:id` - Get penalty details (Protected)
- `POST /api/penalties` - Create penalty (Officer/Admin)
- `PUT /api/penalties/:id/status` - Update penalty status (Officer/Admin)

### Passes
- `POST /api/passes` - Purchase pass (Protected)
- `GET /api/passes` - Get user passes (Protected)
- `GET /api/passes/all` - Get all passes (Admin/Officer)
- `PUT /api/passes/:id/cancel` - Cancel pass (Protected)

### Support
- `POST /api/support` - Create ticket (Protected)
- `GET /api/support` - Get user tickets (Protected)
- `GET /api/support/all` - Get all tickets (Admin/Officer)
- `PUT /api/support/:id/status` - Update ticket (Admin/Officer)

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#0ea5e9 → #0369a1)
- **Secondary**: Teal (#2dd4bf → #0d9488)
- **Success**: Green (#22c55e)
- **Warning**: Yellow (#eab308)
- **Error**: Red (#ef4444)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800

### Components
- Buttons (Primary, Secondary, Outline, Ghost)
- Cards (Standard, Gradient, Hover effects)
- Modals (Smooth animations)
- Toast Notifications (4 types)
- Forms (Validated inputs)
- Tables (Hover states)
- Badges (Status indicators)
- Progress Bars
- Loaders & Skeletons

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt (10 rounds)
- Role-based access control (User, Officer, Admin)
- Input validation and sanitization
- SQL injection prevention (Sequelize ORM)
- XSS protection
- CORS configuration

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

## ♿ Accessibility

- Keyboard navigation support
- ARIA labels where needed
- High contrast text
- Focus indicators
- Semantic HTML

## 🌐 Internationalization

- English (Default)
- Hindi (हिंदी)
- Easy to add more languages via `js/i18n.js`

## 🧪 Testing Checklist

### Backend
- [x] Server starts without errors
- [x] Database connection successful
- [x] All API endpoints respond
- [x] JWT authentication works
- [x] Role-based authorization works
- [x] Error handling prevents crashes

### Frontend
- [x] Pages load correctly
- [x] Login/Registration works
- [x] API calls successful
- [x] Map displays zones
- [x] Toast notifications work
- [x] Responsive on mobile
- [x] Animations smooth

## 📈 Performance

- **Backend**: Non-blocking async operations
- **Database**: Connection pooling, indexed queries
- **Frontend**: Lazy loading, debounced searches
- **Assets**: Optimized CSS, minimal JS

## 🤝 Contributing

This is a complete, production-ready system. To extend:

1. Backend: Add new models in `src/models/`
2. Frontend: Add new pages in `pages/`
3. Styles: Extend design system in `css/variables.css`

## 📝 License

MIT License - feel free to use for your projects!

## 👨‍💻 Support

For issues or questions:
- Check console logs for errors
- Verify database connection
- Ensure all dependencies installed
- Check API endpoint configuration in `frontend/js/config.js`

## 🎯 Next Steps

1. Run database schema in MySQL Workbench
2. Start backend server
3. Open frontend in browser
4. Login with admin credentials
5. Explore zones, create bookings, manage system

---

**Built with ❤️ for Smart Cities**
=======
# SmartPark
SmartPark is a smart parking management system that automates parking operations using a secure and scalable backend. It enables parking zone management, vehicle registration, advance slot booking, violation handling, digital wallet payments, and chatbot support through API-driven architecture, making it suitable for smart city and solutions.
>>>>>>> d7205199541ecc568cdff8b861fe35b57bf14510
