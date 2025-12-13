using HRS_SmartBooking.Data;
using Microsoft.EntityFrameworkCore;

namespace HRS_SmartBooking.Services;

public class CurrencyHelper
{
    private readonly ApplicationDbContext _context;
    private const string DEFAULT_CURRENCY = "USD"; // Use dollars as default
    private const decimal USD_TO_RWF_RATE = 1200m; // Approximate exchange rate

    public CurrencyHelper(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<string> GetCurrencyAsync()
    {
        try
        {
            var setting = await _context.SystemSettings
                .FirstOrDefaultAsync(s => s.SettingKey == "Currency");
            
            return setting?.SettingValue ?? DEFAULT_CURRENCY;
        }
        catch
        {
            // If SystemSettings table doesn't exist, return default currency
            return DEFAULT_CURRENCY;
        }
    }

    public async Task SetCurrencyAsync(string currency)
    {
        if (currency != "USD" && currency != "RWF")
            throw new ArgumentException("Currency must be either USD or RWF");

        try
        {
            var setting = await _context.SystemSettings
                .FirstOrDefaultAsync(s => s.SettingKey == "Currency");

            if (setting == null)
            {
                setting = new Models.SystemSettings
                {
                    SettingKey = "Currency",
                    SettingValue = currency,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };
                _context.SystemSettings.Add(setting);
            }
            else
            {
                setting.SettingValue = currency;
                setting.UpdatedAt = DateTime.Now;
                _context.SystemSettings.Update(setting);
            }

            await _context.SaveChangesAsync();
        }
        catch
        {
            // If SystemSettings table doesn't exist, this will fail silently
            // The table needs to be created via migration first
        }
    }

    public async Task<string> FormatPriceAsync(decimal amount)
    {
        var currency = await GetCurrencyAsync();
        return FormatPrice(amount, currency);
    }

    public string FormatPrice(decimal amount, string currency)
    {
        // Show dollars by default without forcing RWF conversion
        if (currency == "USD")
        {
            return $"${amount:N2}";
        }

        // Otherwise show RWF with no decimals
        return $"RWF {amount:N0}";
    }
    
    public string FormatPriceFromUSD(decimal usdAmount, string currency)
    {
        // Convert USD to target currency if needed
        if (currency == "RWF")
        {
            var rwfAmount = usdAmount * USD_TO_RWF_RATE;
            return $"RWF {rwfAmount:N0}";
        }
        else
        {
            return $"${usdAmount:N0}";
        }
    }

    public async Task<decimal> ConvertToBaseCurrencyAsync(decimal amount, string fromCurrency)
    {
        if (fromCurrency == "RWF" && await GetCurrencyAsync() == "USD")
        {
            return amount / USD_TO_RWF_RATE;
        }
        else if (fromCurrency == "USD" && await GetCurrencyAsync() == "RWF")
        {
            return amount * USD_TO_RWF_RATE;
        }
        return amount;
    }

    public string GetCurrencySymbol(string currency)
    {
        return currency == "RWF" ? "RWF" : "$";
    }
}

