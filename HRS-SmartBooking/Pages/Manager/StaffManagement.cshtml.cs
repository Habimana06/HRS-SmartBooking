using System.Collections.Generic;
using HRS_SmartBooking.Data;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Manager;

public class StaffManagementModel : PageModel
{
    private readonly ApplicationDbContext _context;

    public StaffManagementModel(ApplicationDbContext context)
    {
        _context = context;
    }

    public List<StaffRow> Staff { get; set; } = new();

    public async Task OnGetAsync()
    {
        var staff = await _context.Users
            .Where(u => u.Role == "Manager" || u.Role == "Receptionist")
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .ToListAsync();

        Staff = staff.Select(s => new StaffRow(
            $"{s.FirstName} {s.LastName}",
            s.Role,
            s.IsActive ? "Active" : "Inactive",
            GetDepartment(s.Role),
            GetPermissions(s.Role)
        )).ToList();
    }

    private static string GetDepartment(string role) => role switch
    {
        "Manager" => "Operations",
        "Receptionist" => "Front desk",
        _ => "General"
    };

    private static string GetPermissions(string role) => role switch
    {
        "Manager" => "Full access",
        "Receptionist" => "Limited",
        _ => "Basic"
    };

    public record StaffRow(string Name, string Role, string Status, string Department, string Permissions);
}

