using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRS_SmartBooking.Models;

[Table("AuditLogs")]
public class AuditLog
{
    [Key]
    public int LogId { get; set; }

    public int? UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Action { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? TableName { get; set; }

    public int? RecordId { get; set; }

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    [MaxLength(50)]
    public string? IpAddress { get; set; }

    [MaxLength(500)]
    public string? UserAgent { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    // Navigation properties
    [ForeignKey("UserId")]
    public User? User { get; set; }
}

