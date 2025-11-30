using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace HRS_SmartBooking.Pages.Admin;

public class AuditLogsModel : PageModel
{
    public IReadOnlyList<LogRow> Logs { get; } =
        new List<LogRow>
        {
            new("Updated role permissions", "Admin Ava", "Admin", "Nov 24 09:41", "192.168.1.14", "Chrome", "Success"),
            new("Login attempt", "Unknown", "N/A", "Nov 24 09:32", "83.21.0.11", "Firefox", "Blocked"),
            new("Refund TX-88221", "Finance Leo", "Finance", "Nov 24 09:05", "10.0.0.5", "Edge", "Success"),
            new("Backup triggered", "Automation", "System", "Nov 24 08:45", "127.0.0.1", "Service", "Success"),
            new("Deleted user", "Admin Noah", "Admin", "Nov 24 08:12", "192.168.1.20", "Chrome", "Success")
        };

    public void OnGet()
    {
    }

    public record LogRow(string Action, string User, string Role, string Time, string Ip, string Device, string Status);
}

