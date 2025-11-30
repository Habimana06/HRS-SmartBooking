using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Services;

public class RoomService
{
    private readonly ApplicationDbContext _context;

    public RoomService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Room>> GetAvailableRoomsAsync(DateTime checkIn, DateTime checkOut)
    {
        var bookedRoomIds = await _context.Bookings
            .Where(b => b.BookingStatus != "cancelled" &&
                       ((b.CheckInDate <= checkIn && b.CheckOutDate > checkIn) ||
                        (b.CheckInDate < checkOut && b.CheckOutDate >= checkOut) ||
                        (b.CheckInDate >= checkIn && b.CheckOutDate <= checkOut)))
            .Select(b => b.RoomId)
            .ToListAsync();

        return await _context.Rooms
            .Include(r => r.RoomType)
            .Where(r => r.Status == "available" && !bookedRoomIds.Contains(r.RoomId))
            .ToListAsync();
    }

    public async Task<List<Room>> GetAllRoomsAsync()
    {
        return await _context.Rooms
            .Include(r => r.RoomType)
            .OrderBy(r => r.RoomNumber)
            .ToListAsync();
    }

    public async Task<Room?> GetRoomByIdAsync(int roomId)
    {
        return await _context.Rooms
            .Include(r => r.RoomType)
            .FirstOrDefaultAsync(r => r.RoomId == roomId);
    }

    public async Task<Room?> CreateRoomAsync(Room room)
    {
        _context.Rooms.Add(room);
        await _context.SaveChangesAsync();
        return room;
    }

    public async Task<bool> UpdateRoomAsync(Room room)
    {
        room.UpdatedAt = DateTime.Now;
        _context.Rooms.Update(room);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteRoomAsync(int roomId)
    {
        var room = await _context.Rooms.FindAsync(roomId);
        if (room == null) return false;

        _context.Rooms.Remove(room);
        await _context.SaveChangesAsync();
        return true;
    }
}

