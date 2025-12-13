using System.Linq;
using HRS_SmartBooking.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Services;

public class UserPreferenceService
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public UserPreferenceService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    private ISession? Session => _httpContextAccessor.HttpContext?.Session;

    private async Task<int?> GetCurrentUserIdAsync()
    {
        var idValue = Session?.GetString("UserId");
        if (int.TryParse(idValue, out var id))
        {
            return id;
        }

        var userIdClaim = _httpContextAccessor.HttpContext?.User?.Claims
            .FirstOrDefault(c => c.Type == "UserId")?.Value;

        return int.TryParse(userIdClaim, out var claimId) ? claimId : null;
    }

    public string GetTheme()
    {
        // Default to dark theme when no preference is stored
        return Session?.GetString("ThemePreference") ?? "dark";
    }

    public string GetLanguage()
    {
        return Session?.GetString("PreferredLanguage") ?? "ENG";
    }

    public async Task SetThemeAsync(string? theme)
    {
        var normalized = theme?.ToLowerInvariant() == "dark" ? "dark" : "light";
        Session?.SetString("ThemePreference", normalized);

        var userId = await GetCurrentUserIdAsync();
        if (userId.HasValue)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId.Value);
            if (user != null)
            {
                user.ThemePreference = normalized;
                user.UpdatedAt = DateTime.Now;
                await _context.SaveChangesAsync();
            }
        }
    }

    public async Task SetLanguageAsync(string? language)
    {
        // Normalize to valid values only (ENG or KIN - Kinyarwanda)
        var normalized = string.Equals(language, "KIN", StringComparison.OrdinalIgnoreCase) ? "KIN" : "ENG";
        Session?.SetString("PreferredLanguage", normalized);

        var userId = await GetCurrentUserIdAsync();
        if (userId.HasValue)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId.Value);
                if (user != null)
                {
                    // Ensure we only set valid values that match database constraint
                    user.PreferredLanguage = normalized;
                    user.UpdatedAt = DateTime.Now;
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception)
            {
                // If save fails, at least session is updated
                // Log error if needed
            }
        }
    }
}

