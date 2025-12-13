using System.Collections.Generic;
using HRS_SmartBooking.Data;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Manager;

public class RoomTypesModel : PageModel
{
    private readonly ApplicationDbContext _context;
    private readonly CurrencyHelper _currencyHelper;

    public RoomTypesModel(ApplicationDbContext context, CurrencyHelper currencyHelper)
    {
        _context = context;
        _currencyHelper = currencyHelper;
    }

    public string Currency { get; set; } = "RWF";
    public List<RoomTypeCard> Types { get; set; } = new();

    public async Task OnGetAsync()
    {
        Currency = await _currencyHelper.GetCurrencyAsync();
        var roomTypes = await _context.RoomTypes
            .OrderBy(rt => rt.TypeName)
            .ToListAsync();

        Types = roomTypes.Select(rt =>
        {
            var amenities = !string.IsNullOrEmpty(rt.Amenities)
                ? rt.Amenities.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(a => a.Trim()).ToArray()
                : Array.Empty<string>();

            return new RoomTypeCard(
                rt.TypeName,
                _currencyHelper.FormatPrice(rt.BasePrice, Currency),
                rt.Description ?? "No description available",
                rt.MaxOccupancy,
                amenities
            );
        }).ToList();
    }

    public record RoomTypeCard(string Name, string BasePrice, string Description, int MaxOccupancy, IEnumerable<string> DefaultAmenities);
}

