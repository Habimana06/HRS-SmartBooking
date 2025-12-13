using System.Collections.Generic;
using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Customer;

public class RoomDetailsModel : PageModel
{
    private readonly ApplicationDbContext _context;
    private readonly CurrencyHelper _currencyHelper;

    public RoomDetailsModel(ApplicationDbContext context, CurrencyHelper currencyHelper)
    {
        _context = context;
        _currencyHelper = currencyHelper;
    }

    public string Currency { get; set; } = "USD";
    public string FormattedPrice { get; set; } = string.Empty;
    public string FormattedTax { get; set; } = string.Empty;
    public string FormattedTotal { get; set; } = string.Empty;

    [BindProperty(SupportsGet = true)]
    public int? Id { get; set; }

    public Room? Room { get; set; }
    public IReadOnlyList<string> GalleryImages { get; private set; } = new List<string>();
    public IReadOnlyList<string> Amenities { get; private set; } = new List<string>();
    public IReadOnlyList<ReviewItem> Reviews { get; private set; } = new List<ReviewItem>();
    public IReadOnlyList<RelatedRoom> RelatedRooms { get; private set; } = new List<RelatedRoom>();

    public async Task<IActionResult> OnGetAsync()
    {
        if (!Id.HasValue)
        {
            return RedirectToPage("/Customer/Rooms");
        }

        Room = await _context.Rooms
            .Include(r => r.RoomType)
            .FirstOrDefaultAsync(r => r.RoomId == Id.Value);

        if (Room == null)
        {
            return RedirectToPage("/Customer/Rooms");
        }

        // Get currency and format prices (all in RWF)
        Currency = await _currencyHelper.GetCurrencyAsync();
        var tax = Room.CurrentPrice * 0.1m; // Tax in RWF
        var total = Room.CurrentPrice + tax; // Total in RWF
        FormattedPrice = _currencyHelper.FormatPrice(Room.CurrentPrice, Currency);
        FormattedTax = _currencyHelper.FormatPrice(tax, Currency);
        FormattedTotal = _currencyHelper.FormatPrice(total, Currency);

        // Parse image URLs from comma-separated string
        if (!string.IsNullOrEmpty(Room.ImageUrls))
        {
            GalleryImages = Room.ImageUrls
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(url => url.Trim())
                .Where(url => !string.IsNullOrEmpty(url))
                .ToList();
        }

        // If no images, use default placeholder
        if (GalleryImages.Count == 0)
        {
            GalleryImages = new List<string>
            {
                "https://images.unsplash.com/photo-1501117716987-c8e1ecb210cc?auto=format&fit=crop&w=1200&q=80"
            };
        }

        // Load amenities from RoomType
        if (!string.IsNullOrEmpty(Room.RoomType?.Amenities))
        {
            Amenities = Room.RoomType.Amenities
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(a => a.Trim())
                .Where(a => !string.IsNullOrEmpty(a))
                .ToList();
        }
        else
        {
            Amenities = new List<string> { "Standard amenities" };
        }

        // Load reviews for this room
        var roomReviews = await _context.Reviews
            .Include(r => r.Booking)
            .Include(r => r.Customer)
            .Where(r => r.Booking != null && r.Booking.RoomId == Room.RoomId)
            .Select(r => new ReviewItem(
                r.Customer != null 
                    ? $"{r.Customer.FirstName} {r.Customer.LastName}".Trim()
                    : "Anonymous",
                r.Rating,
                "Guest",
                r.Comment ?? "No comment provided"
            ))
            .Take(3)
            .ToListAsync();

        Reviews = roomReviews.Count > 0 
            ? roomReviews 
            : new List<ReviewItem>
            {
                new("Guest", 5, "Verified Guest", "Great room with excellent amenities and service."),
                new("Guest", 4, "Verified Guest", "Comfortable stay with modern facilities."),
                new("Guest", 5, "Verified Guest", "Highly recommended for a relaxing experience.")
            };

        // Load related rooms (other available rooms of different types)
        var relatedRooms = await _context.Rooms
            .Include(r => r.RoomType)
            .Where(r => r.RoomId != Room.RoomId && r.Status == "available" && r.RoomTypeId != Room.RoomTypeId)
            .OrderBy(r => r.CurrentPrice)
            .Take(3)
            .ToListAsync();

        var relatedRoomsList = relatedRooms.Select(r => new RelatedRoom(
            r.RoomType != null ? r.RoomType.TypeName : $"Room {r.RoomNumber}",
            $"{_currencyHelper.FormatPrice(r.CurrentPrice, Currency)} / night"
        )).ToList();

        RelatedRooms = relatedRoomsList.Count > 0
            ? relatedRoomsList
            : new List<RelatedRoom>
            {
                new("Other Rooms Available", "Check availability")
            };

        return Page();
    }

    public record ReviewItem(string Name, int Rating, string Title, string Quote);
    public record RelatedRoom(string Name, string Price);
}

