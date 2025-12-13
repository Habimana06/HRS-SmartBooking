FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["HRSAPI.csproj", "./"]
RUN dotnet restore "HRSAPI.csproj"

COPY . .

RUN dotnet build "HRSAPI.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "HRSAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "HRSAPI.dll"]
