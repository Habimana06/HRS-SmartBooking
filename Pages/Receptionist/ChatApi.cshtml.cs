using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Receptionist;

[IgnoreAntiforgeryToken]
public class ChatApiModel : PageModel
{
    private readonly ApplicationDbContext _context;
    private readonly AuthService _authService;

    public ChatApiModel(ApplicationDbContext context, AuthService authService)
    {
        _context = context;
        _authService = authService;
    }

    // GET: Get all conversations (customers with unread messages)
    public async Task<IActionResult> OnGetConversationsAsync()
    {
        var userId = _authService.GetCurrentUserIdInt();
        if (userId == null)
        {
            return new JsonResult(new { error = "Unauthorized" }) { StatusCode = 401 };
        }

        var conversations = await _context.ChatMessages
            .Include(m => m.Customer)
            .Where(m => !m.IsFromCustomer || m.IsRead == false)
            .GroupBy(m => m.CustomerId)
            .Select(g => new
            {
                CustomerId = g.Key,
                CustomerName = g.First().Customer != null 
                    ? $"{g.First().Customer.FirstName} {g.First().Customer.LastName}" 
                    : "Unknown",
                LastMessage = g.OrderByDescending(m => m.CreatedAt).First().MessageText,
                LastMessageTime = g.OrderByDescending(m => m.CreatedAt).First().CreatedAt,
                UnreadCount = g.Count(m => !m.IsRead && !m.IsFromCustomer),
                HasUnread = g.Any(m => !m.IsRead && !m.IsFromCustomer)
            })
            .OrderByDescending(c => c.LastMessageTime)
            .ToListAsync();

        return new JsonResult(conversations);
    }

    // GET: Get messages for a specific customer
    public async Task<IActionResult> OnGetCustomerMessagesAsync(int customerId)
    {
        var userId = _authService.GetCurrentUserIdInt();
        if (userId == null)
        {
            return new JsonResult(new { error = "Unauthorized" }) { StatusCode = 401 };
        }

        var messages = await _context.ChatMessages
            .Where(m => m.CustomerId == customerId)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new
            {
                m.MessageId,
                m.MessageText,
                m.IsFromCustomer,
                m.IsRead,
                m.CreatedAt,
                ReceptionistName = m.Receptionist != null ? $"{m.Receptionist.FirstName} {m.Receptionist.LastName}" : null
            })
            .ToListAsync();

        // Mark customer messages as read (messages FROM customer that receptionist hasn't read)
        var unreadMessages = await _context.ChatMessages
            .Where(m => m.CustomerId == customerId && !m.IsRead && m.IsFromCustomer)
            .ToListAsync();

        foreach (var msg in unreadMessages)
        {
            msg.IsRead = true;
            msg.ReadAt = DateTime.Now;
        }

        if (unreadMessages.Any())
        {
            await _context.SaveChangesAsync();
        }

        return new JsonResult(messages);
    }

    // POST: Send a reply from receptionist
    public async Task<IActionResult> OnPostSendReplyAsync([FromBody] SendReplyRequest request)
    {
        var userId = _authService.GetCurrentUserIdInt();
        if (userId == null)
        {
            return new JsonResult(new { error = "Unauthorized" }) { StatusCode = 401 };
        }

        if (string.IsNullOrWhiteSpace(request.Message) || request.CustomerId <= 0)
        {
            return new JsonResult(new { error = "Invalid request" }) { StatusCode = 400 };
        }

        var message = new ChatMessage
        {
            CustomerId = request.CustomerId,
            ReceptionistId = userId.Value,
            MessageText = request.Message.Trim(),
            IsFromCustomer = false,
            IsRead = false,
            CreatedAt = DateTime.Now
        };

        _context.ChatMessages.Add(message);
        await _context.SaveChangesAsync();

        return new JsonResult(new { success = true, messageId = message.MessageId });
    }

    public class SendReplyRequest
    {
        public int CustomerId { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}

