using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace HRS_SmartBooking.Pages.Preferences;

[IgnoreAntiforgeryToken(Order = 1001)]
public class UpdateModel : PageModel
{
    private readonly UserPreferenceService _preferenceService;

    public UpdateModel(UserPreferenceService preferenceService)
    {
        _preferenceService = preferenceService;
    }

    public IActionResult OnGet()
    {
        return Redirect(Request.Headers["Referer"].ToString() ?? "/");
    }

    public async Task<IActionResult> OnPostThemeAsync([FromForm] string mode)
    {
        await _preferenceService.SetThemeAsync(mode);
        return Redirect(Request.Headers["Referer"].ToString() ?? "/");
    }

    public async Task<IActionResult> OnPostLanguageAsync([FromForm] string locale)
    {
        await _preferenceService.SetLanguageAsync(locale);
        return Redirect(Request.Headers["Referer"].ToString() ?? "/");
    }
}

