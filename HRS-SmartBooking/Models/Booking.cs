using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRS_SmartBooking.Models;

[Table("Bookings")]
public class Booking
{
    [Key]
    [Column("booking_id")]
    public int BookingId { get; set; }

    [Required]
    [Column("customer_id")]
    public int CustomerId { get; set; }

    [Required]
    [Column("room_id")]
    public int RoomId { get; set; }

    [Required]
    [Column("check_in_date", TypeName = "date")]
    public DateTime CheckInDate { get; set; }

    [Required]
    [Column("check_out_date", TypeName = "date")]
    public DateTime CheckOutDate { get; set; }

    [Required]
    [Column("total_price", TypeName = "decimal(10,2)")]
    public decimal TotalPrice { get; set; }

    [MaxLength(20)]
    [Column("booking_status")]
    public string BookingStatus { get; set; } = "pending";

    [MaxLength(20)]
    [Column("payment_status")]
    public string PaymentStatus { get; set; } = "pending";

    [MaxLength(50)]
    [Column("payment_method")]
    public string? PaymentMethod { get; set; }

    [MaxLength(255)]
    [Column("qr_code")]
    public string? QrCode { get; set; }

    [Required]
    [Column("number_of_guests")]
    public int NumberOfGuests { get; set; }

    [Column("special_requests")]
    public string? SpecialRequests { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    [Column("cancelled_at")]
    public DateTime? CancelledAt { get; set; }

    [Column("refund_requested")]
    public bool RefundRequested { get; set; } = false;

    [Column("refund_requested_at")]
    public DateTime? RefundRequestedAt { get; set; }

    [Column("refund_approved")]
    public bool? RefundApproved { get; set; }

    [Column("refund_processed_at")]
    public DateTime? RefundProcessedAt { get; set; }

    [Column("cancellation_reason")]
    public string? CancellationReason { get; set; }

    // Navigation properties
    [ForeignKey("CustomerId")]
    public User? Customer { get; set; }

    [ForeignKey("RoomId")]
    public Room? Room { get; set; }

    public ICollection<CheckInCheckOut> CheckInCheckOuts { get; set; } = new List<CheckInCheckOut>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<Complaint> Complaints { get; set; } = new List<Complaint>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}

