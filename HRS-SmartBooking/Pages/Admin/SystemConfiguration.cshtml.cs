using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace HRS_SmartBooking.Pages.Admin;

public class SystemConfigurationModel : PageModel
{
    private readonly CurrencyHelper _currencyHelper;

    public SystemConfigurationModel(CurrencyHelper currencyHelper)
    {
        _currencyHelper = currencyHelper;
    }

    [BindProperty]
    public string Currency { get; set; } = "RWF";

    public string? SuccessMessage { get; set; }
    public string? ErrorMessage { get; set; }

    public async Task OnGetAsync()
    {
        Currency = await _currencyHelper.GetCurrencyAsync();
    }

    public async Task<IActionResult> OnPostAsync()
    {
        try
        {
            if (Currency != "USD" && Currency != "RWF")
            {
                ErrorMessage = "Currency must be either USD or RWF";
                return Page();
            }

            await _currencyHelper.SetCurrencyAsync(Currency);
            SuccessMessage = "Currency setting updated successfully!";
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Error updating currency: {ex.Message}";
        }

        return Page();
    }
}

