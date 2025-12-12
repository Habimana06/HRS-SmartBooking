using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;

namespace HRSAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MessagesController : ControllerBase
{
    private static readonly ConcurrentDictionary<int, ChatMessage> Messages = new();
    private static int _nextId = 1;

    public record ChatReply(string FromRole, string Content, DateTime SentAt);
    public record ChatMessage(int Id, string FromName, string FromEmail, string SenderRole, string Content, DateTime SentAt, List<ChatReply> Replies);
    public record SendMessageRequest(string FromName, string FromEmail, string SenderRole, string Content);
    public record ReplyRequest(string FromRole, string Content);

    [HttpGet]
    public IActionResult GetAll()
    {
        EnsureGreeting();
        var list = Messages.Values.OrderByDescending(m => m.SentAt).ToList();
        return Ok(list);
    }

    [HttpPost]
    public IActionResult Send([FromBody] SendMessageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest("Message content is required");

        var id = Interlocked.Increment(ref _nextId);
        var message = new ChatMessage(
            id,
            request.FromName ?? "Guest",
            request.FromEmail ?? "unknown",
            request.SenderRole ?? "customer",
            request.Content.Trim(),
            DateTime.UtcNow,
            new List<ChatReply>()
        );

        Messages[id] = message;
        return Ok(message);
    }

    [HttpPost("{id:int}/reply")]
    public IActionResult Reply(int id, [FromBody] ReplyRequest request)
    {
        if (!Messages.TryGetValue(id, out var existing))
            return NotFound();

        var reply = new ChatReply(request.FromRole ?? "receptionist", request.Content?.Trim() ?? string.Empty, DateTime.UtcNow);
        existing.Replies.Add(reply);

        return Ok(existing);
    }

    private static void EnsureGreeting()
    {
        if (Messages.IsEmpty)
        {
            var greetId = Interlocked.Increment(ref _nextId);
            Messages[greetId] = new ChatMessage(
                greetId,
                "Reception Desk",
                "reception@hotel.local",
                "receptionist",
                "Hello! 👋 How can we help with your stay today?",
                DateTime.UtcNow,
                new List<ChatReply>()
            );
        }
    }
}

