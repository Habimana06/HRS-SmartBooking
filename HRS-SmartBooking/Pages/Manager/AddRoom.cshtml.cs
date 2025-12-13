using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Pages.Manager;

public class AddRoomModel : PageModel
{
    private readonly ApplicationDbContext _context;

    public AddRoomModel(ApplicationDbContext context)
    {
        _context = context;
    }

    [BindProperty(SupportsGet = true)]
    public int? Id { get; set; }

    public Room? Room { get; set; }
    public bool IsEditMode => Id.HasValue;

    public List<RoomType> RoomTypeList { get; set; } = new();
    public List<string> Statuses { get; set; } = new()
    {
        "available", "occupied", "cleaning", "maintenance"
    };

    public List<string> AmenityCategories { get; set; } = new()
    {
        "Comfort", "Electronics", "Bathroom", "Luxury", "Safety"
    };

    public List<string> AmenityPresets { get; set; } = new()
    {
        "High-speed Wi-Fi", "Smart TV", "Rain shower", "Mini bar", "Butler call"
    };

    [BindProperty]
    public RoomInput Input { get; set; } = new();

    public string? SuccessMessage { get; set; }
    public string? ErrorMessage { get; set; }

    public async Task<IActionResult> OnGetAsync()
    {
        RoomTypeList = await _context.RoomTypes
            .OrderBy(rt => rt.TypeName)
            .ToListAsync();

        if (Id.HasValue)
        {
            Room = await _context.Rooms
                .Include(r => r.RoomType)
                .FirstOrDefaultAsync(r => r.RoomId == Id.Value);

            if (Room == null)
            {
                return RedirectToPage("/Manager/ManageRooms");
            }

            // Populate form with existing data
            Input.RoomNumber = Room.RoomNumber;
            Input.FloorNumber = Room.FloorNumber;
            Input.RoomTypeId = Room.RoomTypeId;
            Input.CurrentPrice = Room.CurrentPrice;
            Input.MaxOccupancy = Room.RoomType?.MaxOccupancy ?? 2;
            Input.Status = Room.Status;
            Input.Description = Room.Description;
            Input.ImageUrls = Room.ImageUrls;
            Input.Amenities = Room.RoomType?.Amenities;
        }

        return Page();
    }

    [RequestSizeLimit(10 * 1024 * 1024)] // 10MB limit
    public async Task<IActionResult> OnPostUploadImageAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return new JsonResult(new { success = false, message = "No file uploaded" });
        }

        if (!file.ContentType.StartsWith("image/"))
        {
            return new JsonResult(new { success = false, message = "File must be an image" });
        }

        try
        {
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "rooms");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var imageUrl = $"/uploads/rooms/{uniqueFileName}";
            return new JsonResult(new { success = true, url = imageUrl });
        }
        catch (Exception ex)
        {
            return new JsonResult(new { success = false, message = ex.Message });
        }
    }

    public async Task<IActionResult> OnPostAsync()
    {
        if (!ModelState.IsValid)
        {
            await LoadDataAsync();
            ErrorMessage = "Please fill in all required fields.";
            return Page();
        }

        try
        {
            if (Id.HasValue)
            {
                // Update existing room
                var room = await _context.Rooms
                    .Include(r => r.RoomType)
                    .FirstOrDefaultAsync(r => r.RoomId == Id.Value);

                if (room == null)
                {
                    return RedirectToPage("/Manager/ManageRooms");
                }

                room.RoomNumber = Input.RoomNumber;
                room.FloorNumber = Input.FloorNumber;
                room.RoomTypeId = Input.RoomTypeId;
                room.CurrentPrice = Input.CurrentPrice;
                room.Status = Input.Status;
                room.Description = Input.Description;
                // Normalize ImageUrls: remove empty entries, trim whitespace, join with comma
                room.ImageUrls = !string.IsNullOrWhiteSpace(Input.ImageUrls)
                    ? string.Join(", ", Input.ImageUrls
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(url => url.Trim())
                        .Where(url => !string.IsNullOrEmpty(url)))
                    : null;
                room.UpdatedAt = DateTime.Now;

                // Update room type amenities if provided
                if (room.RoomType != null && !string.IsNullOrEmpty(Input.Amenities))
                {
                    room.RoomType.Amenities = Input.Amenities;
                    room.RoomType.UpdatedAt = DateTime.Now;
                }

                _context.Rooms.Update(room);
                await _context.SaveChangesAsync();

                SuccessMessage = "Room updated successfully!";
            }
            else
            {
                // Create new room
                var roomType = await _context.RoomTypes.FindAsync(Input.RoomTypeId);
                if (roomType == null)
                {
                    await LoadDataAsync();
                    ErrorMessage = "Invalid room type selected.";
                    return Page();
                }

                // Normalize ImageUrls: remove empty entries, trim whitespace, join with comma
                var normalizedImageUrls = !string.IsNullOrWhiteSpace(Input.ImageUrls)
                    ? string.Join(", ", Input.ImageUrls
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(url => url.Trim())
                        .Where(url => !string.IsNullOrEmpty(url)))
                    : null;

                var room = new Room
                {
                    RoomNumber = Input.RoomNumber,
                    FloorNumber = Input.FloorNumber,
                    RoomTypeId = Input.RoomTypeId,
                    CurrentPrice = Input.CurrentPrice,
                    Status = Input.Status,
                    Description = Input.Description,
                    ImageUrls = normalizedImageUrls,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                _context.Rooms.Add(room);
                await _context.SaveChangesAsync();

                SuccessMessage = "Room created successfully!";
                return RedirectToPage("/Manager/AddRoom", new { id = room.RoomId });
            }

            await LoadDataAsync();
            return Page();
        }
        catch (Exception ex)
        {
            await LoadDataAsync();
            ErrorMessage = $"Error saving room: {ex.Message}";
            return Page();
        }
    }

    private async Task LoadDataAsync()
    {
        RoomTypeList = await _context.RoomTypes
            .OrderBy(rt => rt.TypeName)
            .ToListAsync();
    }

    public class RoomInput
    {
        [Required]
        public string RoomNumber { get; set; } = string.Empty;

        public int? FloorNumber { get; set; }

        [Required]
        public int RoomTypeId { get; set; }

        [Required]
        public decimal CurrentPrice { get; set; }

        public int MaxOccupancy { get; set; } = 2;

        [Required]
        public string Status { get; set; } = "available";

        public string? Description { get; set; }

        public string? ImageUrls { get; set; }

        public string? Amenities { get; set; }
    }
}

