$baseUrl = "http://localhost:5000/api"
$email = "qr_ps_test_$(Get-Date -Format 'yyyyMMddHHmmss')@test.com"
$password = "password123"

Write-Host "🚀 Starting QR Flow Test (PowerShell)..." -ForegroundColor Cyan

# 1. Register
Write-Host "1. Registering User..."
$regBody = @{
    fullName = "PS Test User"
    email    = $email
    password = $password
    phone    = "9876543210"
    role     = "driver"
} | ConvertTo-Json

try {
    $regResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $regBody -ContentType "application/json"
    $token = $regResponse.data.token
    $headers = @{ Authorization = "Bearer $token" }
    Write-Host "✅ Registered. Token acquired." -ForegroundColor Green
}
catch {
    Write-Error "Registration failed: $($_.Exception.Message)"
    exit
}

# 2. Add Vehicle
Write-Host "2. Adding Vehicle..."
$vehBody = @{
    licensePlate = "PS-QR-$(Get-Random -Minimum 100 -Maximum 999)"
    type         = "car"
    model        = "Test Model"
    color        = "Red"
} | ConvertTo-Json

try {
    $vehResponse = Invoke-RestMethod -Uri "$baseUrl/vehicles" -Method Post -Body $vehBody -Headers $headers -ContentType "application/json"
    $vehicleId = $vehResponse.data.vehicle.id
    Write-Host "✅ Vehicle Added. ID: $vehicleId" -ForegroundColor Green
}
catch {
    Write-Error "Add Vehicle failed: $($_.Exception.Message)"
    exit
}

# 3. Create Booking
Write-Host "3. Creating Booking..."
$startTime = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
$endTime = (Get-Date).AddHours(1).ToString("yyyy-MM-ddTHH:mm:ssZ")

$bookBody = @{
    zoneId     = 1
    vehicleId  = $vehicleId
    startTime  = $startTime
    endTime    = $endTime
    totalPrice = 50
} | ConvertTo-Json

try {
    $bookResponse = Invoke-RestMethod -Uri "$baseUrl/bookings" -Method Post -Body $bookBody -Headers $headers -ContentType "application/json"
    $bookingId = $bookResponse.data.booking.id
    Write-Host "✅ Booking Created. ID: $bookingId" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ Booking failed (likely balance). Attempting Top-up..." -ForegroundColor Yellow
    try {
        $topupBody = @{ amount = 1000 } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/wallet/topup" -Method Post -Body $topupBody -Headers $headers -ContentType "application/json" | Out-Null
        Write-Host "✅ Top-up successful. Retrying booking..." -ForegroundColor Green
        
        $bookResponse = Invoke-RestMethod -Uri "$baseUrl/bookings" -Method Post -Body $bookBody -Headers $headers -ContentType "application/json"
        $bookingId = $bookResponse.data.booking.id
        Write-Host "✅ Retry Booking Created. ID: $bookingId" -ForegroundColor Green
    }
    catch {
        Write-Error "Booking failed again: $($_.Exception.Message)"
        exit
    }
}

# 4. Get My Bookings
Write-Host "4. Fetching My Bookings..."
try {
    $myResponse = Invoke-RestMethod -Uri "$baseUrl/bookings/my" -Method Get -Headers $headers -ContentType "application/json"
    $found = $myResponse.data.bookings | Where-Object { $_.id -eq $bookingId }
    if ($found) {
        Write-Host "✅ Booking found in list." -ForegroundColor Green
    }
    else {
        Write-Error "❌ Booking NOT found in list."
    }
}
catch {
    Write-Error "Fetch Bookings failed: $($_.Exception.Message)"
}

# 5. Scan Booking
Write-Host "5. Scanning Booking..."
try {
    $scanResponse = Invoke-RestMethod -Uri "$baseUrl/bookings/$bookingId/scan" -Method Post -Headers $headers -ContentType "application/json"
    
    Write-Host "✅ Scan Successful." -ForegroundColor Green
    Write-Host "   Entry Time: $($scanResponse.data.entryTime)" -ForegroundColor Gray
    Write-Host "   Status: $($scanResponse.data.booking.status)" -ForegroundColor Gray
    
    if ($scanResponse.data.entryTime) {
        Write-Host "🎉 TEST PASSED: Full QR flow verified." -ForegroundColor Cyan
    }
    else {
        Write-Error "❌ TEST FAILED: Entry time not set."
    }
}
catch {
    Write-Error "Scan failed: $($_.Exception.Message)"
}
