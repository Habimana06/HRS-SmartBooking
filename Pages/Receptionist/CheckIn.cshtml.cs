using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Receptionist;

public class CheckInModel : PageModel
{
    private readonly ApplicationDbContext _context;

    public CheckInModel(ApplicationDbContext context)
    {
        _context = context;
    }

    public List<Booking> PendingCheckIns { get; set; } = new();
    public List<ChecklistItem> Checklist { get; set; } = new();

    public async Task OnGetAsync()
    {
        // Get bookings that need check-in (confirmed, not yet checked in)
        var today = DateTime.Today;
        PendingCheckIns = await _context.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Room)
                .ThenInclude(r => r!.RoomType)
            .Where(b => b.BookingStatus == "confirmed" && 
                   b.CheckInDate.Date <= today &&
                   !_context.CheckInCheckOuts.Any(c => c.BookingId == b.BookingId && c.CheckInTime.HasValue))
            .OrderBy(b => b.CheckInDate)
            .ToListAsync();

        Checklist = new List<ChecklistItem>
        {
            new("Verify booking and ID", false),
            new("Assign room & keycard", false),
            new("Confirm payment status", false),
            new("Share amenities + wifi", false),
            new("Trigger welcome message", false)
        };
    }

    public record ChecklistItem(string Title, bool Completed);
}

