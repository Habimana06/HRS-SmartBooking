using System.ComponentModel.DataAnnotations;
using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Customer;

public class BookingModel : PageModel
{
    private readonly ApplicationDbContext _context;
    private readonly CurrencyHelper _currencyHelper;
    private readonly BookingService _bookingService;
    private readonly ILogger<BookingModel> _logger;

    public BookingModel(ApplicationDbContext context, CurrencyHelper currencyHelper, BookingService bookingService, ILogger<BookingModel> logger)
    {
        _context = context;
        _currencyHelper = currencyHelper;
        _bookingService = bookingService;
        _logger = logger;
    }

    [BindProperty(SupportsGet = true)]
    public int? RoomId { get; set; }

    [BindProperty(SupportsGet = true)]
    public string? Attraction { get; set; }

    [BindProperty(SupportsGet = true)]
    public string? Type { get; set; }

    [BindProperty]
    public BookingInput Input { get; set; } = new();

    [BindProperty]
    public TravelBookingInput TravelInput { get; set; } = new();

    public string RoomPrice { get; set; } = string.Empty;
    public string Taxes { get; set; } = string.Empty;
    public string ConciergeFee { get; set; } = string.Empty;
    public string TotalPrice { get; set; } = string.Empty;
    public Room? SelectedRoom { get; set; }
    public string Currency { get; set; } = "USD";
    public string? SuccessMessage { get; set; }
    public string? ErrorMessage { get; set; }

