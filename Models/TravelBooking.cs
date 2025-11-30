using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRS_SmartBooking.Models;

[Table("TravelBookings")]
public class TravelBooking
{
    [Key]
    [Column("travel_booking_id")]
    public int TravelBookingId { get; set; }

    [Required]
    [Column("customer_id")]
    public int CustomerId { get; set; }

    [Required]
    [MaxLength(200)]
    [Column("attraction_name")]
    public string AttractionName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("attraction_type")]
    public string AttractionType { get; set; } = string.Empty; // Nature, Culture, Adventure, Wildlife

    [Required]
    [Column("travel_date", TypeName = "date")]
    public DateTime TravelDate { get; set; }

    [Required]
    [Column("number_of_participants")]
    public int NumberOfParticipants { get; set; }

    [Required]
    [Column("total_price", TypeName = "decimal(10,2)")]
    public decimal TotalPrice { get; set; }

    [MaxLength(20)]
    [Column("booking_status")]
    public string BookingStatus { get; set; } = "pending"; // pending, confirmed, cancelled, refund_pending, refunded

    [MaxLength(20)]
    [Column("payment_status")]
    public string PaymentStatus { get; set; } = "pending"; // pending, paid, refunded

    [MaxLength(50)]
    [Column("payment_method")]
    public string? PaymentMethod { get; set; }

    [Column("refund_requested")]
    public bool RefundRequested { get; set; } = false;

    [Column("refund_requested_at")]
    public DateTime? RefundRequestedAt { get; set; }

    [Column("refund_approved")]
    public bool? RefundApproved { get; set; }

    [Column("refund_approved_at")]
    public DateTime? RefundApprovedAt { get; set; }

    [Column("refund_processed_at")]
    public DateTime? RefundProcessedAt { get; set; }

    [Column("special_requests")]
    public string? SpecialRequests { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    [Column("cancelled_at")]
    public DateTime? CancelledAt { get; set; }

    // Navigation properties
    [ForeignKey("CustomerId")]
    public User? Customer { get; set; }
}

