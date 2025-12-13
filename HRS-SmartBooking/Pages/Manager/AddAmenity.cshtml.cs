using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace HRS_SmartBooking.Pages.Manager;

public class AddAmenityModel : PageModel
{
    public IReadOnlyList<string> Categories { get; } =
        new List<string>
        {
            "Comfort",
            "Bathroom",
            "Electronics",
            "Luxury",
            "Safety",
            "Smart Features",
            "Kitchenette"
        };

    public IReadOnlyList<string> Icons { get; } =
        new List<string> { "bi-wifi", "bi-droplet", "bi-tv", "bi-lightning", "bi-shield-lock", "bi-cup-hot" };

    public void OnGet()
    {
    }
}

