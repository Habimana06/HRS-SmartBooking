using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Receptionist;

public class CheckOutModel : PageModel
{
    private readonly ApplicationDbContext _context;

    public CheckOutModel(ApplicationDbContext context)
    {
        _context = context;
    }

    public List<Booking> PendingCheckOuts { get; set; } = new();
    public Booking? SelectedBooking { get; set; }
    public decimal RoomTotal { get; set; }
    public decimal MiniBarCharges { get; set; }
    public decimal LateCheckoutFee { get; set; }
    public decimal GrandTotal => RoomTotal + MiniBarCharges + LateCheckoutFee;

    public async Task OnGetAsync(int? bookingId = null)
    {
        var today = DateTime.Today;

        // Get bookings that need check-out
        PendingCheckOuts = await _context.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Room)
                .ThenInclude(r => r!.RoomType)
            .Where(b => b.BookingStatus == "confirmed" && 
                   b.CheckOutDate.Date <= today &&
                   _context.CheckInCheckOuts.Any(c => c.BookingId == b.BookingId && c.CheckInTime.HasValue) &&
                   !_context.CheckInCheckOuts.Any(c => c.BookingId == b.BookingId && c.CheckOutTime.HasValue))
            .OrderBy(b => b.CheckOutDate)
            .ToListAsync();

        if (bookingId.HasValue)
        {
            SelectedBooking = await _context.Bookings
                .Include(b => b.Room)
                    .ThenInclude(r => r!.RoomType)
                .FirstOrDefaultAsync(b => b.BookingId == bookingId);

            if (SelectedBooking != null)
            {
                RoomTotal = SelectedBooking.TotalPrice;

                // Get additional charges from check-in record
                var checkInRecord = await _context.CheckInCheckOuts
                    .FirstOrDefaultAsync(c => c.BookingId == bookingId);

                MiniBarCharges = checkInRecord?.AdditionalCharges ?? 0;

                // Calculate late checkout fee if applicable
                if (SelectedBooking.CheckOutDate.Date < today)
                {
                    var daysLate = (today - SelectedBooking.CheckOutDate.Date).Days;
                    LateCheckoutFee = daysLate * 40m; // $40 per day
                }
            }
        }
    }

    public async Task<IActionResult> OnPostCompleteAsync(int bookingId)
    {
        var today = DateTime.Today;

        // Load booking with room information
        var booking = await _context.Bookings
            .Include(b => b.Room)
            .FirstOrDefaultAsync(b => b.BookingId == bookingId);

        if (booking == null)
        {
            TempData["FeedbackError"] = "Booking not found for checkout.";
            return RedirectToPage("/Receptionist/CheckOut");
        }

        // Find existing check-in/out record
        var checkRecord = await _context.CheckInCheckOuts
            .FirstOrDefaultAsync(c => c.BookingId == bookingId);

        if (checkRecord == null)
        {
            // If no record exists, create one so we can track checkout time
            checkRecord = new CheckInCheckOut
            {
                BookingId = bookingId,
                ReceptionistId = 0, // optional: could be set from current user session in future
                CheckInTime = booking.CheckInDate,
                CreatedAt = DateTime.Now
            };
            _context.CheckInCheckOuts.Add(checkRecord);
        }

        checkRecord.CheckOutTime = DateTime.Now;
        checkRecord.ActualCheckOutDate = today;

        // Mark booking as completed / checked-out
        booking.BookingStatus = "completed";
        booking.UpdatedAt = DateTime.Now;

        // Make the room available again
        if (booking.Room != null)
        {
            booking.Room.Status = "available";
            booking.Room.UpdatedAt = DateTime.Now;
        }

        await _context.SaveChangesAsync();

        TempData["FeedbackSuccess"] = "Checkout completed and room marked as available.";
        return RedirectToPage("/Receptionist/CheckOut");
    }
}

