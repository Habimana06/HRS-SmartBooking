using HRS_SmartBooking.Services;
using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace HRSAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly EmailVerificationService _verificationService;
    private readonly ApplicationDbContext _context;
    private readonly IServiceProvider _serviceProvider;

    // Permission-based access control (PBAC) mapping.
    // Expand this map if new permissions are added.
    private static readonly Dictionary<string, string[]> RolePermissions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Admin"] = new[]
        {
            "admin:dashboard:view",
            "admin:users:manage",
            "admin:roles:manage",
            "admin:staff:manage",
            "admin:payments:view",
            "admin:reports:view",
            "admin:audit:view",
            "admin:config:manage",
            "admin:profile:update"
        },
        ["Manager"] = new[]
        {
            "manager:dashboard:view",
            "manager:rooms:manage",
            "manager:bookings:manage",
            "manager:travel:manage",
            "manager:staff:view",
            "manager:reports:view",
            "manager:profile:update"
        },
        ["Receptionist"] = new[]
        {
            "receptionist:dashboard:view",
            "receptionist:bookings:manage",
            "receptionist:checkin",
            "receptionist:checkout",
            "receptionist:travel:view",
            "receptionist:profile:update"
        },
        ["Customer"] = new[]
        {
            "customer:dashboard:view",
            "customer:booking:create",
            "customer:booking:view",
            "customer:profile:update"
        }
    };

    public AuthController(AuthService authService, EmailVerificationService verificationService, ApplicationDbContext context, IServiceProvider serviceProvider)
    {
        _authService = authService;
        _verificationService = verificationService;
        _context = context;
        _serviceProvider = serviceProvider;
    }

    private static string[] GetPermissionsForRole(string? role)
    {
        if (!string.IsNullOrWhiteSpace(role) && RolePermissions.TryGetValue(role, out var perms))
        {
            return perms;
        }

        return RolePermissions["Customer"];
    }

    // Check if user has a specific permission (including user-specific overrides)
    private async Task<bool> CheckUserPermissionAsync(int userId, string permissionId)
    {
        try
        {
            // Load user permissions from SystemSettings
            var userPermsSetting = await _context.SystemSettings
                .FirstOrDefaultAsync(s => s.SettingKey == "userPermissions");
            
            if (userPermsSetting != null && !string.IsNullOrWhiteSpace(userPermsSetting.SettingValue))
            {
                try
                {
                    var userPermissions = JsonSerializer.Deserialize<Dictionary<string, Dictionary<string, bool>>>(
                        userPermsSetting.SettingValue);
                    
                    if (userPermissions != null && userPermissions.TryGetValue(userId.ToString(), out var userPerms))
                    {
                        // Check if this specific permission is disabled
                        if (userPerms.TryGetValue(permissionId, out var isEnabled))
                        {
                            return isEnabled; // Return the explicit override
                        }
                    }
                }
                catch (JsonException jsonEx)
                {
                    Console.WriteLine($"Error deserializing user permissions: {jsonEx.Message}");
                    // If JSON is malformed, log but continue with default behavior
                }
            }

            // Default: permission is enabled if not explicitly disabled
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error checking user permission: {ex.Message}");
            // On error, allow access (fail open for safety, but log the error)
            return true;
        }
    }

    public record LoginRequest(string Email, string Password, string? Code);

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var user = await _authService.LoginAsync(request.Email, request.Password);
            if (user == null)
            {
                return Unauthorized(new { error = "Invalid email or password." });
            }

            // Check if user has login permission enabled
            var hasLoginPermission = await CheckUserPermissionAsync(user.UserId, "auth:login");
            if (!hasLoginPermission)
            {
                return Unauthorized(new 
                { 
                    error = "Your account login access has been disabled. Please contact your administrator or support team for assistance.",
                    loginDisabled = true
                });
            }

            // Always require a fresh verification code per login
            // Flow:
            // 1) Client calls login without code => we send a code and return requiresVerification
            // 2) Client calls login with code => we verify then set session
            if (string.IsNullOrWhiteSpace(request.Code))
            {
                try
                {
                    await _verificationService.GenerateAndSendCodeAsync(user.UserId, user.Email);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to send verification code: {ex.Message}");
                    return StatusCode(500, new { error = "Could not send verification code. Please try again." });
                }

                return Unauthorized(new 
                { 
                    error = "Verification code required. We sent a new code to your email.",
                    requiresVerification = true,
                    userId = user.UserId,
                    email = user.Email
                });
            }

            // Validate provided code
            var isValid = await _verificationService.VerifyCodeAsync(user.UserId, request.Code);
            if (!isValid)
            {
                return Unauthorized(new
                {
                    error = "Invalid or expired verification code.",
                    requiresVerification = true,
                    userId = user.UserId,
                    email = user.Email
                });
            }

            // Check login permission again after code verification (in case it was disabled during verification)
            hasLoginPermission = await CheckUserPermissionAsync(user.UserId, "auth:login");
            if (!hasLoginPermission)
            {
                return Unauthorized(new 
                { 
                    error = "Your account login access has been disabled. Please contact your administrator or support team for assistance.",
                    loginDisabled = true
                });
            }

            // Derive permissions for this user
            var permissions = GetPermissionsForRole(user.Role);

            // Reuse existing session-based auth logic
            _authService.SetUserSession(user);
        
            // Persist permissions in session for downstream PBAC checks
            HttpContext.Session.SetString("Permissions", JsonSerializer.Serialize(permissions));

            // Ensure session is committed (ASP.NET Core does this automatically, but explicit for clarity)
            HttpContext.Session.SetString("_SessionInitialized", "true");

            return Ok(new
            {
                userId = user.UserId,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                role = user.Role,
                permissions
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Login error: {ex.Message}");
            return StatusCode(500, new { error = "Login failed unexpectedly. Please try again." });
        }
    }

    public record RegisterRequest(
        string FirstName,
        string LastName,
        string Email,
        string? PhoneNumber,
        string Password);

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Validate password
        if (string.IsNullOrEmpty(request.Password) || request.Password.Length < 6)
        {
            return BadRequest(new { error = "Password must be at least 6 characters long." });
        }

        // Validate required fields
        if (string.IsNullOrWhiteSpace(request.FirstName) || 
            string.IsNullOrWhiteSpace(request.LastName) || 
            string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { error = "First name, last name, and email are required." });
        }

        var user = await _authService.RegisterAsync(
            request.Email,
            request.Password,
            request.FirstName,
            request.LastName,
            request.PhoneNumber);

        if (user == null)
        {
            return Conflict(new { error = "Email already exists. Please use a different email." });
        }

        // Auto-send verification code after registration
        try
        {
            await _verificationService.GenerateAndSendCodeAsync(user.UserId, user.Email);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to send verification code after registration: {ex.Message}");
            // Don't fail registration, user can request code later
        }

        return Ok(new
        {
            success = true,
            message = "Account created successfully! A verification code has been sent to your email.",
            userId = user.UserId,
            email = user.Email,
            requiresVerification = true
        });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        _authService.ClearSession();
        return Ok();
    }

    [HttpGet("me")]
    public IActionResult Me()
    {
        if (!_authService.IsAuthenticated())
        {
            return Unauthorized();
        }

        var role = _authService.GetCurrentUserRole() ?? "Customer";
        var userIdString = _authService.GetCurrentUserId();
        int.TryParse(userIdString, out var userId);
        var permissionsJson = HttpContext.Session.GetString("Permissions");
        string[] permissions;
        if (!string.IsNullOrWhiteSpace(permissionsJson))
        {
            permissions = JsonSerializer.Deserialize<string[]>(permissionsJson) ?? Array.Empty<string>();
        }
        else
        {
            permissions = GetPermissionsForRole(role);
            HttpContext.Session.SetString("Permissions", JsonSerializer.Serialize(permissions));
        }

        return Ok(new
        {
            userId,
            email = HttpContext.Session.GetString("Email"),
            firstName = HttpContext.Session.GetString("FirstName"),
            lastName = HttpContext.Session.GetString("LastName"),
            role,
            permissions
        });
    }

    [HttpPost("send-verification-code")]
    public async Task<IActionResult> SendVerificationCode([FromBody] SendCodeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { error = "Email is required." });
        }

        var user = await _authService.GetUserByEmailAsync(request.Email);
        if (user == null)
        {
            return NotFound(new { error = "User not found." });
        }

        // Check if user has login permission enabled
        var hasLoginPermission = await CheckUserPermissionAsync(user.UserId, "auth:login");
        if (!hasLoginPermission)
        {
            return Unauthorized(new 
            { 
                error = "Your account login access has been disabled. Please contact your administrator or support team for assistance.",
                loginDisabled = true
            });
        }

        try
        {
            await _verificationService.GenerateAndSendCodeAsync(user.UserId, user.Email);
            return Ok(new { message = "Verification code sent successfully. Please check your email." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error sending verification code: {ex.Message}");
            return StatusCode(500, new { error = "Failed to send verification code. Please try again later." });
        }
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Code))
        {
            return BadRequest(new { error = "Email and code are required." });
        }

        var user = await _authService.GetUserByEmailAsync(request.Email);
        if (user == null)
        {
            return NotFound(new { error = "User not found." });
        }

        var isValid = await _verificationService.VerifyCodeAsync(user.UserId, request.Code);
        if (!isValid)
        {
            return BadRequest(new { error = "Invalid or expired verification code." });
        }

        return Ok(new 
        { 
            message = "Email verified successfully! You can now log in.",
            verified = true
        });
    }

    public record SendCodeRequest(string Email);
    public record VerifyEmailRequest(string Email, string Code);

    // Password Reset Endpoints
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { error = "Email is required." });
        }

        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            
            if (user == null)
            {
                // Don't reveal if email exists for security
                return Ok(new { message = "If the email exists, a password reset link has been sent." });
            }

            // Only allow password reset for customers
            if (user.Role != "Customer")
            {
                return BadRequest(new { 
                    error = "Password reset is only available for customers. Please contact your administrator for assistance." 
                });
            }

            // Generate reset token
            var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
                .Replace("+", "-")
                .Replace("/", "_")
                .Replace("=", "");

            // Store token in database (we'll use SystemSettings or add a field to User)
            // For now, let's store it in SystemSettings with a key like "passwordReset:{userId}"
            var resetKey = $"passwordReset:{user.UserId}";
            var existingSetting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == resetKey);
            
            var resetData = new
            {
                token = token,
                expiresAt = DateTime.UtcNow.AddHours(24), // Token expires in 24 hours
                email = user.Email
            };

            if (existingSetting != null)
            {
                existingSetting.SettingValue = JsonSerializer.Serialize(resetData);
                existingSetting.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _context.SystemSettings.Add(new SystemSettings
                {
                    SettingKey = resetKey,
                    SettingValue = JsonSerializer.Serialize(resetData),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();

            // Send email with reset link
            var resetLink = $"{Request.Scheme}://{Request.Host}/reset-password?token={token}&email={Uri.EscapeDataString(user.Email)}";
            var emailSubject = "Password Reset Request";
            var emailBody = $@"
                <html>
                <body>
                    <h2>Password Reset Request</h2>
                    <p>Hello {user.FirstName},</p>
                    <p>You requested to reset your password. Click the link below to reset your password:</p>
                    <p><a href=""{resetLink}"" style=""background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;"">Reset Password</a></p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p>{resetLink}</p>
                    <p>This link will expire in 24 hours.</p>
                    <p>If you did not request this password reset, please ignore this email.</p>
                    <p>Best regards,<br>HRS Team</p>
                </body>
                </html>";

            try
            {
                var emailSender = _serviceProvider.GetRequiredService<SmtpEmailSender>();
                await emailSender.SendEmailAsync(user.Email, emailSubject, emailBody);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending password reset email: {ex.Message}");
                return StatusCode(500, new { error = "Failed to send password reset email. Please try again later." });
            }

            return Ok(new { message = "If the email exists, a password reset link has been sent." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in ForgotPassword: {ex.Message}");
            return StatusCode(500, new { error = "An error occurred. Please try again later." });
        }
    }

    [HttpPost("verify-reset-token")]
    public async Task<IActionResult> VerifyResetToken([FromBody] VerifyResetTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { error = "Token and email are required." });
        }

        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                return BadRequest(new { error = "Invalid reset link." });
            }

            var resetKey = $"passwordReset:{user.UserId}";
            var resetSetting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == resetKey);
            
            if (resetSetting == null || string.IsNullOrWhiteSpace(resetSetting.SettingValue))
            {
                return BadRequest(new { error = "Invalid or expired reset link." });
            }

            var resetData = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(resetSetting.SettingValue);
            if (resetData == null || !resetData.ContainsKey("token") || !resetData.ContainsKey("expiresAt"))
            {
                return BadRequest(new { error = "Invalid reset link." });
            }

            var storedToken = resetData["token"].GetString();
            var expiresAt = resetData["expiresAt"].GetDateTime();

            if (storedToken != request.Token || expiresAt < DateTime.UtcNow)
            {
                return BadRequest(new { error = "Invalid or expired reset link." });
            }

            return Ok(new { valid = true, message = "Token is valid." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error verifying reset token: {ex.Message}");
            return StatusCode(500, new { error = "An error occurred. Please try again." });
        }
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.Email) || 
            string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest(new { error = "Token, email, and new password are required." });
        }

        if (request.NewPassword.Length < 6)
        {
            return BadRequest(new { error = "Password must be at least 6 characters long." });
        }

        if (request.NewPassword != request.ConfirmPassword)
        {
            return BadRequest(new { error = "Passwords do not match." });
        }

        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                return BadRequest(new { error = "Invalid reset link." });
            }

            var resetKey = $"passwordReset:{user.UserId}";
            var resetSetting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == resetKey);
            
            if (resetSetting == null || string.IsNullOrWhiteSpace(resetSetting.SettingValue))
            {
                return BadRequest(new { error = "Invalid or expired reset link." });
            }

            var resetData = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(resetSetting.SettingValue);
            if (resetData == null || !resetData.ContainsKey("token") || !resetData.ContainsKey("expiresAt"))
            {
                return BadRequest(new { error = "Invalid reset link." });
            }

            var storedToken = resetData["token"].GetString();
            var expiresAt = resetData["expiresAt"].GetDateTime();

            if (storedToken != request.Token || expiresAt < DateTime.UtcNow)
            {
                return BadRequest(new { error = "Invalid or expired reset link." });
            }

            // Update password
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.PasswordHash = hashedPassword;
            user.UpdatedAt = DateTime.UtcNow;

            // Remove reset token
            _context.SystemSettings.Remove(resetSetting);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Password has been reset successfully. You can now login with your new password." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error resetting password: {ex.Message}");
            return StatusCode(500, new { error = "An error occurred. Please try again." });
        }
    }

    public record ForgotPasswordRequest(string Email);
    public record VerifyResetTokenRequest(string Token, string Email);
    public record ResetPasswordRequest(string Token, string Email, string NewPassword, string ConfirmPassword);
}



