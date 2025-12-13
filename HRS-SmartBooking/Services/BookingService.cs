using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Services;

public class BookingService
{
    private readonly ApplicationDbContext _context;

    public BookingService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Booking>> GetBookingsByCustomerAsync(int customerId)
    {
        return await _context.Bookings
            .Include(b => b.Room)
                .ThenInclude(r => r!.RoomType)
            .Where(b => b.CustomerId == customerId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Booking>> GetAllBookingsAsync()
    {
        return await _context.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Room)
                .ThenInclude(r => r!.RoomType)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();
    }

    public async Task<Booking?> GetBookingByIdAsync(int bookingId)
    {
        return await _context.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Room)
                .ThenInclude(r => r!.RoomType)
            .FirstOrDefaultAsync(b => b.BookingId == bookingId);
    }

    public async Task<Booking?> CreateBookingAsync(Booking booking)
    {
        _context.Bookings.Add(booking);
        await _context.SaveChangesAsync();
        return booking;
    }

    public async Task<bool> UpdateBookingStatusAsync(int bookingId, string status)
    {
        var booking = await _context.Bookings.FindAsync(bookingId);
        if (booking == null) return false;

        booking.BookingStatus = status;
        booking.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();
        return true;
    }
}

