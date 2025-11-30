using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Manager;

public class ManageTravelBookingsModel : PageModel
{
    private readonly ApplicationDbContext _context;
    private readonly CurrencyHelper _currencyHelper;

    public ManageTravelBookingsModel(ApplicationDbContext context, CurrencyHelper currencyHelper)
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
    public string? RefundStatus { get; set; }

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

        if (!string.IsNullOrEmpty(RefundStatus) && RefundStatus != "All")
        {
            query = RefundStatus.ToLower() switch
            {
                "pending" => query.Where(t => t.RefundRequested && (t.RefundApproved == null || t.RefundApproved == false)),
                "approved" => query.Where(t => t.RefundRequested && t.RefundApproved == true && t.RefundProcessedAt == null),
                "denied" => query.Where(t => t.RefundRequested && t.RefundApproved == false),
                "processed" => query.Where(t => t.RefundRequested && t.RefundApproved == true && t.RefundProcessedAt != null),
                _ => query
            };
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

        TravelBookings = bookings.Select(t => 
        {
            string refundStatus = "";
            if (t.RefundRequested)
            {
                if (t.RefundApproved == true && t.RefundProcessedAt != null)
                    refundStatus = "processed";
                else if (t.RefundApproved == true)
                    refundStatus = "approved";
                else if (t.RefundApproved == false)
                    refundStatus = "denied";
                else
                    refundStatus = "pending";
            }

            return new TravelBookingRow(
                t.TravelBookingId,
                $"{t.Customer?.FirstName ?? "Unknown"} {t.Customer?.LastName ?? ""}".Trim(),
                t.AttractionName,
                t.AttractionType ?? "N/A",
                t.TravelDate.ToString("yyyy-MM-dd"),
                t.NumberOfParticipants,
                _currencyHelper.FormatPrice(t.TotalPrice, Currency),
                t.PaymentStatus,
                t.BookingStatus,
                refundStatus,
                t.CreatedAt.ToString("yyyy-MM-dd HH:mm")
            );
        }).ToList();
    }

    public async Task<IActionResult> OnPostApproveRefundAsync(int id)
    {
        var booking = await _context.TravelBookings.FindAsync(id);
        if (booking != null && booking.RefundRequested && (booking.RefundApproved == null || booking.RefundApproved == false))
        {
            booking.RefundApproved = true;
            booking.RefundApprovedAt = DateTime.Now;
            booking.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();
        }
        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostDeleteAsync(int id)
    {
        try
        {
            var booking = await _context.TravelBookings.FindAsync(id);
            if (booking != null)
            {
                _context.TravelBookings.Remove(booking);
                await _context.SaveChangesAsync();
                TempData["SuccessMessage"] = "Travel booking deleted successfully.";
            }
            else
            {
                TempData["ErrorMessage"] = "Travel booking not found.";
            }
        }
        catch (Exception ex)
        {
            TempData["ErrorMessage"] = "An error occurred while deleting the travel booking. Please try again.";
        }
        return RedirectToPage();
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
        string RefundStatus,
        string CreatedAt);
}

