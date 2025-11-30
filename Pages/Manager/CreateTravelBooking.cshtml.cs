using System.ComponentModel.DataAnnotations;
using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Manager;

public class CreateTravelBookingModel : PageModel
{
    private readonly ApplicationDbContext _context;
    private readonly CurrencyHelper _currencyHelper;

    public CreateTravelBookingModel(ApplicationDbContext context, CurrencyHelper currencyHelper)
    {
        _context = context;
        _currencyHelper = currencyHelper;
    }

    [BindProperty(SupportsGet = true)]
    public int? Id { get; set; }

    public List<User> Customers { get; set; } = new();
    public string Currency { get; set; } = "RWF";
    public string? SuccessMessage { get; set; }
    public string? ErrorMessage { get; set; }
    public bool IsEditMode => Id.HasValue;

    [BindProperty]
    public TravelBookingInput Input { get; set; } = new();

    public async Task OnGetAsync()
    {
        Currency = await _currencyHelper.GetCurrencyAsync();
        Customers = await _context.Users
            .Where(u => u.Role == "Customer" && u.IsActive)
            .OrderBy(u => u.FirstName)
            .ThenBy(u => u.LastName)
            .ToListAsync();

        if (Id.HasValue)
        {
            var booking = await _context.TravelBookings
                .Include(t => t.Customer)
                .FirstOrDefaultAsync(t => t.TravelBookingId == Id.Value);

            if (booking != null)
            {
                Input.CustomerId = booking.CustomerId;
                Input.AttractionName = booking.AttractionName;
                Input.AttractionType = booking.AttractionType;
                Input.TravelDate = booking.TravelDate;
                Input.NumberOfParticipants = booking.NumberOfParticipants;
                Input.PricePerPerson = booking.TotalPrice / booking.NumberOfParticipants;
                Input.TotalPrice = booking.TotalPrice;
                Input.PaymentMethod = booking.PaymentMethod ?? string.Empty;
                Input.BookingStatus = booking.BookingStatus;
                Input.PaymentStatus = booking.PaymentStatus;
                Input.SpecialRequests = booking.SpecialRequests;
            }
            else
            {
                ErrorMessage = "Travel booking not found.";
            }
        }
    }

    public async Task<IActionResult> OnPostAsync()
    {
        Currency = await _currencyHelper.GetCurrencyAsync();

        if (!ModelState.IsValid)
        {
            Customers = await _context.Users
                .Where(u => u.Role == "Customer" && u.IsActive)
                .OrderBy(u => u.FirstName)
                .ThenBy(u => u.LastName)
                .ToListAsync();
            ErrorMessage = "Please fill in all required fields correctly.";
            return Page();
        }

        try
        {
            var customer = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == Input.CustomerId && u.Role == "Customer" && u.IsActive);

            if (customer == null)
            {
                Customers = await _context.Users
                    .Where(u => u.Role == "Customer" && u.IsActive)
                    .OrderBy(u => u.FirstName)
                    .ThenBy(u => u.LastName)
                    .ToListAsync();
                ErrorMessage = "Selected customer not found or inactive.";
                return Page();
            }

            if (Id.HasValue)
            {
                // Update existing booking
                var existingBooking = await _context.TravelBookings.FindAsync(Id.Value);
                if (existingBooking == null)
                {
                    Customers = await _context.Users
                        .Where(u => u.Role == "Customer" && u.IsActive)
                        .OrderBy(u => u.FirstName)
                        .ThenBy(u => u.LastName)
                        .ToListAsync();
                    ErrorMessage = "Travel booking not found.";
                    return Page();
                }

                existingBooking.CustomerId = Input.CustomerId;
                existingBooking.AttractionName = Input.AttractionName;
                existingBooking.AttractionType = Input.AttractionType;
                existingBooking.TravelDate = Input.TravelDate;
                existingBooking.NumberOfParticipants = Input.NumberOfParticipants;
                existingBooking.TotalPrice = Input.TotalPrice;
                existingBooking.BookingStatus = Input.BookingStatus;
                existingBooking.PaymentStatus = Input.PaymentStatus;
                existingBooking.PaymentMethod = Input.PaymentMethod;
                existingBooking.SpecialRequests = Input.SpecialRequests;
                existingBooking.UpdatedAt = DateTime.Now;

                _context.TravelBookings.Update(existingBooking);
                await _context.SaveChangesAsync();

                SuccessMessage = "Travel booking updated successfully!";
                TempData["TravelBookingSuccess"] = true;
                return RedirectToPage("/Manager/ManageTravelBookings");
            }
            else
            {
                // Create new booking
                var travelBooking = new TravelBooking
                {
                    CustomerId = Input.CustomerId,
                    AttractionName = Input.AttractionName,
                    AttractionType = Input.AttractionType,
                    TravelDate = Input.TravelDate,
                    NumberOfParticipants = Input.NumberOfParticipants,
                    TotalPrice = Input.TotalPrice,
                    BookingStatus = Input.BookingStatus,
                    PaymentStatus = Input.PaymentStatus,
                    PaymentMethod = Input.PaymentMethod,
                    SpecialRequests = Input.SpecialRequests,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                _context.TravelBookings.Add(travelBooking);
                await _context.SaveChangesAsync();

                SuccessMessage = "Travel booking created successfully!";
                TempData["TravelBookingSuccess"] = true;
                return RedirectToPage("/Manager/ManageTravelBookings");
            }
        }
        catch (Exception ex)
        {
            Customers = await _context.Users
                .Where(u => u.Role == "Customer" && u.IsActive)
                .OrderBy(u => u.FirstName)
                .ThenBy(u => u.LastName)
                .ToListAsync();
            ErrorMessage = $"An error occurred while {(Id.HasValue ? "updating" : "creating")} the travel booking. Please try again.";
            return Page();
        }
    }

    public class TravelBookingInput
    {
        [Required]
        public int CustomerId { get; set; }

        [Required]
        [MaxLength(200)]
        public string AttractionName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string AttractionType { get; set; } = "Nature";

        [Required]
        [DataType(DataType.Date)]
        public DateTime TravelDate { get; set; } = DateTime.Today.AddDays(7);

        [Required]
        [Range(1, 20)]
        public int NumberOfParticipants { get; set; } = 2;

        [Required]
        [Range(0, double.MaxValue)]
        public decimal PricePerPerson { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal TotalPrice { get; set; }

        [Required]
        [MaxLength(50)]
        public string PaymentMethod { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string BookingStatus { get; set; } = "confirmed";

        [Required]
        [MaxLength(20)]
        public string PaymentStatus { get; set; } = "paid";

        public string? SpecialRequests { get; set; }
    }
}

