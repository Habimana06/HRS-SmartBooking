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

// ✅ Railway PostgreSQL connection
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
if (!string.IsNullOrEmpty(connectionString))
{
    // Railway uses postgres:// format, convert to Npgsql format
    var databaseUri = new Uri(connectionString);
    var userInfo = databaseUri.UserInfo.Split(':');
    
    connectionString = $"Host={databaseUri.Host};Port={databaseUri.Port};Database={databaseUri.AbsolutePath.Trim('/')};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Require;Trust Server Certificate=true";
}
else
{
    // Fallback to appsettings.json for local development
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
}

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

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

// SMTP Email Configuration (supports environment variables)
builder.Services.Configure<HRS_SmartBooking.Services.SmtpSettings>(settings =>
{
    settings.Host = Environment.GetEnvironmentVariable("SMTP_HOST") ?? builder.Configuration["Smtp:Host"] ?? "";
    settings.Port = int.TryParse(Environment.GetEnvironmentVariable("SMTP_PORT"), out var port) ? port : builder.Configuration.GetValue<int>("Smtp:Port", 587);
    settings.User = Environment.GetEnvironmentVariable("SMTP_USER") ?? builder.Configuration["Smtp:User"] ?? "";
    settings.Pass = Environment.GetEnvironmentVariable("SMTP_PASS") ?? builder.Configuration["Smtp:Pass"] ?? "";
    settings.FromEmail = Environment.GetEnvironmentVariable("SMTP_FROM_EMAIL") ?? builder.Configuration["Smtp:FromEmail"] ?? "";
    settings.FromName = Environment.GetEnvironmentVariable("SMTP_FROM_NAME") ?? builder.Configuration["Smtp:FromName"] ?? "HRS Verification";
    settings.UseSsl = bool.TryParse(Environment.GetEnvironmentVariable("SMTP_USE_SSL"), out var useSsl) ? useSsl : builder.Configuration.GetValue<bool>("Smtp:UseSsl", true);
});
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

// ✅ Updated CORS for Railway + React
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(origin => true) // Allow any origin temporarily
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// ✅ Auto-run migrations on startup (for Railway deployment)
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        
        logger.LogInformation("Running database migrations...");
        db.Database.Migrate();
        logger.LogInformation("Database migrations completed successfully.");
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating the database.");
        throw; // Re-throw to prevent startup if migrations fail
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // ✅ Enable Swagger in production for Railway testing
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ✅ Don't force HTTPS redirect on Railway (Railway handles SSL)
// app.UseHttpsRedirection();

// Serve uploaded files from wwwroot (needed for room/travel images)
app.UseStaticFiles();

app.UseRouting();

app.UseCors("AllowAll");

app.UseSession();

app.UseAuthorization();

app.MapControllers();

// ✅ Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.Run();