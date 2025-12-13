using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Receptionist;

public class RoomAvailabilityModel : PageModel
{
    private readonly ApplicationDbContext _context;

    public RoomAvailabilityModel(ApplicationDbContext context)
    {
        _context = context;
    }

    public List<RoomStatus> Rooms { get; set; } = new();

    public async Task OnGetAsync()
    {
        var rooms = await _context.Rooms
            .Include(r => r.RoomType)
            .OrderBy(r => r.RoomNumber)
            .ToListAsync();

        Rooms = rooms.Select(r => new RoomStatus(
            r.RoomNumber,
            r.RoomType?.TypeName ?? "Unknown",
            r.Status
        )).ToList();
    }

    public record RoomStatus(string RoomNumber, string Type, string Status);
}

