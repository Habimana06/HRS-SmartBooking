namespace HRS_SmartBooking.Helpers;

public static class TranslationHelper
{
    private static readonly Dictionary<string, Dictionary<string, string>> Translations = new()
    {
        ["ENG"] = new Dictionary<string, string>
        {
            // Common
            ["Dashboard"] = "Dashboard",
            ["User Management"] = "User Management",
            ["Roles & Permissions"] = "Roles & Permissions",
            ["Staff Management"] = "Staff Management",
            ["Audit Logs"] = "Audit Logs",
            ["Reports"] = "Reports",
            ["Payments"] = "Payments",
            ["Security Center"] = "Security Center",
            ["Profile"] = "Profile",
            ["Logout"] = "Logout",
            ["Welcome Back"] = "Welcome Back",
            ["Login to continue"] = "Login to continue your experience",
            ["Email address"] = "Email address",
            ["Password"] = "Password",
            ["Remember me"] = "Remember me",
            ["Forgot Password?"] = "Forgot Password?",
            ["Login"] = "Login",
            ["No account?"] = "No account?",
            ["Create one"] = "Create one",
            ["System overview"] = "System overview",
            ["Manage users"] = "Manage users",
            ["Run backup"] = "Run backup",
            ["Add user"] = "Add user",
            ["Save"] = "Save",
            ["Cancel"] = "Cancel",
            ["Update"] = "Update",
            ["Delete"] = "Delete",
            ["Edit"] = "Edit",
            ["View"] = "View",
            ["Search"] = "Search",
            ["Filter"] = "Filter",
            ["Notifications"] = "Notifications",
            ["Settings"] = "Settings",
            ["Theme"] = "Theme",
            ["Language"] = "Language",
            ["Notification Settings"] = "Notification Settings",
            ["Login Notifications"] = "Login Notifications",
            ["Payment Notifications"] = "Payment Notifications",
            ["Room Notifications"] = "Room Notifications",
            ["Booking Notifications"] = "Booking Notifications",
            ["System Notifications"] = "System Notifications",
            ["Accept All"] = "Accept All",
            ["Update All"] = "Update All",
            ["Roles & Permissions"] = "Roles & Permissions",
            ["Create role"] = "Create role",
            ["Assign to users"] = "Assign to users",
            ["Role list"] = "Role list",
            ["Permission matrix"] = "Permission matrix",
            ["Toggle rights"] = "Toggle rights",
            ["Module"] = "Module",
            ["Permissions"] = "Permissions",
            ["Toggle all"] = "Toggle all",
            ["Discard"] = "Discard",
            ["Save role"] = "Save role",
            ["System reports"] = "System reports",
            ["Revenue overview"] = "Revenue overview",
            ["Bookings"] = "Bookings",
            ["Staff performance"] = "Staff performance",
            ["Payment statistics"] = "Payment statistics",
            ["Export"] = "Export",
            ["Print"] = "Print",
            ["PDF"] = "PDF",
            ["Excel"] = "Excel"
        },
        ["KIN"] = new Dictionary<string, string>
        {
            // Common
            ["Dashboard"] = "Ikibaho",
            ["User Management"] = "Gucunga Abakoresha",
            ["Roles & Permissions"] = "Imirimo n'Uburenganzira",
            ["Staff Management"] = "Gucunga Abakozi",
            ["Audit Logs"] = "Inyandiko z'Ubushakashatsi",
            ["Reports"] = "Raporo",
            ["Payments"] = "Kwishyura",
            ["Security Center"] = "Inzu y'Umutekano",
            ["Profile"] = "Profayili",
            ["Logout"] = "Sohoka",
            ["Welcome Back"] = "Murakaza",
            ["Login to continue"] = "Injira kugira ngo mukomeze",
            ["Email address"] = "Aderesi ya imeri",
            ["Password"] = "Ijambo ry'ibanga",
            ["Remember me"] = "Nkwibuke",
            ["Forgot Password?"] = "Wibagiwe ijambo ry'ibanga?",
            ["Login"] = "Injira",
            ["No account?"] = "Nta konti ufite?",
            ["Create one"] = "Kurema",
            ["System overview"] = "Incamake y'Ubucuruzi",
            ["Manage users"] = "Gucunga abakoresha",
            ["Run backup"] = "Gukora backup",
            ["Add user"] = "Ongeraho umukoresha",
            ["Save"] = "Bika",
            ["Cancel"] = "Kureka",
            ["Update"] = "Guhindura",
            ["Delete"] = "Gusiba",
            ["Edit"] = "Guhindura",
            ["View"] = "Reba",
            ["Search"] = "Shakisha",
            ["Filter"] = "Gucunga",
            ["Notifications"] = "Amatangazo",
            ["Settings"] = "Igenamiterere",
            ["Theme"] = "Ishusho",
            ["Language"] = "Ururimi",
            ["Notification Settings"] = "Igenamiterere y'Amatangazo",
            ["Login Notifications"] = "Amatangazo yo Kwinjira",
            ["Payment Notifications"] = "Amatangazo yo Kwishyura",
            ["Room Notifications"] = "Amatangazo y'Icyumba",
            ["Booking Notifications"] = "Amatangazo y'Ubwishingizi",
            ["System Notifications"] = "Amatangazo y'Ubucuruzi",
            ["Accept All"] = "Emera Byose",
            ["Update All"] = "Guhindura Byose",
            ["Create role"] = "Kurema imirimo",
            ["Assign to users"] = "Guhuza abakoresha",
            ["Role list"] = "Urutonde rw'imirimo",
            ["Permission matrix"] = "Matirisi y'uburenganzira",
            ["Toggle rights"] = "Guhindura uburenganzira",
            ["Module"] = "Muduli",
            ["Permissions"] = "Uburenganzira",
            ["Toggle all"] = "Guhindura byose",
            ["Discard"] = "Kureka",
            ["Save role"] = "Bika imirimo",
            ["System reports"] = "Raporo z'ubucuruzi",
            ["Revenue overview"] = "Incamake y'amafaranga",
            ["Bookings"] = "Ubwishingizi",
            ["Staff performance"] = "Imikorere y'abakozi",
            ["Payment statistics"] = "Imibare y'amafaranga",
            ["Export"] = "Kohereza",
            ["Print"] = "Gucapa",
            ["PDF"] = "PDF",
            ["Excel"] = "Excel"
        }
    };

    public static string T(string key, string? language = null)
    {
        var lang = language ?? "ENG";
        if (!Translations.ContainsKey(lang))
            lang = "ENG";
        
        return Translations[lang].TryGetValue(key, out var translation) 
            ? translation 
            : key;
    }

    public static string GetCurrentLanguage(HttpContext? context)
    {
        return context?.Session?.GetString("PreferredLanguage") ?? "ENG";
    }
}

