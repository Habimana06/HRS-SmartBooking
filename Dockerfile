FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project file from HRS-SmartBooking/HRSAPI folder
COPY ["HRS-SmartBooking/HRSAPI/HRSAPI.csproj", "HRS-SmartBooking/HRSAPI/"]

# Restore dependencies
RUN dotnet restore "HRS-SmartBooking/HRSAPI/HRSAPI.csproj"

# Copy all source code
COPY . .

# Build
RUN dotnet build "HRS-SmartBooking/HRSAPI/HRSAPI.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "HRS-SmartBooking/HRSAPI/HRSAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "HRSAPI.dll"]
