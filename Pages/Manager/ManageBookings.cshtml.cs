using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Manager;

public class ManageBookingsModel : PageModel
{
    private readonly ApplicationDbContext _context;
    private readonly CurrencyHelper _currencyHelper;

    public ManageBookingsModel(ApplicationDbContext context, CurrencyHelper currencyHelper)
    {
        _context = context;
        _currencyHelper = currencyHelper;
    }

    public List<BookingRow> Bookings { get; set; } = new();
    public string Currency { get; set; } = "RWF";

    [BindProperty(SupportsGet = true)]
    public string? BookingStatus { get; set; }

    [BindProperty(SupportsGet = true)]
    public string? PaymentStatus { get; set; }

    [BindProperty(SupportsGet = true)]
    public DateTime? FilterDate { get; set; }

    [BindProperty(SupportsGet = true)]
    public string? SearchQuery { get; set; }

    public async Task OnGetAsync()
    {
        Currency = await _currencyHelper.GetCurrencyAsync();
        
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

        if (!string.IsNullOrEmpty(PaymentStatus) && PaymentStatus != "All")
        {
            if (PaymentStatus == "Completed")
            {
                query = query.Where(b => b.PaymentStatus == "paid");
            }
            else
            {
                query = query.Where(b => b.PaymentStatus.ToLower() == PaymentStatus.ToLower());
            }
        }

        if (FilterDate.HasValue)
        {
            query = query.Where(b => b.CreatedAt.Date == FilterDate.Value.Date);
        }

        if (!string.IsNullOrEmpty(SearchQuery))
        {
            var searchLower = SearchQuery.ToLower();
            query = query.Where(b => 
                b.BookingId.ToString().Contains(searchLower) ||
                (b.Customer != null && (b.Customer.FirstName.ToLower().Contains(searchLower) || 
                                        b.Customer.LastName.ToLower().Contains(searchLower) ||
                                        b.Customer.Email.ToLower().Contains(searchLower))) ||
                (b.Room != null && (b.Room.RoomNumber.ToLower().Contains(searchLower) ||
                                    (b.Room.RoomType != null && b.Room.RoomType.TypeName.ToLower().Contains(searchLower)))));
        }
        
        var bookings = await query
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        Bookings = bookings.Select(b => 
        {
            var payment = b.Payments.FirstOrDefault();
            var paymentMethod = payment?.PaymentMethod ?? b.PaymentMethod ?? "N/A";
            var paymentStatus = payment?.PaymentStatus ?? b.PaymentStatus ?? "N/A";
            
            // TotalPrice is stored in RWF, display as-is
            var displayTotal = b.TotalPrice;
            
            return new BookingRow(
                b.BookingId,
                $"BK-{b.BookingId}",
                $"{b.Customer?.FirstName ?? "Unknown"} {b.Customer?.LastName ?? ""}".Trim(),
                b.Customer?.Email ?? "N/A",
                b.Customer?.PhoneNumber ?? "N/A",
                b.Room?.RoomNumber ?? "N/A",
                b.Room?.RoomType?.TypeName ?? "N/A",
                b.CheckInDate.ToString("yyyy-MM-dd"),
                b.CheckOutDate.ToString("yyyy-MM-dd"),
                b.NumberOfGuests,
                _currencyHelper.FormatPrice(displayTotal, Currency),
                paymentMethod,
                paymentStatus,
                b.BookingStatus,
                b.CreatedAt.ToString("yyyy-MM-dd HH:mm")
            );
        }).ToList();
    }

    public record BookingRow(
        int BookingIdInt,
        string BookingId,
        string CustomerName,
        string Email,
        string Phone,
        string RoomNumber,
        string RoomType,
        string CheckIn,
        string CheckOut,
        int NumberOfGuests,
        string TotalPrice,
        string PaymentMethod,
        string PaymentStatus,
        string BookingStatus,
        string CreatedAt);
}

