using HRS_SmartBooking.Data;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HRSAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReceptionistController : ControllerBase
{
    private readonly DashboardService _dashboardService;
    private readonly ApplicationDbContext _context;

    public ReceptionistController(DashboardService dashboardService, ApplicationDbContext context)
    {
        _dashboardService = dashboardService;
        _context = context;
    }

    public record ReceptionistDashboardDto(
        int TotalBookings,
        int TodayCheckIns,
        int TodayCheckOuts,
        int PendingArrivals,
        int UrgentIssues,
        int TotalRooms,
        int OccupiedRooms,
        int AvailableRooms,
        int MaintenanceRooms,
        int CurrentlyCheckedIn
    );

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var today = DateTime.Today;
        
        // Automatically check out bookings that have passed their checkout date
        var overdueBookings = await _context.Bookings
            .Include(b => b.Room)
            .Where(b => b.BookingStatus == "Checked-in" && b.CheckOutDate < today)
            .ToListAsync();
        
        foreach (var booking in overdueBookings)
        {
            // Automatically check out the booking
            // Try "Checked-out" which should be allowed by the CHECK constraint
            booking.BookingStatus = "Checked-out";
            
            // Mark room as available
            if (booking.Room != null)
            {
                booking.Room.Status = "available";
            }
        }
        
        if (overdueBookings.Any())
        {
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException dbEx) when (dbEx.InnerException?.Message?.Contains("CHECK constraint") == true)
            {
                // If "Checked-out" is not allowed, try "Cancelled" as fallback
                foreach (var booking in overdueBookings)
                {
                    booking.BookingStatus = "Cancelled";
                }
                await _context.SaveChangesAsync();
            }
        }
        
        var totalBookings = await _context.Bookings.CountAsync();

        // Arrivals scheduled for today (include already checked-in arrivals)
        var todayCheckIns = await _context.Bookings
            .CountAsync(b => b.CheckInDate.Date == today &&
                             (b.BookingStatus == "Pending" || b.BookingStatus == "Confirmed" || b.BookingStatus == "Checked-in"));

        // Departures due today (any non-cancelled booking)
        var todayCheckOuts = await _context.Bookings
            .CountAsync(b => b.CheckOutDate.Date == today &&
                             b.BookingStatus != "Cancelled");

        // Currently active checked-ins (for “Currently Checked-In” card)
        var currentlyCheckedIn = await _context.Bookings
            .CountAsync(b => b.BookingStatus == "Checked-in");

        var pendingArrivals = await _context.Bookings
            .CountAsync(b => b.CheckInDate.Date == today && b.BookingStatus == "Pending");
        var urgentIssues = await _context.Bookings
            .CountAsync(b => b.BookingStatus == "Pending" && b.CheckInDate <= today.AddHours(2));

        // Room status counts - count rooms that are actually occupied by checked-in bookings
        var totalRooms = await _context.Rooms.CountAsync();
        
        // Count rooms that have active checked-in bookings
        var roomsWithCheckedInBookings = await _context.Bookings
            .Where(b => b.BookingStatus == "Checked-in" && b.RoomId > 0)
            .Select(b => b.RoomId)
            .Distinct()
            .CountAsync();
        
        // Also count rooms with status "occupied" or "checked-in" that might not have active bookings
        var roomsWithOccupiedStatus = await _context.Rooms.CountAsync(r => 
            (r.Status.ToLower() == "occupied" || r.Status.ToLower() == "checked-in") &&
            !_context.Bookings.Any(b => b.RoomId == r.RoomId && b.BookingStatus == "Checked-in"));
        
        var occupiedRooms = roomsWithCheckedInBookings + roomsWithOccupiedStatus;
        var maintenanceRooms = await _context.Rooms.CountAsync(r => 
            r.Status.ToLower() == "maintenance" || r.Status.ToLower() == "cleaning");
        var availableRooms = totalRooms - occupiedRooms - maintenanceRooms;

        var dto = new ReceptionistDashboardDto(
            totalBookings,
            todayCheckIns,
            todayCheckOuts,
            pendingArrivals,
            urgentIssues,
            totalRooms,
            occupiedRooms,
            availableRooms,
            maintenanceRooms,
            currentlyCheckedIn
        );

        // Add recent activity
        var recentBookings = await _context.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Room)
            .OrderByDescending(b => b.CreatedAt)
            .Take(5)
            .ToListAsync();

        var recentBookingsDto = recentBookings.Select(b => new
            {
                id = b.BookingId,
                type = "booking",
                title = "New booking received",
            detail = $"Room {b.Room?.RoomNumber ?? "N/A"} - {b.Customer?.FirstName ?? "Guest"} {b.Customer?.LastName ?? string.Empty}".Trim(),
                time = b.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
                createdAt = b.CreatedAt
        }).ToList();

        var recentCheckIns = await _context.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Room)
            .Where(b => b.BookingStatus == "Checked-in" && b.CreatedAt >= today.AddDays(-7))
            .OrderByDescending(b => b.CheckInDate)
            .Take(5)
            .ToListAsync();

        var recentCheckInsDto = recentCheckIns.Select(b => new
            {
                id = b.BookingId,
                type = "checkin",
                title = "Guest checked in",
            detail = $"Room {b.Room?.RoomNumber ?? "N/A"} - {b.Customer?.FirstName ?? "Guest"} {b.Customer?.LastName ?? string.Empty}".Trim(),
                time = b.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
                createdAt = b.CreatedAt
        }).ToList();

        var recentActivity = recentBookingsDto.Cast<object>()
            .Concat(recentCheckInsDto.Cast<object>())
            .OrderByDescending(a => ((dynamic)a).createdAt)
            .Take(5)
            .ToList();

        var result = new
        {
            totalBookings = dto.TotalBookings,
            todayCheckIns = dto.TodayCheckIns,
            todayCheckOuts = dto.TodayCheckOuts,
            currentlyCheckedIn = dto.CurrentlyCheckedIn,
            pendingArrivals = dto.PendingArrivals,
            urgentIssues = dto.UrgentIssues,
            totalRooms = dto.TotalRooms,
            occupiedRooms = dto.OccupiedRooms,
            availableRooms = dto.AvailableRooms,
            maintenanceRooms = dto.MaintenanceRooms,
            occupancyRate = dto.TotalRooms > 0 ? Math.Round((dto.OccupiedRooms * 100.0 / dto.TotalRooms), 1) : 0,
            recentActivity = recentActivity
        };

        return Ok(result);
    }

    [HttpGet("today-reservations")]
    public async Task<IActionResult> GetTodayReservations()
    {
        var today = DateTime.Today;

        // Get bookings for today's check-ins (pending or confirmed)
        var checkInReservations = await _context.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Room)
                .ThenInclude(r => r!.RoomType)
            .Where(b => b.CheckInDate.Date == today && 
                       (b.BookingStatus == "Pending" || b.BookingStatus == "Confirmed" || b.BookingStatus == "Checked-in"))
            .OrderBy(b => b.CheckInDate)
            .Select(b => new
            {
                bookingId = b.BookingId,
                customer = b.Customer != null ? new
                {
                    firstName = b.Customer.FirstName,
                    lastName = b.Customer.LastName,
                    email = b.Customer.Email,
                    phoneNumber = b.Customer.PhoneNumber
                } : null,
                room = b.Room != null ? new
                {
                    roomId = b.Room.RoomId,
                    roomNumber = b.Room.RoomNumber,
                    roomType = b.Room.RoomType != null ? new
                    {
                        typeName = b.Room.RoomType.TypeName
                    } : null
                } : null,
                checkInDate = b.CheckInDate,
                checkOutDate = b.CheckOutDate,
                bookingStatus = b.BookingStatus,
                paymentStatus = b.PaymentStatus,
                totalPrice = b.TotalPrice,
                createdAt = b.CreatedAt
            })
            .ToListAsync();

        return Ok(checkInReservations);
    }

    [HttpGet("checked-in-bookings")]
    public async Task<IActionResult> GetCheckedInBookings()
    {
        var today = DateTime.Today;
        
        // Automatically check out bookings and make rooms available if checkout date has passed or is today
        var overdueBookings = await _context.Bookings
            .Include(b => b.Room)
            .Where(b => b.BookingStatus == "Checked-in" && b.CheckOutDate <= today)
            .ToListAsync();
        
        foreach (var booking in overdueBookings)
        {
            // Automatically check out the booking
            booking.BookingStatus = "Checked-out";
            
            // Mark room as available if checkout date has passed
            if (booking.Room != null)
            {
                booking.Room.Status = "available";
            }
        }
        
        if (overdueBookings.Any())
        {
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException dbEx) when (dbEx.InnerException?.Message?.Contains("CHECK constraint") == true)
            {
                // If "Checked-out" is not allowed, try "Cancelled" as fallback
                foreach (var booking in overdueBookings)
                {
                    booking.BookingStatus = "Cancelled";
                }
                await _context.SaveChangesAsync();
            }
        }
        
        // Get all bookings that are currently checked in (not yet checked out)
        // This excludes bookings that have been automatically checked out
        var checkedInBookings = await _context.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Room)
                .ThenInclude(r => r!.RoomType)
            .Where(b => b.BookingStatus == "Checked-in")
            .OrderBy(b => b.CheckOutDate)
            .Select(b => new
            {
                bookingId = b.BookingId,
                customer = b.Customer != null ? new
                {
                    firstName = b.Customer.FirstName,
                    lastName = b.Customer.LastName,
                    email = b.Customer.Email,
                    phoneNumber = b.Customer.PhoneNumber
                } : null,
                room = b.Room != null ? new
                {
                    roomId = b.Room.RoomId,
                    roomNumber = b.Room.RoomNumber,
                    roomType = b.Room.RoomType != null ? new
                    {
                        typeName = b.Room.RoomType.TypeName
                    } : null
                } : null,
                checkInDate = b.CheckInDate,
                checkOutDate = b.CheckOutDate,
                bookingStatus = b.BookingStatus,
                paymentStatus = b.PaymentStatus,
                totalPrice = b.TotalPrice,
                createdAt = b.CreatedAt
            })
            .ToListAsync();

        return Ok(checkedInBookings);
    }

    [HttpGet("reservations")]
    public async Task<IActionResult> GetReservations()
    {
        var today = DateTime.Today;
        
        // Automatically check out bookings that have passed their checkout date
        var overdueBookings = await _context.Bookings
            .Include(b => b.Room)
            .Where(b => b.BookingStatus == "Checked-in" && b.CheckOutDate < today)
            .ToListAsync();
        
        foreach (var booking in overdueBookings)
        {
            // Automatically check out the booking
            booking.BookingStatus = "Checked-out";
            
            // Mark room as available if checkout date has passed
            if (booking.Room != null)
            {
                booking.Room.Status = "available";
            }
        }
        
        if (overdueBookings.Any())
        {
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException dbEx) when (dbEx.InnerException?.Message?.Contains("CHECK constraint") == true)
            {
                // If "Checked-out" is not allowed, try "Cancelled" as fallback
                foreach (var booking in overdueBookings)
                {
                    booking.BookingStatus = "Cancelled";
                }
                await _context.SaveChangesAsync();
            }
        }
        
        // Get room reservations
        var roomReservations = await _context.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Room)
                .ThenInclude(r => r!.RoomType)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new
            {
                type = "room",
                bookingId = b.BookingId,
                id = b.BookingId,
                customer = b.Customer != null ? new
                {
                    firstName = b.Customer.FirstName,
                    lastName = b.Customer.LastName,
                    email = b.Customer.Email,
                    phoneNumber = b.Customer.PhoneNumber
                } : null,
                room = b.Room != null ? new
                {
                    roomId = b.Room.RoomId,
                    roomNumber = b.Room.RoomNumber,
                    roomType = b.Room.RoomType != null ? new
                    {
                        typeName = b.Room.RoomType.TypeName
                    } : null
                } : null,
                checkInDate = b.CheckInDate,
                checkOutDate = b.CheckOutDate,
                bookingStatus = b.BookingStatus,
                paymentStatus = b.PaymentStatus,
                totalPrice = b.TotalPrice,
                createdAt = b.CreatedAt
            })
            .ToListAsync();

        // Get travel reservations
        var travelReservations = await _context.TravelBookings
            .Include(t => t.Customer)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                type = "travel",
                travelBookingId = t.TravelBookingId,
                id = t.TravelBookingId,
                customer = t.Customer != null ? new
                {
                    firstName = t.Customer.FirstName,
                    lastName = t.Customer.LastName,
                    email = t.Customer.Email,
                    phoneNumber = t.Customer.PhoneNumber
                } : null,
                attractionName = t.AttractionName,
                attractionType = t.AttractionType,
                travelDate = t.TravelDate,
                numberOfParticipants = t.NumberOfParticipants,
                bookingStatus = t.BookingStatus,
                paymentStatus = t.PaymentStatus,
                totalPrice = t.TotalPrice,
                createdAt = t.CreatedAt
            })
            .ToListAsync();

        // Combine and return
        var allReservations = roomReservations.Cast<object>()
            .Concat(travelReservations.Cast<object>())
            .OrderByDescending(r => ((dynamic)r).createdAt)
            .ToList();

        return Ok(allReservations);
    }

    [HttpGet("room-availability")]
    public async Task<IActionResult> GetRoomAvailability()
    {
        var roomsFromDb = await _context.Rooms
            .Include(r => r.RoomType)
            .ToListAsync();
        
        var rooms = roomsFromDb.Select(r =>
        {
            int floor = 0;
            if (r.RoomNumber != null && int.TryParse(r.RoomNumber.ToString(), out int roomNum) && roomNum > 0)
            {
                floor = roomNum / 100;
            }
            
            return new
            {
                roomId = r.RoomId,
                id = r.RoomNumber,
                type = r.RoomType != null ? r.RoomType.TypeName : "Standard",
                status = r.Status.ToLower(),
                floor = floor,
                capacity = r.RoomType != null ? r.RoomType.MaxOccupancy : 2,
                price = r.CurrentPrice,
                amenities = r.RoomType != null && !string.IsNullOrEmpty(r.RoomType.Amenities)
                    ? r.RoomType.Amenities.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(a => a.Trim()).ToArray()
                    : Array.Empty<string>(),
                lastCleaned = "Today 10:00 AM",
                nextCheckout = (string?)null
            };
        }).ToList();

        return Ok(rooms);
    }

    [HttpGet("customer-requests")]
    public async Task<IActionResult> GetCustomerRequests()
    {
        // Get refund requests from bookings and travel bookings
        var roomRefundRequests = await _context.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Room)
            .Where(b => b.RefundRequested == true && (b.RefundApproved == null || b.RefundApproved == false))
            .Select(b => new
            {
                id = b.BookingId,
                type = "room",
                bookingId = b.BookingId,
                customer = b.Customer != null ? new
                {
                    firstName = b.Customer.FirstName,
                    lastName = b.Customer.LastName,
                    email = b.Customer.Email
                } : null,
                room = b.Room != null ? new
                {
                    roomNumber = b.Room.RoomNumber
                } : null,
                amount = b.TotalPrice,
                status = b.RefundApproved == true
                    ? "Approved"
                    : b.RefundApproved == false
                        ? "Declined"
                        : "Pending", // When refund is requested, status is always Pending
                refundRequested = b.RefundRequested,
                refundApproved = b.RefundApproved,
                cancellationReason = b.CancellationReason,
                createdAt = b.CreatedAt,
                refundRequestedAt = b.RefundRequestedAt
            })
            .ToListAsync();

        var travelRefundRequests = await _context.TravelBookings
            .Include(t => t.Customer)
            .Where(t => t.RefundRequested == true && (t.RefundApproved == null || t.RefundApproved == false))
            .Select(t => new
            {
                id = t.TravelBookingId,
                type = "travel",
                travelBookingId = t.TravelBookingId,
                customer = t.Customer != null ? new
                {
                    firstName = t.Customer.FirstName,
                    lastName = t.Customer.LastName,
                    email = t.Customer.Email
                } : null,
                attractionName = t.AttractionName,
                amount = t.TotalPrice,
                status = t.RefundApproved == true ? "Approved" : t.RefundApproved == false ? "Declined" : "Pending",
                refundRequested = t.RefundRequested,
                refundApproved = t.RefundApproved,
                cancellationReason = t.CancellationReason,
                createdAt = t.CreatedAt,
                refundRequestedAt = t.RefundRequestedAt
            })
            .ToListAsync();

        var allRequests = roomRefundRequests.Cast<object>()
            .Concat(travelRefundRequests.Cast<object>())
            .OrderByDescending(r => ((dynamic)r).refundRequestedAt ?? ((dynamic)r).createdAt)
            .ToList();

        return Ok(allRequests);
    }

    [HttpPost("refund-requests/{id:int}/approve")]
    public async Task<IActionResult> ApproveRefund(int id, [FromQuery] string type = "room")
    {
        if (type == "room")
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();
            booking.RefundApproved = true;
            booking.RefundRequested = false;
            booking.RefundProcessedAt = DateTime.UtcNow;
            booking.PaymentStatus = "Refunded";
            booking.BookingStatus = "Cancelled";
            booking.CancelledAt ??= DateTime.UtcNow;
        }
        else if (type == "travel")
        {
            var travelBooking = await _context.TravelBookings.FindAsync(id);
            if (travelBooking == null) return NotFound();
            travelBooking.RefundApproved = true;
            travelBooking.RefundRequested = false;
            travelBooking.RefundProcessedAt = DateTime.UtcNow;
            travelBooking.PaymentStatus = "Refunded";
            travelBooking.BookingStatus = "Cancelled";
        }
        else
        {
            return BadRequest(new { message = "Invalid booking type" });
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Refund approved successfully" });
    }

    [HttpPost("refund-requests/{id:int}/decline")]
    public async Task<IActionResult> DeclineRefund(int id, [FromQuery] string type = "room", [FromBody] DeclineRefundRequest? request = null)
    {
        if (type == "room")
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();
            booking.RefundApproved = false;
            booking.RefundRequested = false;
            booking.BookingStatus = "Confirmed";
            booking.CancelledAt = null;
            if (!string.IsNullOrEmpty(request?.Reason))
            {
                booking.CancellationReason = request.Reason;
            }
        }
        else if (type == "travel")
        {
            var travelBooking = await _context.TravelBookings.FindAsync(id);
            if (travelBooking == null) return NotFound();
            travelBooking.RefundApproved = false;
            travelBooking.RefundRequested = false;
            travelBooking.BookingStatus = "Confirmed";
            if (!string.IsNullOrEmpty(request?.Reason))
            {
                travelBooking.CancellationReason = request.Reason;
            }
        }
        else
        {
            return BadRequest(new { message = "Invalid booking type" });
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Refund declined" });
    }

    public class DeclineRefundRequest
    {
        public string? Reason { get; set; }
    }

    [HttpGet("pending-approvals")]
    public IActionResult GetPendingApprovals()
    {
        // For now, return empty array - this would come from a PendingApprovals table
        return Ok(new List<object>());
    }

    [HttpPost("check-in/{bookingId:int}")]
    public async Task<IActionResult> CheckIn(int bookingId, [FromBody] CheckInRequest? request = null)
    {
        try
        {
            var booking = await _context.Bookings
                .Include(b => b.Room)
                .FirstOrDefaultAsync(b => b.BookingId == bookingId);
            
            if (booking == null) 
            {
                return NotFound(new { error = $"Booking with ID {bookingId} not found" });
            }

            // Check if booking is already checked in
            if (booking.BookingStatus == "Checked-in")
            {
                return BadRequest(new { error = "Guest is already checked in" });
            }

            // Update booking status
            booking.BookingStatus = "Checked-in";
            // Keep payment status aligned with DB constraint (use Paid instead of Completed)
            if (booking.PaymentStatus != "Paid")
            {
                booking.PaymentStatus = "Paid";
            }
            
            // Handle room assignment
            // If room number is provided in request, use that room
            if (request != null && !string.IsNullOrEmpty(request.RoomNumber))
            {
                var roomByNumber = await _context.Rooms
                    .FirstOrDefaultAsync(r => r.RoomNumber == request.RoomNumber);
                
                if (roomByNumber == null)
                {
                    return BadRequest(new { error = $"Room number {request.RoomNumber} not found" });
                }
                
                // Check if room is available
                if (roomByNumber.Status.ToLower() == "occupied" || roomByNumber.Status.ToLower() == "checked-in")
                {
                    return BadRequest(new { error = $"Room {request.RoomNumber} is already occupied" });
                }
                
                // Update booking to use the specified room
                booking.RoomId = roomByNumber.RoomId;
                booking.Room = roomByNumber;
                roomByNumber.Status = "occupied";
            }
            else if (booking.Room != null)
            {
                // Use the room already assigned to the booking
                booking.Room.Status = "occupied";
            }
            else
            {
                // No room assigned and no room number provided
                return BadRequest(new { error = "Room number is required for check-in" });
            }
            
            // Get receptionist ID from session if available
            int? receptionistId = null;
            try
            {
                var userIdClaim = HttpContext.User?.FindFirst("userId")?.Value;
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
                {
                    receptionistId = userId;
                }
            }
            catch
            {
                // Receptionist ID is optional
            }
            
            // Save booking + room first (critical path). Any optional logging happens after.
            await _context.SaveChangesAsync();

            // OPTIONAL: log to CheckInCheckout table, but never fail the check-in if this fails
            try
            {
                var now = DateTime.Now;
                var roomKeyIssued = true; // Default to true when checking in
                
                // Try to update existing record first
                int rowsAffected = 0;
                if (receptionistId.HasValue)
                {
                    try
                    {
                        rowsAffected = await _context.Database.ExecuteSqlRawAsync(
                            @"UPDATE CheckInCheckout 
                              SET check_in_time = {1},
                                  receptionist_id = {2},
                                  room_key_issued = {3},
                                  notes = {4}
                              WHERE booking_id = {0}",
                            bookingId,
                            now,
                            receptionistId.Value,
                            roomKeyIssued,
                            (object?)request?.Notes ?? DBNull.Value
                        );
                    }
                    catch
                    {
                        // Try alternative table name
                        rowsAffected = await _context.Database.ExecuteSqlRawAsync(
                            @"UPDATE CheckInCheckOut 
                              SET check_in_time = {1},
                                  receptionist_id = {2},
                                  room_key_issued = {3},
                                  notes = {4}
                              WHERE booking_id = {0}",
                            bookingId,
                            now,
                            receptionistId.Value,
                            roomKeyIssued,
                            (object?)request?.Notes ?? DBNull.Value
                        );
                    }
                }
                else
                {
                    try
                    {
                        rowsAffected = await _context.Database.ExecuteSqlRawAsync(
                            @"UPDATE CheckInCheckout 
                              SET check_in_time = {1},
                                  room_key_issued = {2},
                                  notes = {3}
                              WHERE booking_id = {0}",
                            bookingId,
                            now,
                            roomKeyIssued,
                            (object?)request?.Notes ?? DBNull.Value
                        );
                    }
                    catch
                    {
                        // Try alternative table name
                        rowsAffected = await _context.Database.ExecuteSqlRawAsync(
                            @"UPDATE CheckInCheckOut 
                              SET check_in_time = {1},
                                  room_key_issued = {2},
                                  notes = {3}
                              WHERE booking_id = {0}",
                            bookingId,
                            now,
                            roomKeyIssued,
                            (object?)request?.Notes ?? DBNull.Value
                        );
                    }
                }
                
                // If no rows were updated, insert a new record
                if (rowsAffected == 0)
                {
                    try
                    {
                        if (receptionistId.HasValue)
                        {
                            await _context.Database.ExecuteSqlRawAsync(
                                @"INSERT INTO CheckInCheckout (booking_id, receptionist_id, check_in_time, room_key_issued, notes, created_at)
                                  VALUES ({0}, {1}, {2}, {3}, {4}, {5})",
                                bookingId,
                                receptionistId.Value,
                                now,
                                roomKeyIssued,
                                (object?)request?.Notes ?? DBNull.Value,
                                now
                            );
                        }
                        else
                        {
                            await _context.Database.ExecuteSqlRawAsync(
                                @"INSERT INTO CheckInCheckout (booking_id, check_in_time, room_key_issued, notes, created_at)
                                  VALUES ({0}, {1}, {2}, {3}, {4})",
                                bookingId,
                                now,
                                roomKeyIssued,
                                (object?)request?.Notes ?? DBNull.Value,
                                now
                            );
                        }
                        Console.WriteLine($"Successfully inserted CheckInCheckout record for booking {bookingId}");
                    }
                    catch
                    {
                        // Try alternative table name; swallow errors if it still fails
                        try
                        {
                            if (receptionistId.HasValue)
                            {
                                await _context.Database.ExecuteSqlRawAsync(
                                    @"INSERT INTO CheckInCheckOut (booking_id, receptionist_id, check_in_time, room_key_issued, notes, created_at)
                                      VALUES ({0}, {1}, {2}, {3}, {4}, {5})",
                                    bookingId,
                                    receptionistId.Value,
                                    now,
                                    roomKeyIssued,
                                    (object?)request?.Notes ?? DBNull.Value,
                                    now
                                );
                            }
                            else
                            {
                                await _context.Database.ExecuteSqlRawAsync(
                                    @"INSERT INTO CheckInCheckOut (booking_id, check_in_time, room_key_issued, notes, created_at)
                                      VALUES ({0}, {1}, {2}, {3}, {4})",
                                    bookingId,
                                    now,
                                    roomKeyIssued,
                                    (object?)request?.Notes ?? DBNull.Value,
                                    now
                                );
                            }
                            Console.WriteLine($"Successfully inserted CheckInCheckOut record for booking {bookingId}");
                        }
                        catch (Exception logEx)
                        {
                            Console.WriteLine($"Warning: Could not log to CheckInCheckOut for booking {bookingId}: {logEx.Message}");
                        }
                    }
                }
                else
                {
                    Console.WriteLine($"Successfully updated CheckInCheckout record for booking {bookingId}");
                }
            }
            catch (Exception logEx)
            {
                // Do not fail check-in if the optional log table write fails
                Console.WriteLine($"Warning: optional CheckInCheckout logging failed for booking {bookingId}: {logEx.Message}");
            }

            // Return only primitive fields to avoid JSON serialization cycles
            return Ok(new
            {
                message = "Check-in successful",
                bookingId = booking.BookingId,
                bookingStatus = booking.BookingStatus,
                paymentStatus = booking.PaymentStatus,
                roomId = booking.RoomId,
                roomNumber = booking.Room?.RoomNumber,
                checkInDate = booking.CheckInDate,
                checkOutDate = booking.CheckOutDate
            });
        }
        catch (Exception ex)
        {
            // Log the exception (you might want to use a proper logging framework)
            Console.WriteLine($"Error during check-in: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            
            return StatusCode(500, new { error = "An error occurred while processing check-in. Please try again." });
        }
    }

    public class CheckInRequest
    {
        public string? RoomNumber { get; set; }
        public string? PaymentMethod { get; set; }
        public string? Notes { get; set; }
    }

    [HttpPost("check-out/{bookingId:int}")]
    public async Task<IActionResult> CheckOut(int bookingId, [FromBody] CheckOutRequest? request = null)
    {
        try
        {
            var booking = await _context.Bookings
                .Include(b => b.Room)
                .FirstOrDefaultAsync(b => b.BookingId == bookingId);
            
            if (booking == null)
            {
                return NotFound(new { error = $"Booking with ID {bookingId} not found" });
            }

            // PRIORITY 1: Update booking status (from ANY status, not just "Checked-In")
            if (request?.Action == "cancel")
            {
                booking.BookingStatus = "Cancelled";
                booking.PaymentStatus = "Cancelled";
            }
            else
            {
                // Try "Checked-out" first (with lowercase 'o'), fallback to "Cancelled" if that fails
                // The CHECK constraint determines what's allowed
                booking.BookingStatus = "Checked-out";
            }

            // PRIORITY 2: Make room available (critical for room availability)
            if (booking.RoomId > 0)
            {
                if (booking.Room != null)
                {
                    booking.Room.Status = "available";
                }
                else
                {
                    var room = await _context.Rooms.FindAsync(booking.RoomId);
                    if (room != null)
                    {
                        room.Status = "available";
                    }
                }
            }
            
            // PRIORITY 3: Save changes to booking and room (core functionality)
            try
            {
                await _context.SaveChangesAsync();
                Console.WriteLine($"Successfully saved checkout for booking {bookingId}");
            }
            catch (DbUpdateException dbEx) when (dbEx.InnerException?.Message?.Contains("CHECK constraint") == true)
            {
                // If "Checked-out" is not allowed, try "Cancelled" as fallback
                Console.WriteLine($"CHECK constraint rejected 'Checked-out', trying 'Cancelled' instead");
                booking.BookingStatus = "Cancelled";
                await _context.SaveChangesAsync();
                Console.WriteLine($"Successfully saved checkout with 'Cancelled' status for booking {bookingId}");
            }
            catch (Exception saveEx)
            {
                Console.WriteLine($"Error saving changes during checkout: {saveEx.Message}");
                Console.WriteLine($"Save error details: {saveEx.InnerException?.Message ?? saveEx.Message}");
                throw;
            }

            // PRIORITY 4: Try to log in CheckInCheckOut table (optional - don't fail if this fails)
            try
            {
                var now = DateTime.Now;
                var today = DateTime.Today;
                
                // Get receptionist ID if available
                int? receptionistId = null;
                try
                {
                    var userIdClaim = HttpContext.User?.FindFirst("userId")?.Value;
                    if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
                    {
                        receptionistId = userId;
                    }
                }
                catch { /* Optional */ }
                
                // Calculate additional charges if provided
                decimal? additionalCharges = null;
                if (request?.AdditionalCharges != null && request.AdditionalCharges.Count > 0)
                {
                    additionalCharges = request.AdditionalCharges.Sum(c => c.Amount);
                }
                
                // Try to update existing record (table name might be CheckInCheckout or CheckInCheckOut)
                int rowsAffected = 0;
                try
                {
                    if (receptionistId.HasValue)
                    {
                        rowsAffected = await _context.Database.ExecuteSqlRawAsync(
                            @"UPDATE CheckInCheckout 
                              SET check_out_time = {1}, 
                                  actual_check_out_date = {2}, 
                                  additional_charges = {3}, 
                                  notes = {4},
                                  receptionist_id = {5}
                              WHERE booking_id = {0}",
                            bookingId, now, today,
                            (object?)additionalCharges ?? DBNull.Value,
                            (object?)request?.Notes ?? DBNull.Value,
                            receptionistId.Value
                        );
                    }
                    else
                    {
                        rowsAffected = await _context.Database.ExecuteSqlRawAsync(
                            @"UPDATE CheckInCheckout 
                              SET check_out_time = {1}, 
                                  actual_check_out_date = {2}, 
                                  additional_charges = {3}, 
                                  notes = {4}
                              WHERE booking_id = {0}",
                            bookingId, now, today,
                            (object?)additionalCharges ?? DBNull.Value,
                            (object?)request?.Notes ?? DBNull.Value
                        );
                    }
                }
                catch
                {
                    // Try alternative table name
                    if (receptionistId.HasValue)
                    {
                        rowsAffected = await _context.Database.ExecuteSqlRawAsync(
                            @"UPDATE CheckInCheckOut 
                              SET check_out_time = {1}, 
                                  actual_check_out_date = {2}, 
                                  additional_charges = {3}, 
                                  notes = {4},
                                  receptionist_id = {5}
                              WHERE booking_id = {0}",
                            bookingId, now, today,
                            (object?)additionalCharges ?? DBNull.Value,
                            (object?)request?.Notes ?? DBNull.Value,
                            receptionistId.Value
                        );
                    }
                    else
                    {
                        rowsAffected = await _context.Database.ExecuteSqlRawAsync(
                            @"UPDATE CheckInCheckOut 
                              SET check_out_time = {1}, 
                                  actual_check_out_date = {2}, 
                                  additional_charges = {3}, 
                                  notes = {4}
                              WHERE booking_id = {0}",
                            bookingId, now, today,
                            (object?)additionalCharges ?? DBNull.Value,
                            (object?)request?.Notes ?? DBNull.Value
                        );
                    }
                }
                
                // If no record exists, try to insert (but don't fail if it doesn't work)
                if (rowsAffected == 0)
                {
                    try
                    {
                        if (receptionistId.HasValue)
                        {
                            await _context.Database.ExecuteSqlRawAsync(
                                @"INSERT INTO CheckInCheckout (booking_id, receptionist_id, check_out_time, actual_check_out_date, additional_charges, notes, created_at)
                                  VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6})",
                                bookingId, receptionistId.Value, now, today,
                                (object?)additionalCharges ?? DBNull.Value,
                                (object?)request?.Notes ?? DBNull.Value, now
                            );
                        }
                        else
                        {
                            await _context.Database.ExecuteSqlRawAsync(
                                @"INSERT INTO CheckInCheckout (booking_id, check_out_time, actual_check_out_date, additional_charges, notes, created_at)
                                  VALUES ({0}, {1}, {2}, {3}, {4}, {5})",
                                bookingId, now, today,
                                (object?)additionalCharges ?? DBNull.Value,
                                (object?)request?.Notes ?? DBNull.Value, now
                            );
                        }
                        Console.WriteLine($"Successfully inserted CheckInCheckout record for booking {bookingId}");
                    }
                    catch
                    {
                        // Try alternative table name
                        if (receptionistId.HasValue)
                        {
                            await _context.Database.ExecuteSqlRawAsync(
                                @"INSERT INTO CheckInCheckOut (booking_id, receptionist_id, check_out_time, actual_check_out_date, additional_charges, notes, created_at)
                                  VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6})",
                                bookingId, receptionistId.Value, now, today,
                                (object?)additionalCharges ?? DBNull.Value,
                                (object?)request?.Notes ?? DBNull.Value, now
                            );
                        }
                        else
                        {
                            await _context.Database.ExecuteSqlRawAsync(
                                @"INSERT INTO CheckInCheckOut (booking_id, check_out_time, actual_check_out_date, additional_charges, notes, created_at)
                                  VALUES ({0}, {1}, {2}, {3}, {4}, {5})",
                                bookingId, now, today,
                                (object?)additionalCharges ?? DBNull.Value,
                                (object?)request?.Notes ?? DBNull.Value, now
                            );
                        }
                        Console.WriteLine($"Successfully inserted CheckInCheckOut record for booking {bookingId}");
                    }
                }
                else
                {
                    Console.WriteLine($"Successfully updated CheckInCheckout record for booking {bookingId}");
                }
            }
            catch (Exception sqlEx)
            {
                // Log but don't fail - CheckInCheckOut is optional logging
                Console.WriteLine($"Warning: Could not update CheckInCheckOut table (this is optional): {sqlEx.Message}");
            }

            return Ok(new { message = request?.Action == "cancel" ? "Booking cancelled successfully" : "Check-out successful. Room is now available.", booking });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error during check-out: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                Console.WriteLine($"Inner stack trace: {ex.InnerException.StackTrace}");
            }
            
            var errorMessage = "An error occurred while processing check-out. Please try again.";
            if (ex.InnerException != null)
            {
                errorMessage += $" Details: {ex.InnerException.Message}";
            }
            
            return StatusCode(500, new { error = errorMessage });
        }
    }

    public class CheckOutRequest
    {
        public string? Action { get; set; } // "checkout" or "cancel"
        public string? Notes { get; set; }
        public List<AdditionalCharge>? AdditionalCharges { get; set; }
    }
    
    public class AdditionalCharge
    {
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }

    [HttpGet("travel-bookings")]
    public async Task<IActionResult> GetTravelBookings()
    {
        var travelBookings = await _context.TravelBookings
            .Include(t => t.Customer)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                travelBookingId = t.TravelBookingId,
                customer = t.Customer != null ? new
                {
                    firstName = t.Customer.FirstName,
                    lastName = t.Customer.LastName,
                    email = t.Customer.Email,
                    phoneNumber = t.Customer.PhoneNumber
                } : null,
                attractionName = t.AttractionName,
                attractionType = t.AttractionType,
                travelDate = t.TravelDate,
                numberOfParticipants = t.NumberOfParticipants,
                bookingStatus = t.BookingStatus,
                paymentStatus = t.PaymentStatus,
                totalPrice = t.TotalPrice,
                createdAt = t.CreatedAt
            })
            .ToListAsync();

        return Ok(travelBookings);
    }

    [HttpPut("reservations/{bookingId:int}/status")]
    public async Task<IActionResult> UpdateReservationStatus(int bookingId, [FromBody] UpdateStatusRequest request)
    {
        var booking = await _context.Bookings.FindAsync(bookingId);
        if (booking == null) return NotFound();

        booking.BookingStatus = request.Status;
        await _context.SaveChangesAsync();

        return Ok(booking);
    }

    public record UpdateStatusRequest(string Status);
}


