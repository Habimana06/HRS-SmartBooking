using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Services;

public class EmailVerificationService
{
    private readonly ApplicationDbContext _context;
    private readonly SmtpEmailSender _emailSender;
    private const int CODE_EXPIRY_MINUTES = 10;
    private const int CODE_LENGTH = 6;

    public EmailVerificationService(ApplicationDbContext context, SmtpEmailSender emailSender)
    {
        _context = context;
        _emailSender = emailSender;
    }

    public async Task<string> GenerateAndSendCodeAsync(int userId, string userEmail)
    {
        // Check rate limit: max 1 code per minute, 5 per hour
        var oneMinuteAgo = DateTime.UtcNow.AddMinutes(-1);
        var oneHourAgo = DateTime.UtcNow.AddHours(-1);

        var recentCodes = await _context.EmailVerificationCodes
            .Where(c => c.UserId == userId && c.CreatedAt >= oneHourAgo)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        if (recentCodes.Any(c => c.CreatedAt >= oneMinuteAgo))
        {
            throw new InvalidOperationException("Please wait at least 1 minute before requesting a new code.");
        }

        if (recentCodes.Count >= 5)
        {
            throw new InvalidOperationException("Too many code requests. Please try again later.");
        }

        // Invalidate old unused codes for this user
        var oldCodes = await _context.EmailVerificationCodes
            .Where(c => c.UserId == userId && !c.Used && c.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();

        foreach (var oldCode in oldCodes)
        {
            oldCode.Used = true;
        }

        // Generate new code
        var random = new Random();
        var code = random.Next(100000, 999999).ToString();

        var verificationCode = new EmailVerificationCode
        {
            UserId = userId,
            Code = code,
            ExpiresAt = DateTime.UtcNow.AddMinutes(CODE_EXPIRY_MINUTES),
            Used = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.EmailVerificationCodes.Add(verificationCode);
        await _context.SaveChangesAsync();

        // Send email
        var subject = "Your Email Verification Code";
        var body = $@"
Hello,

Your verification code is: {code}

This code will expire in {CODE_EXPIRY_MINUTES} minutes.

If you didn't request this code, please ignore this email.

Best regards,
HRS Team
";

        await _emailSender.SendEmailAsync(userEmail, subject, body);

        return code;
    }

    public async Task<bool> VerifyCodeAsync(int userId, string code)
    {
        var verificationCode = await _context.EmailVerificationCodes
            .Where(c => c.UserId == userId && 
                       c.Code == code && 
                       !c.Used && 
                       c.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();

        if (verificationCode == null)
        {
            return false;
        }

        // Mark code as used
        verificationCode.Used = true;
        await _context.SaveChangesAsync();

        // Mark user as verified
        var user = await _context.Users.FindAsync(userId);
        if (user != null)
        {
            user.IsVerified = true;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return true;
    }

    public async Task<bool> IsUserVerifiedAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        return user?.IsVerified ?? false;
    }
}

