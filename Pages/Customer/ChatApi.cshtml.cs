using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Customer;

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

    // GET: Get messages for current customer
    public async Task<IActionResult> OnGetMessagesAsync()
    {
        try
        {
            var userId = _authService.GetCurrentUserIdInt();
            if (userId == null)
            {
                return new JsonResult(new { error = "Unauthorized" }) { StatusCode = 401 };
            }

            var messages = await _context.ChatMessages
                .Where(m => m.CustomerId == userId.Value)
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

            return new JsonResult(messages);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error loading chat messages: {ex.Message}");
            return new JsonResult(new { error = "Error loading messages" }) { StatusCode = 500 };
        }
    }

    // POST: Send a message from customer
    public async Task<IActionResult> OnPostSendMessageAsync([FromBody] SendMessageRequest request)
    {
        try
        {
            var userId = _authService.GetCurrentUserIdInt();
            if (userId == null)
            {
                return new JsonResult(new { error = "Unauthorized. Please login to send messages." }) { StatusCode = 401 };
            }

            if (request == null || string.IsNullOrWhiteSpace(request.Message))
            {
                return new JsonResult(new { error = "Message cannot be empty" }) { StatusCode = 400 };
            }

            var message = new ChatMessage
            {
                CustomerId = userId.Value,
                MessageText = request.Message.Trim(),
                IsFromCustomer = true,
                IsRead = false,
                CreatedAt = DateTime.Now
            };

            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();

            return new JsonResult(new { success = true, messageId = message.MessageId });
        }
        catch (Exception ex)
        {
            // Log the error (you can add proper logging here)
            Console.Error.WriteLine($"Error sending chat message: {ex.Message}");
            return new JsonResult(new { error = "An error occurred while sending your message. Please try again." }) { StatusCode = 500 };
        }
    }

    public class SendMessageRequest
    {
        public string Message { get; set; } = string.Empty;
    }
}

