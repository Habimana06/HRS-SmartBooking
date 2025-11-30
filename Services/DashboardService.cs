using HRS_SmartBooking.Data;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Services;

public class DashboardService
{
    private readonly ApplicationDbContext _context;

    public DashboardService(ApplicationDbContext context)
    {
        _context = context;
    }

    // Admin Dashboard Statistics
    public async Task<int> GetTotalUsersAsync() => await _context.Users.CountAsync();
    
    public async Task<int> GetActiveStaffAsync() => 
        await _context.Users.CountAsync(u => u.Role != "Customer" && u.IsActive);
    
    public async Task<decimal> GetTotalRevenueAsync()
    {
        // Room booking revenue - check for both "completed" and "paid" status
        var roomRevenue = await _context.Payments
            .Where(p => p.PaymentStatus == "completed" || p.PaymentStatus == "paid")
            .SumAsync(p => (decimal?)p.Amount) ?? 0;
        
        // Travel booking revenue
        var travelRevenue = await _context.TravelBookings
            .Where(t => t.PaymentStatus == "paid")
            .SumAsync(t => (decimal?)t.TotalPrice) ?? 0;
        
        return roomRevenue + travelRevenue;
    }
    
    public async Task<decimal> GetMonthlyRevenueAsync()
    {
        // Room booking revenue - check for both "completed" and "paid" status
        var roomRevenue = await _context.Payments
            .Where(p => (p.PaymentStatus == "completed" || p.PaymentStatus == "paid") && 
                   p.PaymentDate.Month == DateTime.Now.Month && 
                   p.PaymentDate.Year == DateTime.Now.Year)
            .SumAsync(p => (decimal?)p.Amount) ?? 0;
        
        // Travel booking revenue
        var travelRevenue = await _context.TravelBookings
            .Where(t => t.PaymentStatus == "paid" && 
                   t.CreatedAt.Month == DateTime.Now.Month && 
                   t.CreatedAt.Year == DateTime.Now.Year)
            .SumAsync(t => (decimal?)t.TotalPrice) ?? 0;
        
        return roomRevenue + travelRevenue;
    }
    
    public async Task<int> GetTodayBookingsAsync() => 
        await _context.Bookings.CountAsync(b => b.CreatedAt.Date == DateTime.Today);
    
    public async Task<int> GetPendingBookingsAsync() => 
        await _context.Bookings.CountAsync(b => b.BookingStatus == "pending");
    
    public async Task<int> GetFailedTransactionsAsync() => 
        await _context.Payments.CountAsync(p => p.PaymentStatus == "failed");
    
    public async Task<int> GetPendingVerificationsAsync() => 
        await _context.Users.CountAsync(u => !u.IsVerified);

    // Manager Dashboard Statistics
    public async Task<int> GetTotalRoomsAsync() => await _context.Rooms.CountAsync();
    
    public async Task<int> GetOccupiedRoomsAsync() => 
        await _context.Rooms.CountAsync(r => r.Status == "occupied");
    
    public async Task<int> GetMaintenanceRoomsAsync() => 
        await _context.Rooms.CountAsync(r => r.Status == "maintenance");
    
    public async Task<decimal> GetTodayRevenueAsync()
    {
        // Room booking revenue - check for both "completed" and "paid" status
        var roomRevenue = await _context.Payments
            .Where(p => (p.PaymentStatus == "completed" || p.PaymentStatus == "paid") && p.PaymentDate.Date == DateTime.Today)
            .SumAsync(p => (decimal?)p.Amount) ?? 0;
        
        // Travel booking revenue
        var travelRevenue = await _context.TravelBookings
            .Where(t => t.PaymentStatus == "paid" && t.CreatedAt.Date == DateTime.Today)
            .SumAsync(t => (decimal?)t.TotalPrice) ?? 0;
        
        return roomRevenue + travelRevenue;
    }
    
