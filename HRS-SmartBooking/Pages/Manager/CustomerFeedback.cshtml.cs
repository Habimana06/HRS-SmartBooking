using System.Collections.Generic;
using HRS_SmartBooking.Data;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Manager;

public class CustomerFeedbackModel : PageModel
{
    private readonly ApplicationDbContext _context;

    public CustomerFeedbackModel(ApplicationDbContext context)
    {
        _context = context;
    }

    public List<FeedbackRow> Feedback { get; set; } = new();

    public async Task OnGetAsync()
    {
        // Get reviews
        var reviews = await _context.Reviews
            .Include(r => r.Customer)
            .Include(r => r.Booking)
                .ThenInclude(b => b!.Room)
            .OrderByDescending(r => r.CreatedAt)
            .Take(50)
            .ToListAsync();

        // Get complaints/feedback
        var complaints = await _context.Complaints
            .Include(c => c.Customer)
            .OrderByDescending(c => c.CreatedAt)
            .Take(50)
            .ToListAsync();

        var feedbackList = new List<FeedbackRow>();

        // Combine reviews and complaints with their creation dates
        var allFeedback = new List<(FeedbackRow Row, DateTime CreatedAt)>();

        // Add reviews
        allFeedback.AddRange(reviews.Select(r => (
            new FeedbackRow(
                $"{r.Customer?.FirstName ?? "Unknown"} {r.Customer?.LastName ?? ""}".Trim(),
                r.Booking?.Room?.RoomNumber ?? "N/A",
                r.CreatedAt.ToString("MMM dd"),
                r.Rating,
                r.Comment ?? "No comment",
                r.CreatedAt < DateTime.Now.AddDays(-7) ? "Resolved" : "Pending"
            ),
            r.CreatedAt
        )));

        // Add complaints/feedback (treat as rating 0 for display purposes, but show as feedback)
        allFeedback.AddRange(complaints.Select(c => (
            new FeedbackRow(
                $"{c.Customer?.FirstName ?? "Unknown"} {c.Customer?.LastName ?? ""}".Trim(),
                "Feedback",
                c.CreatedAt.ToString("MMM dd"),
                0, // No rating for feedback
                $"{c.Subject}: {c.Description}",
                c.Status == "resolved" || c.Status == "closed" ? "Resolved" : "Pending"
            ),
            c.CreatedAt
        )));

        // Sort by creation date and take top 50
        Feedback = allFeedback
            .OrderByDescending(f => f.CreatedAt)
            .Take(50)
            .Select(f => f.Row)
            .ToList();
    }

    public record FeedbackRow(string Name, string Room, string Date, int Rating, string Comment, string Status);
}

