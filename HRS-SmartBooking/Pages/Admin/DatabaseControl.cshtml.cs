using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace HRS_SmartBooking.Pages.Admin;

public class DatabaseControlModel : PageModel
{
    public IReadOnlyList<DbTable> Tables { get; } =
        new List<DbTable>
        {
            new("Users", 2430, "Id, Email, Role, Created"),
            new("Rooms", 215, "Id, Number, Type, Status"),
            new("Bookings", 5820, "Id, UserId, RoomId, Dates"),
            new("Payments", 3104, "Id, BookingId, Amount, Status"),
            new("Logs", 98210, "Id, Action, UserId, Timestamp")
        };

    public void OnGet()
    {
    }

    public record DbTable(string Name, int Rows, string Columns);
}

