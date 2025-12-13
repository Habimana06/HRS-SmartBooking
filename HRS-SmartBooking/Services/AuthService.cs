using BCrypt.Net;
using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Services;

public class AuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuthService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<User?> LoginAsync(string email, string password)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email && u.IsActive);

        // Fail fast if no user or no stored hash
        if (user == null || string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            return null;
        }

        // BCrypt will throw if the hash is malformed; catch to avoid 500s
        try
        {
            if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            {
                return null;
            }
        }
        catch
        {
            return null;
        }

        user.LastLogin = DateTime.Now;
        await _context.SaveChangesAsync();

        return user;
    }

    public async Task<User?> RegisterAsync(string email, string password, string firstName, string lastName, string? phoneNumber)
    {
        if (await _context.Users.AnyAsync(u => u.Email == email))
        {
            return null; // Email already exists
        }

        var user = new User
        {
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            FirstName = firstName,
            LastName = lastName,
            PhoneNumber = phoneNumber,
            Role = "Customer",
            IsVerified = false,
            IsActive = true,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return user;
    }

    public async Task<User?> GetUserByIdAsync(int userId)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId && u.IsActive);
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Email == email && u.IsActive);
    }

    public void SetUserSession(User user)
    {
        var session = _httpContextAccessor.HttpContext?.Session;
        if (session != null)
        {
            // Store UserId as Int32 for consistency with GetInt32 calls
            session.SetInt32("UserId", user.UserId);
            session.SetString("Email", user.Email);
                session.SetString("Role", user.Role);
            session.SetString("FirstName", user.FirstName);
            session.SetString("LastName", user.LastName);
            session.SetString("PreferredLanguage", user.PreferredLanguage ?? "ENG");
                // Default to dark theme for new or existing users without a preference
                session.SetString("ThemePreference", string.IsNullOrWhiteSpace(user.ThemePreference)
                    ? "dark"
                    : user.ThemePreference);
        }
    }

    public void ClearSession()
    {
        var session = _httpContextAccessor.HttpContext?.Session;
        if (session != null)
        {
            // Clear all session data
            session.Clear();
            
            // Remove all individual session keys to ensure complete cleanup
            var keys = new[] { "UserId", "Email", "Role", "FirstName", "LastName", "PhoneNumber", "PreferredLanguage", "ThemePreference" };
            foreach (var key in keys)
            {
                session.Remove(key);
            }
        }
    }

    public string? GetCurrentUserId()
    {
        // Support both Int32 and String formats for backward compatibility
        var intValue = _httpContextAccessor.HttpContext?.Session.GetInt32("UserId");
        if (intValue.HasValue)
        {
            return intValue.Value.ToString();
        }
        return _httpContextAccessor.HttpContext?.Session.GetString("UserId");
    }
    
    public int? GetCurrentUserIdInt()
    {
        // Get UserId as integer
        var intValue = _httpContextAccessor.HttpContext?.Session.GetInt32("UserId");
        if (intValue.HasValue)
        {
            return intValue.Value;
        }
        // Fallback: try to parse from string
        var stringValue = _httpContextAccessor.HttpContext?.Session.GetString("UserId");
        if (int.TryParse(stringValue, out var parsedId))
        {
            return parsedId;
        }
        return null;
    }

    public string? GetCurrentUserRole()
    {
        return _httpContextAccessor.HttpContext?.Session.GetString("Role");
    }

    public bool IsAuthenticated()
    {
        return !string.IsNullOrEmpty(GetCurrentUserId());
    }

    public bool HasRole(string role)
    {
        return GetCurrentUserRole() == role;
    }
}

