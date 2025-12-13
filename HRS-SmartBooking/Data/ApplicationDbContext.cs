using Microsoft.EntityFrameworkCore;
using HRS_SmartBooking.Models;

namespace HRS_SmartBooking.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<RoomType> RoomTypes { get; set; }
    public DbSet<Room> Rooms { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<CheckInCheckOut> CheckInCheckOuts { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<Complaint> Complaints { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<SystemSettings> SystemSettings { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }
    public DbSet<TravelBooking> TravelBookings { get; set; }
    public DbSet<EmailVerificationCode> EmailVerificationCodes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure User entity
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.Role);
            entity.HasIndex(e => e.IsActive);

            // Map to existing snake_case columns in HotelReservationDB
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Email).HasColumnName("email");
            entity.Property(e => e.PasswordHash).HasColumnName("password_hash");
            entity.Property(e => e.FirstName).HasColumnName("first_name");
            entity.Property(e => e.LastName).HasColumnName("last_name");
            entity.Property(e => e.PhoneNumber).HasColumnName("phone_number");
            entity.Property(e => e.Role).HasColumnName("role");
            entity.Property(e => e.IsVerified).HasColumnName("is_verified");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.PreferredLanguage).HasColumnName("preferred_language");
            entity.Property(e => e.ThemePreference).HasColumnName("theme_preference");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.Property(e => e.LastLogin).HasColumnName("last_login");
        });

        // Configure Room entity
        modelBuilder.Entity<Room>(entity =>
        {
            entity.HasIndex(e => e.RoomNumber).IsUnique();
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.RoomTypeId);

            entity.Property(r => r.RoomId).HasColumnName("room_id");
            entity.Property(r => r.RoomTypeId).HasColumnName("room_type_id");
            entity.Property(r => r.RoomNumber).HasColumnName("room_number");
            entity.Property(r => r.FloorNumber).HasColumnName("floor_number");
            entity.Property(r => r.Status).HasColumnName("status");
            entity.Property(r => r.CurrentPrice).HasColumnName("current_price");
            entity.Property(r => r.Description).HasColumnName("description");
            entity.Property(r => r.ImageUrls).HasColumnName("image_urls");
            entity.Property(r => r.CreatedAt).HasColumnName("created_at");
            entity.Property(r => r.UpdatedAt).HasColumnName("updated_at");

            entity.HasOne(r => r.RoomType)
                .WithMany(rt => rt.Rooms)
                .HasForeignKey(r => r.RoomTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RoomType>(entity =>
        {
            entity.Property(rt => rt.RoomTypeId).HasColumnName("room_type_id");
            entity.Property(rt => rt.TypeName).HasColumnName("type_name");
            entity.Property(rt => rt.Description).HasColumnName("description");
            entity.Property(rt => rt.BasePrice).HasColumnName("base_price");
            entity.Property(rt => rt.MaxOccupancy).HasColumnName("max_occupancy");
            entity.Property(rt => rt.Amenities).HasColumnName("amenities");
            entity.Property(rt => rt.CreatedAt).HasColumnName("created_at");
            entity.Property(rt => rt.UpdatedAt).HasColumnName("updated_at");
        });

        // Configure Booking entity
        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasIndex(e => e.CustomerId);
            entity.HasIndex(e => e.RoomId);
            entity.HasIndex(e => new { e.CheckInDate, e.CheckOutDate });
            entity.HasIndex(e => e.BookingStatus);
            entity.HasIndex(e => e.QrCode).IsUnique().HasFilter("qr_code IS NOT NULL");

            // Map snake_case booking columns
            entity.Property(e => e.BookingId).HasColumnName("booking_id");
            entity.Property(e => e.CustomerId).HasColumnName("customer_id");
            entity.Property(e => e.RoomId).HasColumnName("room_id");
            entity.Property(e => e.CheckInDate).HasColumnName("check_in_date");
            entity.Property(e => e.CheckOutDate).HasColumnName("check_out_date");
            entity.Property(e => e.TotalPrice).HasColumnName("total_price");
            entity.Property(e => e.BookingStatus).HasColumnName("booking_status");
            entity.Property(e => e.PaymentStatus).HasColumnName("payment_status");
            entity.Property(e => e.PaymentMethod).HasColumnName("payment_method");
            entity.Property(e => e.NumberOfGuests).HasColumnName("number_of_guests");
            entity.Property(e => e.SpecialRequests).HasColumnName("special_requests");
            entity.Property(e => e.QrCode).HasColumnName("qr_code");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.Property(e => e.CancelledAt).HasColumnName("cancelled_at");

            entity.HasOne(b => b.Customer)
                .WithMany(u => u.Bookings)
                .HasForeignKey(b => b.CustomerId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(b => b.Room)
                .WithMany(r => r.Bookings)
                .HasForeignKey(b => b.RoomId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure Review entity
        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasIndex(e => e.BookingId);
            entity.HasIndex(e => e.CustomerId);

            // Map to snake_case columns
            entity.Property(r => r.ReviewId).HasColumnName("review_id");
            entity.Property(r => r.BookingId).HasColumnName("booking_id");
            entity.Property(r => r.CustomerId).HasColumnName("customer_id");
            entity.Property(r => r.Rating).HasColumnName("rating");
            entity.Property(r => r.Comment).HasColumnName("comment");
            entity.Property(r => r.CreatedAt).HasColumnName("created_at");

            entity.HasOne(r => r.Customer)
                .WithMany(u => u.Reviews)
                .HasForeignKey(r => r.CustomerId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(r => r.Booking)
                .WithMany(b => b.Reviews)
                .HasForeignKey(r => r.BookingId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure Complaint entity
        modelBuilder.Entity<Complaint>(entity =>
        {
            entity.HasIndex(e => e.CustomerId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.AssignedTo);

            // Map to snake_case columns
            entity.Property(c => c.ComplaintId).HasColumnName("complaint_id");
            entity.Property(c => c.CustomerId).HasColumnName("customer_id");
            entity.Property(c => c.BookingId).HasColumnName("booking_id");
            entity.Property(c => c.Category).HasColumnName("category");
            entity.Property(c => c.Subject).HasColumnName("subject");
            entity.Property(c => c.Description).HasColumnName("description");
            entity.Property(c => c.Status).HasColumnName("status");
            entity.Property(c => c.Priority).HasColumnName("priority");
            entity.Property(c => c.AssignedTo).HasColumnName("assigned_to");
            entity.Property(c => c.Resolution).HasColumnName("resolution");
            entity.Property(c => c.CreatedAt).HasColumnName("created_at");
            entity.Property(c => c.UpdatedAt).HasColumnName("updated_at");
            entity.Property(c => c.ResolvedAt).HasColumnName("resolved_at");

            entity.HasOne(c => c.Customer)
                .WithMany(u => u.Complaints)
                .HasForeignKey(c => c.CustomerId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(c => c.AssignedUser)
                .WithMany()
                .HasForeignKey(c => c.AssignedTo)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(c => c.Booking)
                .WithMany(b => b.Complaints)
                .HasForeignKey(c => c.BookingId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure CheckInCheckOut entity
        modelBuilder.Entity<CheckInCheckOut>(entity =>
        {
            entity.HasIndex(e => e.BookingId);
            entity.HasIndex(e => e.ReceptionistId);
            entity.HasIndex(e => e.CreatedAt);

            // Map to snake_case columns
            entity.Property(c => c.RecordId).HasColumnName("record_id");
            entity.Property(c => c.BookingId).HasColumnName("booking_id");
            entity.Property(c => c.ReceptionistId).HasColumnName("receptionist_id");
            entity.Property(c => c.CheckInTime).HasColumnName("check_in_time");
            entity.Property(c => c.CheckOutTime).HasColumnName("check_out_time");
            entity.Property(c => c.ActualCheckOutDate).HasColumnName("actual_check_out_date");
            entity.Property(c => c.RoomKeyIssued).HasColumnName("room_key_issued");
            entity.Property(c => c.AdditionalCharges).HasColumnName("additional_charges");
            entity.Property(c => c.Notes).HasColumnName("notes");
            entity.Property(c => c.CreatedAt).HasColumnName("created_at");

            entity.HasOne(c => c.Booking)
                .WithMany(b => b.CheckInCheckOuts)
                .HasForeignKey(c => c.BookingId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(c => c.Receptionist)
                .WithMany()
                .HasForeignKey(c => c.ReceptionistId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // Configure AuditLog entity
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("AuditLogs");
            entity.Property(a => a.LogId).HasColumnName("log_id");
            entity.Property(a => a.UserId).HasColumnName("user_id");
            entity.Property(a => a.Action).HasColumnName("action");
            entity.Property(a => a.TableName).HasColumnName("table_name");
            entity.Property(a => a.RecordId).HasColumnName("record_id");
            entity.Property(a => a.OldValue).HasColumnName("old_value");
            entity.Property(a => a.NewValue).HasColumnName("new_value");
            entity.Property(a => a.IpAddress).HasColumnName("ip_address");
            entity.Property(a => a.UserAgent).HasColumnName("user_agent");
            entity.Property(a => a.CreatedAt).HasColumnName("created_at");

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CreatedAt);

            entity.HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // Configure SystemSettings entity
        modelBuilder.Entity<SystemSettings>(entity =>
        {
            entity.HasIndex(e => e.SettingKey).IsUnique();
            entity.Property(s => s.SettingId).HasColumnName("setting_id");
            entity.Property(s => s.SettingKey).HasColumnName("setting_key");
            entity.Property(s => s.SettingValue).HasColumnName("setting_value");
            entity.Property(s => s.CreatedAt).HasColumnName("created_at");
            entity.Property(s => s.UpdatedAt).HasColumnName("updated_at");
        });

        // Configure ChatMessage entity
        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasIndex(e => e.CustomerId);
            entity.HasIndex(e => e.ReceptionistId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.IsRead);

            entity.Property(c => c.MessageId).HasColumnName("message_id");
            entity.Property(c => c.CustomerId).HasColumnName("customer_id");
            entity.Property(c => c.ReceptionistId).HasColumnName("receptionist_id");
            entity.Property(c => c.MessageText).HasColumnName("message_text");
            entity.Property(c => c.IsFromCustomer).HasColumnName("is_from_customer");
            entity.Property(c => c.IsRead).HasColumnName("is_read");
            entity.Property(c => c.CreatedAt).HasColumnName("created_at");
            entity.Property(c => c.ReadAt).HasColumnName("read_at");

            entity.HasOne(c => c.Customer)
                .WithMany()
                .HasForeignKey(c => c.CustomerId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(c => c.Receptionist)
                .WithMany()
                .HasForeignKey(c => c.ReceptionistId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // Configure TravelBooking entity
        modelBuilder.Entity<TravelBooking>(entity =>
        {
            entity.HasIndex(e => e.CustomerId);
            entity.HasIndex(e => e.TravelDate);
            entity.HasIndex(e => e.BookingStatus);
            entity.HasIndex(e => e.RefundRequested);

            entity.Property(t => t.TravelBookingId).HasColumnName("travel_booking_id");
            entity.Property(t => t.CustomerId).HasColumnName("customer_id");
            entity.Property(t => t.AttractionName).HasColumnName("attraction_name");
            entity.Property(t => t.AttractionType).HasColumnName("attraction_type");
            entity.Property(t => t.TravelDate).HasColumnName("travel_date");
            entity.Property(t => t.NumberOfParticipants).HasColumnName("number_of_participants");
            entity.Property(t => t.TotalPrice).HasColumnName("total_price");
            entity.Property(t => t.BookingStatus).HasColumnName("booking_status");
            entity.Property(t => t.PaymentStatus).HasColumnName("payment_status");
            entity.Property(t => t.PaymentMethod).HasColumnName("payment_method");
            entity.Property(t => t.RefundRequested).HasColumnName("refund_requested");
            entity.Property(t => t.RefundRequestedAt).HasColumnName("refund_requested_at");
            entity.Property(t => t.RefundApproved).HasColumnName("refund_approved");
            entity.Property(t => t.RefundApprovedAt).HasColumnName("refund_approved_at");
            entity.Property(t => t.RefundProcessedAt).HasColumnName("refund_processed_at");
            entity.Property(t => t.SpecialRequests).HasColumnName("special_requests");
            entity.Property(t => t.CreatedAt).HasColumnName("created_at");
            entity.Property(t => t.UpdatedAt).HasColumnName("updated_at");
            entity.Property(t => t.CancelledAt).HasColumnName("cancelled_at");

            entity.HasOne(t => t.Customer)
                .WithMany()
                .HasForeignKey(t => t.CustomerId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // Configure EmailVerificationCode entity
        modelBuilder.Entity<EmailVerificationCode>(entity =>
        {
            entity.HasIndex(e => new { e.UserId, e.Code, e.Used });
            entity.HasIndex(e => e.ExpiresAt);

            entity.Property(e => e.VerificationId).HasColumnName("verification_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Code).HasColumnName("code");
            entity.Property(e => e.ExpiresAt).HasColumnName("expires_at");
            entity.Property(e => e.Used).HasColumnName("used");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}

