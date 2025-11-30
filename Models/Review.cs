using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRS_SmartBooking.Models;

[Table("Reviews")]
public class Review
{
    [Key]
    public int ReviewId { get; set; }

    [Required]
    public int BookingId { get; set; }

    [Required]
    public int CustomerId { get; set; }

    [Required]
    [Range(1, 5)]
    public int Rating { get; set; }

    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    // Navigation properties
    [ForeignKey("BookingId")]
    public Booking? Booking { get; set; }

    [ForeignKey("CustomerId")]
    public User? Customer { get; set; }
}

