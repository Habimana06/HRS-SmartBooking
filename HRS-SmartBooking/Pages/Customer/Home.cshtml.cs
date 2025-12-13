using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Customer;

public class HomeModel : PageModel
{
    private readonly ApplicationDbContext _context;
    private readonly CurrencyHelper _currencyHelper;

    public HomeModel(ApplicationDbContext context, CurrencyHelper currencyHelper)
    {
        _context = context;
        _currencyHelper = currencyHelper;
    }

    public List<RoomHighlight> FeaturedRooms { get; set; } = new();
    public List<string> AmenityHighlights { get; set; } = new();
    public List<DestinationSpot> Destinations { get; set; } = new();
    public List<ReviewHighlight> Reviews { get; set; } = new();
    public List<WhyUsCard> WhyUs { get; set; } = new();
    public List<string> RoomTypes { get; set; } = new();

    public async Task OnGetAsync()
    {
        // Load featured rooms (available rooms with room types)
        var rooms = await _context.Rooms
            .Include(r => r.RoomType)
            .Where(r => r.Status == "available")
            .OrderByDescending(r => r.CurrentPrice)
            .Take(4)
            .ToListAsync();

        var currency = await _currencyHelper.GetCurrencyAsync();
        FeaturedRooms = rooms.Select(r => new RoomHighlight(
            r.RoomId,
            r.RoomType?.TypeName ?? "Room",
            _currencyHelper.FormatPrice(r.CurrentPrice, currency),
            r.Status == "available" ? "Available" : "Unavailable",
            r.Description ?? r.RoomType?.Description ?? "Comfortable room",
            $"{r.RoomType?.MaxOccupancy ?? 2} Guests",
            !string.IsNullOrEmpty(r.ImageUrls) 
                ? r.ImageUrls.Split(',', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()?.Trim() 
                    ?? "https://images.unsplash.com/photo-1501117716987-c8e1ecb210cc?auto=format&fit=crop&w=900&q=80"
                : "https://images.unsplash.com/photo-1501117716987-c8e1ecb210cc?auto=format&fit=crop&w=900&q=80"
        )).ToList();

        // Load amenities from room types
        var allAmenities = await _context.RoomTypes
            .Where(rt => !string.IsNullOrEmpty(rt.Amenities))
            .Select(rt => rt.Amenities)
            .ToListAsync();

        var uniqueAmenities = allAmenities
            .SelectMany(a => a.Split(',', StringSplitOptions.RemoveEmptyEntries))
            .Select(a => a.Trim())
            .Distinct()
            .Take(8)
            .ToList();

        AmenityHighlights = uniqueAmenities.Any() 
            ? uniqueAmenities 
            : new List<string> { "Free Wi-Fi", "Breakfast", "Pool", "Spa", "Gym", "24/7 Reception", "Restaurant", "Concierge" };

        Destinations = new List<DestinationSpot>
        {
            new("Premium Rooms", "Luxury accommodations • Premium service"),
            new("Standard Rooms", "Comfortable stay • Great value"),
            new("Deluxe Suites", "Spacious suites • Extra amenities"),
            new("Executive Rooms", "Business class • Professional service")
        };

        // Load real reviews
        var reviews = await _context.Reviews
            .Include(r => r.Customer)
            .OrderByDescending(r => r.CreatedAt)
            .Take(3)
            .ToListAsync();

        Reviews = reviews.Select(r => new ReviewHighlight(
            $"{r.Customer?.FirstName ?? "Guest"} {r.Customer?.LastName ?? ""}".Trim(),
            "Customer",
            r.Rating,
            r.Comment ?? "Great experience!"
        )).ToList();

        // If no reviews, add default ones
        if (!Reviews.Any())
        {
            Reviews = new List<ReviewHighlight>
            {
                new("Guest", "Customer", 5, "Excellent service and comfortable rooms."),
                new("Guest", "Customer", 5, "Great experience, highly recommended."),
                new("Guest", "Customer", 4, "Nice stay, will come again.")
            };
        }

        WhyUs = new List<WhyUsCard>
        {
            new("Safety Protocols", "Digital keys, live monitoring, and on-demand support."),
            new("Comfort Layers", "Premium linens, mood lighting, adaptive climate."),
            new("Affordable Luxury", "Members unlock curated offers each week."),
            new("Velocity Booking", "3-step booking with saved preferences."),
            new("Clean Guarantee", "Medical-grade sanitization every stay."),
            new("Human Concierge", "Live experts in under 30 seconds.")
        };

        // Load room types from database
        RoomTypes = await _context.RoomTypes
            .Where(rt => !string.IsNullOrEmpty(rt.TypeName))
            .Select(rt => rt.TypeName)
            .Distinct()
            .OrderBy(rt => rt)
            .ToListAsync();
    }

    public async Task<IActionResult> OnPostSearchAsync(DateTime? checkIn, DateTime? checkOut, int? guests, string? roomType)
    {
        // Build route values dictionary for query parameters
        var routeValues = new Dictionary<string, object?>();
        
        if (checkIn.HasValue)
            routeValues["checkIn"] = checkIn.Value.ToString("yyyy-MM-dd");
        
        if (checkOut.HasValue)
            routeValues["checkOut"] = checkOut.Value.ToString("yyyy-MM-dd");
        
        if (guests.HasValue)
            routeValues["guests"] = guests.Value;
        
        if (!string.IsNullOrEmpty(roomType))
            routeValues["roomType"] = roomType;

        return RedirectToPage("/Customer/Rooms", routeValues);
    }

    public record RoomHighlight(int RoomId, string Name, string Price, string Tag, string Description, string Capacity, string ImageUrl);
    public record DestinationSpot(string Location, string Detail);
    public record ReviewHighlight(string Name, string Title, int Rating, string Quote);
    public record WhyUsCard(string Title, string Description);
}

