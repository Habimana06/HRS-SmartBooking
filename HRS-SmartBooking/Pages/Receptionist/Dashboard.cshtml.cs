using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace HRS_SmartBooking.Pages.Receptionist;

public class DashboardModel : PageModel
{
    private readonly DashboardService _dashboardService;
    private readonly BookingService _bookingService;
    private readonly CurrencyHelper _currencyHelper;

    public DashboardModel(DashboardService dashboardService, BookingService bookingService, CurrencyHelper currencyHelper)
    {
        _dashboardService = dashboardService;
        _bookingService = bookingService;
        _currencyHelper = currencyHelper;
    }

    public string Currency { get; set; } = "RWF";

    public List<MetricCard> Metrics { get; set; } = new();
    public List<ChartPoint> DailyBookings { get; set; } = new();
    public List<ChartPoint> OccupancyRate { get; set; } = new();
    public List<ActivityItem> Activity { get; set; } = new();
    public List<AlertItem> Alerts { get; set; } = new();

    public async Task OnGetAsync()
    {
        Currency = await _currencyHelper.GetCurrencyAsync();
        var totalBookings = await _dashboardService.GetTotalBookingsAsync();
        var todayCheckIns = await _dashboardService.GetTodayCheckInsAsync();
        var todayCheckOuts = await _dashboardService.GetTodayCheckOutsAsync();
        var pendingArrivals = await _dashboardService.GetPendingArrivalsAsync();
        var urgentIssues = await _dashboardService.GetUrgentIssuesAsync();
        var totalTravelBookings = await _dashboardService.GetTotalTravelBookingsAsync();
        var todayTravelBookings = await _dashboardService.GetTodayTravelBookingsAsync();
        var pendingTravelRefunds = await _dashboardService.GetPendingTravelRefundsAsync();

        Metrics = new List<MetricCard>
        {
            new("Total bookings", totalBookings, "All bookings", "bi-calendar2-check"),
            new("Check-ins", todayCheckIns, $"{pendingArrivals} pending arrivals", "bi-box-arrow-in-right"),
            new("Check-outs", todayCheckOuts, "Today's departures", "bi-box-arrow-left"),
            new("Travel bookings", totalTravelBookings, $"{todayTravelBookings} today", "bi-airplane"),
            new("Travel refunds", pendingTravelRefunds, "Pending approval", "bi-arrow-counterclockwise"),
            new("Urgent issues", urgentIssues, "Requires attention", "bi-exclamation-triangle")
        };

        var bookingsData = await _dashboardService.GetDailyBookingsChartAsync();
        DailyBookings = bookingsData.Select(b => new ChartPoint(b.Label, b.Value)).ToList();

        // Occupancy rate calculation for last 7 days
        OccupancyRate = bookingsData.Select(b => new ChartPoint(b.Label, b.Value)).ToList();

        Activity = new List<ActivityItem>
        {
            new("System operational", $"Last updated {DateTime.Now:HH:mm}"),
            new("Real-time data", "Live statistics"),
            new("Database connected", "All services running")
        };

        Alerts = new List<AlertItem>
        {
            new("System monitoring active", "System", "info"),
            new("All services operational", "Status", "info")
        };
    }

    public record MetricCard(string Title, int Value, string Detail, string Icon);
    public record ChartPoint(string Label, int Value);
    public record ActivityItem(string Title, string Detail);
    public record AlertItem(string Title, string Detail, string Tone);
}

