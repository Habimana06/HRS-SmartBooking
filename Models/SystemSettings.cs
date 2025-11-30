using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRS_SmartBooking.Models;

[Table("SystemSettings")]
public class SystemSettings
{
    [Key]
    [Column("setting_id")]
    public int SettingId { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("setting_key")]
    public string SettingKey { get; set; } = string.Empty;

    [MaxLength(500)]
    [Column("setting_value")]
    public string? SettingValue { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}

