using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using HRS_SmartBooking.Services;

namespace HRS_SmartBooking.Pages;

public class RegisterModel : PageModel
{
    private readonly AuthService _authService;

    public RegisterModel(AuthService authService)
    {
        _authService = authService;
    }

    [BindProperty]
    public string FirstName { get; set; } = string.Empty;

    [BindProperty]
    public string LastName { get; set; } = string.Empty;

    [BindProperty]
    public string Email { get; set; } = string.Empty;

    [BindProperty]
    public string? PhoneNumber { get; set; }

    [BindProperty]
    public string Password { get; set; } = string.Empty;

    [BindProperty]
    public string ConfirmPassword { get; set; } = string.Empty;

    public string? ErrorMessage { get; set; }

    public IActionResult OnGet()
    {
        if (_authService.IsAuthenticated())
        {
            return RedirectToPage("/Customer/Home");
        }
        return Page();
    }

    public async Task<IActionResult> OnPostAsync()
    {
        if (Password != ConfirmPassword)
        {
            ErrorMessage = "Passwords do not match.";
            return Page();
        }

        if (Password.Length < 6)
        {
            ErrorMessage = "Password must be at least 6 characters long.";
            return Page();
        }

        var user = await _authService.RegisterAsync(Email, Password, FirstName, LastName, PhoneNumber);
        if (user == null)
        {
            ErrorMessage = "Email already exists. Please use a different email.";
            return Page();
        }

        return RedirectToPage("/AccountCreated");
    }
}

