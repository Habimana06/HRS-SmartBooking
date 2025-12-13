using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace HRS_SmartBooking.Pages.Receptionist;

public class ProfileModel : PageModel
{
    private readonly AuthService _authService;

    public ProfileModel(AuthService authService)
    {
        _authService = authService;
    }

    public string FullName { get; private set; } = "Reception Agent";
    public string Email { get; private set; } = "agent@hotelconnect.com";
    public string Phone { get; private set; } = "+1 202 555 0147";
    public bool PushEnabled { get; set; } = true;
    public bool AlertsEnabled { get; set; } = true;

    public void OnGet()
    {
        if (_authService.GetCurrentUserId() != null)
        {
            var first = HttpContext.Session.GetString("FirstName") ?? "Reception";
            var last = HttpContext.Session.GetString("LastName") ?? "Agent";
            FullName = $"{first} {last}".Trim();
            Email = HttpContext.Session.GetString("Email") ?? Email;
            Phone = HttpContext.Session.GetString("PhoneNumber") ?? Phone;
        }
    }
}

