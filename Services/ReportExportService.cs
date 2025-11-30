using System.Text;
using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Services;

public class ReportExportService
{
    private readonly ApplicationDbContext _context;
    private readonly CurrencyHelper _currencyHelper;

    public ReportExportService(ApplicationDbContext context, CurrencyHelper currencyHelper)
    {
        _context = context;
        _currencyHelper = currencyHelper;
    }

    public async Task<byte[]> ExportPaymentsToCsvAsync()
    {
        var currency = await _currencyHelper.GetCurrencyAsync();
        
        // Get room booking payments
        var payments = await _context.Payments
            .Include(p => p.Booking)
                .ThenInclude(b => b!.Customer)
            .Include(p => p.Booking)
                .ThenInclude(b => b!.Room)
                    .ThenInclude(r => r!.RoomType)
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();

        // Get travel booking payments
        var travelBookings = await _context.TravelBookings
            .Include(t => t.Customer)
            .Where(t => t.PaymentStatus == "paid")
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var csv = new StringBuilder();
        csv.AppendLine("Transaction ID,Customer,Type,Room/Attraction,Amount,Date,Payment Method,Status");

        // Add room booking payments
        foreach (var payment in payments)
        {
            var customerName = payment.Booking?.Customer != null
                ? $"{payment.Booking.Customer.FirstName} {payment.Booking.Customer.LastName}"
                : "Unknown";
            var room = payment.Booking?.Room != null
                ? $"{payment.Booking.Room.RoomType?.TypeName ?? "Room"} {payment.Booking.Room.RoomNumber}"
                : "N/A";
            var amount = _currencyHelper.FormatPrice(payment.Amount, currency);
            var transactionId = payment.TransactionId ?? $"PAY-{payment.PaymentId}";

            csv.AppendLine($"{transactionId},{customerName},Room Booking,\"{room}\",{amount},{payment.PaymentDate:yyyy-MM-dd HH:mm},{payment.PaymentMethod},{payment.PaymentStatus}");
        }

        // Add travel booking payments
        foreach (var travel in travelBookings)
        {
            var customerName = travel.Customer != null
                ? $"{travel.Customer.FirstName} {travel.Customer.LastName}"
                : "Unknown";
            var amount = _currencyHelper.FormatPrice(travel.TotalPrice, currency);
            var transactionId = $"TB-{travel.TravelBookingId}";

            csv.AppendLine($"{transactionId},{customerName},Travel Booking,\"{travel.AttractionName}\",{amount},{travel.CreatedAt:yyyy-MM-dd HH:mm},{travel.PaymentMethod ?? "N/A"},{travel.PaymentStatus}");
        }

        return Encoding.UTF8.GetBytes(csv.ToString());
    }

    public async Task<byte[]> ExportPaymentsToPdfAsync()
    {
        var currency = await _currencyHelper.GetCurrencyAsync();
        
        // Get room booking payments
        var payments = await _context.Payments
            .Include(p => p.Booking)
                .ThenInclude(b => b!.Customer)
            .Include(p => p.Booking)
                .ThenInclude(b => b!.Room)
                    .ThenInclude(r => r!.RoomType)
            .OrderByDescending(p => p.PaymentDate)
            .Take(100)
            .ToListAsync();

        // Get travel booking payments
        var travelBookings = await _context.TravelBookings
            .Include(t => t.Customer)
            .Where(t => t.PaymentStatus == "paid")
            .OrderByDescending(t => t.CreatedAt)
            .Take(100)
            .ToListAsync();

        var html = new StringBuilder();
        html.AppendLine("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Payments Report</title>");
        html.AppendLine("<style>body{font-family:Arial;margin:20px;}table{width:100%;border-collapse:collapse;}");
        html.AppendLine("th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background-color:#4CAF50;color:white;}</style></head><body>");
        html.AppendLine("<h1>Payments Report</h1>");
        html.AppendLine($"<p>Generated: {DateTime.Now:yyyy-MM-dd HH:mm}</p>");
        html.AppendLine("<table>");
        html.AppendLine("<tr><th>Transaction ID</th><th>Customer</th><th>Type</th><th>Room/Attraction</th><th>Amount</th><th>Date</th><th>Method</th><th>Status</th></tr>");

        // Add room booking payments
        foreach (var payment in payments)
        {
            var customerName = payment.Booking?.Customer != null
                ? $"{payment.Booking.Customer.FirstName} {payment.Booking.Customer.LastName}"
                : "Unknown";
            var room = payment.Booking?.Room != null
                ? $"{payment.Booking.Room.RoomType?.TypeName ?? "Room"} {payment.Booking.Room.RoomNumber}"
                : "N/A";
            var amount = _currencyHelper.FormatPrice(payment.Amount, currency);
            var transactionId = payment.TransactionId ?? $"PAY-{payment.PaymentId}";

            html.AppendLine($"<tr><td>{transactionId}</td><td>{customerName}</td><td>Room Booking</td><td>{room}</td><td>{amount}</td>");
            html.AppendLine($"<td>{payment.PaymentDate:yyyy-MM-dd HH:mm}</td><td>{payment.PaymentMethod}</td><td>{payment.PaymentStatus}</td></tr>");
        }

        // Add travel booking payments
        foreach (var travel in travelBookings)
        {
            var customerName = travel.Customer != null
                ? $"{travel.Customer.FirstName} {travel.Customer.LastName}"
                : "Unknown";
            var amount = _currencyHelper.FormatPrice(travel.TotalPrice, currency);
            var transactionId = $"TB-{travel.TravelBookingId}";

            html.AppendLine($"<tr><td>{transactionId}</td><td>{customerName}</td><td>Travel Booking</td><td>{travel.AttractionName}</td><td>{amount}</td>");
            html.AppendLine($"<td>{travel.CreatedAt:yyyy-MM-dd HH:mm}</td><td>{travel.PaymentMethod ?? "N/A"}</td><td>{travel.PaymentStatus}</td></tr>");
        }

        html.AppendLine("</table></body></html>");
        return Encoding.UTF8.GetBytes(html.ToString());
    }

    public async Task<byte[]> ExportFinancialReportToCsvAsync()
    {
        var currency = await _currencyHelper.GetCurrencyAsync();
        var payments = await _context.Payments
            .Where(p => p.PaymentStatus == "completed")
            .GroupBy(p => new { p.PaymentDate.Year, p.PaymentDate.Month })
            .Select(g => new
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Revenue = g.Sum(p => p.Amount),
                Count = g.Count()
            })
            .OrderBy(x => x.Year)
            .ThenBy(x => x.Month)
            .ToListAsync();

        var csv = new StringBuilder();
        csv.AppendLine("Month,Revenue,Transaction Count");

        foreach (var item in payments)
        {
            var monthName = new DateTime(item.Year, item.Month, 1).ToString("MMMM yyyy");
            var revenue = _currencyHelper.FormatPrice(item.Revenue, currency);
            csv.AppendLine($"{monthName},{revenue},{item.Count}");
        }

        return Encoding.UTF8.GetBytes(csv.ToString());
    }

    public async Task<byte[]> ExportFinancialReportToExcelAsync()
    {
        // For Excel, we'll create a CSV file (Excel can open CSV files)
        return await ExportFinancialReportToCsvAsync();
    }
}

