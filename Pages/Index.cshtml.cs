using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using HRS_SmartBooking.Services;

namespace HRS_SmartBooking.Pages;

public class IndexModel : PageModel
{
    private readonly AuthService _authService;

    public IndexModel(AuthService authService)
    {
        _authService = authService;
    }

    public IActionResult OnGet()
    {
        if (_authService.IsAuthenticated())
        {
            var role = _authService.GetCurrentUserRole();
            return role switch
            {
                "Admin" => RedirectToPage("/Admin/Dashboard"),
                "Manager" => RedirectToPage("/Manager/Dashboard"),
                "Receptionist" => RedirectToPage("/Receptionist/Dashboard"),
                "Customer" => RedirectToPage("/Customer/Home"),
                _ => RedirectToPage("/Login")
            };
        }
        return RedirectToPage("/Login");
    }
}
