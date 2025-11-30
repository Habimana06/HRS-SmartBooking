using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Customer;

public class RoomsModel : PageModel
{
    private readonly ApplicationDbContext _context;
    private readonly CurrencyHelper _currencyHelper;

    public RoomsModel(ApplicationDbContext context, CurrencyHelper currencyHelper)
    {
        _context = context;
        _currencyHelper = currencyHelper;
    }

    public List<RoomListing> Rooms { get; set; } = new();
    public string Currency { get; set; } = "RWF";

    [BindProperty(SupportsGet = true)]
    public DateTime? CheckIn { get; set; }

    [BindProperty(SupportsGet = true)]
    public DateTime? CheckOut { get; set; }

    [BindProperty(SupportsGet = true)]
    public int? Guests { get; set; }

    [BindProperty(SupportsGet = true)]
    public string? RoomType { get; set; }

    public async Task OnGetAsync()
    {
        Currency = await _currencyHelper.GetCurrencyAsync();
        var query = _context.Rooms
            .Include(r => r.RoomType)
            .Where(r => r.Status == "available");

        // Apply filters from search
        if (!string.IsNullOrEmpty(RoomType))
        {
            query = query.Where(r => r.RoomType != null && r.RoomType.TypeName == RoomType);
        }

        if (Guests.HasValue && Guests.Value > 0)
        {
            query = query.Where(r => r.RoomType != null && r.RoomType.MaxOccupancy >= Guests.Value);
        }

        var rooms = await query.ToListAsync();

        // Get average ratings for rooms
        var roomRatings = await _context.Reviews
            .Include(r => r.Booking)
            .GroupBy(r => r.Booking!.RoomId)
            .Select(g => new { RoomId = g.Key, AvgRating = g.Average(r => (decimal?)r.Rating) ?? 0 })
            .ToListAsync();

        Rooms = rooms.Select(r =>
        {
            var rating = roomRatings.FirstOrDefault(rt => rt.RoomId == r.RoomId)?.AvgRating ?? 4.5m;
            var amenities = !string.IsNullOrEmpty(r.RoomType?.Amenities)
                ? r.RoomType.Amenities.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(a => a.Trim()).ToArray()
                : new[] { "Standard amenities" };

            // Get all image URLs if available
            var imageUrls = !string.IsNullOrEmpty(r.ImageUrls)
                ? r.ImageUrls.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(url => url.Trim())
                    .Where(url => !string.IsNullOrEmpty(url))
                    .ToList()
                : new List<string>();

            // If no images, add default placeholder
            if (!imageUrls.Any())
            {
                imageUrls.Add("https://images.unsplash.com/photo-1501117716987-c8e1ecb210cc?auto=format&fit=crop&w=900&q=80");
            }

            return new RoomListing(
                r.RoomType?.TypeName ?? $"Room {r.RoomNumber}",
                rating,
                _currencyHelper.FormatPrice(r.CurrentPrice, Currency),
                $"{r.RoomType?.MaxOccupancy ?? 2} Guests • {r.Description ?? "Comfortable room"}",
                amenities,
                imageUrls,
                r.RoomId
            );
        }).ToList();
    }

    public record RoomListing(string Name, decimal Rating, string Price, string Details, IEnumerable<string> Features, List<string> ImageUrls, int RoomId);
}

