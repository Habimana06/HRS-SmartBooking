using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace HRS_SmartBooking.Pages.Customer;

public class IndexModel : PageModel
{
    public IActionResult OnGet()
    {
        return RedirectToPage("./Home");
    }
}


