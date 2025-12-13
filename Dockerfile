FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy only the API project file
COPY ["HRSAPI.csproj", "./"]

# Restore dependencies
RUN dotnet restore "HRSAPI.csproj"

# Copy only necessary files (exclude HRS-SmartBooking Razor project)
COPY ["Program.cs", "./"]
COPY ["Controllers/", "./Controllers/"]
COPY ["Data/", "./Data/"]
COPY ["Models/", "./Models/"]
COPY ["Services/", "./Services/"]
COPY ["Properties/", "./Properties/"]
COPY ["appsettings.json", "./"]
COPY ["appsettings.Development.json", "./"]
COPY ["wwwroot/", "./wwwroot/"]

# Build
RUN dotnet build "HRSAPI.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "HRSAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "HRSAPI.dll"]
```

**Or add a `.dockerignore` file to exclude the Razor project:**

Create a new file called `.dockerignore` in your root:
```
HRS-SmartBooking/
finalyprojectdont/
Database/
*.md
.git/
.vs/