    public async Task<IActionResult> OnGetAsync()
    {
        Currency = await _currencyHelper.GetCurrencyAsync();

        // Check if user is logged in - redirect to login if not authenticated
        var userId = HttpContext.Session.GetInt32("UserId");
        if (userId == null)
        {
            // Try fallback: check if stored as string
            var userIdString = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var parsedId))
            {
                // Not authenticated - redirect to login with return URL
                var returnUrl = RoomId.HasValue 
                    ? $"/Customer/Booking?RoomId={RoomId.Value}" 
                    : "/Customer/Booking";
                TempData["ReturnUrl"] = returnUrl;
                return RedirectToPage("/Login");
            }
            userId = parsedId;
        }

        // Load user info for display
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId.Value);
        if (user != null)
        {
            ViewData["UserFirstName"] = user.FirstName;
            ViewData["UserLastName"] = user.LastName;
            ViewData["UserEmail"] = user.Email;
            ViewData["UserPhone"] = user.PhoneNumber ?? "Not provided";
        }

        // Check if this is a travel booking first
        if (!string.IsNullOrEmpty(Attraction))
        {
            // This is a travel booking - initialize TravelInput
            if (string.IsNullOrEmpty(TravelInput.AttractionName))
            {
                TravelInput.AttractionName = Attraction;
            }
            if (string.IsNullOrEmpty(TravelInput.AttractionType))
            {
                TravelInput.AttractionType = Type ?? "Nature";
            }
            // Set default travel date if needed
            if (TravelInput.TravelDate == default(DateTime) || TravelInput.TravelDate < DateTime.Today)
            {
                TravelInput.TravelDate = DateTime.Today.AddDays(7);
            }
            if (TravelInput.NumberOfParticipants <= 0)
            {
                TravelInput.NumberOfParticipants = 2;
            }
            // Don't show room error for travel bookings
            return Page();
        }

        // This is a room booking - proceed with room validation
        // Always set default dates if not already set
        if (Input.CheckInDate == default(DateTime) || Input.CheckInDate < new DateTime(2001, 1, 1))
        {
            Input.CheckInDate = DateTime.Today;
        }
        if (Input.CheckOutDate == default(DateTime) || Input.CheckOutDate < new DateTime(2001, 1, 1))
        {
            Input.CheckOutDate = DateTime.Today.AddDays(1);
        }

        // Use RoomId from query string or Input
        var roomIdToLoad = RoomId ?? Input.RoomId;
        
        if (roomIdToLoad > 0)
        {
            SelectedRoom = await _context.Rooms
                .Include(r => r.RoomType)
                .FirstOrDefaultAsync(r => r.RoomId == roomIdToLoad);

            if (SelectedRoom != null)
            {
                Input.RoomId = roomIdToLoad;
                Input.CheckInDate = DateTime.Today;
                Input.CheckOutDate = DateTime.Today.AddDays(1);
                Input.NumberOfGuests = Math.Min(Input.NumberOfGuests > 0 ? Input.NumberOfGuests : 2, SelectedRoom.RoomType?.MaxOccupancy ?? 10);

                var nights = (Input.CheckOutDate - Input.CheckInDate).Days;
                if (nights <= 0) nights = 1;
                await CalculatePricesAsync(SelectedRoom.CurrentPrice, nights, Input.NumberOfGuests);
            }
            else
            {
                // Room not found - clear RoomId
                Input.RoomId = 0;
                ErrorMessage = $"Room {roomIdToLoad} was not found. Please select a room from the rooms page.";
            }
        }
        else
        {
            // No room selected - only show error if not a travel booking
            if (Input.RoomId <= 0)
            {
                ErrorMessage = "Please select a room from the rooms page before booking.";
            }
            var nights = (Input.CheckOutDate - Input.CheckInDate).Days;
            if (nights <= 0) nights = 1;
            await CalculatePricesAsync(504000m, nights, Input.NumberOfGuests); // Default price in RWF (420 USD * 1200)
        }

        return Page();
    }

    public async Task<IActionResult> OnPostRecalculateAsync()
    {
        Currency = await _currencyHelper.GetCurrencyAsync();
        
        if (Input.RoomId > 0)
        {
            SelectedRoom = await _context.Rooms
                .Include(r => r.RoomType)
                .FirstOrDefaultAsync(r => r.RoomId == Input.RoomId);

            if (SelectedRoom != null)
            {
                var nights = (Input.CheckOutDate - Input.CheckInDate).Days;
                if (nights <= 0) nights = 1;
                await CalculatePricesAsync(SelectedRoom.CurrentPrice, nights, Input.NumberOfGuests);
            }
        }
        else
        {
            var nights = (Input.CheckOutDate - Input.CheckInDate).Days;
            if (nights <= 0) nights = 1;
            await CalculatePricesAsync(504000m, nights, Input.NumberOfGuests); // Default price in RWF (420 USD * 1200)
        }

        return Page();
    }

    public async Task<IActionResult> OnGetRecalculatePrice(int roomId, DateTime checkIn, DateTime checkOut, int guests)
    {
        Currency = await _currencyHelper.GetCurrencyAsync();
        
        decimal basePrice = 504000m; // Default price in RWF (420 USD * 1200)
        if (roomId > 0)
        {
            var room = await _context.Rooms
                .Include(r => r.RoomType)
                .FirstOrDefaultAsync(r => r.RoomId == roomId);
            if (room != null)
            {
                basePrice = room.CurrentPrice;
            }
        }

        var nights = (checkOut - checkIn).Days;
        if (nights <= 0) nights = 1;

        // All prices in RWF
        var roomPriceRWF = basePrice * nights; // basePrice is already in RWF
        var baseOccupancy = 2;
        var additionalGuests = Math.Max(0, guests - baseOccupancy);
        var guestFeeRWF = additionalGuests * 18000m * nights; // RWF (15 USD * 1200)
        var subtotalRWF = roomPriceRWF + guestFeeRWF;
        var taxRWF = subtotalRWF * 0.1m;
        var conciergeFeeRWF = 24000m; // RWF (20 USD * 1200)
        var totalRWF = subtotalRWF + taxRWF + conciergeFeeRWF;

        return new JsonResult(new
        {
            roomPrice = $"RWF {roomPriceRWF:N0}",
            guestFee = guestFeeRWF > 0 ? $"RWF {guestFeeRWF:N0}" : null,
            taxes = $"RWF {taxRWF:N0}",
            conciergeFee = $"RWF {conciergeFeeRWF:N0}",
            totalPrice = $"RWF {totalRWF:N0}",
            nights = nights,
            guests = guests
        });
    }

    public async Task<IActionResult> OnPostAsync()
    {
        Currency = await _currencyHelper.GetCurrencyAsync();

        // Validate user session
        var userId = HttpContext.Session.GetInt32("UserId");
        
        _logger.LogInformation("=== SESSION VERIFICATION ===");
        _logger.LogInformation("Session UserId: {UserId}", userId);
        
        if (userId == null)
        {
            _logger.LogWarning("Session UserId is null - user not authenticated");
            ErrorMessage = "Please log in to make a booking.";
            await LoadRoomDataAsync();
            return Page();
        }

        // Verify this user exists in database
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == userId.Value);
        
        if (user != null)
        {
            _logger.LogInformation("✓ User FOUND: {Email} ({FirstName} {LastName}), UserId: {UserId}, IsActive: {IsActive}", 
                user.Email, user.FirstName, user.LastName, user.UserId, user.IsActive);
        }
        else
        {
            _logger.LogError("✗ User NOT FOUND in database for UserId: {UserId}", userId);
            ErrorMessage = $"Your account (ID: {userId}) was not found. Please log out and log back in.";
            await LoadRoomDataAsync();
            return Page();
        }

        _logger.LogInformation("=== Booking Process Started ===");
        _logger.LogInformation("UserId: {UserId}, RoomId: {RoomId}, PaymentMethod: {PaymentMethod}", 
            userId, Input.RoomId, Input.PaymentMethod ?? "Not Selected");
        
        // Try to query existing payment_status values to understand what's allowed
        try
        {
            var existingStatuses = await _context.Bookings
                .Where(b => b.PaymentStatus != null)
                .Select(b => b.PaymentStatus)
                .Distinct()
                .ToListAsync();
            _logger.LogInformation("Existing payment_status values in database: {Statuses}", string.Join(", ", existingStatuses));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not query existing payment_status values");
        }

        // Validate required fields
        if (Input.RoomId <= 0)
        {
            _logger.LogWarning("Booking failed: RoomId is invalid ({RoomId})", Input.RoomId);
            ErrorMessage = "Please select a room before booking. Please go to the rooms page and select a room first.";
            Currency = await _currencyHelper.GetCurrencyAsync();
            await LoadRoomDataAsync();
            return Page();
        }

        if (string.IsNullOrEmpty(Input.PaymentMethod))
        {
            _logger.LogWarning("Booking failed: Payment method not selected");
            ErrorMessage = "Please select a payment method (Card or MTN MoMo) to continue.";
            Currency = await _currencyHelper.GetCurrencyAsync();
            await LoadRoomDataAsync();
            return Page();
        }

        if (!ModelState.IsValid)
        {
            _logger.LogWarning("Booking failed: ModelState is invalid. Errors: {Errors}", 
                string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
            ErrorMessage = "Please fill in all required fields correctly. " + 
                string.Join(" ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
            Currency = await _currencyHelper.GetCurrencyAsync();
            await LoadRoomDataAsync();
            return Page();
        }

        try
        {

            // Verify customer exists
            var customer = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == userId.Value && u.IsActive);
            
            if (customer == null)
            {
                _logger.LogError("Booking failed: Customer {CustomerId} not found or inactive", userId.Value);
                ErrorMessage = "Your account was not found or is inactive. Please log out and log back in, or contact support.";
                Currency = await _currencyHelper.GetCurrencyAsync();
                await LoadRoomDataAsync();
                return Page();
            }

            SelectedRoom = await _context.Rooms
                .Include(r => r.RoomType)
                .FirstOrDefaultAsync(r => r.RoomId == Input.RoomId);

            if (SelectedRoom == null)
            {
                _logger.LogError("Booking failed: Room {RoomId} not found", Input.RoomId);
                ErrorMessage = $"Room {Input.RoomId} was not found. Please select a different room from the rooms page.";
                Currency = await _currencyHelper.GetCurrencyAsync();
                await LoadRoomDataAsync();
                return Page();
            }

            // Verify room type exists
            if (SelectedRoom.RoomType == null)
            {
                _logger.LogError("Booking failed: Room {RoomId} has no RoomType", Input.RoomId);
                ErrorMessage = "Room information is incomplete (missing room type). Please select a different room or contact support.";
                Currency = await _currencyHelper.GetCurrencyAsync();
                await LoadRoomDataAsync();
                return Page();
            }

            var nights = (Input.CheckOutDate - Input.CheckInDate).Days;
            if (nights <= 0)
            {
                _logger.LogWarning("Booking failed: Invalid date range. CheckIn: {CheckIn}, CheckOut: {CheckOut}", 
                    Input.CheckInDate, Input.CheckOutDate);
                ErrorMessage = "Check-out date must be after check-in date. Please select valid dates.";
                Currency = await _currencyHelper.GetCurrencyAsync();
                await LoadRoomDataAsync();
                return Page();
            }

            // Calculate total in RWF (all prices stored, calculated, and displayed in RWF)
            var roomPricePerNightRWF = SelectedRoom.CurrentPrice; // Already in RWF
            var roomPriceRWF = roomPricePerNightRWF * nights;
            
            // Add per-guest fee (additional charge per guest beyond base occupancy)
            var baseOccupancy = 2; // Base occupancy is typically 2 guests
            var additionalGuests = Math.Max(0, Input.NumberOfGuests - baseOccupancy);
            var guestFeePerNightRWF = 18000m; // RWF (15 USD * 1200)
            var guestFeeRWF = additionalGuests * guestFeePerNightRWF * nights;
            
            var subtotalRWF = roomPriceRWF + guestFeeRWF;
            var taxRWF = subtotalRWF * 0.1m; // 10% tax on subtotal
            var conciergeFeeRWF = 24000m; // RWF (20 USD * 1200)
            var finalTotalRWF = subtotalRWF + taxRWF + conciergeFeeRWF;
            
            // Store total in RWF for consistency
            var finalTotal = finalTotalRWF;

            // Check if room is available
            if (SelectedRoom.Status != "available")
            {
                _logger.LogWarning("Booking failed: Room {RoomId} is not available. Status: {Status}", 
                    SelectedRoom.RoomId, SelectedRoom.Status);
                ErrorMessage = $"This room is currently {SelectedRoom.Status.ToLower()} and not available for booking. Please select another room.";
                Currency = await _currencyHelper.GetCurrencyAsync();
                await LoadRoomDataAsync();
                return Page();
            }

            // Use a transaction to ensure all operations succeed or fail together
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Double-check customer and room exist right before creating booking (WITH tracking for FK)
                var verifyCustomer = await _context.Users
                    .FirstOrDefaultAsync(u => u.UserId == userId.Value && u.IsActive);
                
                if (verifyCustomer == null)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError("Booking failed: Customer {CustomerId} verification failed during transaction", userId.Value);
                    ErrorMessage = "Your account verification failed. Please log out and log back in.";
                    Currency = await _currencyHelper.GetCurrencyAsync();
                    await LoadRoomDataAsync();
                    return Page();
                }

                var verifyRoom = await _context.Rooms
                    .Include(r => r.RoomType)
                    .FirstOrDefaultAsync(r => r.RoomId == Input.RoomId);
                
                if (verifyRoom == null)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError("Booking failed: Room {RoomId} verification failed during transaction", Input.RoomId);
                    ErrorMessage = "The selected room verification failed. Please select another room from the rooms page.";
                    Currency = await _currencyHelper.GetCurrencyAsync();
                    await LoadRoomDataAsync();
                    return Page();
                }
                
                // Verify room type exists
                if (verifyRoom.RoomType == null)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError("Booking failed: Room {RoomId} has no RoomType during transaction", Input.RoomId);
                    ErrorMessage = "Room information is incomplete (missing room type). Please select another room.";
                    Currency = await _currencyHelper.GetCurrencyAsync();
                    await LoadRoomDataAsync();
                    return Page();
                }

                _logger.LogInformation("Creating booking: CustomerId={CustomerId} (exists: {CustomerExists}), RoomId={RoomId} (exists: {RoomExists}, RoomType: {RoomType}), Total={Total}", 
                    userId.Value, verifyCustomer != null, Input.RoomId, verifyRoom != null, verifyRoom.RoomType?.TypeName ?? "N/A", finalTotal);

                // Use the verified entity IDs directly
                var customerId = verifyCustomer.UserId;
                var roomId = verifyRoom.RoomId;
                
                _logger.LogInformation("=== Before Adding Booking ===");
                _logger.LogInformation("CustomerId: {CustomerId}, RoomId: {RoomId}", customerId, roomId);
                _logger.LogInformation("Customer UserId from entity: {UserId}, Room RoomId from entity: {RoomId}", 
                    verifyCustomer.UserId, verifyRoom.RoomId);
                
                // Verify IDs are valid
                if (customerId <= 0 || roomId <= 0)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError("CRITICAL: Invalid IDs - CustomerId: {CustomerId}, RoomId: {RoomId}", customerId, roomId);
                    ErrorMessage = "Invalid customer or room information. Please refresh and try again.";
                    Currency = await _currencyHelper.GetCurrencyAsync();
                    await LoadRoomDataAsync();
                    return Page();
                }
                
                // Create booking with confirmed status - use IDs directly
                // EF Core will validate foreign keys using the configured column mappings
                // CHECK constraint allows: 'pending', 'paid', 'failed', 'refunded'
                var booking = new Booking
                {
                    CustomerId = customerId,
                    RoomId = roomId,
                    CheckInDate = Input.CheckInDate,
                    CheckOutDate = Input.CheckOutDate,
                    NumberOfGuests = Input.NumberOfGuests,
                    TotalPrice = finalTotal,
                    BookingStatus = "confirmed",
                    PaymentStatus = "pending", // Start with 'pending' (valid per CHECK constraint)
                    PaymentMethod = Input.PaymentMethod,
                    SpecialRequests = Input.SpecialRequests,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };
                
                _logger.LogInformation("Booking object created: CustomerId={CustomerId}, RoomId={RoomId}, CheckIn={CheckIn}, CheckOut={CheckOut}, Guests={Guests}, Total={Total}",
                    booking.CustomerId, booking.RoomId, booking.CheckInDate, booking.CheckOutDate, booking.NumberOfGuests, booking.TotalPrice);

                _context.Bookings.Add(booking);
                
                // Save booking first
                try
                {
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Booking saved successfully with BookingId: {BookingId}", booking.BookingId);
                }
                catch (Exception saveEx)
                {
                    _logger.LogError(saveEx, "=== SaveChangesAsync FAILED ===");
                    _logger.LogError("Exception Type: {ExceptionType}", saveEx.GetType().Name);
                    _logger.LogError("Exception Message: {Message}", saveEx.Message);
                    if (saveEx.InnerException != null)
                    {
                        _logger.LogError("Inner Exception: {InnerMessage}", saveEx.InnerException.Message);
                        _logger.LogError("Inner Exception Type: {InnerType}", saveEx.InnerException.GetType().Name);
                        _logger.LogError("Inner Exception Stack: {StackTrace}", saveEx.InnerException.StackTrace);
                    }
                    _logger.LogError("Attempted PaymentStatus value: {PaymentStatus}", booking.PaymentStatus);
                    _logger.LogError("Attempted BookingStatus value: {BookingStatus}", booking.BookingStatus);
                    throw; // Re-throw to be caught by outer catch
                }

                // Generate QR code data AFTER booking is saved (so BookingId is available)
                var qrData = $"BOOKING-{booking.BookingId}-{userId.Value}-{Input.RoomId}-{Input.CheckInDate:yyyyMMdd}-{Input.CheckOutDate:yyyyMMdd}";
                booking.QrCode = qrData;
                _context.Bookings.Update(booking);
                await _context.SaveChangesAsync();
                _logger.LogInformation("QR code updated for BookingId: {BookingId}", booking.BookingId);

                // Create payment record with completed status
                var payment = new Payment
                {
                    BookingId = booking.BookingId,
                    Amount = finalTotal,
                    PaymentMethod = Input.PaymentMethod ?? "Card",
                    PaymentStatus = "completed",
                    PaymentDate = DateTime.Now,
                    TransactionId = Input.PaymentMethod == "MTN MoMo" 
                        ? $"MTN-{Input.MomoNumber ?? "N/A"}-{DateTime.Now:yyyyMMddHHmmss}" 
                        : $"CARD-{DateTime.Now:yyyyMMddHHmmss}",
                    Notes = Input.PaymentMethod == "MTN MoMo" 
                        ? $"MTN MoMo: {Input.MomoNumber ?? "N/A"}" 
                        : "Card payment processed"
                };

                _context.Payments.Add(payment);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Payment created for BookingId: {BookingId}", booking.BookingId);

                // Update booking payment status to "paid" now that payment is recorded
                booking.PaymentStatus = "paid"; // Valid per CHECK constraint: 'pending', 'paid', 'failed', 'refunded'
                booking.UpdatedAt = DateTime.Now;
                _context.Bookings.Update(booking);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Booking payment status updated to 'paid' for BookingId: {BookingId}", booking.BookingId);

                // Update room status to "occupied" - use the tracked room entity
                verifyRoom.Status = "occupied";
                verifyRoom.UpdatedAt = DateTime.Now;
                _context.Rooms.Update(verifyRoom);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Room {RoomId} status updated to occupied", verifyRoom.RoomId);

                // Commit transaction ONLY if all operations succeed
                await transaction.CommitAsync();
                _logger.LogInformation("Transaction committed successfully for BookingId: {BookingId}", booking.BookingId);

                // Verify booking was actually saved by querying it back
                var savedBooking = await _context.Bookings
                    .AsNoTracking()
                    .FirstOrDefaultAsync(b => b.BookingId == booking.BookingId);
                
                if (savedBooking == null)
                {
                    _logger.LogError("CRITICAL: Booking {BookingId} was not found after commit! Transaction may have failed silently.", booking.BookingId);
                    ErrorMessage = "Booking was created but could not be verified. Please check your bookings or contact support.";
                    Currency = await _currencyHelper.GetCurrencyAsync();
                    await LoadRoomDataAsync();
                    return Page();
                }
                
                _logger.LogInformation("Booking verified in database: BookingId={BookingId}, Status={Status}, PaymentStatus={PaymentStatus}",
                    savedBooking.BookingId, savedBooking.BookingStatus, savedBooking.PaymentStatus);

                _logger.LogInformation("=== Booking Successful and Verified ===");
                _logger.LogInformation("BookingId: {BookingId}, CustomerId: {CustomerId}, RoomId: {RoomId}, Total: {Total}", 
                    booking.BookingId, booking.CustomerId, booking.RoomId, finalTotal);

                SuccessMessage = "Booking confirmed successfully! Your room has been reserved.";
                TempData["BookingSuccess"] = true;
                return RedirectToPage("/Customer/MyBookings");
            }
            catch (Exception ex)
            {
                // Rollback transaction on ANY error
                try
                {
                    await transaction.RollbackAsync();
                    _logger.LogWarning("Transaction rolled back due to error: {Error}", ex.Message);
                }
                catch (Exception rollbackEx)
                {
                    _logger.LogError(rollbackEx, "Failed to rollback transaction");
                }
                throw; // Re-throw to be caught by outer catch block
            }
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException dbEx)
        {
            // Handle database-specific errors
            var innerException = dbEx.InnerException?.Message ?? dbEx.Message;
            var innerExceptionType = dbEx.InnerException?.GetType().Name ?? "None";
            
            _logger.LogError(dbEx, "=== Booking Failed with Database Exception ===");
            _logger.LogError("Exception Type: {ExceptionType}", dbEx.GetType().Name);
            _logger.LogError("UserId: {UserId}, RoomId: {RoomId}", userId, Input.RoomId);
            _logger.LogError("Error Message: {Error}", dbEx.Message);
            _logger.LogError("Inner Exception Type: {InnerType}", innerExceptionType);
            _logger.LogError("Inner Exception Message: {InnerException}", innerException);
            
            // Log stack trace for debugging
            _logger.LogError("Stack Trace: {StackTrace}", dbEx.StackTrace);
            if (dbEx.InnerException != null)
            {
                _logger.LogError("Inner Stack Trace: {InnerStackTrace}", dbEx.InnerException.StackTrace);
            }
            
            // Check for specific database errors
            string userFriendlyMessage = "An error occurred while saving your booking.";
            string detailedError = "";
            
            if (innerException.Contains("UNIQUE") || innerException.Contains("duplicate") || innerException.Contains("unique constraint"))
            {
                userFriendlyMessage = "A booking with similar details already exists. Please try again or contact support.";
                detailedError = "Duplicate entry detected.";
            }
            else if (innerException.Contains("CHECK constraint") || innerException.Contains("check constraint") ||
                     (innerException.Contains("INSERT statement conflicted") && innerException.Contains("CHECK")) ||
                     innerException.Contains("CK__Bookings__paymen"))
            {
                userFriendlyMessage = "Invalid booking data. Please check your input and try again.";
                detailedError = "Data validation constraint violation. ";
                
                // Try to identify which field failed
                if (innerException.Contains("payment_status") || innerException.Contains("paymen"))
                {
                    detailedError += $"Payment status value '{Input.PaymentMethod}' is invalid. The database constraint only allows specific values. Please contact support.";
                    _logger.LogError("CHECK constraint violation on payment_status. Attempted value may not be allowed by the constraint.");
                }
                else if (innerException.Contains("booking_status"))
                {
                    detailedError += "Booking status value is invalid.";
                }
                else
                {
                    detailedError += "A data validation constraint was violated. Please contact support with the error details.";
                }
            }
            else if (innerException.Contains("FOREIGN KEY") || innerException.Contains("constraint") || 
                     innerException.Contains("The INSERT statement conflicted") ||
                     innerException.Contains("reference constraint"))
            {
                userFriendlyMessage = "Invalid room or customer information. Please refresh the page and try again.";
                detailedError = "Foreign key constraint violation. ";
                
                // Try to identify which foreign key failed
                if (innerException.Contains("customer_id") || innerException.Contains("CustomerId"))
                {
                    detailedError += "Customer ID validation failed.";
                }
                else if (innerException.Contains("room_id") || innerException.Contains("RoomId"))
                {
                    detailedError += "Room ID validation failed.";
                }
            }
            else if (innerException.Contains("NOT NULL") || innerException.Contains("required") || 
                     innerException.Contains("cannot be null"))
            {
                userFriendlyMessage = "Some required information is missing. Please fill in all fields and try again.";
                detailedError = "Required field is missing.";
            }
            else if (innerException.Contains("timeout") || innerException.Contains("Timeout"))
            {
                userFriendlyMessage = "The request timed out. Please try again.";
                detailedError = "Database timeout.";
            }
            else
            {
                detailedError = $"Database error: {innerException}";
            }
            
            _logger.LogError("User-friendly message: {Message}, Detailed error: {Detailed}", 
                userFriendlyMessage, detailedError);
            
            ErrorMessage = $"{userFriendlyMessage} If the problem persists, please contact support. Error details: {detailedError}";
            Currency = await _currencyHelper.GetCurrencyAsync();
            await LoadRoomDataAsync();
            return Page();
        }
        catch (Exception ex)
        {
            // Handle general exceptions
            var innerException = ex.InnerException?.Message ?? "No additional details";
            _logger.LogError(ex, "=== Booking Failed with Exception ===");
            _logger.LogError("UserId: {UserId}, RoomId: {RoomId}, Error: {Error}, InnerException: {InnerException}", 
                userId, Input.RoomId, ex.Message, innerException);
            
            ErrorMessage = "An unexpected error occurred while processing your booking. Please try again or contact support if the problem persists.";
            Currency = await _currencyHelper.GetCurrencyAsync();
            await LoadRoomDataAsync();
            return Page();
        }
    }

    private async Task CalculatePricesAsync(decimal basePriceRWF, int nights, int numberOfGuests = 2)
    {
        Currency = await _currencyHelper.GetCurrencyAsync();
        
        // Calculate all prices in RWF (all prices stored, calculated, and displayed in RWF)
        var roomPriceRWF = basePriceRWF * nights;
        
        // Add per-guest fee (additional charge per guest beyond base occupancy)
        var baseOccupancy = 2; // Base occupancy is typically 2 guests
        var additionalGuests = Math.Max(0, numberOfGuests - baseOccupancy);
        var guestFeePerNightRWF = 18000m; // RWF (15 USD * 1200)
        var guestFeeRWF = additionalGuests * guestFeePerNightRWF * nights;
        
        var subtotalRWF = roomPriceRWF + guestFeeRWF;
        var taxRWF = subtotalRWF * 0.1m; // 10% tax on subtotal
        var conciergeFeeRWF = 24000m; // RWF (20 USD * 1200)
        var totalRWF = subtotalRWF + taxRWF + conciergeFeeRWF;

        // Format prices for display (all in RWF)
        RoomPrice = $"RWF {roomPriceRWF:N0}";
        if (guestFeeRWF > 0)
        {
            RoomPrice += $" + RWF {guestFeeRWF:N0} (guest fee)";
        }
        Taxes = $"RWF {taxRWF:N0}";
        ConciergeFee = $"RWF {conciergeFeeRWF:N0}";
        TotalPrice = $"RWF {totalRWF:N0}";
    }

    private async Task LoadRoomDataAsync()
    {
        Currency = await _currencyHelper.GetCurrencyAsync();
        
        if (Input.RoomId > 0)
        {
            SelectedRoom = await _context.Rooms
                .Include(r => r.RoomType)
                .FirstOrDefaultAsync(r => r.RoomId == Input.RoomId);

            if (SelectedRoom != null)
            {
                var nights = (Input.CheckOutDate - Input.CheckInDate).Days;
                if (nights <= 0) nights = 1;
                await CalculatePricesAsync(SelectedRoom.CurrentPrice, nights, Input.NumberOfGuests);
            }
            else
            {
                // Room not found - set default prices
                var nights = (Input.CheckOutDate - Input.CheckInDate).Days;
                if (nights <= 0) nights = 1;
                await CalculatePricesAsync(504000m, nights, Input.NumberOfGuests); // Default price in RWF (420 USD * 1200)
            }
        }
        else
        {
            // No room selected - set default prices
            var nights = (Input.CheckOutDate - Input.CheckInDate).Days;
            if (nights <= 0) nights = 1;
            await CalculatePricesAsync(504000m, nights, Input.NumberOfGuests); // Default price in RWF (420 USD * 1200)
        }
        
        // Load user info for display
        var userId = HttpContext.Session.GetInt32("UserId");
        if (userId.HasValue)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId.Value);
            if (user != null)
            {
                ViewData["UserFirstName"] = user.FirstName;
                ViewData["UserLastName"] = user.LastName;
                ViewData["UserEmail"] = user.Email;
                ViewData["UserPhone"] = user.PhoneNumber ?? "Not provided";
            }
        }
    }

    public class BookingInput
    {
        [Required]
        public int RoomId { get; set; }

        [Required]
        [DataType(DataType.Date)]
        public DateTime CheckInDate { get; set; } = DateTime.Today;

        [Required]
        [DataType(DataType.Date)]
        public DateTime CheckOutDate { get; set; } = DateTime.Today.AddDays(1);

        [Required]
        [Range(1, 10)]
        public int NumberOfGuests { get; set; } = 2;

        [Required]
        public string PaymentMethod { get; set; } = string.Empty;

        public string? CardNumber { get; set; }
        public string? CardExpiry { get; set; }
        public string? CardCVC { get; set; }
        public string? MomoNumber { get; set; }
        public string? PromoCode { get; set; }
        public string? SpecialRequests { get; set; }
    }

    public class TravelBookingInput
    {
        [Required]
        public string AttractionName { get; set; } = string.Empty;

        [Required]
        public string AttractionType { get; set; } = "Nature";

        [Required]
        [DataType(DataType.Date)]
        public DateTime TravelDate { get; set; } = DateTime.Today.AddDays(7);

        [Required]
        [Range(1, 20)]
        public int NumberOfParticipants { get; set; } = 2;

        [Required]
        public string PaymentMethod { get; set; } = string.Empty;

        public decimal TotalPrice { get; set; }
        public string? SpecialRequests { get; set; }
    }

    public async Task<IActionResult> OnPostTravelBookingAsync()
    {
        Currency = await _currencyHelper.GetCurrencyAsync();

        var userId = HttpContext.Session.GetInt32("UserId");
        if (userId == null)
        {
            ErrorMessage = "Please log in to make a travel booking.";
            // Preserve attraction info when returning to page
            Attraction = TravelInput.AttractionName;
            Type = TravelInput.AttractionType;
            return Page();
        }

        // Validate required fields
        if (string.IsNullOrEmpty(TravelInput.AttractionName))
        {
            ErrorMessage = "Attraction name is required.";
            Attraction = TravelInput.AttractionName;
            Type = TravelInput.AttractionType;
            return Page();
        }

        if (string.IsNullOrEmpty(TravelInput.PaymentMethod))
        {
            ErrorMessage = "Please select a payment method.";
            // Preserve attraction info when returning to page
            Attraction = TravelInput.AttractionName;
            Type = TravelInput.AttractionType;
            return Page();
        }

        if (TravelInput.TravelDate < DateTime.Today)
        {
            ErrorMessage = "Travel date cannot be in the past.";
            Attraction = TravelInput.AttractionName;
            Type = TravelInput.AttractionType;
            return Page();
        }

        if (TravelInput.NumberOfParticipants < 1 || TravelInput.NumberOfParticipants > 20)
        {
            ErrorMessage = "Number of participants must be between 1 and 20.";
            Attraction = TravelInput.AttractionName;
            Type = TravelInput.AttractionType;
            return Page();
        }

        try
        {
            var customer = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == userId.Value && u.IsActive);

            if (customer == null)
            {
                ErrorMessage = "Your account was not found or is inactive.";
                return Page();
            }

            // Calculate total price in RWF (all prices stored, calculated, and displayed in RWF)
            // Base prices in RWF
            var basePriceRWF = TravelInput.AttractionType switch
            {
                "Nature" => 180000m,    // RWF (150 USD * 1200)
                "Adventure" => 96000m,   // RWF (80 USD * 1200)
                "Wildlife" => 144000m,   // RWF (120 USD * 1200)
                "Culture" => 60000m,    // RWF (50 USD * 1200)
                _ => 120000m            // RWF (100 USD * 1200)
            };
            var totalPrice = basePriceRWF * TravelInput.NumberOfParticipants;

            var travelBooking = new TravelBooking
            {
                CustomerId = userId.Value,
                AttractionName = TravelInput.AttractionName,
                AttractionType = TravelInput.AttractionType,
                TravelDate = TravelInput.TravelDate,
                NumberOfParticipants = TravelInput.NumberOfParticipants,
                TotalPrice = totalPrice,
                BookingStatus = "confirmed",
                PaymentStatus = "paid",
                PaymentMethod = TravelInput.PaymentMethod,
                SpecialRequests = TravelInput.SpecialRequests,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.TravelBookings.Add(travelBooking);
            await _context.SaveChangesAsync();

            SuccessMessage = "Travel booking confirmed successfully!";
            TempData["TravelBookingSuccess"] = true;
            return RedirectToPage("/Customer/MyBookings");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating travel booking");
            ErrorMessage = "An error occurred while processing your travel booking. Please try again.";
            // Preserve attraction info when returning to page
            Attraction = TravelInput.AttractionName;
            Type = TravelInput.AttractionType;
            return Page();
        }
    }
}

