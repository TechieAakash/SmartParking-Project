# Database Schema & Backend Integration Guide

## 📊 Database Schema Overview

The `smartparking` database consists of **5 main tables** with relationships, views, stored procedures, triggers, and functions.

---

## 🗄️ Database Tables Structure

### 1. **parking_zones** Table
Stores all parking zone information.

**Key Fields:**
- `id` - Primary key (AUTO_INCREMENT)
- `name`, `address`, `latitude`, `longitude` - Location data
- `total_capacity` - Maximum vehicles allowed (1-5000)
- `current_occupancy` - Current vehicles parked (0 to total_capacity)
- `contractor_limit` - Maximum vehicles contractor can park (1 to total_capacity)
- `contractor_name`, `contractor_contact`, `contractor_email` - Contractor details
- `hourly_rate`, `penalty_per_vehicle` - Pricing information
- `operating_hours` - Zone operating schedule
- `status` - ENUM('active', 'inactive', 'maintenance')
- `created_at`, `updated_at` - Timestamps

**Constraints:**
- `chk_latitude`: -90 to 90
- `chk_longitude`: -180 to 180
- `chk_current_occupancy`: 0 ≤ occupancy ≤ total_capacity
- `chk_contractor_limit`: 1 ≤ limit ≤ total_capacity

### 2. **violations** Table
Stores parking violations when contractors exceed limits.

**Key Fields:**
- `id` - Primary key
- `zone_id` - Foreign key to parking_zones (CASCADE DELETE)
- `severity` - ENUM('warning', 'critical')
- `excess_vehicles` - Number of vehicles over limit (≥1)
- `penalty_amount` - Calculated penalty (≥0)
- `timestamp` - When violation occurred
- `resolved` - Boolean flag
- `resolved_at` - Resolution timestamp
- `notes` - Additional information
- `auto_generated` - Boolean (true if system-generated)

**Relationships:**
- `zone_id` → `parking_zones.id` (ON DELETE CASCADE)

### 3. **users** Table
Stores user accounts for authentication.

**Key Fields:**
- `id` - Primary key
- `username` - Unique identifier
- `email` - Unique email
- `password_hash` - Bcrypt hashed password
- `full_name` - User's full name
- `role` - ENUM('admin', 'contractor', 'officer', 'viewer')
- `phone` - Contact number
- `status` - ENUM('active', 'inactive', 'suspended')
- `last_login` - Last login timestamp

### 4. **audit_logs** Table
Tracks all system changes for accountability.

**Key Fields:**
- `id` - Primary key
- `user_id` - Who made the change
- `action` - Action type (e.g., 'OCCUPANCY_UPDATED')
- `table_name` - Which table was modified
- `record_id` - Which record was modified
- `old_values` - JSON of old values
- `new_values` - JSON of new values
- `ip_address` - User's IP
- `user_agent` - Browser/client info
- `created_at` - When change occurred

### 5. **payments** Table
Tracks penalty payments.

**Key Fields:**
- `id` - Primary key
- `violation_id` - Foreign key to violations (CASCADE DELETE)
- `amount` - Payment amount
- `payment_method` - ENUM('cash', 'card', 'online', 'bank_transfer')
- `transaction_id` - Unique transaction ID
- `payer_name`, `payer_email` - Payer information
- `status` - ENUM('pending', 'completed', 'failed', 'refunded')
- `payment_date` - When payment was made

### 6. **settings** Table
Stores system configuration.

**Key Fields:**
- `id` - Primary key
- `setting_key` - Unique setting identifier
- `setting_value` - Setting value (TEXT)
- `setting_type` - ENUM('string', 'number', 'boolean', 'json')
- `category` - Setting category
- `description` - What the setting does
- `is_editable` - Whether it can be modified

---

## 🔗 Backend-Database Integration

### 1. **Database Connection** (`backend/db/database.js`)

The backend uses **Sequelize ORM** to connect to MySQL:

```javascript
const sequelize = new Sequelize(
  'smartparking',        // Database name
  'root',               // Username
  'admin123',            // Password
  {
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',
    pool: {
      max: 10,           // Maximum connections
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,  // Uses snake_case for fields
      freezeTableName: true
    }
  }
);
```

