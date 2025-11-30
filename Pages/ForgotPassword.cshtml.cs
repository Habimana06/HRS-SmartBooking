using Microsoft.AspNetCore.Mvc.RazorPages;

namespace HRS_SmartBooking.Pages;

public class ForgotPasswordModel : PageModel
{
    public string? StatusMessage { get; private set; }

    public void OnGet()
    {
    }
}

