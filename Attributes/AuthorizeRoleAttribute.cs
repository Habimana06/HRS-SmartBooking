using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using HRS_SmartBooking.Services;

namespace HRS_SmartBooking.Attributes;

public class AuthorizeRoleAttribute : Attribute, IAsyncAuthorizationFilter
{
    private readonly string[] _allowedRoles;

    public AuthorizeRoleAttribute(params string[] allowedRoles)
    {
        _allowedRoles = allowedRoles;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var authService = context.HttpContext.RequestServices.GetRequiredService<AuthService>();

        if (!authService.IsAuthenticated())
        {
            context.Result = new RedirectToPageResult("/Login");
            return;
        }

        var userRole = authService.GetCurrentUserRole();
        if (userRole == null || !_allowedRoles.Contains(userRole))
        {
            context.Result = new RedirectToPageResult("/AccessDenied");
            return;
        }
    }
}

