# API Connection Flow Documentation

## Complete Data Flow: Frontend → Backend → Database

### 1. Frontend Configuration

#### API Client (`src/services/apiClient.js`)
- **Base URL**: `/api` (relative path)
- **Proxy**: Vite proxies `/api` → `http://localhost:5241` (see `vite.config.js`)
- **Credentials**: `withCredentials: true` (sends cookies)
- **Timeout**: 30 seconds

#### Vite Proxy (`vite.config.js`)
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5241',
    changeOrigin: true,
    secure: false
  }
}
```

### 2. Service Layer (`src/services/managerService.js`)

**Example: `getRooms()`**
```javascript
async getRooms() {
  const response = await apiClient.get("/manager/rooms");
  // Transforms backend data to frontend format
  return transformed;
}
```

**Flow:**
1. Calls `apiClient.get("/manager/rooms")`
2. This becomes: `GET http://localhost:5173/api/manager/rooms`
3. Vite proxy forwards to: `GET http://localhost:5241/api/manager/rooms`
4. Receives response and transforms data

### 3. Page Components (`src/pages/ManagerManageRooms.jsx`)

**Usage:**
```javascript
import { managerService } from '../services/managerService.js';

useEffect(() => {
  fetchRooms();
}, []);

const fetchRooms = async () => {
  const data = await managerService.getRooms();
  setRooms(data);
};
```

### 4. Backend API (`HRSAPI/Controllers/ManagerController.cs`)

**Endpoint: `GET /api/manager/rooms`**
```csharp
[HttpGet("rooms")]
public async Task<IActionResult> GetRooms()
{
    // Direct database access
    var rooms = await _context.Rooms
        .Include(r => r.RoomType)
        .ToListAsync();
    
    // Transform to camelCase JSON
    var result = rooms.Select(r => new {
        roomId = r.RoomId,
        roomNumber = r.RoomNumber,
        status = r.Status,
        // ... etc
    });
    
    return Ok(result);
}
```

### 5. Database Connection (`HRSAPI/Program.cs`)

**Connection String:**
```json
"DefaultConnection": "Data Source=Habimana;Initial Catalog=HotelReservationDB;Integrated Security=True;Trust Server Certificate=True"
```

**Database Context:**
```csharp
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
```

### 6. JSON Serialization (`HRSAPI/Program.cs`)

**Configured for camelCase:**
```csharp
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });
```

## Complete Request Flow

```
[React Component]
    ↓
[managerService.getRooms()]
    ↓
[apiClient.get("/manager/rooms")]
    ↓
[Vite Proxy: /api → http://localhost:5241]
    ↓
[Backend: GET /api/manager/rooms]
    ↓
[ManagerController.GetRooms()]
    ↓
[ApplicationDbContext.Rooms.Include(r => r.RoomType)]
    ↓
[SQL Server: SELECT * FROM Rooms JOIN RoomTypes]
    ↓
[Transform to camelCase JSON]
    ↓
[Return Ok(result)]
    ↓
[Frontend receives response]
    ↓
[Transform data for UI]
    ↓
[setRooms(data)]
    ↓
[Component re-renders with data]
```

## All Service Endpoints

### Manager Service (`managerService.js`)
- `getRooms()` → `GET /api/manager/rooms`
- `getBookings()` → `GET /api/manager/bookings`
- `getTravelBookings()` → `GET /api/manager/travel-bookings`
- `getAmenities()` → `GET /api/manager/amenities`
- `getRoomTypes()` → `GET /api/manager/room-types`
- `getStaff()` → `GET /api/manager/staff`
- `getFinancialReports()` → `GET /api/manager/financial-reports`
- `getCustomerFeedback()` → `GET /api/manager/customer-feedback`

### Receptionist Service (`receptionistService.js`)
- `getDashboard()` → `GET /api/receptionist/dashboard`
- `getReservations()` → `GET /api/receptionist/reservations`
- `getRoomAvailability()` → `GET /api/receptionist/room-availability`
- `getTravelBookings()` → `GET /api/receptionist/travel-bookings`

### Admin Service (`adminService.js`)
- `getDashboard()` → `GET /api/admin/dashboard`
- `getStaff()` → `GET /api/admin/staff`
- `getPayments()` → `GET /api/admin/payments`
- `getReports()` → `GET /api/admin/reports`
- `getAuditLogs()` → `GET /api/admin/audit-logs`
- `getRoles()` → `GET /api/admin/roles`

## Troubleshooting

### If data doesn't appear:

1. **Check Backend is Running**
   - Backend should be on `http://localhost:5241`
   - Check console for startup messages

2. **Check Database Connection**
   - Verify connection string in `appsettings.json`
   - Database name: `HotelReservationDB`
   - Server: `Habimana`

3. **Check Browser Console**
   - Open DevTools (F12)
   - Look for:
     - "Full API response:" logs
     - "First room object:" logs
     - Any error messages

4. **Check Network Tab**
   - Open DevTools → Network tab
   - Look for `/api/manager/rooms` request
   - Check Status Code (should be 200)
   - Check Response tab to see actual data

5. **Check Backend Logs**
   - Look for console output:
     - "Direct DB query returned X rooms"
     - "Returning X transformed rooms"
     - Any error messages

6. **Verify CORS**
   - Backend CORS allows: `http://localhost:5173`
   - Check for CORS errors in console

## Testing the Connection

### Test Backend Directly:
```bash
# Open in browser or use curl
http://localhost:5241/api/manager/rooms
```

### Test Frontend:
1. Open browser console (F12)
2. Navigate to Manager → Manage Rooms
3. Check console logs for API responses
4. Check Network tab for API calls

