using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRS_SmartBooking.Models;

[Table("RoomTypes")]
public class RoomType
{
    [Key]
    [Column("room_type_id")]
    public int RoomTypeId { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("type_name")]
    public string TypeName { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Required]
    [Column("base_price", TypeName = "decimal(10,2)")]
    public decimal BasePrice { get; set; }

    [Required]
    [Column("max_occupancy")]
    public int MaxOccupancy { get; set; }

    [Column("amenities")]
    public string? Amenities { get; set; } // JSON format

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    // Navigation properties
    public ICollection<Room> Rooms { get; set; } = new List<Room>();
}

