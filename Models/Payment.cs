using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRS_SmartBooking.Models;

[Table("Payments")]
public class Payment
{
    [Key]
    [Column("payment_id")]
    public int PaymentId { get; set; }

    [Required]
    [Column("booking_id")]
    public int BookingId { get; set; }

    [Required]
    [Column("amount", TypeName = "decimal(10,2)")]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("payment_method")]
    public string PaymentMethod { get; set; } = string.Empty;

    [MaxLength(20)]
    [Column("payment_status")]
    public string PaymentStatus { get; set; } = "pending";

    [MaxLength(255)]
    [Column("transaction_id")]
    public string? TransactionId { get; set; }

    [Column("payment_date")]
    public DateTime PaymentDate { get; set; } = DateTime.Now;

    [Column("refund_amount", TypeName = "decimal(10,2)")]
    public decimal RefundAmount { get; set; } = 0;

    [Column("refund_date")]
    public DateTime? RefundDate { get; set; }

    [MaxLength(500)]
    [Column("notes")]
    public string? Notes { get; set; }

    // Navigation properties
    [ForeignKey("BookingId")]
    public Booking? Booking { get; set; }
}

