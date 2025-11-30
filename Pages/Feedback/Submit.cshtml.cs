using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Feedback;

public class SubmitModel : PageModel
{
    private readonly ApplicationDbContext _context;
    private readonly AuthService _authService;

    public SubmitModel(ApplicationDbContext context, AuthService authService)
    {
        _context = context;
        _authService = authService;
    }

    [BindProperty]
    public string? UserRole { get; set; }

    [BindProperty]
    public string? Subject { get; set; }

    [BindProperty]
    public string? Message { get; set; }

    public async Task<IActionResult> OnPostAsync()
    {
        if (string.IsNullOrEmpty(Subject) || string.IsNullOrEmpty(Message))
        {
            TempData["FeedbackError"] = "Please fill in both subject and message.";
            return Redirect(Request.Headers["Referer"].ToString());
        }

        try
        {
            var userId = _authService.GetCurrentUserIdInt();
            if (userId == null)
            {
                TempData["FeedbackError"] = "Please log in to submit feedback.";
                return Redirect(Request.Headers["Referer"].ToString());
            }

            var user = await _context.Users.FindAsync(userId.Value);

            // Create a complaint/feedback record
            var complaint = new Complaint
            {
                CustomerId = userId.Value,
                Subject = Subject,
                Description = Message,
                Status = "pending",
                Priority = UserRole == "Manager" ? "high" : "medium",
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.Complaints.Add(complaint);
            await _context.SaveChangesAsync();

            TempData["FeedbackSuccess"] = "Thank you for your feedback! We'll review it and get back to you soon.";
        }
        catch (Exception)
        {
            TempData["FeedbackError"] = "An error occurred while submitting your feedback. Please try again.";
        }

        return Redirect(Request.Headers["Referer"].ToString());
    }
}