**Connection Flow:**
1. Backend starts → `testConnection()` runs
2. Sequelize authenticates with MySQL
3. Models sync with database (in development)
4. Connection pool established

### 2. **ORM Models** (Sequelize)

The backend maps database tables to JavaScript models:

#### **ParkingZone Model** (`backend/models/ParkingZone.js`)
```javascript
const ParkingZone = sequelize.define('ParkingZone', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  total_capacity: { type: DataTypes.INTEGER, allowNull: false },
  current_occupancy: { type: DataTypes.INTEGER, defaultValue: 0 },
  contractor_limit: { type: DataTypes.INTEGER, allowNull: false },
  // ... other fields
}, {
  tableName: 'parking_zones',  // Maps to database table
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
```

**Key Features:**
- Field mapping: `total_capacity` (model) → `total_capacity` (database)
- Validation: Min/max values, custom validators
- Instance methods: `getOccupancyPercentage()`, `getViolationStatus()`
- Static methods: `findViolations()`

#### **Violation Model** (`backend/models/Violation.js`)
```javascript
const Violation = sequelize.define('Violation', {
  zone_id: {
    type: DataTypes.INTEGER,
    references: { model: 'parking_zones', key: 'id' }
  },
  severity: { type: DataTypes.ENUM('warning', 'critical') },
  excess_vehicles: { type: DataTypes.INTEGER },
  // ... other fields
}, {
  tableName: 'violations'
});
```

#### **User Model** (`backend/models/User.js`)
```javascript
const User = sequelize.define('User', {
  username: { type: DataTypes.STRING(50), unique: true },
  email: { type: DataTypes.STRING(100), unique: true },
  password_hash: { type: DataTypes.STRING(255) },
  role: { type: DataTypes.ENUM('admin', 'officer', 'contractor', 'viewer') },
  // ... other fields
}, {
  tableName: 'users'
});
```

### 3. **Model Associations** (`backend/models/index.js`)

Sequelize defines relationships between models:

```javascript
// One-to-Many: ParkingZone has many Violations
ParkingZone.hasMany(Violation, {
  foreignKey: 'zone_id',
  as: 'violations',
  onDelete: 'CASCADE'
});

// Many-to-One: Violation belongs to ParkingZone
Violation.belongsTo(ParkingZone, {
  foreignKey: 'zone_id',
  as: 'zone'
});
```

**Benefits:**
- Automatic JOIN queries
- Cascade deletes
- Easy data access: `zone.getViolations()`, `violation.getZone()`

---

## 🔄 Data Flow: Frontend → Backend → Database

### Example: Creating a Violation

```
1. Frontend (index.html)
   ↓
   POST /api/violations
   {
     zone_id: 1,
     excess_vehicles: 10,
     notes: "Manual violation"
   }
   ↓
2. Backend Route (routes/violations.js)
   ↓
   authenticate() → Verify JWT token
   authorize('admin', 'officer') → Check role
   ↓
3. Sequelize Model (Violation.create())
   ↓
   INSERT INTO violations (zone_id, excess_vehicles, ...)
   VALUES (1, 10, ...)
   ↓
4. MySQL Database
   ↓
   - Insert record into violations table
   - Foreign key constraint validates zone_id exists
   - Trigger fires (if any)
   ↓
5. Response back to Frontend
   {
     success: true,
     data: { id: 123, zone_id: 1, ... }
   }
```

### Example: Updating Zone Occupancy

```
1. Frontend
   ↓
   PATCH /api/zones/:id/occupancy
   { occupancyChange: +5 }
   ↓
2. Backend Route (routes/zones.js)
   ↓
   const zone = await ParkingZone.findByPk(id);
   const newOccupancy = zone.current_occupancy + 5;
   ↓
3. Check for Violation
   ↓
   const excessVehicles = newOccupancy - zone.contractor_limit;
   if (excessVehicles > 0) {
     await Violation.create({ ... });
   }
   ↓
4. Database Transaction
   ↓
   BEGIN TRANSACTION;
   UPDATE parking_zones SET current_occupancy = newOccupancy;
   INSERT INTO violations (...);
   COMMIT;
   ↓
5. Database Trigger Fires
   ↓
   parking_zones_audit trigger logs the change
   INSERT INTO audit_logs (...);
   ↓
6. Response to Frontend
```

