using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace HRSAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly DashboardService _dashboardService;
    private readonly UserService _userService;
    private readonly ApplicationDbContext _context;

    public record RoleDefinition
    (
        string Name,
        string Description,
        string Color,
        string[] Permissions,
        bool Disabled = false
    );

    // Default PBAC roles and permissions. Extend here when adding new capabilities.
    private static readonly List<RoleDefinition> DefaultRoleDefinitions = new()
    {
        new RoleDefinition(
            "Admin",
            "Full administrative access",
            "red",
            new[]
            {
                "admin:dashboard:view",
                "admin:users:manage",
                "admin:roles:manage",
                "admin:staff:manage",
                "admin:payments:view",
                "admin:reports:view",
                "admin:reports:download",
                "admin:audit:view",
                "admin:config:manage",
                "admin:security:manage",
                "admin:backup:manage",
                "admin:profile:update"
            }
        ),
        new RoleDefinition(
            "Manager",
            "Manage rooms, bookings, reports",
            "blue",
            new[]
            {
                "manager:dashboard:view",
                "manager:rooms:view",
                "manager:rooms:manage",
                "manager:rooms:create",
                "manager:bookings:view",
                "manager:bookings:manage",
                "manager:travel:manage",
                "manager:reports:view",
                "manager:reports:download",
                "manager:staff:view",
                "manager:profile:update"
            }
        ),
        new RoleDefinition(
            "Receptionist",
            "Handle guest check-ins, bookings, and requests",
            "green",
            new[]
            {
                "receptionist:dashboard:view",
                "receptionist:bookings:view",
                "receptionist:bookings:manage",
                "receptionist:checkin",
                "receptionist:checkout",
                "receptionist:travel:view",
                "receptionist:requests:handle",
                "receptionist:profile:update"
            }
        ),
        new RoleDefinition(
            "Customer",
            "Create and manage own bookings",
            "purple",
            new[]
            {
                "customer:dashboard:view",
                "customer:booking:create",
                "customer:booking:view",
                "customer:payments:pay",
                "customer:profile:update"
            }
        )
    };

    public AdminController(DashboardService dashboardService, UserService userService, ApplicationDbContext context)
    {
        _dashboardService = dashboardService;
        _userService = userService;
        _context = context;
    }

    #region Dashboard

    public record AdminDashboardDto(
        int TotalUsers,
        int ActiveStaff,
        decimal TotalRevenue,
        decimal MonthlyRevenue,
        int TodayBookings,
        int PendingBookings,
        int FailedTransactions,
        int PendingVerifications,
        List<ChartPointDto> MonthlyRevenueChart,
        List<ChartPointIntDto> DailyBookingsChart,
        List<ChartPointIntDto> PaymentMethodsDistribution,
        List<ChartPointIntDto> UserGrowthChart,
        List<ChartPointIntDto> RoomOccupancyByType,
        TravelStatsDto TravelStats
    );

    public record ChartPointDto(string Label, decimal Value);
    public record ChartPointIntDto(string Label, int Value);

    public record TravelStatsDto(
        int TotalTravelBookings,
        int TodayTravelBookings,
        int PendingTravelBookings,
        decimal TravelBookingRevenue,
        decimal MonthlyTravelBookingRevenue,
        int PendingTravelRefunds
    );

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var totalUsers = await _dashboardService.GetTotalUsersAsync();
        var activeStaff = await _dashboardService.GetActiveStaffAsync();
        var totalRevenue = await _dashboardService.GetTotalRevenueAsync();
        var monthlyRevenue = await _dashboardService.GetMonthlyRevenueAsync();
        var todayBookings = await _dashboardService.GetTodayBookingsAsync();
        var pendingBookings = await _dashboardService.GetPendingBookingsAsync();
        var failedTransactions = await _dashboardService.GetFailedTransactionsAsync();
        var pendingVerifications = await _dashboardService.GetPendingVerificationsAsync();

        var monthlyRevenueChart = (await _dashboardService.GetMonthlyRevenueChartAsync())
            .Select(p => new ChartPointDto(p.Label, p.Value))
            .ToList();

        var dailyBookingsChart = (await _dashboardService.GetDailyBookingsChartAsync())
            .Select(p => new ChartPointIntDto(p.Label, p.Value))
            .ToList();

        var paymentMethods = (await _dashboardService.GetPaymentMethodsDistributionAsync())
            .Select(p => new ChartPointIntDto(p.Label, p.Value))
            .ToList();

        var userGrowth = (await _dashboardService.GetUserGrowthChartAsync())
            .Select(p => new ChartPointIntDto(p.Label, p.Value))
            .ToList();

        var roomOccupancy = (await _dashboardService.GetRoomOccupancyByTypeAsync())
            .Select(p => new ChartPointIntDto(p.Label, p.Value))
            .ToList();

        var travelStats = new TravelStatsDto(
            await _dashboardService.GetTotalTravelBookingsAsync(),
            await _dashboardService.GetTodayTravelBookingsAsync(),
            await _dashboardService.GetPendingTravelBookingsAsync(),
            await _dashboardService.GetTravelBookingRevenueAsync(),
            await _dashboardService.GetMonthlyTravelBookingRevenueAsync(),
            await _dashboardService.GetPendingTravelRefundsAsync()
        );

        // Get recent activities from last 7 days
        var startDate = DateTime.UtcNow.AddDays(-7);
        var activities = new List<object>();

        // New bookings
        var recentBookings = await _context.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Room)
            .Where(b => b.CreatedAt >= startDate)
            .OrderByDescending(b => b.CreatedAt)
            .Take(10)
            .ToListAsync();

        activities.AddRange(recentBookings.Select(b => new
        {
            action = "New booking received",
            user = b.Customer != null ? $"{b.Customer.FirstName} {b.Customer.LastName}".Trim() : "Guest",
            time = GetTimeAgo(b.CreatedAt),
            type = "booking",
            createdAt = b.CreatedAt
        }));

        // Payments processed
        var recentPayments = await _context.Payments
            .Include(p => p.Booking)
                .ThenInclude(b => b!.Customer)
            .Where(p => p.PaymentDate >= startDate && p.PaymentStatus == "Completed")
            .OrderByDescending(p => p.PaymentDate)
            .Take(10)
            .ToListAsync();

        activities.AddRange(recentPayments.Select(p => new
        {
            action = "Payment processed",
            user = p.Booking?.Customer != null ? $"{p.Booking.Customer.FirstName} {p.Booking.Customer.LastName}".Trim() : "Guest",
            time = GetTimeAgo(p.PaymentDate),
            type = "payment",
            createdAt = p.PaymentDate
        }));

        // Staff members added
        var recentStaff = await _context.Users
            .Where(u => u.CreatedAt >= startDate && (u.Role == "Admin" || u.Role == "Manager" || u.Role == "Receptionist"))
            .OrderByDescending(u => u.CreatedAt)
            .Take(10)
            .ToListAsync();

        activities.AddRange(recentStaff.Select(u => new
        {
            action = "Staff member added",
            user = "Admin",
            time = GetTimeAgo(u.CreatedAt),
            type = "staff",
            createdAt = u.CreatedAt
        }));

        // Verifications completed (users who were verified recently)
        var recentVerifications = await _context.Users
            .Where(u => u.IsVerified && u.UpdatedAt >= startDate && u.UpdatedAt != u.CreatedAt)
            .OrderByDescending(u => u.UpdatedAt)
            .Take(10)
            .ToListAsync();

        activities.AddRange(recentVerifications.Select(u => new
        {
            action = "Verification completed",
            user = $"{u.FirstName} {u.LastName}".Trim(),
            time = GetTimeAgo(u.UpdatedAt),
            type = "verify",
            createdAt = u.UpdatedAt
        }));

        // Bookings cancelled
        var cancelledBookings = await _context.Bookings
            .Include(b => b.Customer)
            .Where(b => b.BookingStatus == "Cancelled" && b.CancelledAt.HasValue && b.CancelledAt >= startDate)
            .OrderByDescending(b => b.CancelledAt)
            .Take(10)
            .ToListAsync();

        activities.AddRange(cancelledBookings.Select(b => new
        {
            action = "Booking cancelled",
            user = b.Customer != null ? $"{b.Customer.FirstName} {b.Customer.LastName}".Trim() : "Guest",
            time = GetTimeAgo(b.CancelledAt!.Value),
            type = "cancel",
            createdAt = b.CancelledAt.Value
        }));

        // Travel bookings
        var recentTravelBookings = await _context.TravelBookings
            .Include(t => t.Customer)
            .Where(t => t.CreatedAt >= startDate)
            .OrderByDescending(t => t.CreatedAt)
            .Take(10)
            .ToListAsync();

        activities.AddRange(recentTravelBookings.Select(t => new
        {
            action = "New travel booking",
            user = t.Customer != null ? $"{t.Customer.FirstName} {t.Customer.LastName}".Trim() : "Guest",
            time = GetTimeAgo(t.CreatedAt),
            type = "booking",
            createdAt = t.CreatedAt
        }));

        // Sort by creation date and take most recent 5
        var recentActivities = activities
            .OrderByDescending(a => ((dynamic)a).createdAt)
            .Take(5)
            .Select(a => new
            {
                ((dynamic)a).action,
                ((dynamic)a).user,
                ((dynamic)a).time,
                ((dynamic)a).type
            })
            .ToList();

        var dto = new AdminDashboardDto(
            totalUsers,
            activeStaff,
            totalRevenue,
            monthlyRevenue,
            todayBookings,
            pendingBookings,
            failedTransactions,
            pendingVerifications,
            monthlyRevenueChart,
            dailyBookingsChart,
            paymentMethods,
            userGrowth,
            roomOccupancy,
            travelStats
        );

        return Ok(new
        {
            totalUsers = dto.TotalUsers,
            activeStaff = dto.ActiveStaff,
            totalRevenue = dto.TotalRevenue,
            monthlyRevenue = dto.MonthlyRevenue,
            todayBookings = dto.TodayBookings,
            pendingBookings = dto.PendingBookings,
            failedTransactions = dto.FailedTransactions,
            pendingVerifications = dto.PendingVerifications,
            revenueByMonth = dto.MonthlyRevenueChart.Select(c => new { month = c.Label, revenue = c.Value, bookings = 0 }),
            dailyBookingsChart = dto.DailyBookingsChart,
            paymentMethods = dto.PaymentMethodsDistribution.Select(p => new { name = p.Label, value = p.Value, color = "" }),
            userGrowthChart = dto.UserGrowthChart,
            roomOccupancy = dto.RoomOccupancyByType.Select(r => new { type = r.Label, occupied = r.Value, total = 0, percentage = 0 }),
            travelStats = dto.TravelStats,
            recentActivities = recentActivities
        });
    }

    private string GetTimeAgo(DateTime dateTime)
    {
        var timeSpan = DateTime.UtcNow - dateTime;
        
        if (timeSpan.TotalMinutes < 1)
            return "Just now";
        if (timeSpan.TotalMinutes < 60)
            return $"{(int)timeSpan.TotalMinutes} min ago";
        if (timeSpan.TotalHours < 24)
            return $"{(int)timeSpan.TotalHours} hour{(timeSpan.TotalHours >= 2 ? "s" : "")} ago";
        if (timeSpan.TotalDays < 7)
            return $"{(int)timeSpan.TotalDays} day{(timeSpan.TotalDays >= 2 ? "s" : "")} ago";
        
        return dateTime.ToString("MMM dd, yyyy");
    }

    #endregion

    #region Users

    public record AssignRoleDto(int UserId, string Role);

    public record CreateUserDto(
        string Email,
        string Password,
        string FirstName,
        string LastName,
        string? PhoneNumber,
        string Role,
        bool IsActive = true,
        bool IsVerified = true
    );

    public record UpdateUserDto(
        int UserId,
        string Email,
        string? Password,
        string FirstName,
        string LastName,
        string? PhoneNumber,
        string Role,
        bool IsActive = true,
        bool IsVerified = true
    );

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _userService.GetAllUsersAsync();
        return Ok(users);
    }

    [HttpGet("users/{id:int}")]
    public async Task<IActionResult> GetUser(int id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new { message = "Password is required" });
        }

        var user = new User
        {
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            PhoneNumber = dto.PhoneNumber,
            Role = string.IsNullOrWhiteSpace(dto.Role) ? "User" : dto.Role,
            IsVerified = dto.IsVerified,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        var created = await _userService.CreateUserAsync(user);
        if (created == null) return StatusCode(500, new { message = "Failed to create user" });
        return CreatedAtAction(nameof(GetUser), new { id = created.UserId }, created);
    }

    [HttpPut("users/{id:int}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto dto)
    {
        if (id != dto.UserId) return BadRequest(new { message = "Mismatched user id" });

        var user = await _userService.GetUserByIdAsync(id);
        if (user == null) return NotFound();

        user.Email = dto.Email;
        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.PhoneNumber = dto.PhoneNumber;
        user.Role = dto.Role;
        user.IsActive = dto.IsActive;
        user.IsVerified = dto.IsVerified;
        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        }

        await _userService.UpdateUserAsync(user);
        return NoContent();
    }

    [HttpDelete("users/{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var ok = await _userService.DeleteUserAsync(id);
        if (!ok) return NotFound();
        return NoContent();
    }

    [HttpPost("users/assign-role")]
    public async Task<IActionResult> AssignRole([FromBody] AssignRoleDto dto)
    {
        var user = await _userService.GetUserByIdAsync(dto.UserId);
        if (user == null) return NotFound();

        user.Role = dto.Role;
        user.IsActive = true;
        await _userService.UpdateUserAsync(user);
        return Ok(new { message = "Role updated" });
    }

    #endregion

    #region Staff

    [HttpGet("staff")]
    public async Task<IActionResult> GetStaff()
    {
        var staff = await _context.Users
            .Where(u => u.Role != "Customer")
            .Select(u => new
            {
                u.UserId,
                Id = u.UserId,
                Name = $"{u.FirstName} {u.LastName}",
                Role = u.Role,
                Status = "Active",
                Shift = "Day",
                Email = u.Email,
                Phone = u.PhoneNumber ?? "+250 788 000 000",
                JoinDate = u.CreatedAt.ToString("yyyy-MM-dd"),
                Performance = 90,
                Leaves = 0
            })
            .ToListAsync();

        return Ok(staff);
    }

    [HttpPost("staff")]
    public async Task<IActionResult> CreateStaff([FromBody] CreateUserDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new { message = "Password is required" });
        }

        var staffUser = new User
        {
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            PhoneNumber = dto.PhoneNumber,
            Role = string.IsNullOrWhiteSpace(dto.Role) ? "Receptionist" : dto.Role,
            IsVerified = dto.IsVerified,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        var created = await _userService.CreateUserAsync(staffUser);
        return CreatedAtAction(nameof(GetUser), new { id = created!.UserId }, created);
    }

    [HttpPut("staff/{id:int}")]
    public async Task<IActionResult> UpdateStaff(int id, [FromBody] UpdateUserDto dto)
    {
        if (id != dto.UserId) return BadRequest(new { message = "Mismatched staff id" });

        var user = await _userService.GetUserByIdAsync(id);
        if (user == null) return NotFound();

        user.Email = dto.Email;
        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.PhoneNumber = dto.PhoneNumber;
        user.Role = dto.Role;
        user.IsActive = dto.IsActive;
        user.IsVerified = dto.IsVerified;
        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        }

        await _userService.UpdateUserAsync(user);
        return NoContent();
    }

    [HttpDelete("staff/{id:int}")]
    public async Task<IActionResult> DeleteStaff(int id)
    {
        var deleted = await _userService.DeleteUserAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }

    #endregion

    #region Payments

    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments()
    {
        try
        {
            // Get room booking payments
            var roomPayments = await _context.Payments
                .Include(p => p.Booking)
                    .ThenInclude(b => b!.Customer)
                .OrderByDescending(p => p.PaymentDate)
                .Select(p => new
                {
                    paymentId = p.PaymentId,
                    id = p.PaymentId,
                    customer = p.Booking != null && p.Booking.Customer != null
                        ? $"{p.Booking.Customer.FirstName} {p.Booking.Customer.LastName}"
                        : "Unknown",
                    amount = p.Amount,
                    method = p.PaymentMethod,
                    status = p.PaymentStatus,
                    date = p.PaymentDate.ToString("yyyy-MM-dd"),
                    time = p.PaymentDate.ToString("HH:mm"),
                    bookingId = p.BookingId,
                    type = "Room Booking",
                    email = p.Booking != null && p.Booking.Customer != null ? p.Booking.Customer.Email : ""
                })
                .ToListAsync();

            // Get travel booking payments
            var travelPayments = await _context.TravelBookings
                .Include(t => t.Customer)
                .Where(t => t.PaymentStatus != null && (t.PaymentStatus == "paid" || t.PaymentStatus == "Paid" || t.PaymentStatus == "Completed"))
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    paymentId = t.TravelBookingId,
                    id = t.TravelBookingId,
                    customer = t.Customer != null
                        ? $"{t.Customer.FirstName} {t.Customer.LastName}"
                        : "Unknown",
                    amount = t.TotalPrice,
                    method = "Card", // Travel bookings may not have PaymentMethod, default to Card
                    status = t.PaymentStatus,
                    date = t.CreatedAt.ToString("yyyy-MM-dd"),
                    time = t.CreatedAt.ToString("HH:mm"),
                    bookingId = t.TravelBookingId,
                    type = "Travel Booking",
                    email = t.Customer != null ? t.Customer.Email : ""
                })
                .ToListAsync();

            // Combine both types of payments
            var allPayments = roomPayments.Concat(travelPayments)
                .OrderByDescending(p => p.date)
                .ThenByDescending(p => p.time)
                .ToList();

            Console.WriteLine($"Returning {allPayments.Count} total payments ({roomPayments.Count} room, {travelPayments.Count} travel)");
            return Ok(allPayments);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetPayments: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    #endregion

    #region Reports

    [HttpGet("reports")]
    public async Task<IActionResult> GetReports()
    {
        var today = DateTime.Today;
        var thisMonthStart = new DateTime(today.Year, today.Month, 1);

        try
        {
            var lastMonthStart = thisMonthStart.AddMonths(-1);
            var lastMonthEnd = thisMonthStart.AddDays(-1);

            // Calculate real revenue from bookings and travel bookings
            var thisMonthRoomRevenue = await _context.Bookings
                .Where(b => b.CreatedAt >= thisMonthStart && (b.PaymentStatus == "Completed" || b.PaymentStatus == "Paid"))
                .SumAsync(b => (decimal?)b.TotalPrice) ?? 0;

            var thisMonthTravelRevenue = await _context.TravelBookings
                .Where(t => t.CreatedAt >= thisMonthStart && (t.PaymentStatus == "paid" || t.PaymentStatus == "Paid"))
                .SumAsync(b => (decimal?)b.TotalPrice) ?? 0;

            var thisMonthTotalRevenue = thisMonthRoomRevenue + thisMonthTravelRevenue;

            // Last month revenue for comparison
            var lastMonthRoomRevenue = await _context.Bookings
                .Where(b => b.CreatedAt >= lastMonthStart && b.CreatedAt <= lastMonthEnd && (b.PaymentStatus == "Completed" || b.PaymentStatus == "Paid"))
                .SumAsync(b => (decimal?)b.TotalPrice) ?? 0;

            var lastMonthTravelRevenue = await _context.TravelBookings
                .Where(t => t.CreatedAt >= lastMonthStart && t.CreatedAt <= lastMonthEnd && (t.PaymentStatus == "paid" || t.PaymentStatus == "Paid"))
                .SumAsync(b => (decimal?)b.TotalPrice) ?? 0;

            var lastMonthTotalRevenue = lastMonthRoomRevenue + lastMonthTravelRevenue;
            var revenueTrend = lastMonthTotalRevenue > 0 
                ? ((thisMonthTotalRevenue - lastMonthTotalRevenue) / lastMonthTotalRevenue * 100).ToString("F1")
                : "0.0";

            // Occupancy calculation
            var totalRooms = await _context.Rooms.CountAsync();
            var occupiedRooms = await _context.Rooms.CountAsync(r => r.Status == "occupied" || r.Status == "Occupied");
            var occupancyRate = totalRooms > 0 ? (occupiedRooms * 100.0 / totalRooms) : 0;

            var reports = new List<object>
            {
                new
                {
                    id = 1,
                    name = "Monthly Revenue",
                    period = "This Month",
                    amount = thisMonthTotalRevenue,
                    type = "Finance",
                    status = "Ready",
                    lastGenerated = today.ToString("yyyy-MM-dd"),
                    trend = revenueTrend.StartsWith("-") ? revenueTrend : $"+{revenueTrend}%"
                },
                new
                {
                    id = 2,
                    name = "Occupancy Summary",
                    period = "This Month",
                    amount = occupancyRate,
                    unit = "%",
                    type = "Operations",
                    status = "Ready",
                    lastGenerated = today.ToString("yyyy-MM-dd"),
                    trend = "+5.2%"
                }
            };

            // Revenue data for last 6 months
            var revenueDataList = new List<object>();
            for (int i = 5; i >= 0; i--)
            {
                var monthStart = thisMonthStart.AddMonths(-i);
                var monthEnd = monthStart.AddMonths(1).AddDays(-1);
                
                var monthRoomRevenue = await _context.Bookings
                    .Where(b => b.CreatedAt >= monthStart && b.CreatedAt <= monthEnd && (b.PaymentStatus == "Completed" || b.PaymentStatus == "Paid"))
                    .SumAsync(b => (decimal?)b.TotalPrice) ?? 0;

                var monthTravelRevenue = await _context.TravelBookings
                    .Where(t => t.CreatedAt >= monthStart && t.CreatedAt <= monthEnd && (t.PaymentStatus == "paid" || t.PaymentStatus == "Paid"))
                    .SumAsync(b => (decimal?)b.TotalPrice) ?? 0;

                revenueDataList.Add(new
                {
                    month = monthStart.ToString("MMM"),
                    revenue = monthRoomRevenue + monthTravelRevenue,
                    expenses = (monthRoomRevenue + monthTravelRevenue) * 0.5m
                });
            }

            // Category data based on actual bookings
            var totalBookings = await _context.Bookings.CountAsync(b => b.BookingStatus != "Cancelled");
            var totalTravelBookings = await _context.TravelBookings.CountAsync();
            var totalUsers = await _context.Users.CountAsync();

            var categoryData = new[]
            {
                new { name = "Room Bookings", value = totalBookings },
                new { name = "Travel Bookings", value = totalTravelBookings },
                new { name = "Users", value = totalUsers },
                new { name = "Other", value = 0 }
            };

            // User growth data for last 4 weeks
            var userGrowthDataList = new List<object>();
            for (int week = 3; week >= 0; week--)
            {
                var weekStart = today.AddDays(-(week * 7 + 6));
                var weekEnd = weekStart.AddDays(6);
                
                var weekUsers = await _context.Users
                    .CountAsync(u => u.CreatedAt >= weekStart && u.CreatedAt <= weekEnd);

                userGrowthDataList.Add(new
                {
                    week = $"Week {4 - week}",
                    users = weekUsers
                });
            }

            Console.WriteLine($"Returning reports with revenue: {thisMonthTotalRevenue}, occupancy: {occupancyRate}%");
            return Ok(new
            {
                reports,
                revenueData = revenueDataList,
                categoryData,
                userGrowthData = userGrowthDataList
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetReports: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    #endregion

    #region Audit Logs

    [HttpGet("audit-logs")]
    public IActionResult GetAuditLogs()
    {
        var logs = _context.AuditLogs
            .OrderByDescending(a => a.CreatedAt)
            .Take(200)
            .Select(a => new
            {
                id = a.LogId,
                actor = a.User != null ? $"{a.User.FirstName} {a.User.LastName}" : "System",
                action = a.Action,
                target = a.TableName,
                time = a.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
                status = "Success",
                recordId = a.RecordId,
                ipAddress = a.IpAddress,
                userAgent = a.UserAgent
            })
            .ToList();

        return Ok(logs);
    }

    #endregion

    #region Roles

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var mergedRoles = await GetMergedRoleDefinitionsAsync();

        var userRoleCounts = await _context.Users
            .GroupBy(u => u.Role)
            .Select(g => new { Role = g.Key, Count = g.Count() })
            .ToDictionaryAsync(k => k.Role ?? "Customer", v => v.Count);

        var roles = mergedRoles
            .Select((r, idx) => new
            {
                Id = idx + 1,
                Name = r.Name,
                Description = r.Description,
                Users = userRoleCounts.TryGetValue(r.Name, out var cnt) ? cnt : 0,
                Permissions = r.Permissions,
                Color = r.Color,
                Disabled = r.Disabled,
                CreatedAt = DateTime.Today.AddDays(-30).ToString("yyyy-MM-dd")
            })
            .ToList();

        var activityLog = new List<object>
        {
            new { User = "System", Action = "Roles loaded", Time = DateTime.Now.ToString("HH:mm"), Type = "info" }
        };

        return Ok(new { roles, activityLog });
    }

    [HttpPut("roles")]
    public async Task<IActionResult> UpsertRoles([FromBody] List<RoleDefinition> roles)
    {
        if (roles == null || roles.Count == 0)
        {
            return BadRequest(new { message = "No roles supplied" });
        }

        // Keep only known roles; merge with defaults to avoid wiping required permissions.
        var updated = DefaultRoleDefinitions
            .Select(def =>
            {
                var incoming = roles.FirstOrDefault(r => r.Name.Equals(def.Name, StringComparison.OrdinalIgnoreCase));
                return incoming is null
                    ? def
                    : new RoleDefinition(
                        def.Name,
                        incoming.Description ?? def.Description,
                        string.IsNullOrWhiteSpace(incoming.Color) ? def.Color : incoming.Color,
                        incoming.Permissions?.Length > 0 ? incoming.Permissions : def.Permissions,
                        incoming.Disabled);
            })
            .ToList();

        await SaveRoleDefinitionsAsync(updated);
        var merged = await GetMergedRoleDefinitionsAsync();

        return Ok(new
        {
            message = "Roles updated",
            roles = merged
        });
    }

    private async Task<List<RoleDefinition>> GetMergedRoleDefinitionsAsync()
    {
        var saved = await LoadRoleDefinitionsAsync();

        var merged = DefaultRoleDefinitions
            .Select(def =>
            {
                var savedRole = saved.FirstOrDefault(r => r.Name.Equals(def.Name, StringComparison.OrdinalIgnoreCase));
                return savedRole is null
                    ? def
                    : new RoleDefinition(
                        def.Name,
                        string.IsNullOrWhiteSpace(savedRole.Description) ? def.Description : savedRole.Description,
                        string.IsNullOrWhiteSpace(savedRole.Color) ? def.Color : savedRole.Color,
                        savedRole.Permissions?.Length > 0 ? savedRole.Permissions : def.Permissions,
                        savedRole.Disabled);
            })
            .ToList();

        return merged;
    }

    private async Task<List<RoleDefinition>> LoadRoleDefinitionsAsync()
    {
        var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == "rolePermissions");
        if (setting == null || string.IsNullOrWhiteSpace(setting.SettingValue))
        {
            return new List<RoleDefinition>();
        }

        try
        {
            var roles = JsonSerializer.Deserialize<List<RoleDefinition>>(setting.SettingValue);
            return roles ?? new List<RoleDefinition>();
        }
        catch
        {
            return new List<RoleDefinition>();
        }
    }

    private async Task SaveRoleDefinitionsAsync(List<RoleDefinition> roles)
    {
        var json = JsonSerializer.Serialize(roles, new JsonSerializerOptions
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        });

        var existing = await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == "rolePermissions");
        if (existing == null)
        {
            _context.SystemSettings.Add(new SystemSettings
            {
                SettingKey = "rolePermissions",
                SettingValue = json,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }
        else
        {
            existing.SettingValue = json;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    [HttpPost("roles/assign")]
    public async Task<IActionResult> AssignUserRole([FromBody] AssignRoleDto dto)
    {
        var user = await _userService.GetUserByIdAsync(dto.UserId);
        if (user == null) return NotFound();

        user.Role = dto.Role;
        user.IsActive = true;
        await _userService.UpdateUserAsync(user);
        return Ok(new { message = "Role assigned" });
    }

    [HttpPut("roles/{role}/status")]
    public async Task<IActionResult> UpdateRoleStatus(string role, [FromQuery] bool enabled = true)
    {
        var usersInRole = await _context.Users.Where(u => u.Role == role).ToListAsync();
        if (!usersInRole.Any()) return NotFound(new { message = "Role not found" });

        foreach (var user in usersInRole)
        {
            user.IsActive = enabled;
            user.UpdatedAt = DateTime.Now;
        }
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Role '{role}' {(enabled ? "enabled" : "disabled")}" });
    }

    [HttpPut("users/permissions")]
    public async Task<IActionResult> SaveUserPermissions([FromBody] Dictionary<string, Dictionary<string, bool>> userPermissions)
    {
        if (userPermissions == null || userPermissions.Count == 0)
        {
            return BadRequest(new { message = "No user permissions supplied" });
        }

        try
        {
            var json = JsonSerializer.Serialize(userPermissions, new JsonSerializerOptions
            {
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            });

            var existing = await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == "userPermissions");
            if (existing == null)
            {
                _context.SystemSettings.Add(new SystemSettings
                {
                    SettingKey = "userPermissions",
                    SettingValue = json,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            else
            {
                existing.SettingValue = json;
                existing.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User permissions saved successfully",
                userPermissions
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error saving user permissions: {ex.Message}");
            return StatusCode(500, new { message = "Failed to save user permissions" });
        }
    }

    #endregion

    #region System Config

    [HttpGet("config")]
    public async Task<IActionResult> GetSystemConfig()
    {
        try
    {
        // Load from SystemSettings table if available; fallback to defaults
            var settings = await _context.SystemSettings.ToDictionaryAsync(s => s.SettingKey, s => s.SettingValue);

        bool Bool(string key, bool def) => settings.TryGetValue(key, out var v) && bool.TryParse(v, out var b) ? b : def;

        return Ok(new
        {
            maintenancemode = Bool("maintenanceMode", false),
            emailnotifications = Bool("emailNotifications", true),
            twofactorauthentication = Bool("twoFactorAuth", true),
            autobackup = Bool("autoBackup", true)
        });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting system config: {ex.Message}");
            return Ok(new
            {
                maintenancemode = false,
                emailnotifications = true,
                twofactorauthentication = true,
                autobackup = true
            });
        }
    }

    [HttpPut("config")]
    public async Task<IActionResult> UpdateSystemConfig([FromBody] Dictionary<string, object> config)
    {
        if (config == null) return BadRequest(new { error = "Configuration data is required" });

        try
        {
            // Map frontend keys to backend keys
            var keyMapping = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "maintenancemode", "maintenanceMode" },
                { "emailnotifications", "emailNotifications" },
                { "twofactorauthentication", "twoFactorAuth" },
                { "autobackup", "autoBackup" }
            };

        foreach (var kv in config)
        {
                var frontendKey = kv.Key.ToLower();
                var backendKey = keyMapping.TryGetValue(frontendKey, out var mapped) ? mapped : frontendKey;
            var value = kv.Value?.ToString() ?? "false";

                var existing = await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == backendKey);
            if (existing == null)
            {
                _context.SystemSettings.Add(new SystemSettings
                {
                        SettingKey = backendKey,
                    SettingValue = value,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                });
            }
            else
            {
                existing.SettingValue = value;
                    existing.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Configuration updated successfully" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error updating system config: {ex.Message}");
            return StatusCode(500, new { error = "Failed to update configuration", message = ex.Message });
        }
    }

    #endregion

    #region Backup & Restore

    [HttpPost("backup/create")]
    public async Task<IActionResult> CreateBackup()
    {
        try
        {
            var backupId = $"backup-{DateTime.UtcNow:yyyyMMdd-HHmmss}";
            var timestamp = DateTime.UtcNow;

            // Backup all tables in parallel for better performance
            var usersTask = _context.Users.Select(u => new
                {
                    u.UserId,
                    u.Email,
                    u.FirstName,
                    u.LastName,
                    u.PhoneNumber,
                    u.Role,
                    u.IsActive,
                    u.IsVerified,
                    u.CreatedAt,
                    u.UpdatedAt
                }).ToListAsync();
            
            var bookingsTask = _context.Bookings
                    .Include(b => b.Customer)
                    .Include(b => b.Room)
                    .Select(b => new
                    {
                        b.BookingId,
                        b.CustomerId,
                        CustomerName = b.Customer != null ? $"{b.Customer.FirstName} {b.Customer.LastName}" : null,
                        CustomerEmail = b.Customer != null ? b.Customer.Email : null,
                        b.RoomId,
                        RoomNumber = b.Room != null ? b.Room.RoomNumber : null,
                        RoomType = b.Room != null ? b.Room.RoomType : null,
                        b.CheckInDate,
                        b.CheckOutDate,
                        BookingStatus = b.BookingStatus,
                        TotalPrice = b.TotalPrice,
                        b.CreatedAt,
                        b.UpdatedAt
                    }).ToListAsync();
            
            var paymentsTask = _context.Payments
                    .Include(p => p.Booking)
                    .Select(p => new
                    {
                        p.PaymentId,
                        p.BookingId,
                        p.Amount,
                        p.PaymentMethod,
                        p.PaymentStatus,
                        p.PaymentDate,
                        p.TransactionId
                    }).ToListAsync();
            
            var travelBookingsTask = _context.TravelBookings
                    .Include(t => t.Customer)
                    .Select(t => new
                    {
                        t.TravelBookingId,
                        t.CustomerId,
                        CustomerName = t.Customer != null ? $"{t.Customer.FirstName} {t.Customer.LastName}" : null,
                        CustomerEmail = t.Customer != null ? t.Customer.Email : null,
                        AttractionName = t.AttractionName,
                        AttractionType = t.AttractionType,
                        TravelDate = t.TravelDate,
                        NumberOfParticipants = t.NumberOfParticipants,
                        BookingStatus = t.BookingStatus,
                        TotalPrice = t.TotalPrice,
                        t.CreatedAt,
                        t.UpdatedAt
                    }).ToListAsync();
            
            var roomsTask = _context.Rooms
                    .Include(r => r.RoomType)
                    .Select(r => new
                {
                    r.RoomId,
                    r.RoomNumber,
                    RoomType = r.RoomType != null ? r.RoomType.TypeName : (string?)null,
                    Price = r.RoomType != null ? r.RoomType.BasePrice : 0,
                    r.Status,
                    r.Description,
                    r.CreatedAt,
                    r.UpdatedAt
                }).ToListAsync();
            
            var systemSettingsTask = _context.SystemSettings.Select(s => new
                {
                    s.SettingKey,
                    s.SettingValue,
                    s.CreatedAt,
                    s.UpdatedAt
                }).ToListAsync();

            // Execute all queries in parallel
            await Task.WhenAll(usersTask, bookingsTask, paymentsTask, travelBookingsTask, roomsTask, systemSettingsTask);

            // Build backup data object
            var backupData = new
            {
                backupId,
                timestamp,
                version = "1.0",
                users = await usersTask,
                bookings = await bookingsTask,
                payments = await paymentsTask,
                travelBookings = await travelBookingsTask,
                rooms = await roomsTask,
                systemSettings = await systemSettingsTask
            };

            // Store backup in SystemSettings
            var backupJson = JsonSerializer.Serialize(backupData, new JsonSerializerOptions
            {
                WriteIndented = true,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            });

            var backupKey = $"backup_{backupId}";
            var existing = await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == backupKey);
            if (existing == null)
            {
                _context.SystemSettings.Add(new SystemSettings
                {
                    SettingKey = backupKey,
                    SettingValue = backupJson,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            else
            {
                existing.SettingValue = backupJson;
                existing.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                backupId,
                timestamp,
                message = "Backup created successfully",
                recordCount = new
                {
                    users = backupData.users.Count,
                    bookings = backupData.bookings.Count,
                    payments = backupData.payments.Count,
                    travelBookings = backupData.travelBookings.Count,
                    rooms = backupData.rooms.Count
                }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error creating backup: {ex.Message}");
            return StatusCode(500, new { error = "Failed to create backup", message = ex.Message });
        }
    }

    [HttpGet("backup/list")]
    public async Task<IActionResult> ListBackups()
    {
        try
        {
            var backups = await _context.SystemSettings
                .Where(s => s.SettingKey.StartsWith("backup_"))
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new
                {
                    backupId = s.SettingKey.Replace("backup_", ""),
                    createdAt = s.CreatedAt,
                    size = s.SettingValue != null ? s.SettingValue.Length : 0
                })
                .ToListAsync();

            var backupList = backups.Select(b => new
            {
                id = b.backupId,
                name = b.backupId,
                time = b.createdAt.ToString("yyyy-MM-dd HH:mm:ss"),
                size = FormatBytes(b.size),
                status = "Success",
                type = "Manual",
                timestamp = b.createdAt
            }).ToList();

            return Ok(new { backups = backupList });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error listing backups: {ex.Message}");
            return StatusCode(500, new { error = "Failed to list backups", message = ex.Message });
        }
    }

    [HttpGet("backup/{backupId}/download")]
    public async Task<IActionResult> DownloadBackupPdf(string backupId)
    {
        try
        {
            var backupKey = $"backup_{backupId}";
            var backupSetting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == backupKey);
            
            if (backupSetting == null)
            {
                return NotFound(new { error = "Backup not found" });
            }

            var backupData = JsonSerializer.Deserialize<JsonElement>(backupSetting.SettingValue);

            // Generate PDF content (simplified - in production use a PDF library like iTextSharp or QuestPDF)
            var pdfContent = GenerateBackupPdf(backupData);

            return File(System.Text.Encoding.UTF8.GetBytes(pdfContent), "application/pdf", $"backup-{backupId}.pdf");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error downloading backup: {ex.Message}");
            return StatusCode(500, new { error = "Failed to download backup", message = ex.Message });
        }
    }

    [HttpDelete("backup/{backupId}")]
    public async Task<IActionResult> DeleteBackup(string backupId)
    {
        try
        {
            var backupKey = $"backup_{backupId}";
            var backupSetting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == backupKey);
            
            if (backupSetting == null)
            {
                return NotFound(new { error = "Backup not found" });
            }

            _context.SystemSettings.Remove(backupSetting);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Backup deleted successfully" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting backup: {ex.Message}");
            return StatusCode(500, new { error = "Failed to delete backup", message = ex.Message });
        }
    }

    private string GenerateBackupPdf(JsonElement backupData)
    {
        var content = new System.Text.StringBuilder();
        
        // Header
        content.AppendLine("╔══════════════════════════════════════════════════════════════════════════════╗");
        content.AppendLine("║                    HRS SYSTEM - COMPLETE BACKUP REPORT                      ║");
        content.AppendLine("╚══════════════════════════════════════════════════════════════════════════════╝");
        content.AppendLine();
        content.AppendLine($"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss UTC}");
        if (backupData.TryGetProperty("backupId", out var backupId))
        {
            content.AppendLine($"Backup ID: {backupId.GetString()}");
        }
        content.AppendLine("=".PadRight(90, '='));
        content.AppendLine();

        if (backupData.TryGetProperty("users", out var users))
        {
            content.AppendLine("USERS");
            content.AppendLine("-".PadRight(80, '-'));
            foreach (var user in users.EnumerateArray())
            {
                content.AppendLine($"ID: {user.GetProperty("userId").GetInt32()}, " +
                    $"Name: {user.GetProperty("firstName").GetString()} {user.GetProperty("lastName").GetString()}, " +
                    $"Email: {user.GetProperty("email").GetString()}, " +
                    $"Role: {user.GetProperty("role").GetString()}");
            }
            content.AppendLine();
        }

        if (backupData.TryGetProperty("bookings", out var bookings))
        {
            content.AppendLine("BOOKINGS");
            content.AppendLine("-".PadRight(80, '-'));
            foreach (var booking in bookings.EnumerateArray())
            {
                var customerName = booking.TryGetProperty("customerName", out var cn) ? cn.GetString() : "N/A";
                var roomNumber = booking.TryGetProperty("roomNumber", out var rn) ? rn.GetString() : "N/A";
                var bookingStatus = booking.TryGetProperty("bookingStatus", out var bs) ? bs.GetString() : 
                    (booking.TryGetProperty("status", out var s) ? s.GetString() : "N/A");
                var totalPrice = booking.TryGetProperty("totalPrice", out var tp) ? tp.GetDecimal() : 
                    (booking.TryGetProperty("totalAmount", out var ta) ? ta.GetDecimal() : 0);
                content.AppendLine($"Booking ID: {booking.GetProperty("bookingId").GetInt32()}, " +
                    $"Customer: {customerName}, " +
                    $"Room: {roomNumber}, " +
                    $"Check-in: {booking.GetProperty("checkInDate").GetString()}, " +
                    $"Check-out: {booking.GetProperty("checkOutDate").GetString()}, " +
                    $"Amount: {totalPrice}, " +
                    $"Status: {bookingStatus ?? "N/A"}");
            }
            content.AppendLine();
        }

        if (backupData.TryGetProperty("payments", out var payments))
        {
            content.AppendLine("PAYMENTS");
            content.AppendLine("-".PadRight(80, '-'));
            foreach (var payment in payments.EnumerateArray())
            {
                content.AppendLine($"Payment ID: {payment.GetProperty("paymentId").GetInt32()}, " +
                    $"Booking ID: {payment.GetProperty("bookingId").GetInt32()}, " +
                    $"Amount: {payment.GetProperty("amount").GetDecimal()}, " +
                    $"Method: {payment.GetProperty("paymentMethod").GetString()}, " +
                    $"Status: {payment.GetProperty("paymentStatus").GetString()}, " +
                    $"Date: {payment.GetProperty("paymentDate").GetString()}");
            }
            content.AppendLine();
        }

        if (backupData.TryGetProperty("travelBookings", out var travelBookings))
        {
            content.AppendLine("TRAVEL BOOKINGS");
            content.AppendLine("-".PadRight(80, '-'));
            foreach (var travel in travelBookings.EnumerateArray())
            {
                var customerName = travel.TryGetProperty("customerName", out var cn) ? cn.GetString() : "N/A";
                var attractionName = travel.TryGetProperty("attractionName", out var an) ? an.GetString() : 
                    (travel.TryGetProperty("destination", out var d) ? d.GetString() : "N/A");
                var travelDate = travel.TryGetProperty("travelDate", out var td) ? td.GetString() : 
                    (travel.TryGetProperty("departureDate", out var dd) ? dd.GetString() : "N/A");
                var totalPrice = travel.TryGetProperty("totalPrice", out var tp) ? tp.GetDecimal() : 
                    (travel.TryGetProperty("totalAmount", out var ta) ? ta.GetDecimal() : 0);
                var bookingStatus = travel.TryGetProperty("bookingStatus", out var bs) ? bs.GetString() : 
                    (travel.TryGetProperty("status", out var s) ? s.GetString() : "N/A");
                var participants = travel.TryGetProperty("numberOfParticipants", out var np) ? np.GetInt32() : 0;
                content.AppendLine($"Travel ID: {travel.GetProperty("travelBookingId").GetInt32()}, " +
                    $"Customer: {customerName ?? "N/A"}, " +
                    $"Attraction: {attractionName ?? "N/A"}, " +
                    $"Travel Date: {travelDate ?? "N/A"}, " +
                    $"Participants: {participants}, " +
                    $"Amount: {totalPrice}, " +
                    $"Status: {bookingStatus ?? "N/A"}");
            }
            content.AppendLine();
        }

        if (backupData.TryGetProperty("rooms", out var rooms))
        {
            content.AppendLine("ROOMS");
            content.AppendLine("-".PadRight(80, '-'));
            foreach (var room in rooms.EnumerateArray())
            {
                var roomPrice = room.TryGetProperty("price", out var priceProp) ? priceProp.GetDecimal() : 0;
                content.AppendLine($"Room ID: {room.GetProperty("roomId").GetInt32()}, " +
                    $"Number: {room.GetProperty("roomNumber").GetString()}, " +
                    $"Type: {room.GetProperty("roomType").GetString()}, " +
                    $"Price: {roomPrice}, " +
                    $"Status: {room.GetProperty("status").GetString()}");
            }
        }

        content.AppendLine();
        content.AppendLine("=".PadRight(90, '='));
        content.AppendLine("End of Backup Report");
        var userCount = backupData.TryGetProperty("users", out var u) ? u.GetArrayLength() : 0;
        var bookingCount = backupData.TryGetProperty("bookings", out var b) ? b.GetArrayLength() : 0;
        var paymentCount = backupData.TryGetProperty("payments", out var p) ? p.GetArrayLength() : 0;
        var travelBookingCount = backupData.TryGetProperty("travelBookings", out var tb) ? tb.GetArrayLength() : 0;
        var roomCount = backupData.TryGetProperty("rooms", out var r) ? r.GetArrayLength() : 0;
        content.AppendLine($"Total Records: Users: {userCount}, " +
            $"Bookings: {bookingCount}, " +
            $"Payments: {paymentCount}, " +
            $"Travel Bookings: {travelBookingCount}, " +
            $"Rooms: {roomCount}");

        return content.ToString(); // Return text content for now - in production generate proper PDF
    }

    private static string FormatBytes(long bytes)
    {
        string[] sizes = { "B", "KB", "MB", "GB" };
        double len = bytes;
        int order = 0;
        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len = len / 1024;
        }
        return $"{len:0.##} {sizes[order]}";
    }

    #endregion
}


