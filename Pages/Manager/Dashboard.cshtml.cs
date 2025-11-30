using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace HRS_SmartBooking.Pages.Manager;

public class DashboardModel : PageModel
{
    private readonly DashboardService _dashboardService;
    private readonly RoomService _roomService;
    private readonly CurrencyHelper _currencyHelper;

    public DashboardModel(DashboardService dashboardService, RoomService roomService, CurrencyHelper currencyHelper)
    {
        _dashboardService = dashboardService;
        _roomService = roomService;
        _currencyHelper = currencyHelper;
    }

    public string Currency { get; set; } = "RWF";

    public List<MetricCard> Metrics { get; set; } = new();
    public List<ChartPoint> Earnings { get; set; } = new();
    public List<ChartPoint> Bookings { get; set; } = new();
    public List<ChartSlice> Occupancy { get; set; } = new();
    public List<ActivityItem> ActivityLogs { get; set; } = new();

    public async Task OnGetAsync()
    {
        Currency = await _currencyHelper.GetCurrencyAsync();
        var totalRooms = await _dashboardService.GetTotalRoomsAsync();
        var occupiedRooms = await _dashboardService.GetOccupiedRoomsAsync();
        var maintenanceRooms = await _dashboardService.GetMaintenanceRoomsAsync();
        var todayRevenue = await _dashboardService.GetTodayRevenueAsync();
        var monthlyRevenue = await _dashboardService.GetMonthlyRevenueForManagerAsync();
        var pendingRequests = await _dashboardService.GetPendingRequestsAsync();
        var totalStaff = await _dashboardService.GetTotalStaffAsync();
        var avgRating = await _dashboardService.GetAverageRatingAsync();
        var newReviews = await _dashboardService.GetNewReviewsCountAsync();

        var occupancyRate = totalRooms > 0 ? (occupiedRooms * 100 / totalRooms) : 0;

        var totalTravelBookings = await _dashboardService.GetTotalTravelBookingsAsync();
        var travelBookingRevenue = await _dashboardService.GetMonthlyTravelBookingRevenueAsync();
        var pendingTravelRefunds = await _dashboardService.GetPendingTravelRefundsAsync();

        Metrics = new List<MetricCard>
        {
            new("Total rooms", totalRooms.ToString("N0"), $"{totalRooms} rooms available", "bi-building"),
            new("Occupied", occupiedRooms.ToString("N0"), $"{occupancyRate}% occupancy", "bi-door-open"),
            new("Maintenance", maintenanceRooms.ToString("N0"), "Under maintenance", "bi-tools"),
            new("Today's revenue", _currencyHelper.FormatPrice(todayRevenue, Currency), "Today's earnings", "bi-currency-dollar"),
            new("Month revenue", _currencyHelper.FormatPrice(monthlyRevenue, Currency), "Current month", "bi-graph-up"),
            new("Travel bookings", totalTravelBookings.ToString("N0"), _currencyHelper.FormatPrice(travelBookingRevenue, Currency), "bi-airplane"),
            new("Travel refunds", pendingTravelRefunds.ToString("N0"), "Pending approval", "bi-arrow-counterclockwise"),
            new("Pending requests", pendingRequests.ToString("N0"), "Customer requests", "bi-flag"),
            new("Total staff", totalStaff.ToString("N0"), "Active employees", "bi-people"),
            new("Customer feedback", $"{avgRating:F1}★", $"{newReviews} new reviews", "bi-stars")
        };

        var revenueData = await _dashboardService.GetMonthlyRevenueChartAsync();
        Earnings = revenueData.Select(r => new ChartPoint(r.Label, (int)(r.Value / 1000))).ToList();

        var bookingsData = await _dashboardService.GetDailyBookingsChartAsync();
        Bookings = bookingsData.Select(b => new ChartPoint(b.Label, b.Value)).ToList();

        var occupancyData = await _dashboardService.GetRoomOccupancyByTypeAsync();
        Occupancy = occupancyData.Select(o => new ChartSlice(o.Label, o.Value)).ToList();

        ActivityLogs = new List<ActivityItem>
        {
            new("System operational", $"Last updated {DateTime.Now:HH:mm}"),
            new("Real-time data", "Live statistics"),
            new("Database connected", "All services running")
        };
    }

    public record MetricCard(string Title, string Value, string Detail, string Icon);
    public record ChartPoint(string Label, int Value);
    public record ChartSlice(string Label, int Value);
    public record ActivityItem(string Title, string Detail);
}

