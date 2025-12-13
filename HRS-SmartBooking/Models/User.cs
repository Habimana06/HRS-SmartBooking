using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRS_SmartBooking.Models;

[Table("Users")]
public class User
{
    [Key]
    [Column("user_id")]
    public int UserId { get; set; }

    [Required]
    [MaxLength(255)]
    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    [Column("password_hash")]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("first_name")]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("last_name")]
    public string LastName { get; set; } = string.Empty;

    [MaxLength(20)]
    [Column("phone_number")]
    public string? PhoneNumber { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("role")]
    public string Role { get; set; } = string.Empty;

    [Column("is_verified")]
    public bool IsVerified { get; set; } = false;

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [MaxLength(10)]
    [Column("preferred_language")]
    public string PreferredLanguage { get; set; } = "ENG";

    [MaxLength(10)]
    [Column("theme_preference")]
    public string ThemePreference { get; set; } = "dark";

    // The current database may not have this column; mark as not mapped to avoid runtime errors.
    [NotMapped]
    public string? Address { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    [Column("last_login")]
    public DateTime? LastLogin { get; set; }

    // Navigation properties
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<Complaint> Complaints { get; set; } = new List<Complaint>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}

