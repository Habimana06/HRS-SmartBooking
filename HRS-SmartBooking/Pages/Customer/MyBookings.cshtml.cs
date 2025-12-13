using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Customer;

public class MyBookingsModel : PageModel
{
    private readonly ApplicationDbContext _context;
    private readonly CurrencyHelper _currencyHelper;

    public MyBookingsModel(ApplicationDbContext context, CurrencyHelper currencyHelper)
    {
        _context = context;
        _currencyHelper = currencyHelper;
    }

    public List<BookingCard> Bookings { get; set; } = new();
    public List<TravelBookingCard> TravelBookings { get; set; } = new();
    public string Currency { get; set; } = "RWF";
    public string? ErrorMessage { get; set; }
    public string? SuccessMessage { get; set; }

    public async Task<IActionResult> OnGetAsync()
    {
        Currency = await _currencyHelper.GetCurrencyAsync();

        // Check session - support both Int32 and String formats
        var userId = HttpContext.Session.GetInt32("UserId");
        if (userId == null)
        {
            // Try fallback: check if stored as string
            var userIdString = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var parsedId))
            {
                // Not authenticated - redirect to login
                TempData["ReturnUrl"] = "/Customer/MyBookings";
                return RedirectToPage("/Login");
            }
            userId = parsedId;
        }

        var bookings = await _context.Bookings
            .Include(b => b.Room)
                .ThenInclude(r => r!.RoomType)
            .Include(b => b.Payments)
            .Where(b => b.CustomerId == userId.Value)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        Bookings = bookings.Select(b =>
        {
            var payment = b.Payments.FirstOrDefault();
            var roomKey = GenerateRoomKey(b.BookingId, b.RoomId, b.CheckInDate);

            return new BookingCard(
                b.BookingId,
                b.Room?.RoomType?.TypeName ?? "Room",
                b.Room?.RoomNumber ?? "N/A",
                b.CheckInDate.ToString("yyyy-MM-dd"),
                b.CheckOutDate.ToString("yyyy-MM-dd"),
                b.NumberOfGuests,
                _currencyHelper.FormatPrice(b.TotalPrice, Currency),
                payment?.PaymentMethod ?? b.PaymentMethod ?? "N/A",
                payment?.PaymentStatus ?? b.PaymentStatus ?? "N/A",
                b.BookingStatus,
                b.QrCode ?? $"BOOKING-{b.BookingId}",
                roomKey
            );
        }).ToList();

        // Load travel bookings
        var travelBookings = await _context.TravelBookings
            .Where(t => t.CustomerId == userId.Value)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        TravelBookings = travelBookings.Select(t =>
        {
            return new TravelBookingCard(
                t.TravelBookingId,
                t.AttractionName,
                t.AttractionType,
                t.TravelDate.ToString("yyyy-MM-dd"),
                t.NumberOfParticipants,
                _currencyHelper.FormatPrice(t.TotalPrice, Currency),
                t.PaymentMethod ?? "N/A",
                t.PaymentStatus,
                t.BookingStatus,
                t.RefundRequested,
                t.RefundApproved,
                t.RefundProcessedAt
            );
        }).ToList();

        if (TempData["RefundRequested"] != null)
        {
            SuccessMessage = "Refund request submitted successfully. Waiting for approval.";
        }

        return Page();
    }

    public async Task<IActionResult> OnPostRequestRefundAsync(int travelBookingId)
    {
        var userId = HttpContext.Session.GetInt32("UserId");
        if (userId == null)
        {
            return RedirectToPage("/Login");
        }

        var travelBooking = await _context.TravelBookings
            .FirstOrDefaultAsync(t => t.TravelBookingId == travelBookingId && t.CustomerId == userId.Value);

        if (travelBooking == null)
        {
            ErrorMessage = "Travel booking not found.";
            return RedirectToPage();
        }

        if (travelBooking.BookingStatus == "cancelled" || travelBooking.PaymentStatus == "refunded")
        {
            ErrorMessage = "This booking is already cancelled or refunded.";
            return RedirectToPage();
        }

        if (travelBooking.RefundRequested)
        {
            ErrorMessage = "Refund request already submitted. Waiting for approval.";
            return RedirectToPage();
        }

        travelBooking.RefundRequested = true;
        travelBooking.RefundRequestedAt = DateTime.Now;
        travelBooking.BookingStatus = "refund_pending";
        travelBooking.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        TempData["RefundRequested"] = true;
        return RedirectToPage();
    }

    private string GenerateRoomKey(int bookingId, int roomId, DateTime checkInDate)
    {
        // Generate a unique room key based on booking ID, room ID, and check-in date
        var keyData = $"{bookingId}-{roomId}-{checkInDate:yyyyMMdd}";
        var hash = keyData.GetHashCode();
        return $"KEY-{Math.Abs(hash).ToString("D8")}";
    }

    public record BookingCard(
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

    public record TravelBookingCard(
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
        DateTime? RefundProcessedAt);
}

