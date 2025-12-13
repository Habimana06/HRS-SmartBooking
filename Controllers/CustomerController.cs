using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using Npgsql;


namespace HRSAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomerController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly CurrencyHelper _currencyHelper;
    private readonly AuthService _authService;
    private readonly SmtpEmailSender _emailSender;

    public class CancelBookingRequest
    {
        public string? Reason { get; set; }
    }

    public CustomerController(ApplicationDbContext context, CurrencyHelper currencyHelper, AuthService authService, SmtpEmailSender emailSender)
    {
        _context = context;
        _currencyHelper = currencyHelper;
        _authService = authService;
        _emailSender = emailSender;
    }

    #region Home

    public record RoomHighlightDto(
        int RoomId,
        string Name,
        string Price,
        string Tag,
        string Description,
        string Capacity,
        string ImageUrl
    );

    public record DestinationSpotDto(string Location, string Detail);

    public record ReviewHighlightDto(string Name, string Title, int Rating, string Quote);

    public record WhyUsCardDto(string Title, string Description);

    public record HomeResponseDto(
        List<RoomHighlightDto> FeaturedRooms,
        List<string> AmenityHighlights,
        List<DestinationSpotDto> Destinations,
        List<ReviewHighlightDto> Reviews,
        List<WhyUsCardDto> WhyUs,
        List<string> RoomTypes
    );

    [HttpGet("home")]
    public async Task<IActionResult> GetHome()
    {
        var rooms = await _context.Rooms
            .Include(r => r.RoomType)
            .Where(r => r.Status == "available")
            .OrderByDescending(r => r.CurrentPrice)
            .Take(4)
            .ToListAsync();

        var currency = await _currencyHelper.GetCurrencyAsync() ?? "USD";
        var featuredRooms = rooms.Select(r => new RoomHighlightDto(
            r.RoomId,
            r.RoomType?.TypeName ?? "Room",
            _currencyHelper.FormatPrice(r.CurrentPrice, currency),
            r.Status == "available" ? "Available" : "Unavailable",
            r.Description ?? r.RoomType?.Description ?? "Comfortable room",
            $"{r.RoomType?.MaxOccupancy ?? 2} Guests",
            !string.IsNullOrEmpty(r.ImageUrls)
                ? r.ImageUrls.Split(',', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()?.Trim()
                    ?? "https://images.unsplash.com/photo-1501117716987-c8e1ecb210cc?auto=format&fit=crop&w=900&q=80"
                : "https://images.unsplash.com/photo-1501117716987-c8e1ecb210cc?auto=format&fit=crop&w=900&q=80"
        )).ToList();

        var allAmenities = await _context.RoomTypes
            .Where(rt => !string.IsNullOrEmpty(rt.Amenities))
            .Select(rt => rt.Amenities)
            .ToListAsync();

        var uniqueAmenities = allAmenities
            .SelectMany(a => (a ?? string.Empty).Split(',', StringSplitOptions.RemoveEmptyEntries))
            .Select(a => a.Trim())
            .Distinct()
            .Take(8)
            .ToList();

        var amenityHighlights = uniqueAmenities.Any()
            ? uniqueAmenities
            : new List<string>
            {
                "Free Wi-Fi", "Breakfast", "Pool", "Spa", "Gym", "24/7 Reception", "Restaurant", "Concierge"
            };

        var destinations = new List<DestinationSpotDto>
        {
            new("Premium Rooms", "Luxury accommodations • Premium service"),
            new("Standard Rooms", "Comfortable stay • Great value"),
            new("Deluxe Suites", "Spacious suites • Extra amenities"),
            new("Executive Rooms", "Business class • Professional service")
        };

        var reviews = await _context.Reviews
            .Include(r => r.Customer)
            .OrderByDescending(r => r.CreatedAt)
            .Take(3)
            .ToListAsync();

        var reviewHighlights = reviews.Select(r => new ReviewHighlightDto(
            $"{r.Customer?.FirstName ?? "Guest"} {r.Customer?.LastName ?? ""}".Trim(),
            "Customer",
            r.Rating,
            r.Comment ?? "Great experience!"
        )).ToList();

        if (!reviewHighlights.Any())
        {
            reviewHighlights = new List<ReviewHighlightDto>
            {
                new("Guest", "Customer", 5, "Excellent service and comfortable rooms."),
                new("Guest", "Customer", 5, "Great experience, highly recommended."),
                new("Guest", "Customer", 4, "Nice stay, will come again.")
            };
        }

        var whyUs = new List<WhyUsCardDto>
        {
            new("Safety Protocols", "Digital keys, live monitoring, and on-demand support."),
            new("Comfort Layers", "Premium linens, mood lighting, adaptive climate."),
            new("Affordable Luxury", "Members unlock curated offers each week."),
            new("Velocity Booking", "3-step booking with saved preferences."),
            new("Clean Guarantee", "Medical-grade sanitization every stay."),
            new("Human Concierge", "Live experts in under 30 seconds.")
        };

        var roomTypes = await _context.RoomTypes
            .Where(rt => !string.IsNullOrEmpty(rt.TypeName))
            .Select(rt => rt.TypeName)
            .Distinct()
            .OrderBy(rt => rt)
            .ToListAsync();

        var response = new HomeResponseDto(
            featuredRooms,
            amenityHighlights,
            destinations,
            reviewHighlights,
            whyUs,
            roomTypes
        );

        return Ok(response);
    }

    #endregion

    #region Profile

    public record UpdateProfileRequest(
        string FirstName,
        string LastName,
        string Email,
        string? PhoneNumber,
        string? CurrentPassword,
        string? NewPassword
    );

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = _authService.GetCurrentUserIdInt();
        if (userId == null)
        {
            return Unauthorized(new { message = "Not signed in." });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId.Value);
        if (user == null) return Unauthorized(new { message = "User not found." });

        // Basic validation
        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName) || string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { message = "First name, last name, and email are required." });
        }

        // Handle password change if provided
        if (!string.IsNullOrWhiteSpace(request.NewPassword))
        {
            if (string.IsNullOrWhiteSpace(request.CurrentPassword))
            {
                return BadRequest(new { message = "Current password is required to change password." });
            }

            var valid = BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash);
            if (!valid)
            {
                return BadRequest(new { message = "Current password is incorrect." });
            }

            if (request.NewPassword.Length < 6)
            {
                return BadRequest(new { message = "New password must be at least 6 characters." });
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        }

        // Update profile fields
        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.Email = request.Email.Trim();
        user.PhoneNumber = request.PhoneNumber?.Trim();
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Refresh session
        _authService.SetUserSession(user);

        return Ok(new
        {
            userId = user.UserId,
            firstName = user.FirstName,
            lastName = user.LastName,
            email = user.Email,
            phoneNumber = user.PhoneNumber,
            role = user.Role
        });
    }

    #endregion

    #region MyBookings

    public record BookingCardDto(
        int BookingId,
        string RoomType,
        string RoomNumber,
        string CheckInDate,
        string CheckOutDate,
        int NumberOfGuests,
        string TotalPrice,
        string PaymentMethod,
        string PaymentStatus,
        string BookingStatus,
        string QrCode,
        string RoomKey);

    public record TravelBookingCardDto(
        int TravelBookingId,
        string AttractionName,
        string AttractionType,
        string TravelDate,
        int NumberOfParticipants,
        string TotalPrice,
        string PaymentMethod,
        string PaymentStatus,
        string BookingStatus,
        bool RefundRequested,
        bool? RefundApproved,
        DateTime? RefundProcessedAt,
        List<string>? ImageUrls);

    public record MyBookingsResponseDto(
        List<BookingCardDto> Bookings,
        List<TravelBookingCardDto> TravelBookings,
        string Currency);

    public record BookRoomDto(
        int RoomId,
        DateTime CheckInDate,
        DateTime CheckOutDate,
        int NumberOfGuests,
        string PaymentMethod,
        string? SpecialRequests
    );

    [HttpGet("my-bookings")]
    public async Task<IActionResult> GetMyBookings()
    {
        var userId = _authService.GetCurrentUserIdInt();

        var currency = await _currencyHelper.GetCurrencyAsync();

        IQueryable<Booking> bookingsQuery = _context.Bookings
            .Include(b => b.Room)
                .ThenInclude(r => r!.RoomType)
            .Include(b => b.Payments);

        if (userId != null)
        {
            bookingsQuery = bookingsQuery.Where(b => b.CustomerId == userId.Value);
        }

        var bookings = await bookingsQuery
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        IQueryable<TravelBooking> travelQuery = _context.TravelBookings;

        if (userId != null)
        {
            travelQuery = travelQuery.Where(t => t.CustomerId == userId.Value);
        }

        var travelBookings = await travelQuery
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        // REMOVED: Fallback that showed all bookings to all users
        // This was a security/privacy issue - users should only see their own bookings
        // If they have no bookings, return empty arrays

        var bookingCards = bookings.Select(b =>
        {
            var payment = b.Payments.FirstOrDefault();
            var roomKey = GenerateRoomKey(b.BookingId, b.RoomId, b.CheckInDate);

            return new BookingCardDto(
                b.BookingId,
                b.Room?.RoomType?.TypeName ?? "Room",
                b.Room?.RoomNumber ?? "N/A",
                b.CheckInDate.ToString("yyyy-MM-dd"),
                b.CheckOutDate.ToString("yyyy-MM-dd"),
                b.NumberOfGuests,
                _currencyHelper.FormatPrice(b.TotalPrice, currency),
                payment?.PaymentMethod ?? b.PaymentMethod ?? "N/A",
                payment?.PaymentStatus ?? b.PaymentStatus ?? "N/A",
                b.BookingStatus,
                b.QrCode ?? $"BOOKING-{b.BookingId}",
                roomKey
            );
        }).ToList();

        var travelBookingCards = travelBookings.Select(t =>
        {
            // Parse imageUrls from SpecialRequests if it's JSON
            List<string>? imageUrls = null;
            if (!string.IsNullOrWhiteSpace(t.SpecialRequests))
            {
                try
                {
                    // Try to parse as JSON object with imageUrls property
                    using var doc = System.Text.Json.JsonDocument.Parse(t.SpecialRequests);
                    if (doc.RootElement.TryGetProperty("imageUrls", out var imageUrlsElement))
                    {
                        imageUrls = imageUrlsElement.EnumerateArray()
                            .Select(e => e.GetString() ?? string.Empty)
                            .Where(s => !string.IsNullOrWhiteSpace(s))
                            .ToList();
                    }
                }
                catch
                {
                    // If parsing fails, treat as plain text (no images)
                    imageUrls = null;
                }
            }

            return new TravelBookingCardDto(
                t.TravelBookingId,
                t.AttractionName,
                t.AttractionType,
                t.TravelDate.ToString("yyyy-MM-dd"),
                t.NumberOfParticipants,
                _currencyHelper.FormatPrice(t.TotalPrice, currency),
                t.PaymentMethod ?? "N/A",
                t.PaymentStatus,
                t.BookingStatus,
                t.RefundRequested,
                t.RefundApproved,
                t.RefundProcessedAt,
                imageUrls
            );
        }).ToList();

        var response = new MyBookingsResponseDto(bookingCards, travelBookingCards, currency);

        return Ok(response);
    }

    private string GenerateRoomKey(int bookingId, int roomId, DateTime checkInDate)
    {
        var keyData = $"{bookingId}-{roomId}-{checkInDate:yyyyMMdd}";
        var hash = keyData.GetHashCode();
        return $"KEY-{Math.Abs(hash).ToString("D8")}";
    }

    #endregion

    #region Feedback

    [HttpPost("feedback")]
    public async Task<IActionResult> SubmitFeedback([FromBody] FeedbackRequestDto request)
    {
        try
        {
            var userId = _authService.GetCurrentUserIdInt();
            var customer = userId.HasValue
                ? await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId.Value)
                : null;

            if (customer == null)
            {
                return Unauthorized(new { message = "Please sign in to submit feedback." });
            }

            // Attach feedback to an existing booking if none is provided (fallback to most recent)
            var bookingId = request.BookingId ?? await _context.Bookings
                .Where(b => b.CustomerId == customer.UserId)
                .OrderByDescending(b => b.CreatedAt)
                .Select(b => b.BookingId)
                .FirstOrDefaultAsync();

            if (bookingId == 0)
            {
                return BadRequest(new { message = "No booking found to attach this feedback." });
            }

            var review = new Review
            {
                CustomerId = customer.UserId,
                BookingId = bookingId,
                Rating = request.Rating,
                Comment = request.Comment,
                CreatedAt = DateTime.UtcNow
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            Console.WriteLine($"Feedback submitted: Rating={request.Rating}, Category={request.Category}");

            return Ok(new { message = "Feedback submitted successfully", reviewId = review.ReviewId });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error submitting feedback: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    public record FeedbackRequestDto(
        int Rating,
        string Comment,
        string Category,
        int? BookingId,
        string? CustomerName,
        string? CustomerEmail
    );

    #endregion

    #region Travel Refunds

    public record RefundRequestDto(int TravelBookingId, string? Reason);

    [HttpPost("travel/refund")]
    public async Task<IActionResult> RequestTravelRefund([FromBody] RefundRequestDto dto)
    {
        var userId = _authService.GetCurrentUserIdInt();
        if (userId == null)
        {
            return Unauthorized();
        }

        var travel = await _context.TravelBookings.FirstOrDefaultAsync(t => t.TravelBookingId == dto.TravelBookingId && t.CustomerId == userId.Value);
        if (travel == null) return NotFound(new { message = "Travel booking not found" });

        var daysUntilTravel = (travel.TravelDate.Date - DateTime.Today).TotalDays;
        if (daysUntilTravel < 2)
        {
            return BadRequest(new { message = "Refunds are only allowed 2 days before travel date" });
        }

        travel.RefundRequested = true;
        travel.RefundRequestedAt = DateTime.Now;
        travel.SpecialRequests = dto.Reason;
        travel.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Refund requested. We will review within 24h." });
    }

    [HttpPost("cancel-booking/{bookingId:int}")]
    public async Task<IActionResult> CancelBooking(int bookingId, [FromBody] CancelBookingRequest? request = null)
    {
        var userId = _authService.GetCurrentUserIdInt();
        if (userId == null)
        {
            return Unauthorized();
        }

        var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.BookingId == bookingId && b.CustomerId == userId.Value);
        if (booking == null)
        {
            return NotFound(new { message = "Booking not found." });
        }

        if (booking.BookingStatus == "Cancelled")
        {
            return BadRequest(new { message = "Booking is already cancelled." });
        }

        // Store the customer's reason and mark the booking as pending cancellation until staff responds
        booking.RefundRequested = true;
        booking.RefundRequestedAt = DateTime.UtcNow;
        booking.CancellationReason = request?.Reason ?? "Customer requested cancellation";
        booking.CancelledAt = null; // leave status unchanged; receptionist will approve/decline
        // Note: BookingStatus remains as is, but refund status will show as "Pending" in refund requests

        await _context.SaveChangesAsync();

        return Ok(new { message = "Cancellation requested. The team will review and process your refund." });
    }

    #endregion

    #region Travel Booking

    [HttpPost("book-room")]
    public async Task<IActionResult> BookRoom([FromBody] BookRoomDto request)
    {
        try
        {
            Console.WriteLine($"BookRoom called with: RoomId={request.RoomId}, CheckIn={request.CheckInDate}, CheckOut={request.CheckOutDate}, Guests={request.NumberOfGuests}");
            
            var userId = _authService.GetCurrentUserIdInt();
            if (userId == null)
            {
                Console.WriteLine("BookRoom: User not authenticated");
                return Unauthorized(new { message = "Please sign in to book a room." });
            }

            Console.WriteLine($"BookRoom: User authenticated, UserId={userId.Value}");
            var customer = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId.Value);

            if (request.CheckOutDate <= request.CheckInDate)
            {
                Console.WriteLine($"BookRoom: Invalid dates - CheckOut ({request.CheckOutDate}) <= CheckIn ({request.CheckInDate})");
                return BadRequest(new { message = "Check-out must be after check-in." });
            }

            var room = await _context.Rooms.Include(r => r.RoomType).FirstOrDefaultAsync(r => r.RoomId == request.RoomId);
            if (room == null)
            {
                return NotFound(new { message = "Room not found." });
            }

            // Check if room is available for the requested dates
            var conflictingBookings = await _context.Bookings
                .Where(b => b.RoomId == request.RoomId 
                    && b.BookingStatus != "Cancelled" 
                    && b.BookingStatus != "Checked-out"
                    && b.BookingStatus != "Checked-Out"
                    && b.CheckOutDate > request.CheckInDate 
                    && b.CheckInDate < request.CheckOutDate)
                .AnyAsync();

            if (conflictingBookings)
            {
                return BadRequest(new { message = "Room is not available for the selected dates. Please choose different dates or another room." });
            }

            var nights = (int)Math.Ceiling((request.CheckOutDate.Date - request.CheckInDate.Date).TotalDays);
            if (nights <= 0)
            {
                return BadRequest(new { message = "Stay length must be at least 1 night." });
            }

            var pricePerNight = room.CurrentPrice > 0 ? room.CurrentPrice : room.RoomType?.BasePrice ?? 0;
            var totalPrice = nights * pricePerNight;
            
            // Generate unique QR code with booking information
            // Format: BK-{userId}-{roomId}-{timestamp}-{short-guid}
            // This ensures uniqueness and includes key booking identifiers
            var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
            var shortGuid = Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();
            var qrCode = $"BK-{userId.Value}-{room.RoomId}-{timestamp}-{shortGuid}";
            
            // QR Code data payload (for when scanned, contains booking info)
            // Format: JSON-like structure that can be parsed
            // Note: The qr_code field stores the unique identifier
            // The actual QR code data can be generated on-the-fly when needed
            
            var booking = new Booking
            {
                CustomerId = userId.Value,
                RoomId = room.RoomId,
                CheckInDate = request.CheckInDate.Date,
                CheckOutDate = request.CheckOutDate.Date,
                TotalPrice = totalPrice,
                BookingStatus = "Confirmed",
                PaymentStatus = "Paid", // Payment status for confirmed bookings
                PaymentMethod = request.PaymentMethod,
                NumberOfGuests = request.NumberOfGuests,
                SpecialRequests = request.SpecialRequests,
                QrCode = qrCode,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            Console.WriteLine($"Creating booking: CustomerId={booking.CustomerId}, RoomId={booking.RoomId}, CheckIn={booking.CheckInDate}, CheckOut={booking.CheckOutDate}, Status={booking.BookingStatus}, PaymentStatus={booking.PaymentStatus}, QrCode={booking.QrCode} (Length: {qrCode.Length})");

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();
            
            Console.WriteLine($"Booking created successfully: BookingId={booking.BookingId}, CustomerId={userId.Value}, RoomId={room.RoomId}, QrCode={booking.QrCode}");

            // Create a payment record for visibility in payments dashboard
            try
            {
                var payment = new Payment
                {
                    BookingId = booking.BookingId,
                    Amount = totalPrice,
                    PaymentMethod = request.PaymentMethod,
                    PaymentStatus = "Paid",
                    PaymentDate = DateTime.UtcNow,
                    TransactionId = $"TXN-{booking.BookingId}-{DateTime.UtcNow:yyyyMMddHHmmss}"
                };
                _context.Payments.Add(payment);
                await _context.SaveChangesAsync();
            }
            catch (Exception paymentEx)
            {
                // Log payment creation error but don't fail the booking
                Console.WriteLine($"Warning: Could not create payment record: {paymentEx.Message}");
            }

            // Fire-and-forget confirmation email (log any failure, don't block booking)
            _ = Task.Run(async () =>
            {
                try
                {
                    var toEmail = customer?.Email;
                    if (!string.IsNullOrWhiteSpace(toEmail))
                    {
                        var currency = await _currencyHelper.GetCurrencyAsync() ?? "USD";
                        var formattedTotal = _currencyHelper.FormatPrice(booking.TotalPrice, currency);
                        var subject = $"Your reservation #{booking.BookingId} is confirmed";
                        var body = $"Hi {customer?.FirstName ?? "Guest"},\n\n" +
                                   $"Your booking is confirmed.\n" +
                                   $"Room: {room.RoomNumber} ({room.RoomType?.TypeName})\n" +
                                   $"Check-in: {booking.CheckInDate:yyyy-MM-dd}\n" +
                                   $"Check-out: {booking.CheckOutDate:yyyy-MM-dd}\n" +
                                   $"Guests: {booking.NumberOfGuests}\n" +
                                   $"Total: {formattedTotal}\n\n" +
                                   $"Reservation ID: {booking.BookingId}\n" +
                                   $"We look forward to hosting you.";
                        await _emailSender.SendEmailAsync(toEmail, subject, body);
                    }
                }
                catch (Exception emailEx)
                {
                    Console.WriteLine($"Warning: could not send booking email: {emailEx.Message}");
                }
            });

            return Ok(new { 
                message = "Booking created successfully", 
                bookingId = booking.BookingId,
                qrCode = booking.QrCode,
                checkInDate = booking.CheckInDate,
                checkOutDate = booking.CheckOutDate,
                totalPrice = booking.TotalPrice,
                bookingStatus = booking.BookingStatus,
                paymentStatus = booking.PaymentStatus
            });
        }
        catch (DbUpdateException dbEx)
        {
            Console.WriteLine($"Database error creating booking: {dbEx.Message}");
            if (dbEx.InnerException != null)
            {
                Console.WriteLine($"Inner exception message: {dbEx.InnerException.Message}");
                Console.WriteLine($"Inner exception type: {dbEx.InnerException.GetType().Name}");

                if (dbEx.InnerException is Npgsql.PostgresException pgEx)
                {
                    Console.WriteLine($"PostgreSQL SQL State: {pgEx.SqlState}");
                    Console.WriteLine($"PostgreSQL Error Code: {pgEx.ErrorCode}");
                    Console.WriteLine($"PostgreSQL Detail: {pgEx.Detail}");
                    Console.WriteLine($"PostgreSQL Where: {pgEx.Where}");
                }
            }

            var errorMessage = dbEx.InnerException?.Message ?? dbEx.Message;
            return StatusCode(500, new { 
                message = "Failed to create booking", 
                error = errorMessage,
                details = dbEx.InnerException?.GetType().Name ?? "Unknown"
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error creating booking: {ex.Message}");
            Console.WriteLine($"Error type: {ex.GetType().Name}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            return StatusCode(500, new { 
                message = "Failed to create booking", 
                error = ex.Message,
                type = ex.GetType().Name
            });
        }
    }

    public record TravelBookingCreateDto(
        string AttractionName,
        string AttractionType,
        DateTime TravelDate,
        int NumberOfParticipants,
        decimal TotalPrice,
        string PaymentMethod,
        string? SpecialRequests,
        List<string>? ImageUrls
    );

    [HttpPost("travel-booking")]
    public async Task<IActionResult> CreateTravelBooking([FromBody] TravelBookingCreateDto request)
    {
        try
        {
            var userId = _authService.GetCurrentUserIdInt();
            if (userId == null)
            {
                return Unauthorized(new { message = "Please sign in to create a travel booking." });
            }

            var customer = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId.Value);
            if (customer == null)
            {
                return Unauthorized(new { message = "Customer not found." });
            }

            // Combine special requests and image URLs into SpecialRequests field
            string? specialRequestsJson = null;
            if (!string.IsNullOrWhiteSpace(request.SpecialRequests) || (request.ImageUrls != null && request.ImageUrls.Any()))
            {
                var specialRequestsData = new
                {
                    notes = request.SpecialRequests ?? "",
                    imageUrls = request.ImageUrls ?? new List<string>()
                };
                specialRequestsJson = System.Text.Json.JsonSerializer.Serialize(specialRequestsData);
            }

            var travelBooking = new TravelBooking
            {
                CustomerId = customer.UserId,
                AttractionName = request.AttractionName,
                AttractionType = request.AttractionType,
                TravelDate = request.TravelDate,
                NumberOfParticipants = request.NumberOfParticipants,
                TotalPrice = request.TotalPrice,
                PaymentMethod = request.PaymentMethod,
                PaymentStatus = "pending",
                BookingStatus = "pending",
                SpecialRequests = specialRequestsJson ?? request.SpecialRequests,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.TravelBookings.Add(travelBooking);
            await _context.SaveChangesAsync();

            // Fire-and-forget confirmation email
            _ = Task.Run(async () =>
            {
                try
                {
                    if (!string.IsNullOrWhiteSpace(customer.Email))
                    {
                        var currency = await _currencyHelper.GetCurrencyAsync() ?? "USD";
                        var formattedTotal = _currencyHelper.FormatPrice(travelBooking.TotalPrice, currency);
                        var subject = $"Your travel booking #{travelBooking.TravelBookingId} is received";
                        var body = $"Hi {customer.FirstName ?? "Guest"},\n\n" +
                                   $"We received your travel booking request.\n" +
                                   $"Attraction: {travelBooking.AttractionName} ({travelBooking.AttractionType})\n" +
                                   $"Travel date: {travelBooking.TravelDate:yyyy-MM-dd}\n" +
                                   $"Participants: {travelBooking.NumberOfParticipants}\n" +
                                   $"Total: {formattedTotal}\n\n" +
                                   $"Booking ID: {travelBooking.TravelBookingId}\n" +
                                   $"We will keep you posted with any updates.";
                        await _emailSender.SendEmailAsync(customer.Email, subject, body);
                    }
                }
                catch (Exception emailEx)
                {
                    Console.WriteLine($"Warning: could not send travel booking email: {emailEx.Message}");
                }
            });

            return Ok(new { message = "Travel booking created successfully", travelBookingId = travelBooking.TravelBookingId });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error creating travel booking: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    #endregion
}