---

## 🛠️ Backend API Routes & Database Operations

### **Zones Routes** (`backend/routes/zones.js`)

| Route | Method | Database Operation | SQL Equivalent |
|-------|--------|-------------------|----------------|
| `/api/zones` | GET | `ParkingZone.findAll()` | `SELECT * FROM parking_zones` |
| `/api/zones/:id` | GET | `ParkingZone.findByPk(id)` | `SELECT * FROM parking_zones WHERE id = ?` |
| `/api/zones` | POST | `ParkingZone.create(data)` | `INSERT INTO parking_zones (...) VALUES (...)` |
| `/api/zones/:id` | PUT | `zone.update(data)` | `UPDATE parking_zones SET ... WHERE id = ?` |
| `/api/zones/:id` | DELETE | `zone.destroy()` | `DELETE FROM parking_zones WHERE id = ?` |
| `/api/zones/:id/occupancy` | PATCH | `zone.update()` + `Violation.create()` | `UPDATE ...` + `INSERT INTO violations` |
| `/api/zones/stats/overview` | GET | `sequelize.query()` | `SELECT COUNT(*), SUM(...) FROM parking_zones` |

### **Violations Routes** (`backend/routes/violations.js`)

| Route | Method | Database Operation | SQL Equivalent |
|-------|--------|-------------------|----------------|
| `/api/violations` | GET | `Violation.findAll({ include: ['zone'] })` | `SELECT v.*, pz.* FROM violations v JOIN parking_zones pz ON v.zone_id = pz.id` |
| `/api/violations/:id` | GET | `Violation.findByPk(id, { include: ['zone'] })` | `SELECT * FROM violations WHERE id = ?` |
| `/api/violations` | POST | `Violation.create(data)` | `INSERT INTO violations (...) VALUES (...)` |
| `/api/violations/:id` | PUT | `violation.update(data)` | `UPDATE violations SET ... WHERE id = ?` |
| `/api/violations/:id/resolve` | PATCH | `violation.update({ resolved: true })` | `UPDATE violations SET resolved = TRUE WHERE id = ?` |
| `/api/violations/:id` | DELETE | `violation.destroy()` | `DELETE FROM violations WHERE id = ?` |
| `/api/violations/stats/summary` | GET | `sequelize.query()` | Aggregation queries |

### **Auth Routes** (`backend/routes/auth.js`)

| Route | Method | Database Operation | SQL Equivalent |
|-------|--------|-------------------|----------------|
| `/api/auth/register` | POST | `User.create(data)` | `INSERT INTO users (...) VALUES (...)` |
| `/api/auth/login` | POST | `User.findOne({ where: { username } })` | `SELECT * FROM users WHERE username = ?` |
| `/api/auth/me` | GET | `User.findByPk(userId)` | `SELECT * FROM users WHERE id = ?` |
| `/api/auth/check-users` | GET | `User.count()` | `SELECT COUNT(*) FROM users` |

---

## 🔐 Database Features Used by Backend

### 1. **Stored Procedures**

The backend can call stored procedures:

```javascript
// Example: Update zone occupancy
await sequelize.query(
  'CALL update_zone_occupancy(?, ?, ?)',
  {
    replacements: [zoneId, occupancyChange, userId],
    type: QueryTypes.RAW
  }
);
```

**Available Procedures:**
- `update_zone_occupancy(zone_id, occupancy_change, user_id)`
- `resolve_violation(violation_id, user_id, resolution_notes)`
- `generate_daily_report(report_date)`

### 2. **Database Triggers**

Triggers automatically fire on database events:

**`parking_zones_audit` Trigger:**
```sql
-- Fires AFTER UPDATE on parking_zones
-- Automatically logs occupancy changes to audit_logs
```

**`update_zone_status` Trigger:**
```sql
-- Fires BEFORE UPDATE on parking_zones
-- Updates zone status based on occupancy
```

### 3. **Database Functions**

Functions can be called from backend:

