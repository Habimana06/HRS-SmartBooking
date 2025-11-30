using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace HRS_SmartBooking.Pages.Admin;

public class SecurityCenterModel : PageModel
{
    public IReadOnlyList<SecurityCard> SecurityStats { get; } =
        new List<SecurityCard>
        {
            new("Failed logins (24h)", "14 attempts", "bi-door-closed"),
            new("Blocked IPs", "6 active blocks", "bi-shield-lock"),
            new("2FA compliance", "96% enabled", "bi-phone"),
            new("Active sessions", "312 devices", "bi-display"),
            new("Password policy", "Strong", "bi-key"),
            new("Encryption status", "AES-256", "bi-lock")
        };

    public void OnGet()
    {
    }

    public record SecurityCard(string Title, string Detail, string Icon);
}

