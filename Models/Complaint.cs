using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRS_SmartBooking.Models;

[Table("Complaints")]
public class Complaint
{
    [Key]
    public int ComplaintId { get; set; }

    [Required]
    public int CustomerId { get; set; }

    public int? BookingId { get; set; }

    [MaxLength(100)]
    public string? Category { get; set; }

    [Required]
    [MaxLength(200)]
    public string Subject { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Status { get; set; } = "open";

    [MaxLength(20)]
    public string Priority { get; set; } = "medium";

    public int? AssignedTo { get; set; }

    public string? Resolution { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    public DateTime? ResolvedAt { get; set; }

    // Navigation properties
    [ForeignKey("CustomerId")]
    public User? Customer { get; set; }

    [ForeignKey("BookingId")]
    public Booking? Booking { get; set; }

    [ForeignKey("AssignedTo")]
    public User? AssignedUser { get; set; }
}

