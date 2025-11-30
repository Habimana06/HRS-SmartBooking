using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace HRS_SmartBooking.Pages.Admin;

public class StaffManagementModel : PageModel
{
    public IReadOnlyList<StaffRow> Staff { get; } =
        new List<StaffRow>
        {
            new("Ava Lewis", "Receptionist Lead", "Reception", "Active", "92%", "Excellent"),
            new("Jonah Kim", "Technician", "Engineering", "Active", "88%", "Great"),
            new("Sara Brooks", "Cleaner", "Housekeeping", "On Leave", "80%", "Fair"),
            new("Leo Torres", "Security", "Security", "Active", "95%", "Excellent"),
            new("Maya Singh", "Manager", "Operations", "Active", "90%", "Great")
        };

    public void OnGet()
    {
    }

    public record StaffRow(string Name, string Role, string Department, string Status, string Performance, string Rating);
}

