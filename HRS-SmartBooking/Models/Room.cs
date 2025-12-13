using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRS_SmartBooking.Models;

[Table("Rooms")]
public class Room
{
    [Key]
    [Column("room_id")]
    public int RoomId { get; set; }

    [Required]
    [Column("room_type_id")]
    public int RoomTypeId { get; set; }

    [Required]
    [MaxLength(20)]
    [Column("room_number")]
    public string RoomNumber { get; set; } = string.Empty;

    [Column("floor_number")]
    public int? FloorNumber { get; set; }

    [MaxLength(20)]
    [Column("status")]
    public string Status { get; set; } = "available";

    [Required]
    [Column("current_price", TypeName = "decimal(10,2)")]
    public decimal CurrentPrice { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Column("image_urls")]
    public string? ImageUrls { get; set; } // JSON format

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    // Navigation properties
    [ForeignKey("RoomTypeId")]
    public RoomType? RoomType { get; set; }

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}

