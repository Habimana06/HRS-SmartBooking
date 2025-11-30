using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using HRS_SmartBooking.Services;

namespace HRS_SmartBooking.Pages;

[IgnoreAntiforgeryToken]
public class LogoutModel : PageModel
{
    private readonly AuthService _authService;
    private readonly ILogger<LogoutModel> _logger;

    public LogoutModel(AuthService authService, ILogger<LogoutModel> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    public IActionResult OnGet()
    {
        try
        {
            // Clear all session data using AuthService
            _authService.ClearSession();
            
            // Clear session explicitly (redundant but ensures cleanup)
            HttpContext.Session.Clear();
            
            _logger.LogInformation("User logged out successfully");
            
            // Redirect to login with cache prevention headers
            Response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate");
            Response.Headers.Add("Pragma", "no-cache");
            Response.Headers.Add("Expires", "0");
            
            return Redirect("/Login");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            // Even if there's an error, try to redirect to login
            return Redirect("/Login");
        }
    }

    public IActionResult OnPost()
    {
        return OnGet();
    }
}

