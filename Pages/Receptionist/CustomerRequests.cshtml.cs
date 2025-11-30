using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Receptionist;

public class CustomerRequestsModel : PageModel
{
    private readonly ApplicationDbContext _context;

    public CustomerRequestsModel(ApplicationDbContext context)
    {
        _context = context;
    }

    public List<RequestItem> Requests { get; set; } = new();

    public async Task OnGetAsync()
    {
        // Get complaints/requests from database
        var complaints = await _context.Complaints
            .Include(c => c.Customer)
            .Include(c => c.Booking)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        Requests = complaints.Select(c => new RequestItem(
            $"{c.Customer?.FirstName ?? ""} {c.Customer?.LastName ?? ""}".Trim(),
            c.Subject,
            c.Priority ?? "Medium",
            c.Status ?? "open"
        )).ToList();
    }

    public record RequestItem(string Guest, string Message, string Priority, string Status);
}

