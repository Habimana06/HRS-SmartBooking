using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using HRS_SmartBooking.Attributes;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using HRS_SmartBooking.Data;

namespace HRS_SmartBooking.Pages.Customer;

[AuthorizeRole("Customer")]
public class ProfileModel : PageModel
{
    private readonly UserService _userService;
    private readonly AuthService _authService;

    public ProfileModel(UserService userService, AuthService authService)
    {
        _userService = userService;
        _authService = authService;
    }

    [BindProperty]
    public User EditableUser { get; set; } = new();

    public async Task OnGetAsync()
    {
        var userId = _authService.GetCurrentUserId();
        if (userId != null)
        {
            var user = await _userService.GetUserByIdAsync(int.Parse(userId));
            if (user != null)
            {
                EditableUser = user;
                EditableUser.ThemePreference = "dark";
                EditableUser.PreferredLanguage ??= "ENG";
            }
        }
    }

    public async Task<IActionResult> OnPostAsync()
    {
        if (!ModelState.IsValid)
        {
            return Page();
        }

        EditableUser.ThemePreference = "dark";
        EditableUser.PreferredLanguage ??= "ENG";
        await _userService.UpdateUserAsync(EditableUser);
        return RedirectToPage("/Customer/Home");
    }
}

