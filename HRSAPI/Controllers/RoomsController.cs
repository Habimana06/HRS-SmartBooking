using HRS_SmartBooking.Data;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HRSAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoomsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly CurrencyHelper _currencyHelper;

    public RoomsController(ApplicationDbContext context, CurrencyHelper currencyHelper)
    {
        _context = context;
        _currencyHelper = currencyHelper;
    }

    public record RoomListingDto(
        int RoomId,
        string Name,
        decimal Rating,
        string Price,
        string Details,
        IEnumerable<string> Features,
        List<string> ImageUrls
    );

    public record RoomDetailsDto(
        int RoomId,
        string Name,
        string Description,
        string Price,
        string Tax,
        string Total,
        IEnumerable<string> Amenities,
        List<string> GalleryImages,
        IEnumerable<ReviewItemDto> Reviews,
        IEnumerable<RelatedRoomDto> RelatedRooms
    );

    public record ReviewItemDto(string Name, int Rating, string Title, string Quote);

    public record RelatedRoomDto(string Name, string Price);

    [HttpGet]
    public async Task<IActionResult> GetRooms([FromQuery] DateTime? checkIn, [FromQuery] DateTime? checkOut,
        [FromQuery] int? guests, [FromQuery] string? roomType)
    {
        var currency = await _currencyHelper.GetCurrencyAsync();

        var query = _context.Rooms
            .Include(r => r.RoomType)
            .Where(r => r.Status == "available");

        if (!string.IsNullOrEmpty(roomType))
        {
            query = query.Where(r => r.RoomType != null && r.RoomType.TypeName == roomType);
        }

        if (guests.HasValue && guests.Value > 0)
        {
            query = query.Where(r => r.RoomType != null && r.RoomType.MaxOccupancy >= guests.Value);
        }

        var rooms = await query.ToListAsync();

        // Filter out rooms that have conflicting bookings for the requested dates
        if (checkIn.HasValue && checkOut.HasValue)
        {
            var checkInDate = checkIn.Value.Date;
            var checkOutDate = checkOut.Value.Date;

            var bookedRoomIds = await _context.Bookings
                .Where(b => b.BookingStatus != "Cancelled" 
                    && b.BookingStatus != "Checked-out"
                    && b.BookingStatus != "Checked-Out"
                    && b.CheckOutDate > checkInDate 
                    && b.CheckInDate < checkOutDate)
                .Select(b => b.RoomId)
                .Distinct()
                .ToListAsync();

            rooms = rooms.Where(r => !bookedRoomIds.Contains(r.RoomId)).ToList();
        }

        var roomRatings = await _context.Reviews
            .Include(r => r.Booking)
            .GroupBy(r => r.Booking!.RoomId)
            .Select(g => new { RoomId = g.Key, AvgRating = g.Average(r => (decimal?)r.Rating) ?? 0 })
            .ToListAsync();

        var result = rooms.Select(r =>
        {
            var rating = roomRatings.FirstOrDefault(rt => rt.RoomId == r.RoomId)?.AvgRating ?? 4.5m;
            var amenities = !string.IsNullOrEmpty(r.RoomType?.Amenities)
                ? r.RoomType.Amenities.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(a => a.Trim()).ToArray()
                : new[] { "Standard amenities" };

            var imageUrls = !string.IsNullOrEmpty(r.ImageUrls)
                ? r.ImageUrls.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(url => url.Trim())
                    .Where(url => !string.IsNullOrEmpty(url))
                    .ToList()
                : new List<string>();

            if (!imageUrls.Any())
            {
                imageUrls.Add("https://images.unsplash.com/photo-1501117716987-c8e1ecb210cc?auto=format&fit=crop&w=900&q=80");
            }

            return new RoomListingDto(
                r.RoomId,
                r.RoomType?.TypeName ?? $"Room {r.RoomNumber}",
                rating,
                _currencyHelper.FormatPrice(r.CurrentPrice, currency),
                $"{r.RoomType?.MaxOccupancy ?? 2} Guests • {r.Description ?? "Comfortable room"}",
                amenities,
                imageUrls
            );
        });

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetRoomDetails(int id)
    {
        var room = await _context.Rooms
            .Include(r => r.RoomType)
            .FirstOrDefaultAsync(r => r.RoomId == id);

        if (room == null)
        {
            return NotFound();
        }

        var currency = await _currencyHelper.GetCurrencyAsync();
        var tax = room.CurrentPrice * 0.1m;
        var total = room.CurrentPrice + tax;

        var galleryImages = !string.IsNullOrEmpty(room.ImageUrls)
            ? room.ImageUrls
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(url => url.Trim())
                .Where(url => !string.IsNullOrEmpty(url))
                .ToList()
            : new List<string>();

        if (galleryImages.Count == 0)
        {
            galleryImages = new List<string>
            {
                "https://images.unsplash.com/photo-1501117716987-c8e1ecb210cc?auto=format&fit=crop&w=1200&q=80"
            };
        }

        var amenities = !string.IsNullOrEmpty(room.RoomType?.Amenities)
            ? room.RoomType.Amenities
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(a => a.Trim())
                .Where(a => !string.IsNullOrEmpty(a))
                .ToList()
            : new List<string> { "Standard amenities" };

        var roomReviews = await _context.Reviews
            .Include(r => r.Booking)
            .Include(r => r.Customer)
            .Where(r => r.Booking != null && r.Booking.RoomId == room.RoomId)
            .Select(r => new ReviewItemDto(
                r.Customer != null
                    ? $"{r.Customer.FirstName} {r.Customer.LastName}".Trim()
                    : "Anonymous",
                r.Rating,
                "Guest",
                r.Comment ?? "No comment provided"
            ))
            .Take(3)
            .ToListAsync();

        if (!roomReviews.Any())
        {
            roomReviews = new List<ReviewItemDto>
            {
                new("Guest", 5, "Verified Guest", "Great room with excellent amenities and service."),
                new("Guest", 4, "Verified Guest", "Comfortable stay with modern facilities."),
                new("Guest", 5, "Verified Guest", "Highly recommended for a relaxing experience.")
            };
        }

        var relatedRooms = await _context.Rooms
            .Include(r => r.RoomType)
            .Where(r => r.RoomId != room.RoomId && r.Status == "available" && r.RoomTypeId != room.RoomTypeId)
            .OrderBy(r => r.CurrentPrice)
            .Take(3)
            .ToListAsync();

        var relatedRoomDtos = relatedRooms.Any()
            ? relatedRooms.Select(r => new RelatedRoomDto(
                r.RoomType != null ? r.RoomType.TypeName : $"Room {r.RoomNumber}",
                _currencyHelper.FormatPrice(r.CurrentPrice, currency) + " / night"
            ))
            : new[]
            {
                new RelatedRoomDto("Other Rooms Available", "Check availability")
            };

        var dto = new RoomDetailsDto(
            room.RoomId,
            room.RoomType?.TypeName ?? $"Room {room.RoomNumber}",
            room.Description ?? room.RoomType?.Description ?? "Comfortable room",
            _currencyHelper.FormatPrice(room.CurrentPrice, currency),
            _currencyHelper.FormatPrice(tax, currency),
            _currencyHelper.FormatPrice(total, currency),
            amenities,
            galleryImages,
            roomReviews,
            relatedRoomDtos
        );

        return Ok(dto);
    }
}


