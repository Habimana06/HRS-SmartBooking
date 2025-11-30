using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Receptionist;

public class MessagesModel : PageModel
{
    private readonly ApplicationDbContext _context;

    public MessagesModel(ApplicationDbContext context)
    {
        _context = context;
    }

    public List<Conversation> Conversations { get; set; } = new();
    public List<MessageBubble> Chat { get; set; } = new();
    public int? SelectedCustomerId { get; set; }

    public async Task OnGetAsync(int? customerId = null)
    {
        // Get all customers who have sent messages - materialize first to avoid LINQ translation issues
        var allMessages = await _context.ChatMessages
            .Include(m => m.Customer)
            .Where(m => m.Customer != null)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();

        // Group by customer in memory
        var customersWithMessages = allMessages
            .GroupBy(m => m.CustomerId)
            .Select(g => new
            {
                CustomerId = g.Key,
                Customer = g.First().Customer,
                LastMessage = g.OrderByDescending(m => m.CreatedAt).First(),
                UnreadCount = g.Count(m => !m.IsRead && m.IsFromCustomer) // Unread messages FROM customer
            })
            .OrderByDescending(x => x.LastMessage.CreatedAt)
            .ToList();

        Conversations = customersWithMessages.Select(x => new Conversation(
            x.CustomerId,
            !string.IsNullOrWhiteSpace($"{x.Customer?.FirstName ?? ""} {x.Customer?.LastName ?? ""}".Trim()) 
                ? $"{x.Customer?.FirstName ?? ""} {x.Customer?.LastName ?? ""}".Trim() 
                : "Unknown Customer",
            x.LastMessage.MessageText,
            x.LastMessage.CreatedAt,
            x.UnreadCount > 0
        )).ToList();

        // If no conversations, add placeholder
        if (!Conversations.Any())
        {
            Conversations = new List<Conversation>
            {
                new(0, "No messages", "No customer messages available", DateTime.Now, false)
            };
        }

        // Load messages for selected customer
        if (customerId.HasValue && customerId.Value > 0)
        {
            SelectedCustomerId = customerId.Value;
            var messages = await _context.ChatMessages
                .Include(m => m.Customer)
                .Include(m => m.Receptionist)
                .Where(m => m.CustomerId == customerId.Value)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();

            Chat = messages.Select(m => new MessageBubble(
                m.IsFromCustomer 
                    ? $"{m.Customer?.FirstName ?? ""} {m.Customer?.LastName ?? ""}".Trim() ?? "Customer"
                    : $"{m.Receptionist?.FirstName ?? ""} {m.Receptionist?.LastName ?? ""}".Trim() ?? "Receptionist",
                m.MessageText,
                !m.IsFromCustomer,
                m.CreatedAt
            )).ToList();

            // Mark customer messages as read (messages FROM customer that receptionist hasn't read yet)
            var unreadMessages = messages.Where(m => !m.IsRead && m.IsFromCustomer).ToList();
            foreach (var msg in unreadMessages)
            {
                msg.IsRead = true;
                msg.ReadAt = DateTime.Now;
            }
            if (unreadMessages.Any())
            {
                await _context.SaveChangesAsync();
            }
        }
        else
        {
            Chat = new List<MessageBubble>
            {
                new("System", "Select a conversation to view messages", true, DateTime.Now)
            };
        }
    }

    public record Conversation(int CustomerId, string Title, string Snippet, DateTime LastMessageTime, bool HasUnread);
    public record MessageBubble(string Sender, string Body, bool IsAgent, DateTime CreatedAt);
}

