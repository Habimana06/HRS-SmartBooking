using System.Collections.Generic;
using HRS_SmartBooking.Data;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Manager;

public class ManageAmenitiesModel : PageModel
{
    private readonly ApplicationDbContext _context;

    public ManageAmenitiesModel(ApplicationDbContext context)
    {
        _context = context;
    }

    public List<AmenityRow> Amenities { get; set; } = new();

    public async Task OnGetAsync()
    {
        // Get all room types with their amenities
        var roomTypes = await _context.RoomTypes
            .Include(rt => rt.Rooms)
            .ToListAsync();

        // Extract all unique amenities from room types
        var amenityDict = new Dictionary<string, (string Category, int RoomCount)>();

        foreach (var roomType in roomTypes)
        {
            if (!string.IsNullOrEmpty(roomType.Amenities))
            {
                var amenities = roomType.Amenities.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(a => a.Trim())
                    .Where(a => !string.IsNullOrEmpty(a));

                foreach (var amenity in amenities)
                {
                    if (!amenityDict.ContainsKey(amenity))
                    {
                        amenityDict[amenity] = (GetCategory(amenity), 0);
                    }
                    amenityDict[amenity] = (amenityDict[amenity].Category, amenityDict[amenity].RoomCount + roomType.Rooms.Count);
                }
            }
        }

        Amenities = amenityDict.Select(kvp => new AmenityRow(
            GetIcon(kvp.Key),
            kvp.Key,
            kvp.Value.Category,
            GetDescription(kvp.Key),
            kvp.Value.RoomCount,
            "Active"
        )).OrderBy(a => a.Name).ToList();
    }

    private static string GetIcon(string amenity) => amenity.ToLower() switch
    {
        var a when a.Contains("wifi") || a.Contains("wi-fi") => "bi-wifi",
        var a when a.Contains("tv") => "bi-tv",
        var a when a.Contains("shower") => "bi-droplet",
        var a when a.Contains("safe") => "bi-shield-lock",
        var a when a.Contains("light") => "bi-lightning",
        var a when a.Contains("bar") => "bi-cup-straw",
        _ => "bi-star"
    };

    private static string GetCategory(string amenity) => amenity.ToLower() switch
    {
        var a when a.Contains("wifi") || a.Contains("tv") || a.Contains("light") => "Electronics",
        var a when a.Contains("shower") || a.Contains("bath") => "Bathroom",
        var a when a.Contains("safe") => "Safety",
        var a when a.Contains("bar") || a.Contains("butler") => "Luxury",
        _ => "Comfort"
    };

    private static string GetDescription(string amenity) => $"Available in {amenity} rooms";

    public record AmenityRow(string Icon, string Name, string Category, string Description, int RoomCount, string Status);
}

