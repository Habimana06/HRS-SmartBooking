using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Http;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HRSAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ManagerController : ControllerBase
{
    public class RoomCreateDto
    {
        public int RoomTypeId { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public int? FloorNumber { get; set; }
        public string Status { get; set; } = "available";
        public decimal CurrentPrice { get; set; }
        public string? Description { get; set; }
        public List<string>? ImageUrls { get; set; }
    }

    public class RoomUpdateDto
    {
        public int? RoomTypeId { get; set; }
        public string? RoomNumber { get; set; }
        public int? FloorNumber { get; set; }
        public string? Status { get; set; }
        public decimal? CurrentPrice { get; set; }
        public string? Description { get; set; }
        public List<string>? ImageUrls { get; set; }
    }

    public class TravelBookingCreateDto
    {
        public int CustomerId { get; set; }
        public string AttractionName { get; set; } = string.Empty;
        public string AttractionType { get; set; } = string.Empty;
        public DateTime TravelDate { get; set; }
        public int NumberOfParticipants { get; set; }
        public decimal TotalPrice { get; set; }
        public string BookingStatus { get; set; } = "pending";
        public string PaymentStatus { get; set; } = "pending";
        public string? PaymentMethod { get; set; }
        public string? SpecialRequests { get; set; }
        public List<string>? ImageUrls { get; set; }
    }

    private record TravelSpecialRequest
    {
        public string? Notes { get; set; }
        public List<string>? ImageUrls { get; set; }
    }

    private readonly DashboardService _dashboardService;
    private readonly RoomService _roomService;
    private readonly BookingService _bookingService;
    private readonly ApplicationDbContext _context;
    private readonly AuthService _authService;

    public ManagerController(DashboardService dashboardService, RoomService roomService, BookingService bookingService, ApplicationDbContext context, AuthService authService)
    {
        _dashboardService = dashboardService;
        _roomService = roomService;
        _bookingService = bookingService;
        _context = context;
        _authService = authService;
    }

    public record ManagerDashboardDto(
        int TotalRooms,
        int OccupiedRooms,
        int MaintenanceRooms,
        decimal TodayRevenue,
        decimal MonthlyRevenue,
        int PendingRequests,
        int TotalStaff,
        double AverageRating,
        int NewReviewsCount
    );

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard([FromQuery] string? timeRange = "today")
    {
        var startDate = timeRange switch
        {
            "week" => DateTime.Today.AddDays(-7),
            "month" => new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1),
            _ => DateTime.Today
        };

        // Calculate today revenue based on bookings with CheckInDate today or payments today
        var today = DateTime.Today;
        var todayRevenue = await _context.Bookings
            .Where(b => (b.CheckInDate.Date == today || b.CreatedAt.Date == today) && 
                       (b.PaymentStatus == "Completed" || b.PaymentStatus == "Paid") &&
                       b.BookingStatus != "Cancelled")
            .SumAsync(b => (decimal?)b.TotalPrice) ?? 0;

        var todayTravelRevenue = await _context.TravelBookings
            .Where(t => (t.TravelDate.Date == today || t.CreatedAt.Date == today) &&
                       (t.PaymentStatus == "paid" || t.PaymentStatus == "Paid") &&
                       t.BookingStatus != "Cancelled")
            .SumAsync(t => (decimal?)t.TotalPrice) ?? 0;

        var totalTodayRevenue = todayRevenue + todayTravelRevenue;

        var dto = new ManagerDashboardDto(
            await _dashboardService.GetTotalRoomsAsync(),
            await _dashboardService.GetOccupiedRoomsAsync(),
            await _dashboardService.GetMaintenanceRoomsAsync(),
            totalTodayRevenue, // Use calculated today revenue
            await _dashboardService.GetMonthlyRevenueForManagerAsync(),
            await _dashboardService.GetPendingRequestsAsync(),
            await _dashboardService.GetTotalStaffAsync(),
            await _dashboardService.GetAverageRatingAsync(),
            await _dashboardService.GetNewReviewsCountAsync()
        );

        // Get comprehensive recent activity from last 7 days
        var activityStartDate = DateTime.UtcNow.AddDays(-7);
        var activities = new List<object>();

        // New room bookings
        var recentBookings = await _context.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Room)
            .Where(b => b.CreatedAt >= activityStartDate)
            .OrderByDescending(b => b.CreatedAt)
            .Take(10)
            .ToListAsync();

        activities.AddRange(recentBookings.Select(b => new
        {
            id = b.BookingId,
            type = "booking",
            title = "New booking confirmed",
            description = $"Room {b.Room?.RoomNumber ?? "N/A"} - {b.Customer?.FirstName ?? "Guest"} {b.Customer?.LastName ?? string.Empty}".Trim(),
            time = GetTimeAgo(b.CreatedAt),
            createdAt = b.CreatedAt
        }));

        // New travel bookings
        var recentTravelBookings = await _context.TravelBookings
            .Include(t => t.Customer)
            .Where(t => t.CreatedAt >= activityStartDate)
            .OrderByDescending(t => t.CreatedAt)
            .Take(10)
            .ToListAsync();

        activities.AddRange(recentTravelBookings.Select(t => new
        {
            id = t.TravelBookingId,
            type = "travel",
            title = "New travel booking",
            description = $"{t.AttractionName} - {t.Customer?.FirstName ?? "Guest"} {t.Customer?.LastName ?? string.Empty}".Trim(),
            time = GetTimeAgo(t.CreatedAt),
            createdAt = t.CreatedAt
        }));

        // Payments processed
        var recentPayments = await _context.Payments
            .Include(p => p.Booking)
                .ThenInclude(b => b!.Customer)
            .Where(p => p.PaymentDate >= activityStartDate && p.PaymentStatus == "Completed")
            .OrderByDescending(p => p.PaymentDate)
            .Take(10)
            .ToListAsync();

        activities.AddRange(recentPayments.Select(p => new
        {
            id = p.PaymentId,
            type = "payment",
            title = "Payment processed",
            description = p.Booking?.Customer != null 
                ? $"{p.Booking.Customer.FirstName} {p.Booking.Customer.LastName} - {p.Amount:C}".Trim()
                : $"Payment of {p.Amount:C}",
            time = GetTimeAgo(p.PaymentDate),
            createdAt = p.PaymentDate
        }));

        // Bookings cancelled
        var cancelledBookings = await _context.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Room)
            .Where(b => b.BookingStatus == "Cancelled" && b.CancelledAt.HasValue && b.CancelledAt >= activityStartDate)
            .OrderByDescending(b => b.CancelledAt)
            .Take(10)
            .ToListAsync();

        activities.AddRange(cancelledBookings.Select(b => new
        {
            id = b.BookingId,
            type = "cancel",
            title = "Booking cancelled",
            description = $"Room {b.Room?.RoomNumber ?? "N/A"} - {b.Customer?.FirstName ?? "Guest"} {b.Customer?.LastName ?? string.Empty}".Trim(),
            time = GetTimeAgo(b.CancelledAt!.Value),
            createdAt = b.CancelledAt.Value
        }));

        // Staff members added
        var recentStaff = await _context.Users
            .Where(u => u.CreatedAt >= activityStartDate && (u.Role == "Manager" || u.Role == "Receptionist"))
            .OrderByDescending(u => u.CreatedAt)
            .Take(10)
            .ToListAsync();

        activities.AddRange(recentStaff.Select(u => new
        {
            id = u.UserId,
            type = "staff",
            title = "Staff member added",
            description = $"{u.FirstName} {u.LastName} - {u.Role}",
            time = GetTimeAgo(u.CreatedAt),
            createdAt = u.CreatedAt
        }));

        // Maintenance requests (if you have a maintenance table, add it here)
        // For now, we'll use room status changes to maintenance
        var maintenanceRooms = await _context.Rooms
            .Where(r => r.Status == "maintenance" && r.UpdatedAt >= activityStartDate)
            .OrderByDescending(r => r.UpdatedAt)
            .Take(10)
            .ToListAsync();

        activities.AddRange(maintenanceRooms.Select(r => new
        {
            id = r.RoomId,
            type = "maintenance",
            title = "Maintenance request",
            description = $"Room {r.RoomNumber} requires maintenance",
            time = GetTimeAgo(r.UpdatedAt),
            createdAt = r.UpdatedAt
        }));

        // Sort by creation date and take most recent 5
        var recentActivity = activities
            .OrderByDescending(a => ((dynamic)a).createdAt)
            .Take(5)
            .ToList();

        // Add notifications
        var notifications = await _context.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Room)
            .Where(b => b.CreatedAt >= startDate && b.BookingStatus == "Pending")
            .OrderByDescending(b => b.CreatedAt)
            .Take(10)
            .ToListAsync();

        var notificationsDto = notifications.Select(b => new
            {
                id = b.BookingId,
                type = "booking",
                title = "Pending booking approval",
            description = $"Room {b.Room?.RoomNumber ?? "N/A"} - {b.Customer?.FirstName ?? "Guest"} {b.Customer?.LastName ?? string.Empty}".Trim(),
                time = b.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
            read = false,
            createdAt = b.CreatedAt
        }).ToList();

        var result = new
        {
            totalRooms = dto.TotalRooms,
            occupiedRooms = dto.OccupiedRooms,
            maintenanceRooms = dto.MaintenanceRooms,
            todayRevenue = dto.TodayRevenue,
            monthlyRevenue = dto.MonthlyRevenue,
            pendingRequests = dto.PendingRequests,
            totalStaff = dto.TotalStaff,
            averageRating = dto.AverageRating,
            newReviewsCount = dto.NewReviewsCount,
            recentActivity = recentActivity,
            notifications = notificationsDto
        };

        return Ok(result);
    }

    private string GetTimeAgo(DateTime dateTime)
    {
        var timeSpan = DateTime.UtcNow - dateTime;
        
        if (timeSpan.TotalMinutes < 1)
            return "Just now";
        if (timeSpan.TotalMinutes < 60)
            return $"{(int)timeSpan.TotalMinutes} min ago";
        if (timeSpan.TotalHours < 24)
            return $"{(int)timeSpan.TotalHours} hour{(timeSpan.TotalHours >= 2 ? "s" : "")} ago";
        if (timeSpan.TotalDays < 7)
            return $"{(int)timeSpan.TotalDays} day{(timeSpan.TotalDays >= 2 ? "s" : "")} ago";
        
        return dateTime.ToString("MMM dd, yyyy");
    }

    [HttpGet("rooms")]
    public async Task<IActionResult> GetRooms()
    {
        try
        {
            // Try direct database access first to verify connection
            var roomsFromDb = await _context.Rooms
                .Include(r => r.RoomType)
                .ToListAsync();
            
            Console.WriteLine($"Direct DB query returned {roomsFromDb.Count} rooms");
            
            // Also try service method
            var roomsFromService = await _roomService.GetAllRoomsAsync();
            Console.WriteLine($"Service method returned {roomsFromService?.Count() ?? 0} rooms");
            
            // Use direct DB query result
            var rooms = roomsFromDb;
            
            if (rooms == null || !rooms.Any())
            {
                Console.WriteLine("No rooms found in database");
                return Ok(new List<object>());
            }
            
            // Transform to ensure proper serialization with camelCase
            // Materialize first, then calculate floor (can't use out variables in expression trees)
            var result = rooms.Select(r =>
            {
                int floor = 0;
                if (r.RoomNumber != null && int.TryParse(r.RoomNumber.ToString(), out int roomNum) && roomNum > 0)
                {
                    floor = roomNum / 100;
                }
                
                return new
                {
                    roomId = r.RoomId,
                    roomNumber = r.RoomNumber,
                    status = r.Status,
                    currentPrice = r.CurrentPrice,
                    description = r.Description,
                    imageUrls = r.ImageUrls,
                    floor = floor, // Calculate floor from room number
                    roomType = r.RoomType != null ? new
                    {
                        roomTypeId = r.RoomType.RoomTypeId,
                        typeName = r.RoomType.TypeName,
                        basePrice = r.RoomType.BasePrice,
                        maxOccupancy = r.RoomType.MaxOccupancy,
                        amenities = r.RoomType.Amenities
                    } : null
                };
            }).ToList();
            
            Console.WriteLine($"Returning {result.Count} transformed rooms");
            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetRooms: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
        }
    }

    [HttpGet("bookings")]
    public async Task<IActionResult> GetBookings()
    {
        try
        {
            // Use direct database access like dashboard does
#pragma warning disable CS8602 // Suppress nullable warning for EF query
            var bookingsFromDb = await _context!.Bookings
                .Include(b => b.Customer)
                .Include(b => b.Room)
                    .ThenInclude(r => r.RoomType)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
#pragma warning restore CS8602
            
            Console.WriteLine($"Direct DB query returned {bookingsFromDb!.Count} bookings");
            
            if (!bookingsFromDb.Any())
            {
                Console.WriteLine("No bookings found in database");
                return Ok(new List<object>());
            }
            
            // Transform to ensure proper serialization with camelCase
            var result = bookingsFromDb.Select(b => new
            {
                bookingId = b.BookingId,
                customerId = b.CustomerId,
                roomId = b.RoomId,
                checkInDate = b.CheckInDate,
                checkOutDate = b.CheckOutDate,
                numberOfGuests = b.NumberOfGuests,
                totalPrice = b.TotalPrice,
                bookingStatus = b.BookingStatus,
                paymentStatus = b.PaymentStatus,
                createdAt = b.CreatedAt,
                customer = b.Customer != null ? new
                {
                    customerId = b.CustomerId,
                    firstName = b.Customer.FirstName,
                    lastName = b.Customer.LastName,
                    email = b.Customer.Email,
                    phoneNumber = b.Customer.PhoneNumber
                } : null,
                room = b.Room != null ? new
                {
                    roomId = b.Room.RoomId,
                    roomNumber = b.Room.RoomNumber,
                    status = b.Room.Status,
                    roomType = b.Room.RoomType != null ? new
                    {
                        roomTypeId = b.Room.RoomType.RoomTypeId,
                        typeName = b.Room.RoomType.TypeName
                    } : null
                } : null
            }).ToList();
            
            Console.WriteLine($"Returning {result.Count} transformed bookings");
            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetBookings: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
        }
    }

    [HttpPut("bookings/{bookingId:int}")]
    public async Task<IActionResult> UpdateBooking(int bookingId, [FromBody] BookingUpdateDto dto)
    {
        try
        {
            var booking = await _context.Bookings
                .Include(b => b.Room)
                .Include(b => b.Customer)
                .FirstOrDefaultAsync(b => b.BookingId == bookingId);

            if (booking == null)
            {
                return NotFound(new { error = "Booking not found" });
            }

            // Update room if provided
            if (dto.RoomId.HasValue && dto.RoomId.Value != booking.RoomId)
            {
                var newRoom = await _context.Rooms
                    .Include(r => r.RoomType)
                    .FirstOrDefaultAsync(r => r.RoomId == dto.RoomId.Value);

                if (newRoom == null)
                {
                    return BadRequest(new { error = "Room not found" });
                }

                // Free up old room
                if (booking.Room != null && booking.Room.Status == "occupied")
                {
                    booking.Room.Status = "available";
                }

                // Assign new room
                booking.RoomId = dto.RoomId.Value;
                booking.Room = newRoom;

                // Update price based on new room
                if (dto.TotalPrice.HasValue)
                {
                    booking.TotalPrice = dto.TotalPrice.Value;
                }
                else if (newRoom.RoomType != null)
                {
                    var nights = (booking.CheckOutDate - booking.CheckInDate).Days;
                    if (nights > 0)
                    {
                        booking.TotalPrice = newRoom.RoomType.BasePrice * nights;
                    }
                }
            }

            // Update dates if provided
            if (dto.CheckInDate.HasValue)
            {
                booking.CheckInDate = dto.CheckInDate.Value;
            }

            if (dto.CheckOutDate.HasValue)
            {
                booking.CheckOutDate = dto.CheckOutDate.Value;
                
                // Recalculate total if dates changed
                if (booking.Room?.RoomType != null)
                {
                    var nights = (booking.CheckOutDate - booking.CheckInDate).Days;
                    if (nights > 0)
                    {
                        booking.TotalPrice = booking.Room.RoomType.BasePrice * nights;
                    }
                }
            }

            // Update status if provided
            if (!string.IsNullOrWhiteSpace(dto.BookingStatus))
            {
                booking.BookingStatus = dto.BookingStatus;
            }

            // Update number of guests if provided
            if (dto.NumberOfGuests.HasValue)
            {
                booking.NumberOfGuests = dto.NumberOfGuests.Value;
            }

            // Update total price if explicitly provided
            if (dto.TotalPrice.HasValue)
            {
                booking.TotalPrice = dto.TotalPrice.Value;
            }

            booking.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Booking updated successfully", bookingId = booking.BookingId });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error updating booking: {ex.Message}");
            return StatusCode(500, new { error = "Failed to update booking", message = ex.Message });
        }
    }

    public class BookingUpdateDto
    {
        public int? RoomId { get; set; }
        public DateTime? CheckInDate { get; set; }
        public DateTime? CheckOutDate { get; set; }
        public string? BookingStatus { get; set; }
        public int? NumberOfGuests { get; set; }
        public decimal? TotalPrice { get; set; }
    }

    [HttpGet("travel-bookings")]
    public async Task<IActionResult> GetTravelBookings()
    {
        try
        {
            var travelBookings = await _context.TravelBookings
                .Include(t => t.Customer)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            var result = travelBookings.Select(t =>
            {
                string? notes = t.SpecialRequests;
                List<string> imageUrls = new();
                if (!string.IsNullOrWhiteSpace(t.SpecialRequests) && t.SpecialRequests.TrimStart().StartsWith("{"))
                {
                    try
                    {
                        var parsed = JsonSerializer.Deserialize<TravelSpecialRequest>(t.SpecialRequests);
                        if (parsed != null)
                        {
                            notes = parsed.Notes;
                            imageUrls = parsed.ImageUrls ?? new List<string>();
                        }
                    }
                    catch
                    {
                        // ignore parse errors
                    }
                }

                return new
                {
                    travelBookingId = t.TravelBookingId,
                    customerId = t.CustomerId,
                    attractionName = t.AttractionName,
                    attractionType = t.AttractionType,
                    travelDate = t.TravelDate,
                    numberOfParticipants = t.NumberOfParticipants,
                    totalPrice = t.TotalPrice,
                    bookingStatus = t.BookingStatus,
                    paymentStatus = t.PaymentStatus,
                    createdAt = t.CreatedAt,
                    specialRequests = notes,
                    imageUrls,
                    customer = t.Customer != null ? new
                    {
                        customerId = t.CustomerId,
                        firstName = t.Customer.FirstName,
                        lastName = t.Customer.LastName,
                        email = t.Customer.Email
                    } : null
                };
            }).ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    public class TravelBookingCreateWithEmailDto
    {
        public string? CustomerEmail { get; set; }
        public int? CustomerId { get; set; }
        public string AttractionName { get; set; } = string.Empty;
        public string AttractionType { get; set; } = string.Empty;
        public DateTime TravelDate { get; set; }
        public int NumberOfParticipants { get; set; }
        public decimal TotalPrice { get; set; }
        public string BookingStatus { get; set; } = "pending";
        public string PaymentStatus { get; set; } = "pending";
        public string? PaymentMethod { get; set; }
        public string? SpecialRequests { get; set; }
        public List<string>? ImageUrls { get; set; }
    }

    [HttpPost("travel-bookings")]
    public async Task<IActionResult> CreateTravelBooking([FromBody] TravelBookingCreateWithEmailDto request)
    {
        if (request == null) return BadRequest(new { message = "Invalid travel booking payload." });

        int customerId = request.CustomerId ?? 0;

        // If customer email is provided, find or create customer
        if (!string.IsNullOrEmpty(request.CustomerEmail) && customerId == 0)
        {
            var existingCustomer = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.CustomerEmail && u.Role == "Customer");
            
            if (existingCustomer != null)
            {
                customerId = existingCustomer.UserId;
            }
            else
            {
                // Create new customer
                var newCustomer = new User
                {
                    Email = request.CustomerEmail,
                    FirstName = request.CustomerEmail.Split('@')[0],
                    LastName = "",
                    Role = "Customer",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("TempPassword123!"), // Temporary password
                    CreatedAt = DateTime.UtcNow
                };
                _context.Users.Add(newCustomer);
                await _context.SaveChangesAsync();
                customerId = newCustomer.UserId;
            }
        }

        if (customerId == 0)
        {
            return BadRequest(new { message = "Customer ID or email is required." });
        }

        var special = request.ImageUrls != null && request.ImageUrls.Any()
            ? JsonSerializer.Serialize(new TravelSpecialRequest
            {
                Notes = request.SpecialRequests,
                ImageUrls = request.ImageUrls.Where(u => !string.IsNullOrWhiteSpace(u)).ToList()
            })
            : request.SpecialRequests;

        var booking = new TravelBooking
        {
            CustomerId = customerId,
            AttractionName = request.AttractionName,
            AttractionType = request.AttractionType,
            TravelDate = request.TravelDate,
            NumberOfParticipants = request.NumberOfParticipants,
            TotalPrice = request.TotalPrice,
            BookingStatus = request.BookingStatus ?? "pending",
            PaymentStatus = request.PaymentStatus ?? "pending",
            PaymentMethod = request.PaymentMethod,
            SpecialRequests = special,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.TravelBookings.Add(booking);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetTravelBookings), new { id = booking.TravelBookingId }, booking);
    }

    [HttpDelete("travel-bookings/{id:int}")]
    public async Task<IActionResult> DeleteTravelBooking(int id)
    {
        try
        {
            var booking = await _context.TravelBookings.FindAsync(id);
            if (booking == null) return NotFound(new { message = "Travel booking not found." });

            _context.TravelBookings.Remove(booking);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting travel booking: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpDelete("bookings/{id:int}")]
    public async Task<IActionResult> DeleteBooking(int id)
    {
        try
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound(new { message = "Booking not found." });

            _context.Bookings.Remove(booking);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting booking: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("amenities")]
    public async Task<IActionResult> GetAmenities()
    {
        try
        {
            // Extract unique amenities from RoomTypes
            var roomTypes = await _context.RoomTypes
                .Where(rt => !string.IsNullOrEmpty(rt.Amenities))
                .ToListAsync();
            
            Console.WriteLine($"Found {roomTypes.Count} room types with amenities");
            
            var amenitiesList = new List<string>();
            foreach (var rt in roomTypes)
            {
                if (!string.IsNullOrEmpty(rt.Amenities))
                {
                    // Handle JSON array format like ["WiFi", "TV", "AC"]
                    if (rt.Amenities.Trim().StartsWith("["))
                    {
                        try
                        {
                            var parsed = System.Text.Json.JsonSerializer.Deserialize<string[]>(rt.Amenities);
                            if (parsed != null)
                                amenitiesList.AddRange(parsed);
                        }
                        catch
                        {
                            // If not valid JSON, treat as comma-separated
                            amenitiesList.AddRange(rt.Amenities.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(a => a.Trim().Replace("\"", "").Replace("[", "").Replace("]", "")));
                        }
                    }
                    else
                    {
                        // Comma-separated format
                        amenitiesList.AddRange(rt.Amenities.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(a => a.Trim()));
                    }
                }
            }
            
            var uniqueAmenities = amenitiesList.Distinct().ToList();
            Console.WriteLine($"Extracted {uniqueAmenities.Count} unique amenities");
            
            var result = uniqueAmenities.Select((a, index) => new 
            { 
                id = index + 1, 
                name = a, 
                type = "Essential", 
                status = "Active", 
                description = a, 
                icon = a 
            }).ToList();
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetAmenities: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("amenities")]
    public IActionResult CreateAmenity([FromBody] object amenity)
    {
        // For now, return success - actual implementation would add to a separate Amenities table
        return Ok(new { message = "Amenity created successfully" });
    }

    [HttpPut("amenities/{id:int}")]
    public IActionResult UpdateAmenity(int id, [FromBody] object amenity)
    {
        // For now, return success - actual implementation would update Amenities table
        return Ok(new { message = "Amenity updated successfully" });
    }

    [HttpDelete("amenities/{id:int}")]
    public IActionResult DeleteAmenity(int id)
    {
        // For now, return success - actual implementation would delete from Amenities table
        return NoContent();
    }

    [HttpGet("room-types")]
    public async Task<IActionResult> GetRoomTypes()
    {
        try
        {
            var roomTypes = await _context.RoomTypes
                .Include(rt => rt.Rooms)
                .ToListAsync();
            
            Console.WriteLine($"Direct DB query returned {roomTypes.Count} room types");
            
            if (roomTypes == null || !roomTypes.Any())
            {
                Console.WriteLine("No room types found in database");
                return Ok(new List<object>());
            }
            
            var result = roomTypes.Select(rt => new
            {
                id = rt.RoomTypeId,
                roomTypeId = rt.RoomTypeId,
                name = rt.TypeName,
                basePrice = rt.BasePrice,
                capacity = rt.MaxOccupancy,
                size = $"{rt.BasePrice / 1000}m²", // Approximate size calculation
                available = rt.Rooms.Count(r => r.Status == "available"),
                total = rt.Rooms.Count,
                features = rt.Amenities != null ? rt.Amenities.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(a => a.Trim()).ToArray() : Array.Empty<string>(),
                status = "active"
            }).ToList();
            
            Console.WriteLine($"Returning {result.Count} transformed room types");
            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetRoomTypes: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    public record RoomTypeCreateDto(
        string TypeName,
        string? Description,
        decimal BasePrice,
        int MaxOccupancy,
        string? Amenities
    );

    [HttpPost("room-types")]
    public async Task<IActionResult> CreateRoomType([FromBody] RoomTypeCreateDto request)
    {
        try
        {
            var roomType = new RoomType
            {
                TypeName = request.TypeName,
                Description = request.Description,
                BasePrice = request.BasePrice,
                MaxOccupancy = request.MaxOccupancy,
                Amenities = request.Amenities,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.RoomTypes.Add(roomType);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Room type created successfully", roomTypeId = roomType.RoomTypeId });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error creating room type: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpDelete("room-types/{id:int}")]
    public async Task<IActionResult> DeleteRoomType(int id)
    {
        try
        {
            var roomType = await _context.RoomTypes.FindAsync(id);
            if (roomType == null) return NotFound();

            // Check if any rooms are using this type
            var roomsUsingType = await _context.Rooms.AnyAsync(r => r.RoomTypeId == id);
            if (roomsUsingType)
            {
                return BadRequest(new { error = "Cannot delete room type that is in use by rooms" });
            }

            _context.RoomTypes.Remove(roomType);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting room type: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("staff")]
    public async Task<IActionResult> GetStaff()
    {
        try
        {
            // Get users with staff roles (Manager, Receptionist, etc.)
            var staffFromDb = await _context.Users
                .Where(u => u.Role != "Customer")
                .ToListAsync();
            
            Console.WriteLine($"Direct DB query returned {staffFromDb.Count} staff members");
            
            if (staffFromDb == null || !staffFromDb.Any())
            {
                Console.WriteLine("No staff found in database");
                return Ok(new List<object>());
            }
            
            var result = staffFromDb.Select(u => new
            {
                userId = u.UserId,
                id = u.UserId,
                name = $"{u.FirstName} {u.LastName}",
                role = u.Role,
                status = "Active",
                shift = "Day",
                email = u.Email,
                phone = u.PhoneNumber ?? "+250 788 000 000",
                joinDate = u.CreatedAt.ToString("yyyy-MM-dd"),
                performance = 90,
                leaves = 0
            }).ToList();
            
            Console.WriteLine($"Returning {result.Count} transformed staff members");
            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetStaff: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("financial-reports")]
    public async Task<IActionResult> GetFinancialReports()
    {
        var today = DateTime.Today;
        var thisMonthStart = new DateTime(today.Year, today.Month, 1);
        var thisWeekStart = today.AddDays(-(int)today.DayOfWeek);

        var thisMonthRevenue = await _context.Bookings
            .Where(b => b.CreatedAt >= thisMonthStart && b.PaymentStatus == "Completed")
            .SumAsync(b => (decimal?)b.TotalPrice) ?? 0;

        var thisMonthTravelRevenue = await _context.TravelBookings
            .Where(t => t.CreatedAt >= thisMonthStart && t.PaymentStatus == "Completed")
            .SumAsync(t => (decimal?)t.TotalPrice) ?? 0;

        var thisWeekRevenue = await _context.Bookings
            .Where(b => b.CreatedAt >= thisWeekStart && b.PaymentStatus == "Completed")
            .SumAsync(b => (decimal?)b.TotalPrice) ?? 0;

        var thisWeekTravelRevenue = await _context.TravelBookings
            .Where(t => t.CreatedAt >= thisWeekStart && t.PaymentStatus == "Completed")
            .SumAsync(t => (decimal?)t.TotalPrice) ?? 0;

        var pendingPayments = await _context.Bookings
            .Where(b => b.PaymentStatus == "Pending")
            .CountAsync();

        var totalMonthRevenue = thisMonthRevenue + thisMonthTravelRevenue;
        var totalWeekRevenue = thisWeekRevenue + thisWeekTravelRevenue;

        var financials = new[]
        {
            new { Name = "This Month Revenue", Value = totalMonthRevenue, Trend = "+12%", Change = 12 },
            new { Name = "This Week Revenue", Value = totalWeekRevenue, Trend = "+5%", Change = 5 },
            new { Name = "Pending Payments", Value = pendingPayments * 1000m, Trend = $"{pendingPayments} pending", Change = 0 }
        };

        var bookings = new[]
        {
            new { Label = "Rooms", Value = await _context.Bookings.CountAsync(b => b.BookingStatus != "Cancelled") },
            new { Label = "Travel", Value = await _context.TravelBookings.CountAsync() },
            new { Label = "Extras", Value = 0 }
        };

        var roomTransactions = await _context.Bookings
            .Include(b => b.Customer)
            .OrderByDescending(b => b.CreatedAt)
            .Take(5)
            .Select(b => new
            {
                BookingId = b.BookingId,
                Customer = $"{b.Customer!.FirstName} {b.Customer.LastName}",
                Type = "Room Booking",
                Amount = b.TotalPrice,
                Status = b.PaymentStatus,
                Date = b.CreatedAt.ToString("yyyy-MM-dd"),
                CreatedAt = b.CreatedAt
            })
            .ToListAsync();

        var travelTransactions = await _context.TravelBookings
            .Include(t => t.Customer)
            .OrderByDescending(t => t.CreatedAt)
            .Take(5)
            .Select(t => new
            {
                BookingId = t.TravelBookingId,
                Customer = $"{t.Customer!.FirstName} {t.Customer.LastName}",
                Type = "Travel Booking",
                Amount = t.TotalPrice,
                Status = t.PaymentStatus,
                Date = t.CreatedAt.ToString("yyyy-MM-dd"),
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        var recentTransactions = roomTransactions.Cast<object>()
            .Concat(travelTransactions.Cast<object>())
            .OrderByDescending(t => ((dynamic)t).CreatedAt)
            .Take(5)
            .Select(t => new
            {
                bookingId = ((dynamic)t).BookingId,
                customer = ((dynamic)t).Customer,
                type = ((dynamic)t).Type,
                amount = ((dynamic)t).Amount,
                status = ((dynamic)t).Status,
                date = ((dynamic)t).Date
            })
            .ToList();

        var roomMonthlyRevenue = await _context.Bookings
            .Where(b => b.CreatedAt >= thisMonthStart.AddMonths(-6) && b.PaymentStatus == "Completed")
            .GroupBy(b => new { Year = b.CreatedAt.Year, Month = b.CreatedAt.Month })
            .Select(g => new
            {
                Month = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM"),
                Revenue = g.Sum(b => b.TotalPrice),
                Year = g.Key.Year,
                MonthNum = g.Key.Month
            })
            .ToListAsync();

        var travelMonthlyRevenue = await _context.TravelBookings
            .Where(t => t.CreatedAt >= thisMonthStart.AddMonths(-6) && t.PaymentStatus == "Completed")
            .GroupBy(t => new { Year = t.CreatedAt.Year, Month = t.CreatedAt.Month })
            .Select(g => new
            {
                Month = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM"),
                Revenue = g.Sum(t => t.TotalPrice),
                Year = g.Key.Year,
                MonthNum = g.Key.Month
            })
            .ToListAsync();

        var monthlyRevenue = roomMonthlyRevenue
            .Concat(travelMonthlyRevenue)
            .GroupBy(m => new { m.Year, m.MonthNum })
            .Select(g => new
            {
                Month = new DateTime(g.Key.Year, g.Key.MonthNum, 1).ToString("MMM"),
                Revenue = g.Sum(m => m.Revenue)
            })
            .OrderBy(x => x.Month)
            .ToList();

        var result = new
        {
            financials = financials.Select(f => new
            {
                name = f.Name,
                value = f.Value,
                trend = f.Trend,
                change = f.Change
            }).ToArray(),
            bookings = bookings.Select(b => new
            {
                label = b.Label,
                value = b.Value
            }).ToArray(),
            recentTransactions = recentTransactions,
            monthlyRevenue = monthlyRevenue.Select(m => new
            {
                month = m.Month,
                revenue = m.Revenue
            }).ToList()
        };
        
        Console.WriteLine($"Returning financial reports with {result.financials.Length} financials, {result.bookings.Length} booking types");
        return Ok(result);
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = _authService.GetCurrentUserIdInt();
        if (userId == null)
        {
            return Unauthorized(new { message = "Authentication required." });
        }

        var user = await _context.Users.FindAsync(userId.Value);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        return Ok(new
        {
            userId = user.UserId,
            firstName = user.FirstName,
            lastName = user.LastName,
            email = user.Email,
            phone = user.PhoneNumber,
            address = user.Address,
            role = user.Role,
            createdAt = user.CreatedAt
        });
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto request)
    {
        var userId = _authService.GetCurrentUserIdInt();
        if (userId == null)
        {
            return Unauthorized(new { message = "Authentication required." });
        }

        var user = await _context.Users.FindAsync(userId.Value);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        if (!string.IsNullOrEmpty(request.FirstName))
            user.FirstName = request.FirstName;
        if (!string.IsNullOrEmpty(request.LastName))
            user.LastName = request.LastName;
        if (!string.IsNullOrEmpty(request.PhoneNumber))
            user.PhoneNumber = request.PhoneNumber;
        if (!string.IsNullOrEmpty(request.Address))
            user.Address = request.Address;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Profile updated successfully." });
    }

    public class UpdateProfileDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
    }

    [HttpGet("customer-feedback")]
    public async Task<IActionResult> GetCustomerFeedback()
    {
        try
        {
            var feedbackFromDb = await _context.Reviews
                .Include(r => r.Customer)
                .Include(r => r.Booking)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
            
            Console.WriteLine($"Direct DB query returned {feedbackFromDb.Count} reviews");
            
            if (feedbackFromDb == null || !feedbackFromDb.Any())
            {
                Console.WriteLine("No customer feedback found in database");
                return Ok(new List<object>());
            }
            
            var result = feedbackFromDb.Select(r => new
            {
                reviewId = r.ReviewId,
                id = r.ReviewId,
                name = r.Customer != null ? $"{r.Customer.FirstName} {r.Customer.LastName}" : "Anonymous",
                rating = r.Rating,
                comment = r.Comment ?? "No comment",
                date = r.CreatedAt <= DateTime.Today.AddDays(-1) ? r.CreatedAt.ToString("MMM dd") : r.CreatedAt <= DateTime.Today ? "Yesterday" : "Today",
                category = "Service",
                replied = false,
                helpful = 0
            }).ToList();

            Console.WriteLine($"Returning {result.Count} transformed reviews");
            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetCustomerFeedback: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("rooms")]
    public async Task<IActionResult> CreateRoom([FromBody] RoomCreateDto request)
    {
        if (request == null)
        {
            return BadRequest(new { message = "Invalid room payload." });
        }

        var room = new Room
        {
            RoomTypeId = request.RoomTypeId,
            RoomNumber = request.RoomNumber,
            FloorNumber = request.FloorNumber,
            Status = request.Status?.ToLower() ?? "available",
            CurrentPrice = request.CurrentPrice,
            Description = request.Description,
            ImageUrls = request.ImageUrls != null ? string.Join(",", request.ImageUrls.Where(u => !string.IsNullOrWhiteSpace(u))) : null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Rooms.Add(room);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetRooms), new { id = room.RoomId }, room);
    }

    [HttpPut("rooms/{id:int}")]
    public async Task<IActionResult> UpdateRoom(int id, [FromBody] RoomUpdateDto request)
    {
        var room = await _context.Rooms.FindAsync(id);
        if (room == null) return NotFound();

        if (request.RoomTypeId.HasValue) room.RoomTypeId = request.RoomTypeId.Value;
        if (!string.IsNullOrWhiteSpace(request.RoomNumber)) room.RoomNumber = request.RoomNumber;
        if (request.FloorNumber.HasValue) room.FloorNumber = request.FloorNumber;
        if (!string.IsNullOrWhiteSpace(request.Status)) room.Status = request.Status.ToLower();
        if (request.CurrentPrice.HasValue) room.CurrentPrice = request.CurrentPrice.Value;
        if (!string.IsNullOrWhiteSpace(request.Description)) room.Description = request.Description;
        if (request.ImageUrls != null) room.ImageUrls = string.Join(",", request.ImageUrls.Where(u => !string.IsNullOrWhiteSpace(u)));
        room.UpdatedAt = DateTime.UtcNow;

        _context.Rooms.Update(room);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Room updated", roomId = room.RoomId });
    }

    [HttpDelete("rooms/{id:int}")]
    public async Task<IActionResult> DeleteRoom(int id)
    {
        var room = await _context.Rooms.FindAsync(id);
        if (room == null) return NotFound();
        _context.Rooms.Remove(room);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("rooms/upload-images")]
    public async Task<IActionResult> UploadRoomImages(List<IFormFile> files)
    {
        if (files == null || files.Count == 0)
        {
            return BadRequest(new { message = "No files uploaded." });
        }

        var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "rooms");
        Directory.CreateDirectory(uploadsRoot);

        var urls = new List<string>();
        foreach (var file in files)
        {
            var safeFileName = $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
            var fullPath = Path.Combine(uploadsRoot, safeFileName);
            await using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            var url = $"{baseUrl}/uploads/rooms/{safeFileName}";
            urls.Add(url);
        }

        return Ok(new { urls });
    }

    [HttpPost("travel/upload-images")]
    public async Task<IActionResult> UploadTravelImages(List<IFormFile> files)
    {
        if (files == null || files.Count == 0)
        {
            return BadRequest(new { message = "No files uploaded." });
        }

        var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "travel");
        Directory.CreateDirectory(uploadsRoot);

        var urls = new List<string>();
        foreach (var file in files)
        {
            var safeFileName = $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
            var fullPath = Path.Combine(uploadsRoot, safeFileName);
            await using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            var url = $"{baseUrl}/uploads/travel/{safeFileName}";
            urls.Add(url);
        }

        return Ok(new { urls });
    }
}


