using System.ComponentModel.DataAnnotations;
using HRS_SmartBooking.Data;
using HRS_SmartBooking.Models;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace HRS_SmartBooking.Pages.Admin;

public class UserManagementModel : PageModel
{
    private readonly UserService _userService;
    private readonly ApplicationDbContext _context;

    public UserManagementModel(UserService userService, ApplicationDbContext context)
    {
        _userService = userService;
        _context = context;
    }

    public List<UserRow> Users { get; set; } = new();
    public string? SuccessMessage { get; set; }
    public string? ErrorMessage { get; set; }

    [BindProperty]
    public CreateUserInput CreateUserInput { get; set; } = new();

    public async Task OnGetAsync()
    {
        await LoadUsersAsync();
    }

    public async Task<IActionResult> OnPostCreateUserAsync()
    {
        if (!ModelState.IsValid)
        {
            await LoadUsersAsync();
            ErrorMessage = "Please fill in all required fields.";
            return Page();
        }

        // Check if email already exists
        if (await _context.Users.AnyAsync(u => u.Email == CreateUserInput.Email))
        {
            await LoadUsersAsync();
            ErrorMessage = "Email already exists. Please use a different email.";
            return Page();
        }

        // Validate password
        if (string.IsNullOrWhiteSpace(CreateUserInput.Password) || CreateUserInput.Password.Length < 6)
        {
            await LoadUsersAsync();
            ErrorMessage = "Password must be at least 6 characters long.";
            return Page();
        }

        // Parse full name
        var nameParts = CreateUserInput.FullName.Trim().Split(' ', 2);
        var firstName = nameParts[0];
        var lastName = nameParts.Length > 1 ? nameParts[1] : string.Empty;

        // Create new user
        var user = new User
        {
            Email = CreateUserInput.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(CreateUserInput.Password),
            FirstName = firstName,
            LastName = lastName,
            PhoneNumber = CreateUserInput.Phone,
            Role = CreateUserInput.Role,
            IsVerified = true, // Admin-created users are verified
            IsActive = CreateUserInput.Status == "Active",
            PreferredLanguage = "ENG",
            ThemePreference = "dark",
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        try
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            
            SuccessMessage = $"User {user.Email} created successfully!";
            CreateUserInput = new CreateUserInput(); // Reset form
            await LoadUsersAsync();
            return Page();
        }
        catch (Exception ex)
        {
            await LoadUsersAsync();
            ErrorMessage = $"Error creating user: {ex.Message}";
            return Page();
        }
    }

    private async Task LoadUsersAsync()
    {
        var allUsers = await _userService.GetAllUsersAsync();
        Users = allUsers.Select(u => new UserRow(
            $"{u.FirstName} {u.LastName}".Trim(),
            u.Email,
            u.Role,
            u.IsActive ? "Active" : "Inactive",
            u.LastLogin?.ToString("MMM dd, HH:mm") ?? "Never",
            u.CreatedAt.ToString("MMM dd, yyyy")
        )).ToList();
    }

    public record UserRow(string Name, string Email, string Role, string Status, string LastLogin, string Created);
}

public class CreateUserInput
{
    [Required(ErrorMessage = "Full name is required")]
    [Display(Name = "Full Name")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email address")]
    [Display(Name = "Email")]
    public string Email { get; set; } = string.Empty;

    [Phone(ErrorMessage = "Invalid phone number")]
    [Display(Name = "Phone")]
    public string? Phone { get; set; }

    [Required(ErrorMessage = "Password is required")]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
    [Display(Name = "Password")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Role is required")]
    [Display(Name = "Role")]
    public string Role { get; set; } = "Customer";

    [Required(ErrorMessage = "Status is required")]
    [Display(Name = "Status")]
    public string Status { get; set; } = "Active";
}