    public async Task<decimal> GetMonthlyRevenueForManagerAsync()
    {
        // Room booking revenue - check for both "completed" and "paid" status
        var roomRevenue = await _context.Payments
            .Where(p => (p.PaymentStatus == "completed" || p.PaymentStatus == "paid") && 
                   p.PaymentDate.Month == DateTime.Now.Month && 
                   p.PaymentDate.Year == DateTime.Now.Year)
            .SumAsync(p => (decimal?)p.Amount) ?? 0;
        
        // Travel booking revenue
        var travelRevenue = await _context.TravelBookings
            .Where(t => t.PaymentStatus == "paid" && 
                   t.CreatedAt.Month == DateTime.Now.Month && 
                   t.CreatedAt.Year == DateTime.Now.Year)
            .SumAsync(t => (decimal?)t.TotalPrice) ?? 0;
        
        return roomRevenue + travelRevenue;
    }
    
    public async Task<int> GetPendingRequestsAsync() => 
        await _context.Complaints.CountAsync(c => c.Status == "pending");
    
    public async Task<int> GetTotalStaffAsync() => 
        await _context.Users.CountAsync(u => u.Role == "Manager" || u.Role == "Receptionist");
    
    public async Task<double> GetAverageRatingAsync() => 
        await _context.Reviews.AverageAsync(r => (double?)r.Rating) ?? 0.0;
    
    public async Task<int> GetNewReviewsCountAsync() => 
        await _context.Reviews.CountAsync(r => r.CreatedAt.Date == DateTime.Today);

    // Receptionist Dashboard Statistics
    public async Task<int> GetTotalBookingsAsync() => await _context.Bookings.CountAsync();
    
    public async Task<int> GetTodayCheckInsAsync() => 
        await _context.CheckInCheckOuts.CountAsync(c => c.CheckInTime.HasValue && c.CheckInTime.Value.Date == DateTime.Today);
    
    public async Task<int> GetTodayCheckOutsAsync() => 
        await _context.CheckInCheckOuts.CountAsync(c => c.CheckOutTime.HasValue && c.CheckOutTime.Value.Date == DateTime.Today);
    
    public async Task<int> GetPendingArrivalsAsync() => 
        await _context.Bookings.CountAsync(b => b.CheckInDate.Date == DateTime.Today && b.BookingStatus == "confirmed");
    
    public async Task<int> GetUrgentIssuesAsync() => 
        await _context.Complaints.CountAsync(c => c.Status == "pending" && c.Priority == "high");

    // Revenue Chart Data (Last 12 months) - Combined room and travel revenue
    public async Task<List<(string Label, decimal Value)>> GetMonthlyRevenueChartAsync()
    {
        var startDate = DateTime.Now.AddMonths(-11).Date;
        var endDate = DateTime.Now.Date;
        
        // Get room booking revenue - check for both "completed" and "paid" status
        var roomMonthlyRevenue = await _context.Payments
            .Where(p => (p.PaymentStatus == "completed" || p.PaymentStatus == "paid") && 
                   p.PaymentDate >= startDate && 
                   p.PaymentDate <= endDate)
            .GroupBy(p => new { p.PaymentDate.Year, p.PaymentDate.Month })
            .Select(g => new
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Total = g.Sum(p => p.Amount)
            })
            .ToListAsync();
        
