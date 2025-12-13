using HRS_SmartBooking.Data;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Admin;

public class RolesPermissionsModel : PageModel
{
    private readonly ApplicationDbContext _context;

    public RolesPermissionsModel(ApplicationDbContext context)
    {
        _context = context;
    }

    public List<RoleCard> Roles { get; set; } = new();
    public List<PermissionCategory> PermissionMatrix { get; set; } = new();

    public async Task OnGetAsync()
    {
        // Get roles from database with member counts
        var roleGroups = await _context.Users
            .GroupBy(u => u.Role)
            .Select(g => new { Role = g.Key, Count = g.Count() })
            .ToListAsync();

        Roles = roleGroups.Select(r => new RoleCard(
            r.Role,
            GetRoleDescription(r.Role),
            r.Count
        )).ToList();

        // If no roles found, add default roles
        if (!Roles.Any())
        {
            Roles = new List<RoleCard>
            {
                new("Admin", "Full system access", 0),
                new("Manager", "Operational control", 0),
                new("Receptionist", "Front desk portal", 0),
                new("Customer", "Customer access", 0)
            };
        }

        PermissionMatrix = new List<PermissionCategory>
        {
            new("Customer pages", new[] { "View", "Edit", "Delete" }),
            new("Receptionist module", new[] { "View", "Create", "Approve" }),
            new("Manager controls", new[] { "View", "Edit" }),
            new("Admin controls", new[] { "View", "Edit", "Assign" }),
            new("Financial module", new[] { "View", "Refund", "Export" }),
            new("System settings", new[] { "View", "Edit", "Publish" }),
            new("Logs & reports", new[] { "View", "Export" }),
            new("Database", new[] { "View", "Backup", "Restore" })
        };
    }

    private string GetRoleDescription(string role) => role switch
    {
        "Admin" => "Full system access",
        "Manager" => "Operational control",
        "Receptionist" => "Front desk portal",
        "Customer" => "Customer access",
        _ => "User access"
    };

    public record RoleCard(string Name, string Description, int Members);
    public record PermissionCategory(string Name, IEnumerable<string> Permissions);
}

