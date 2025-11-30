using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace HRS_SmartBooking.Pages.Admin;

public class BackupRestoreModel : PageModel
{
    public IReadOnlyList<BackupItem> History { get; } =
        new List<BackupItem>
        {
            new("Full backup", "Nov 24 03:00", "Cloud + Local", "Success"),
            new("Diff backup", "Nov 23 03:00", "Cloud", "Success"),
            new("Full backup", "Nov 22 03:00", "Cloud + Local", "Success"),
            new("Restore test", "Nov 21 14:00", "Sandbox", "Success")
        };

    public void OnGet()
    {
    }

    public record BackupItem(string Type, string Time, string Location, string Status);
}

