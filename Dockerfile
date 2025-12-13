FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy HRS-SmartBooking project file first (dependency)
COPY ["HRS-SmartBooking/HRS-SmartBooking.csproj", "HRS-SmartBooking/"]

# Copy HRSAPI project file
COPY ["HRSAPI/HRSAPI.csproj", "HRSAPI/"]

# Restore dependencies
WORKDIR /src/HRSAPI
RUN dotnet restore "HRSAPI.csproj"

# Copy HRS-SmartBooking source
WORKDIR /src
COPY ["HRS-SmartBooking/", "HRS-SmartBooking/"]

# Copy HRSAPI source
COPY ["HRSAPI/", "HRSAPI/"]

# Build and publish
WORKDIR /src/HRSAPI
RUN dotnet build "HRSAPI.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "HRSAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "HRSAPI.dll"]