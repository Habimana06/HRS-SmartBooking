using HRS_SmartBooking.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HRS_SmartBooking.Data;

public static class DatabaseSeeder
{
    private const string AdminEmail = "hntaganira06@gmail.com";
    private const string AdminPassword = "Hab,62001";

    public static async Task SeedAdminUserAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        await context.Database.EnsureCreatedAsync();

        var adminExists = await context.Users.AnyAsync(u => u.Email == AdminEmail);
        if (adminExists)
        {
            return;
        }

        var adminUser = new User
        {
            Email = AdminEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(AdminPassword),
            FirstName = "System",
            LastName = "Admin",
            Role = "Admin",
            IsVerified = true,
            IsActive = true,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        context.Users.Add(adminUser);
        await context.SaveChangesAsync();
    }
}

