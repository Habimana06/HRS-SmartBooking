using Microsoft.AspNetCore.Mvc.RazorPages;

namespace HRS_SmartBooking.Pages.Admin;

public class ProfileModel : PageModel
{
    public string FullName { get; private set; } = "System Admin";
    public string Email { get; private set; } = "admin@hrsbooking.com";
    public string Phone { get; private set; } = "+1 333 555 0188";

    public void OnGet()
    {
        var first = HttpContext.Session.GetString("FirstName");
        var last = HttpContext.Session.GetString("LastName");
        var email = HttpContext.Session.GetString("Email");
        var phone = HttpContext.Session.GetString("PhoneNumber");

        if (!string.IsNullOrWhiteSpace(first) || !string.IsNullOrWhiteSpace(last))
        {
            FullName = $"{first} {last}".Trim();
        }

        if (!string.IsNullOrWhiteSpace(email))
        {
            Email = email;
        }

        if (!string.IsNullOrWhiteSpace(phone))
        {
            Phone = phone;
        }
    }
}

