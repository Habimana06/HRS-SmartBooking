FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files - now using relative paths from HRSAPI
COPY ["../HRS-SmartBooking/HRS-SmartBooking.csproj", "HRS-SmartBooking/"]
COPY ["HRSAPI.csproj", "HRSAPI/"]

# Restore dependencies
WORKDIR /src/HRSAPI
RUN dotnet restore "HRSAPI.csproj"

# Copy source code
WORKDIR /src
COPY ["../HRS-SmartBooking/", "HRS-SmartBooking/"]
COPY [".", "HRSAPI/"]

# Build and publish
WORKDIR /src/HRSAPI
RUN dotnet build "HRSAPI.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "HRSAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "HRSAPI.dll"]
```

3. **In Render settings, change to:**
```
Dockerfile Path: ./Dockerfile
```

(Just `./Dockerfile` - remove the `HRSAPI/` part)

---

### **Option 2: Keep Dockerfile in root, change Root Directory**

1. **Keep Dockerfile in the repository root** (don't move it)

2. **In Render settings, change to:**
```
Dockerfile Path: Dockerfile
```

(Just `Dockerfile` - no `./` or `../`)

**Or try:**
```
Dockerfile Path: ./Dockerfile
```

And make sure **Root Directory** is **empty** (not set to anything)

---

## **My Recommendation:**

**Try Option 2 first** (it's easier):

1. Click **"Edit"** on the Dockerfile Path field
2. Change from `HRSAPI/../Dockerfile` to just:
```
   Dockerfile
