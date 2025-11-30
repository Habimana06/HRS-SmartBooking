using System.Collections.Generic;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace HRS_SmartBooking.Pages.Manager;

public class FinancialReportsModel : PageModel
{
    private readonly DashboardService _dashboardService;
    private readonly ReportExportService _exportService;
    private readonly CurrencyHelper _currencyHelper;

    public FinancialReportsModel(DashboardService dashboardService, ReportExportService exportService, CurrencyHelper currencyHelper)
    {
        _dashboardService = dashboardService;
        _exportService = exportService;
        _currencyHelper = currencyHelper;
    }

    public List<ChartPoint> RevenueMonthly { get; set; } = new();
    public List<ChartSlice> PaymentMethods { get; set; } = new();
    public string Currency { get; set; } = "RWF";

    public async Task OnGetAsync()
    {
        Currency = await _currencyHelper.GetCurrencyAsync();
        // Get monthly revenue for last 12 months
        var monthlyRevenue = await _dashboardService.GetMonthlyRevenueChartAsync();
        RevenueMonthly = monthlyRevenue.Select(m => new ChartPoint(m.Label, (int)(m.Value / 1000))).ToList();

        // Get payment methods distribution
        var paymentMethods = await _dashboardService.GetPaymentMethodsDistributionAsync();
        var total = paymentMethods.Sum(p => p.Value);
        if (total > 0)
        {
            PaymentMethods = paymentMethods.Select(p => new ChartSlice(p.Label, (int)Math.Round((double)p.Value / total * 100))).ToList();
        }
        else
        {
            PaymentMethods = new List<ChartSlice>();
        }
    }

    public async Task<IActionResult> OnGetExportPdfAsync()
    {
        var pdfData = await _exportService.ExportPaymentsToPdfAsync();
        var fileName = $"financial_report_{DateTime.Now:yyyyMMdd_HHmmss}.html";
        return File(pdfData, "text/html", fileName);
    }

    public async Task<IActionResult> OnGetExportExcelAsync()
    {
        var excelData = await _exportService.ExportFinancialReportToExcelAsync();
        var fileName = $"financial_report_{DateTime.Now:yyyyMMdd_HHmmss}.csv";
        return File(excelData, "text/csv", fileName);
    }

    public record ChartPoint(string Label, int Value);
    public record ChartSlice(string Label, int Value);
}

