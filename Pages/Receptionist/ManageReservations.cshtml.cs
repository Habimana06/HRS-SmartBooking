using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Receptionist;

public class ManageReservationsModel : PageModel
{
    private readonly ApplicationDbContext _context;
    private readonly CurrencyHelper _currencyHelper;

    public ManageReservationsModel(ApplicationDbContext context, CurrencyHelper currencyHelper)
    {
        _context = context;
        _currencyHelper = currencyHelper;
    }

    public List<ReservationRow> Reservations { get; set; } = new();
    public List<string> RoomTypes { get; set; } = new();
    public string Currency { get; set; } = "RWF";

    [BindProperty(SupportsGet = true)]
    public string? BookingStatus { get; set; }

    [BindProperty(SupportsGet = true)]
    public DateTime? FilterDate { get; set; }

    [BindProperty(SupportsGet = true)]
    public string? RoomType { get; set; }

    [BindProperty(SupportsGet = true)]
    public string? SearchQuery { get; set; }

    public async Task OnGetAsync()
    {
        Currency = await _currencyHelper.GetCurrencyAsync();
        
        // Load room types for filter dropdown
        RoomTypes = await _context.RoomTypes
            .Select(rt => rt.TypeName)
            .Distinct()
            .OrderBy(rt => rt)
            .ToListAsync();
        
        var query = _context.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Room)
                .ThenInclude(r => r!.RoomType)
            .Include(b => b.Payments)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(BookingStatus) && BookingStatus != "All")
        {
            query = query.Where(b => b.BookingStatus.ToLower() == BookingStatus.ToLower());
        }

        if (FilterDate.HasValue)
        {
            query = query.Where(b => b.CreatedAt.Date == FilterDate.Value.Date);
        }

        if (!string.IsNullOrEmpty(RoomType) && RoomType != "Any")
        {
            query = query.Where(b => b.Room != null && b.Room.RoomType != null && b.Room.RoomType.TypeName.ToLower() == RoomType.ToLower());
        }

        if (!string.IsNullOrEmpty(SearchQuery))
        {
            var searchLower = SearchQuery.ToLower();
            query = query.Where(b => 
                b.BookingId.ToString().Contains(searchLower) ||
                (b.Customer != null && (b.Customer.FirstName.ToLower().Contains(searchLower) || 
                                        b.Customer.LastName.ToLower().Contains(searchLower) ||
                                        b.Customer.Email.ToLower().Contains(searchLower))));
        }
        
        var bookings = await query
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        Reservations = bookings.Select(b => 
        {
            var payment = b.Payments.FirstOrDefault();
            var paymentMethod = payment?.PaymentMethod ?? b.PaymentMethod ?? "N/A";
            var paymentStatus = payment?.PaymentStatus ?? b.PaymentStatus ?? "N/A";
            
            // TotalPrice is stored in RWF, display as-is
            var displayTotal = b.TotalPrice;
            
            return new ReservationRow(
                b.BookingId,
                $"BK-{b.BookingId}",
                $"{b.Customer?.FirstName ?? "Unknown"} {b.Customer?.LastName ?? ""}".Trim(),
                b.Customer?.Email ?? "N/A",
                b.Room?.RoomNumber ?? "N/A",
                b.Room?.RoomType?.TypeName ?? "N/A",
                b.CheckInDate.ToString("yyyy-MM-dd"),
                b.CheckOutDate.ToString("yyyy-MM-dd"),
                b.NumberOfGuests,
                _currencyHelper.FormatPrice(displayTotal, Currency),
                paymentMethod,
                paymentStatus,
                b.BookingStatus
            );
        }).ToList();
    }

    public record ReservationRow(
        int BookingIdInt,
        string BookingId,
        string Customer,
        string Email,
        string Room,
        string RoomType,
        string CheckIn,
        string CheckOut,
        int Guests,
        string TotalPrice,
        string PaymentMethod,
        string PaymentStatus,
        string Status);
}

