using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace HRS_SmartBooking.Pages;

public class LoginModel : PageModel
{
    private readonly AuthService _authService;

    public LoginModel(AuthService authService)
    {
        _authService = authService;
    }

    [BindProperty]
    public string Email { get; set; } = string.Empty;

    [BindProperty]
    public string Password { get; set; } = string.Empty;

    public string? ErrorMessage { get; set; }

    public IActionResult OnGet()
    {
        if (_authService.IsAuthenticated())
        {
            return RedirectToRoleDashboard();
        }
        return Page();
    }

    public async Task<IActionResult> OnPostAsync()
    {
        if (!ModelState.IsValid)
        {
            return Page();
        }

        var user = await _authService.LoginAsync(Email, Password);
        if (user == null)
        {
            ErrorMessage = "Invalid email or password.";
            return Page();
        }

        _authService.SetUserSession(user);
        return RedirectToRoleDashboard(user.Role);
    }

    private IActionResult RedirectToRoleDashboard(string? role = null)
    {
        role ??= _authService.GetCurrentUserRole();
        return role switch
        {
            "Admin" => RedirectToPage("/Admin/Dashboard"),
            "Manager" => RedirectToPage("/Manager/Dashboard"),
            "Receptionist" => RedirectToPage("/Receptionist/Dashboard"),
            "Customer" => RedirectToPage("/Customer/Home"),
            _ => RedirectToPage("/Login")
        };
    }

}

