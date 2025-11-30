using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRS_SmartBooking.Models;

[Table("ChatMessages")]
public class ChatMessage
{
    [Key]
    [Column("message_id")]
    public int MessageId { get; set; }

    [Required]
    [Column("customer_id")]
    public int CustomerId { get; set; }

    [Column("receptionist_id")]
    public int? ReceptionistId { get; set; }

    [Required]
    [MaxLength(2000)]
    [Column("message_text")]
    public string MessageText { get; set; } = string.Empty;

    [Required]
    [Column("is_from_customer")]
    public bool IsFromCustomer { get; set; }

    [Required]
    [Column("is_read")]
    public bool IsRead { get; set; } = false;

    [Required]
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Column("read_at")]
    public DateTime? ReadAt { get; set; }

    // Navigation properties
    [ForeignKey("CustomerId")]
    public User? Customer { get; set; }

    [ForeignKey("ReceptionistId")]
    public User? Receptionist { get; set; }
}

