using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
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
}