        // Get travel booking revenue
        var travelMonthlyRevenue = await _context.TravelBookings
            .Where(t => t.PaymentStatus == "paid" && 
                   t.CreatedAt >= startDate && 
                   t.CreatedAt <= endDate)
            .GroupBy(t => new { t.CreatedAt.Year, t.CreatedAt.Month })
            .Select(g => new
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Total = g.Sum(t => t.TotalPrice)
            })
            .ToListAsync();

        // Combine room and travel revenue by month
        var combinedRevenue = roomMonthlyRevenue
            .Concat(travelMonthlyRevenue)
            .GroupBy(r => new { r.Year, r.Month })
            .Select(g => new
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Total = g.Sum(r => r.Total)
            })
            .OrderBy(x => x.Year).ThenBy(x => x.Month)
            .ToList();
        
        var months = new[] { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
        var result = new List<(string Label, decimal Value)>();
        
        for (int i = 0; i < 12; i++)
        {
            var date = startDate.AddMonths(i);
            var revenue = combinedRevenue.FirstOrDefault(r => r.Year == date.Year && r.Month == date.Month);
            result.Add((months[date.Month - 1], revenue?.Total ?? 0));
        }
        
        return result;
    }

    // Daily Bookings Chart (Last 7 days)
    public async Task<List<(string Label, int Value)>> GetDailyBookingsChartAsync()
    {
        var startDate = DateTime.Today.AddDays(-6);
        var dailyBookings = await _context.Bookings
            .Where(b => b.CreatedAt >= startDate)
            .GroupBy(b => b.CreatedAt.Date)
            .Select(g => new
            {
                Date = g.Key,
                Count = g.Count()
            })
            .OrderBy(x => x.Date)
            .ToListAsync();

        var days = new[] { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" };
        var result = new List<(string Label, int Value)>();
        
        for (int i = 0; i < 7; i++)
        {
            var date = startDate.AddDays(i);
            var booking = dailyBookings.FirstOrDefault(b => b.Date == date);
            result.Add((days[(int)date.DayOfWeek == 0 ? 6 : (int)date.DayOfWeek - 1], booking?.Count ?? 0));
        }
        
        return result;
    }

    // Payment Methods Distribution
    public async Task<List<(string Label, int Value)>> GetPaymentMethodsDistributionAsync()
    {
        var distribution = await _context.Payments
            .Where(p => p.PaymentStatus == "completed" && !string.IsNullOrEmpty(p.PaymentMethod))
            .GroupBy(p => p.PaymentMethod)
            .Select(g => new
            {
                Method = g.Key ?? "Unknown",
                Count = g.Count()
            })
            .OrderByDescending(x => x.Count)
            .Take(4)
            .ToListAsync();

        return distribution.Select(d => (d.Method, d.Count)).ToList();
    }

    // User Growth (Last 4 quarters)
    public async Task<List<(string Label, int Value)>> GetUserGrowthChartAsync()
    {
        var quarters = new List<(string Label, int Value)>();
        var now = DateTime.Now;
        
        for (int i = 3; i >= 0; i--)
        {
            var quarterStart = new DateTime(now.Year, ((now.Month - 1) / 3 - i) * 3 + 1, 1);
            if (quarterStart.Month < 1)
            {
                quarterStart = quarterStart.AddYears(-1);
                quarterStart = new DateTime(quarterStart.Year, 10, 1);
            }
            var quarterEnd = quarterStart.AddMonths(3).AddDays(-1);
            
            var count = await _context.Users.CountAsync(u => u.CreatedAt >= quarterStart && u.CreatedAt <= quarterEnd);
            quarters.Add(($"Q{((quarterStart.Month - 1) / 3) + 1}", count));
        }
        
        return quarters;
    }

    // Room Occupancy by Type
    public async Task<List<(string Label, int Value)>> GetRoomOccupancyByTypeAsync()
    {
        var occupancy = await _context.Rooms
            .Include(r => r.RoomType)
            .Where(r => r.Status == "occupied")
            .GroupBy(r => r.RoomType!.TypeName)
            .Select(g => new
            {
                TypeName = g.Key ?? "Unknown",
                Count = g.Count()
            })
            .OrderByDescending(x => x.Count)
            .Take(4)
            .ToListAsync();

        return occupancy.Select(o => (o.TypeName, o.Count)).ToList();
    }

    // Travel Booking Statistics
    public async Task<int> GetTotalTravelBookingsAsync() => 
        await _context.TravelBookings.CountAsync();
    
    public async Task<int> GetTodayTravelBookingsAsync() => 
        await _context.TravelBookings.CountAsync(t => t.CreatedAt.Date == DateTime.Today);
    
    public async Task<int> GetPendingTravelBookingsAsync() => 
        await _context.TravelBookings.CountAsync(t => t.BookingStatus == "pending");
    
    public async Task<decimal> GetTravelBookingRevenueAsync() => 
        await _context.TravelBookings
            .Where(t => t.PaymentStatus == "paid")
            .SumAsync(t => t.TotalPrice);
    
    public async Task<decimal> GetMonthlyTravelBookingRevenueAsync() => 
        await _context.TravelBookings
            .Where(t => t.PaymentStatus == "paid" && 
                   t.CreatedAt.Month == DateTime.Now.Month && 
                   t.CreatedAt.Year == DateTime.Now.Year)
            .SumAsync(t => t.TotalPrice);
    
    public async Task<int> GetPendingTravelRefundsAsync() => 
        await _context.TravelBookings.CountAsync(t => t.RefundRequested && (t.RefundApproved == null || t.RefundApproved == false));
}

