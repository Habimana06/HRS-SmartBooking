using System.Collections.Generic;
using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Admin;

public class PaymentsModel : PageModel
{
    private readonly ApplicationDbContext _context;
    private readonly CurrencyHelper _currencyHelper;
    private readonly ReportExportService _exportService;

    public PaymentsModel(ApplicationDbContext context, CurrencyHelper currencyHelper, ReportExportService exportService)
    {
        _context = context;
        _currencyHelper = currencyHelper;
        _exportService = exportService;
    }

    public IReadOnlyList<TransactionRow> Transactions { get; set; } = new List<TransactionRow>();

    public async Task OnGetAsync()
    {
        var currency = await _currencyHelper.GetCurrencyAsync();
        
        // Get room booking payments
        var roomPayments = await _context.Payments
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

        var transactions = new List<TransactionRow>();

        // Add room booking payments
        transactions.AddRange(roomPayments.Select(p => new TransactionRow(
            p.TransactionId ?? $"PAY-{p.PaymentId}",
            p.Booking?.Customer != null 
                ? $"{p.Booking.Customer.FirstName} {p.Booking.Customer.LastName}" 
                : "Unknown",
            "Room Booking",
            p.Booking?.Room != null 
                ? $"{p.Booking.Room.RoomType?.TypeName ?? "Room"} {p.Booking.Room.RoomNumber}" 
                : "N/A",
            _currencyHelper.FormatPrice(p.Amount, currency),
            p.PaymentDate.ToString("MMM dd HH:mm"),
            p.PaymentMethod,
            p.PaymentStatus
        )));

        // Add travel booking payments
        transactions.AddRange(travelBookings.Select(t => new TransactionRow(
            $"TB-{t.TravelBookingId}",
            t.Customer != null 
                ? $"{t.Customer.FirstName} {t.Customer.LastName}" 
                : "Unknown",
            "Travel Booking",
            t.AttractionName,
            _currencyHelper.FormatPrice(t.TotalPrice, currency),
            t.CreatedAt.ToString("MMM dd HH:mm"),
            t.PaymentMethod ?? "N/A",
            t.PaymentStatus
        )));

        Transactions = transactions.OrderByDescending(t => t.Date).Take(100).ToList();
    }

    public async Task<IActionResult> OnGetExportCsvAsync()
    {
        var csvData = await _exportService.ExportPaymentsToCsvAsync();
        var fileName = $"payments_report_{DateTime.Now:yyyyMMdd_HHmmss}.csv";
        return File(csvData, "text/csv", fileName);
    }

    public async Task<IActionResult> OnGetExportPdfAsync()
    {
        var pdfData = await _exportService.ExportPaymentsToPdfAsync();
        var fileName = $"payments_report_{DateTime.Now:yyyyMMdd_HHmmss}.html";
        return File(pdfData, "text/html", fileName);
    }

    public record TransactionRow(string TransactionId, string Customer, string Type, string Room, string Amount, string Date, string Method, string Status);
}

