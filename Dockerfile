FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project file
COPY ["HRSAPI.csproj", "./"]

# Restore dependencies
RUN dotnet restore "HRSAPI.csproj"

# Copy all source code
COPY . .

# Build
RUN dotnet build "HRSAPI.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "HRSAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "HRSAPI.dll"]
```

**And make sure your `.dockerignore` file has this content:**
```
HRS-SmartBooking/
finalyprojectdont/
Database/
*.md
.git/
.vs/
.vscode/
bin/
obj/