```javascript
// Example: Check if zone is violating
const result = await sequelize.query(
  'SELECT is_zone_violating(?) as is_violating',
  { replacements: [zoneId] }
);
```

**Available Functions:**
- `calculate_available_spots(zone_id)` → Returns available parking spots
- `is_zone_violating(zone_id)` → Returns TRUE if violating

### 4. **Database Views**

Views provide pre-computed queries:

```javascript
// Example: Get zones with violations
const zones = await sequelize.query(
  'SELECT * FROM zones_with_violations',
  { type: QueryTypes.SELECT }
);
```

**Available Views:**
- `zones_with_violations` - Zones with violation counts
- `violation_statistics` - Daily violation stats
- `contractor_performance` - Contractor compliance metrics

### 5. **Indexes**

Indexes improve query performance:

```sql
CREATE INDEX idx_zone_timestamp ON violations(zone_id, timestamp DESC);
CREATE INDEX idx_zone_occupancy ON parking_zones(current_occupancy DESC);
CREATE INDEX idx_user_role ON users(role);
```

**Backend Benefits:**
- Faster queries on indexed columns
- Better performance for filtered searches
- Optimized JOIN operations

---

## 🔄 Transaction Management

The backend uses database transactions for data integrity:

```javascript
// Example: Update occupancy and create violation atomically
await sequelize.transaction(async (t) => {
  await zone.update({ current_occupancy: newOccupancy }, { transaction: t });
  
  if (excessVehicles > 0) {
    await Violation.create({
      zone_id: zone.id,
      excess_vehicles: excessVehicles,
      // ...
    }, { transaction: t });
  }
  
  // If any operation fails, entire transaction rolls back
});
```

**Benefits:**
- Atomic operations (all or nothing)
- Data consistency
- Prevents partial updates

---

## 📝 Important Notes

### 1. **Password Hashing**

⚠️ **Fix Required:** The SQL script has a placeholder password hash:
```sql
-- Current (needs fixing):
INSERT INTO users (username, email, password_hash, full_name, role)
VALUES ('admin', 'admin@smartparking.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8p3bqKqqhH0Fm3Tuvxj/g0YcH1aRZK', 'System Administrator', 'admin');
```

**Solution:** Use the backend registration endpoint or hash the password properly:
```javascript
const bcrypt = require('bcryptjs');
const passwordHash = await bcrypt.hash('admin123', 10);
// Then use passwordHash in SQL
```

### 2. **Field Naming Convention**

- **Database:** Uses `snake_case` (e.g., `total_capacity`, `current_occupancy`)
- **Backend Models:** Maps to `snake_case` using `field` property
- **API Responses:** Converted to `camelCase` for frontend

### 3. **Cascade Deletes**

- Deleting a `parking_zone` → Automatically deletes related `violations`
- Deleting a `violation` → Automatically deletes related `payments`
- Ensures referential integrity

### 4. **Audit Logging**

All changes are logged:
- Backend explicitly logs via `audit_logs` table
- Database triggers also log occupancy changes
- Provides complete audit trail

---

## 🚀 Quick Start

1. **Run SQL Script:**
   ```bash
   mysql -u root -p < Database\ SPMS.sql
   ```

2. **Backend Connects Automatically:**
   ```javascript
   // backend/db/database.js
   // Automatically connects on server start
   ```

3. **Models Sync (Development):**
   ```javascript
   // Models automatically sync with database
   await sequelize.sync({ alter: true });
   ```

4. **Start Backend:**
   ```bash
   cd smartparking/backend
   npm install
   npm start
   ```

---

## 📊 Database Schema Diagram

```
parking_zones (1) ──┐
                    │
                    ├──< (many) violations (1) ──< (many) payments
                    │
users (many) ───────┘
                    │
                    └──> (many) audit_logs

settings (standalone)
```

---

## ✅ Summary

The backend uses **Sequelize ORM** to:
- Map database tables to JavaScript models
- Handle relationships (associations)
- Execute queries with validation
- Manage transactions
- Call stored procedures and functions
- Leverage database triggers and views

This provides a clean, type-safe interface between the Node.js backend and MySQL database while maintaining all the power of SQL features like triggers, stored procedures, and views.

