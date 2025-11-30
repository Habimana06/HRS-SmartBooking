using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace HRS_SmartBooking.Pages.Customer;

public class SupportModel : PageModel
{
    private readonly ApplicationDbContext _context;
    private readonly AuthService _authService;

    public SupportModel(ApplicationDbContext context, AuthService authService)
    {
        _context = context;
        _authService = authService;
    }

    [BindProperty]
    public SupportInput Input { get; set; } = new();

    public string? SuccessMessage { get; set; }
    public string? ErrorMessage { get; set; }

    public void OnGet()
    {
    }

    public async Task<IActionResult> OnPostSendMessageAsync()
    {
        if (!ModelState.IsValid)
        {
            ErrorMessage = "Please fill in all required fields.";
            return Page();
        }

        // Check session - support both Int32 and String formats
        var userId = HttpContext.Session.GetInt32("UserId");
        if (userId == null)
        {
            // Try fallback: check if stored as string
            var userIdString = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var parsedId))
            {
                ErrorMessage = "Please log in to send a message.";
                TempData["ReturnUrl"] = "/Customer/Support";
                return RedirectToPage("/Login");
            }
            userId = parsedId;
        }

        try
        {
            var complaint = new Complaint
            {
                CustomerId = userId.Value,
                Subject = Input.Subject,
                Description = Input.Description,
                Category = Input.Category,
                Status = "open",
                Priority = "medium",
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.Complaints.Add(complaint);
            await _context.SaveChangesAsync();

            SuccessMessage = "Your message has been sent to our support team. We'll get back to you soon!";
            Input = new SupportInput();
            return Page();
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Error sending message: {ex.Message}";
            return Page();
        }
    }

    public class SupportInput
    {
        [Required]
        [MaxLength(200)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Category { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;
    }
}

