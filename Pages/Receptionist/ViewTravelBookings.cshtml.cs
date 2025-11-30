using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Receptionist;

public class ViewTravelBookingsModel : PageModel
{
    private readonly ApplicationDbContext _context;
    private readonly CurrencyHelper _currencyHelper;

    public ViewTravelBookingsModel(ApplicationDbContext context, CurrencyHelper currencyHelper)
    {
        _context = context;
        _currencyHelper = currencyHelper;
    }

    public List<TravelBookingRow> TravelBookings { get; set; } = new();
    public string Currency { get; set; } = "RWF";

    [BindProperty(SupportsGet = true)]
    public string? BookingStatus { get; set; }

    [BindProperty(SupportsGet = true)]
    public string? PaymentStatus { get; set; }

    [BindProperty(SupportsGet = true)]
    public string? SearchQuery { get; set; }

    public async Task OnGetAsync()
    {
        Currency = await _currencyHelper.GetCurrencyAsync();
        
        var query = _context.TravelBookings
            .Include(t => t.Customer)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(BookingStatus) && BookingStatus != "All")
        {
            query = query.Where(t => t.BookingStatus.ToLower() == BookingStatus.ToLower());
        }

        if (!string.IsNullOrEmpty(PaymentStatus) && PaymentStatus != "All")
        {
            query = query.Where(t => t.PaymentStatus.ToLower() == PaymentStatus.ToLower());
        }

        if (!string.IsNullOrEmpty(SearchQuery))
        {
            var searchLower = SearchQuery.ToLower();
            query = query.Where(t => 
                t.TravelBookingId.ToString().Contains(searchLower) ||
                t.AttractionName.ToLower().Contains(searchLower) ||
                (t.Customer != null && (t.Customer.FirstName.ToLower().Contains(searchLower) || 
                                        t.Customer.LastName.ToLower().Contains(searchLower) ||
                                        t.Customer.Email.ToLower().Contains(searchLower))));
        }
        
        var bookings = await query
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        TravelBookings = bookings.Select(t => new TravelBookingRow(
            t.TravelBookingId,
            $"{t.Customer?.FirstName ?? "Unknown"} {t.Customer?.LastName ?? ""}".Trim(),
            t.AttractionName,
            t.AttractionType ?? "N/A",
            t.TravelDate.ToString("yyyy-MM-dd"),
            t.NumberOfParticipants,
            _currencyHelper.FormatPrice(t.TotalPrice, Currency),
            t.PaymentStatus,
            t.BookingStatus,
            t.CreatedAt.ToString("yyyy-MM-dd HH:mm")
        )).ToList();
    }

    public record TravelBookingRow(
        int TravelBookingId,
        string CustomerName,
        string AttractionName,
        string AttractionType,
        string TravelDate,
        int NumberOfParticipants,
        string TotalPrice,
        string PaymentStatus,
        string BookingStatus,
        string CreatedAt);
}

