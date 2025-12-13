using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace HRS_SmartBooking.Data
{
    public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        public ApplicationDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
            
            // Hardcoded PostgreSQL connection string for design-time migrations
            optionsBuilder.UseNpgsql(
                "Host=localhost;Port=5432;Database=Hrs_bookingDB;Username=postgres;Password=62001"
            );
            
            return new ApplicationDbContext(optionsBuilder.Options);
        }
    }
}
