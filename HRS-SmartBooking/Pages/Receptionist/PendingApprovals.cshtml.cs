using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Receptionist;

public class PendingApprovalsModel : PageModel
{
    private readonly ApplicationDbContext _context;
    private readonly CurrencyHelper _currencyHelper;

    public PendingApprovalsModel(ApplicationDbContext context, CurrencyHelper currencyHelper)
    {
        _context = context;
        _currencyHelper = currencyHelper;
    }

    public List<ApprovalCard> Approvals { get; set; } = new();

    public async Task OnGetAsync()
    {
        // Get pending bookings that need approval
        var pendingBookings = await _context.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Room)
                .ThenInclude(r => r!.RoomType)
            .Where(b => b.BookingStatus == "pending")
            .OrderBy(b => b.CheckInDate)
            .ToListAsync();

        Approvals = pendingBookings.Select(b => new ApprovalCard(
            $"{b.Customer?.FirstName ?? ""} {b.Customer?.LastName ?? ""}".Trim(),
            $"{b.CheckInDate:MMM dd} - {b.CheckOutDate:MMM dd}",
            $"{b.Room?.RoomNumber ?? "N/A"} ({b.Room?.RoomType?.TypeName ?? "Unknown"})",
            b.PaymentStatus == "pending" ? "Payment pending" : b.PaymentStatus,
            b.PaymentStatus == "pending" ? "High" : "Medium"
        )).ToList();
    }

    public record ApprovalCard(string Guest, string Dates, string Room, string PaymentNote, string Priority);
}

