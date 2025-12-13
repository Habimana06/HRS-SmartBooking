using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRS_SmartBooking.Models;

[Table("CheckInCheckOut")]
public class CheckInCheckOut
{
    [Key]
    public int RecordId { get; set; }

    [Required]
    public int BookingId { get; set; }

    [Required]
    public int ReceptionistId { get; set; }

    public DateTime? CheckInTime { get; set; }

    public DateTime? CheckOutTime { get; set; }

    [Column(TypeName = "date")]
    public DateTime? ActualCheckOutDate { get; set; }

    [MaxLength(50)]
    public string? RoomKeyIssued { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal AdditionalCharges { get; set; } = 0;

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    // Navigation properties
    [ForeignKey("BookingId")]
    public Booking? Booking { get; set; }

    [ForeignKey("ReceptionistId")]
    public User? Receptionist { get; set; }
}

