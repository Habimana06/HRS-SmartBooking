using HRS_SmartBooking.Data;
using HRS_SmartBooking.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Use camelCase for JSON property names (JavaScript convention)
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.WriteIndented = true;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Session (same behaviour as Razor app)
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.Cookie.Path = "/"; // Ensure cookie is available for all paths
    options.Cookie.Name = ".AspNetCore.Session"; // Explicit cookie name
});

// SMTP Email Configuration
builder.Services.Configure<HRS_SmartBooking.Services.SmtpSettings>(
    builder.Configuration.GetSection("Smtp"));
builder.Services.AddScoped<HRS_SmartBooking.Services.SmtpEmailSender>();

// App services reused from Razor project
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<CurrencyHelper>();
builder.Services.AddScoped<RoomService>();
builder.Services.AddScoped<BookingService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<HRS_SmartBooking.Services.EmailVerificationService>();
builder.Services.AddHttpContextAccessor();

// CORS for React dev client
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactClient", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:3000",
                "http://localhost:5174",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:3000"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Serve uploaded files from wwwroot (needed for room/travel images)
app.UseStaticFiles();

app.UseRouting();

app.UseCors("ReactClient");

app.UseSession();

app.UseAuthorization();

app.MapControllers();

app.Run();
