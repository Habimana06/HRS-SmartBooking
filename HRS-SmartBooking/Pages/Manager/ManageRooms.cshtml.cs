using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Manager;

public class ManageRoomsModel : PageModel
{
    private readonly ApplicationDbContext _context;
    private readonly CurrencyHelper _currencyHelper;

    public ManageRoomsModel(ApplicationDbContext context, CurrencyHelper currencyHelper)
    {
        _context = context;
        _currencyHelper = currencyHelper;
    }

    public string Currency { get; set; } = "RWF";

    public List<RoomRow> Rooms { get; set; } = new();

    public async Task OnGetAsync()
    {
        Currency = await _currencyHelper.GetCurrencyAsync();
        var rooms = await _context.Rooms
            .Include(r => r.RoomType)
            .OrderBy(r => r.RoomNumber)
            .ToListAsync();

        Rooms = rooms.Select(r =>
        {
            var amenityCount = !string.IsNullOrEmpty(r.RoomType?.Amenities)
                ? r.RoomType.Amenities.Split(',', StringSplitOptions.RemoveEmptyEntries).Length
                : 0;

            var imageCount = !string.IsNullOrEmpty(r.ImageUrls)
                ? r.ImageUrls.Split(',', StringSplitOptions.RemoveEmptyEntries).Length
                : 0;

            // CurrentPrice is stored in RWF, display as-is
            var displayPrice = r.CurrentPrice;
            return new RoomRow(
                r.RoomId,
                r.RoomNumber,
                r.RoomType?.TypeName ?? "Unknown",
                _currencyHelper.FormatPrice(displayPrice, Currency),
                r.Status,
                amenityCount,
                imageCount
            );
        }).ToList();
    }

    public record RoomRow(int RoomId, string Number, string Type, string Price, string Status, int AmenityCount, int ImageCount);
}

