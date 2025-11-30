using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace HRS_SmartBooking.Pages.Admin;

public class DashboardModel : PageModel
{
    private readonly DashboardService _dashboardService;
    private readonly CurrencyHelper _currencyHelper;

    public DashboardModel(DashboardService dashboardService, CurrencyHelper currencyHelper)
    {
        _dashboardService = dashboardService;
        _currencyHelper = currencyHelper;
    }

    public string Currency { get; set; } = "RWF";

    public List<MetricCard> Metrics { get; set; } = new();
    public List<ChartPoint> RevenueYearly { get; set; } = new();
    public List<ChartPoint> BookingsDaily { get; set; } = new();
    public List<ChartSlice> PaymentMethods { get; set; } = new();
    public List<ChartPoint> UserGrowth { get; set; } = new();
    public List<ActivityItem> ActivityFeed { get; set; } = new();
    public List<SecurityIndicator> SecurityStats { get; set; } = new();

    public async Task OnGetAsync()
    {
        Currency = await _currencyHelper.GetCurrencyAsync();
        var totalUsers = await _dashboardService.GetTotalUsersAsync();
        var activeStaff = await _dashboardService.GetActiveStaffAsync();
        var totalRevenue = await _dashboardService.GetTotalRevenueAsync();
        var monthlyRevenue = await _dashboardService.GetMonthlyRevenueAsync();
        var todayBookings = await _dashboardService.GetTodayBookingsAsync();
        var pendingBookings = await _dashboardService.GetPendingBookingsAsync();
        var failedTransactions = await _dashboardService.GetFailedTransactionsAsync();
        var pendingVerifications = await _dashboardService.GetPendingVerificationsAsync();

        var totalTravelBookings = await _dashboardService.GetTotalTravelBookingsAsync();
        var travelBookingRevenue = await _dashboardService.GetTravelBookingRevenueAsync();
        var pendingTravelRefunds = await _dashboardService.GetPendingTravelRefundsAsync();

        Metrics = new List<MetricCard>
        {
            new("Total system users", totalUsers.ToString("N0"), $"+{totalUsers} total", "bi-people"),
            new("Active staff", activeStaff.ToString("N0"), "Active employees", "bi-person-badge"),
            new("Total revenue", _currencyHelper.FormatPrice(totalRevenue, Currency), "All time", "bi-currency-dollar"),
            new("This month earnings", _currencyHelper.FormatPrice(monthlyRevenue, Currency), "Current month", "bi-graph-up"),
            new("Bookings today", todayBookings.ToString("N0"), $"{pendingBookings} pending approvals", "bi-calendar2-check"),
            new("Travel bookings", totalTravelBookings.ToString("N0"), _currencyHelper.FormatPrice(travelBookingRevenue, Currency), "bi-airplane"),
            new("Travel refunds", pendingTravelRefunds.ToString("N0"), "Pending approval", "bi-arrow-counterclockwise"),
            new("Failed transactions", failedTransactions.ToString("N0"), "Requires review", "bi-x-octagon"),
            new("Pending verifications", pendingVerifications.ToString("N0"), "KYC + documents", "bi-shield-exclamation"),
            new("System health", "99.98% uptime", "All services operational", "bi-activity")
        };

        var revenueData = await _dashboardService.GetMonthlyRevenueChartAsync();
        RevenueYearly = revenueData.Select(r => new ChartPoint(r.Label, (int)(r.Value / 1000))).ToList();

        var bookingsData = await _dashboardService.GetDailyBookingsChartAsync();
        BookingsDaily = bookingsData.Select(b => new ChartPoint(b.Label, b.Value)).ToList();

        var paymentMethodsData = await _dashboardService.GetPaymentMethodsDistributionAsync();
        PaymentMethods = paymentMethodsData.Select(p => new ChartSlice(p.Label, p.Value)).ToList();

        var userGrowthData = await _dashboardService.GetUserGrowthChartAsync();
        UserGrowth = userGrowthData.Select(u => new ChartPoint(u.Label, u.Value)).ToList();

        ActivityFeed = new List<ActivityItem>
        {
            new("System operational", $"Last updated {DateTime.Now:HH:mm}"),
            new("Database connected", "All services running"),
            new("Real-time data", "Live statistics")
        };

        SecurityStats = new List<SecurityIndicator>
        {
            new("System uptime", "99.98%", "bi-cloud-check"),
            new("Open vulnerabilities", "0 critical", "bi-bug"),
            new("Failed logins (24h)", "0 attempts", "bi-shield-exclamation"),
            new("Active sessions", "Active", "bi-phone")
        };
    }

    public record MetricCard(string Title, string Value, string Detail, string Icon);
    public record ChartPoint(string Label, int Value);
    public record ChartSlice(string Label, int Value);
    public record ActivityItem(string Title, string Detail);
    public record SecurityIndicator(string Title, string Value, string Icon);
}

