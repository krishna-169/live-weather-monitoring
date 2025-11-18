const input = document.getElementById('cityInput');
    const weatherInfo = document.getElementById('weatherInfo');
    const weatherAnimation = document.getElementById('weatherAnimation');
    const mapContainer = document.getElementById('mapContainer');
    const historyList = document.getElementById('historyList');
    const forecastContainer = document.getElementById('forecastContainer');
    const rainEffect = document.getElementById('rainEffect');
    const snowEffect = document.getElementById('snowEffect');
    const sunEffect = document.getElementById('sunEffect');
    const aiAnalysisResult = document.getElementById('aiAnalysisResult');
    const aiLoading = document.getElementById('aiLoading');
    const aiAnalysisContent = document.getElementById('aiAnalysisContent');
    const aiError = document.getElementById('aiError');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const historicalChart = document.getElementById('historicalChart');
    
    let map;
    let marker;
    let selectedCoords = null;
    let currentWeatherData = null;
    let tempUnit = 'c'; // Default to Celsius
    const MAX_HISTORY_ITEMS = 10;
    let weatherChart = null;
    let lottieAnimation = null;

    // Weather animation paths (Lottie)
    const weatherAnimations = {
      sunny: 'https://assets10.lottiefiles.com/packages/lf20_6q0yJh.json',
      cloudy: 'https://assets10.lottiefiles.com/packages/lf20_6q0yJh.json',
      rainy: 'https://assets1.lottiefiles.com/packages/lf20_6q0yJh.json',
      snowy: 'https://assets1.lottiefiles.com/packages/lf20_6q0yJh.json',
      thunder: 'https://assets1.lottiefiles.com/packages/lf20_6q0yJh.json'
    };

    // Set default date range (last 7 days)
    document.addEventListener('DOMContentLoaded', function() {
      renderHistory();
      
      // Set default date range (last 7 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      startDateInput.valueAsDate = startDate;
      endDateInput.valueAsDate = endDate;

      
      // Puter auth check removed - not required for weather app functionality
    });

    // Initialize map when opened
    function openMap() {
      mapContainer.style.display = 'flex';
      
      if (!map) {
        map = L.map('map').setView([20, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        map.on('click', function(e) {
          if (marker) {
            map.removeLayer(marker);
          }
          marker = L.marker(e.latlng).addTo(map);
          selectedCoords = e.latlng;
        });
      }
      setTimeout(() => {
        if (map) map.invalidateSize();
      }, 200);
    }

    function closeMap() {
      mapContainer.style.display = 'none';
    }

    function useCurrentLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = position.coords;
            if (marker) {
              map.removeLayer(marker);
            }
            map.setView([latitude, longitude], 12);
            marker = L.marker([latitude, longitude]).addTo(map);
            selectedCoords = { lat: latitude, lng: longitude };
          },
          error => {
            alert("Unable to retrieve your location: " + error.message);
          }
        );
      } else {
        alert("Geolocation is not supported by this browser.");
      }
    }

    function useSelectedLocation() {
      if (selectedCoords) {
        getWeatherByCoords(selectedCoords.lat, selectedCoords.lng);
        closeMap();
      } else {
        alert("Please select a location on the map first.");
      }
    }

    // Existing keyboard shortcut
    input.addEventListener("keydown", function(event) {
      if (event.key === "Enter") getWeather();
    });



    // Feedback Form Handling
    document.addEventListener('DOMContentLoaded', function() {
      const feedbackForm = document.getElementById('feedbackForm');
      const starRating = document.getElementById('starRating');
      const userRating = document.getElementById('userRating');
      const feedbackStatus = document.getElementById('feedbackStatus');

      // Star rating functionality
      if (starRating) {
        const stars = starRating.querySelectorAll('.star');
        
        stars.forEach((star, index) => {
          star.addEventListener('click', function() {
            const rating = parseInt(star.dataset.rating);
            userRating.value = rating;
            
            // Update star display
            stars.forEach((s, i) => {
              if (i < rating) {
                s.classList.add('active');
              } else {
                s.classList.remove('active');
              }
            });
          });
          
          star.addEventListener('mouseover', function() {
            const rating = parseInt(star.dataset.rating);
            stars.forEach((s, i) => {
              if (i < rating) {
                s.style.filter = 'grayscale(0%)';
                s.style.transform = 'scale(1.1)';
              } else {
                s.style.filter = 'grayscale(100%)';
                s.style.transform = 'scale(1)';
              }
            });
          });
          
          starRating.addEventListener('mouseleave', function() {
            const currentRating = parseInt(userRating.value);
            stars.forEach((s, i) => {
              if (i < currentRating) {
                s.classList.add('active');
              } else {
                s.classList.remove('active');
              }
            });
          });
        });
      }

      // Form submission
      if (feedbackForm) {
        feedbackForm.addEventListener('submit', function(e) {
          e.preventDefault();
          submitFeedback();
        });
      }
    });

    async function submitFeedback() {
      const form = document.getElementById('feedbackForm');
      const submitBtn = form.querySelector('.submit-feedback-btn');
      const btnText = submitBtn.querySelector('.btn-text');
      const btnLoading = submitBtn.querySelector('.btn-loading');
      const statusDiv = document.getElementById('feedbackStatus');

      // Show loading state
      submitBtn.disabled = true;
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline';
      statusDiv.style.display = 'none';

      try {
        // Prepare form data
        const formData = new FormData(form);
        const feedbackData = Object.fromEntries(formData.entries());

        // Add current weather data if requested
        if (document.getElementById('includeWeatherData').checked && currentWeatherData) {
          feedbackData.weather_data = JSON.stringify({
            city: currentWeatherData.name,
            country: currentWeatherData.sys.country,
            temperature: currentWeatherData.main.temp,
            condition: currentWeatherData.weather[0].main,
            humidity: currentWeatherData.main.humidity,
            windSpeed: currentWeatherData.wind.speed,
            timestamp: new Date().toISOString()
          });
        }

        // Add timestamp
        feedbackData.submitted_at = new Date().toLocaleString();

        // Send email using EmailJS
        const response = await emailjs.send(
          'service_yb7l0fc',
          'template_lk31df2',
          feedbackData
        );

        // Success
        showFeedbackStatus('success', '✅ Thank you! Your feedback has been sent successfully. We\'ll get back to you soon!');
        form.reset();
        document.getElementById('userRating').value = '0';
        document.querySelectorAll('.star').forEach(star => star.classList.remove('active'));

      } catch (error) {
        console.error('Feedback submission error:', error);
        showFeedbackStatus('error', '❌ Sorry, there was an error sending your feedback. Please try again or contact us directly.');
      } finally {
        // Reset button state
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
      }
    }

    function showFeedbackStatus(type, message) {
      const statusDiv = document.getElementById('feedbackStatus');
      statusDiv.className = `feedback-status ${type}`;
      statusDiv.textContent = message;
      statusDiv.style.display = 'block';

      // Auto-hide after 5 seconds
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 5000);
    }

    function showPage(pageId) {
      // Hide all pages
      document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
      });
      
      // Show selected page
      document.getElementById(`${pageId}-page`).classList.add('active');
      
      // Update tab styling
      document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
      });
      event.target.classList.add('active');
    }

    function celsiusToFahrenheit(c) {
      return (c * 9/5) + 32;
    }

    function toggleTempUnit(unit) {
      tempUnit = unit;
      if (currentWeatherData) {
        displayWeather(currentWeatherData);
        renderForecast(currentWeatherData.forecast);
      }
      
      // Update active button state
      document.querySelectorAll('.temp-toggle button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.unit === unit);
      });
    }

    // Save search history to localStorage
    function saveToHistory(city) {
      let history = JSON.parse(localStorage.getItem('weatherSearchHistory')) || [];
      
      // Remove if already exists
      history = history.filter(item => item.toLowerCase() !== city.toLowerCase());
      
      // Add to beginning of array
      history.unshift(city);
      
      // Limit to max items
      if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
      }
      
      localStorage.setItem('weatherSearchHistory', JSON.stringify(history));
      renderHistory();
    }

    // Render search history
    function renderHistory() {
      const history = JSON.parse(localStorage.getItem('weatherSearchHistory')) || [];
      
      if (historyList) {
        historyList.innerHTML = history.map(city => 
          `<div class="history-item" onclick="searchFromHistory('${city}')">${city}</div>`
        ).join('');
      }
    }

    // Clear search history
    function clearHistory() {
      localStorage.removeItem('weatherSearchHistory');
      renderHistory();
    }

    // Search from history item click
    function searchFromHistory(city) {
      input.value = city;
      getWeather();
      showPage('current');
    }

    async function getWeather() {
      const city = input.value.trim();
      if (!city) return;
      
      const apiKey = "1eb5e63f8b310afea1aa79bbc9a44705";
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

      try {
        // Fetch current weather
        const currentResponse = await fetch(currentUrl);
        const currentData = await currentResponse.json();

        if (currentData.cod != 200) {
          weatherInfo.innerHTML = `<p>⚠️ ${currentData.message}</p>`;
          return;
        }

        // Fetch forecast
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();

        if (forecastData.cod != "200") {
          weatherInfo.innerHTML = `<p>⚠️ Failed to get forecast data</p>`;
          return;
        }

        // Combine data
        currentData.forecast = forecastData;
        currentWeatherData = currentData;
        
        displayWeather(currentData);
        renderForecast(forecastData);
        saveToHistory(city);
        
      } catch (error) {
        weatherInfo.innerHTML = `<p>❌ Failed to fetch data. Please try again.</p>`;
      }
    }

    async function getWeatherByCoords(lat, lon) {
      const apiKey = "1eb5e63f8b310afea1aa79bbc9a44705";
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

      try {
        // Fetch current weather
        const currentResponse = await fetch(currentUrl);
        const currentData = await currentResponse.json();

        if (currentData.cod != 200) {
          weatherInfo.innerHTML = `<p>⚠️ ${currentData.message}</p>`;
          return;
        }

        // Fetch forecast
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();

        if (forecastData.cod != "200") {
          weatherInfo.innerHTML = `<p>⚠️ Failed to get forecast data</p>`;
          return;
        }

        // Combine data
        currentData.forecast = forecastData;
        currentWeatherData = currentData;
        
        input.value = currentData.name;
        displayWeather(currentData);
        renderForecast(forecastData);
        saveToHistory(currentData.name);
        
      } catch (error) {
        weatherInfo.innerHTML = `<p>❌ Failed to fetch data. Please try again.</p>`;
      }
    }

    function setWeatherBackground(weatherType) {
      // Hide all effects first
      rainEffect.style.display = 'none';
      snowEffect.style.display = 'none';
      sunEffect.style.display = 'none';
      
      // Clear any existing elements
      rainEffect.innerHTML = '';
      snowEffect.innerHTML = '';
      
      // Set body background based on weather
      if (weatherType.includes('rain') || weatherType.includes('drizzle')) {
        document.body.style.background = 'linear-gradient(to bottom, #616161, #9bc5c3)';
        rainEffect.style.display = 'block';
        createRainEffect();
      } else if (weatherType.includes('snow')) {
        document.body.style.background = 'linear-gradient(to bottom, #b6b6b6, #e8e8e8)';
        snowEffect.style.display = 'block';
        createSnowEffect();
      } else if (weatherType.includes('clear')) {
        document.body.style.background = 'linear-gradient(to right, #ffd200, #ffa500)';
        sunEffect.style.display = 'block';
      } else if (weatherType.includes('cloud')) {
        document.body.style.background = 'linear-gradient(to bottom, #a3bded, #6991c7)';
      } else {
        document.body.style.background = 'linear-gradient(to right, #89f7fe, #66a6ff)';
      }
    }

    function createRainEffect() {
      for (let i = 0; i < 50; i++) {
        const drop = document.createElement('div');
        drop.className = 'rain-drop';
        drop.style.left = Math.random() * 100 + '%';
        drop.style.animationDuration = (Math.random() * 0.5 + 0.5) + 's';
        drop.style.animationDelay = Math.random() * 2 + 's';
        drop.style.opacity = Math.random() * 0.5 + 0.3;
        rainEffect.appendChild(drop);
      }
    }

    function createSnowEffect() {
      for (let i = 0; i < 30; i++) {
        const flake = document.createElement('div');
        flake.className = 'snowflake';
        flake.innerHTML = '❄';
        flake.style.left = Math.random() * 100 + '%';
        flake.style.animationDuration = (Math.random() * 3 + 5) + 's';
        flake.style.animationDelay = Math.random() * 5 + 's';
        flake.style.fontSize = (Math.random() * 10 + 10) + 'px';
        flake.style.opacity = Math.random() * 0.5 + 0.3;
        snowEffect.appendChild(flake);
      }
    }

    function loadWeatherAnimation(weatherType) {
      // Destroy previous animation if exists
      if (lottieAnimation) {
        lottieAnimation.destroy();
      }
      
      let animationUrl;
      
      if (weatherType.includes('rain') || weatherType.includes('drizzle')) {
        animationUrl = weatherAnimations.rainy;
      } else if (weatherType.includes('snow')) {
        animationUrl = weatherAnimations.snowy;
      } else if (weatherType.includes('clear')) {
        animationUrl = weatherAnimations.sunny;
      } else if (weatherType.includes('cloud')) {
        animationUrl = weatherAnimations.cloudy;
      } else if (weatherType.includes('thunder')) {
        animationUrl = weatherAnimations.thunder;
      } else {
        animationUrl = weatherAnimations.cloudy;
      }
      
      // Load new animation
      lottieAnimation = lottie.loadAnimation({
        container: weatherAnimation,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: animationUrl
      });
    }

    function renderForecast(forecastData) {
      if (!forecastData || !forecastData.list) return;
      
      // Group forecast by day
      const dailyForecast = {};
      forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toDateString();
        
        if (!dailyForecast[day]) {
          dailyForecast[day] = {
            date: date,
            temps: [],
            humidity: [],
            icons: [],
            descriptions: []
          };
        }
        
        dailyForecast[day].temps.push(item.main.temp);
        dailyForecast[day].humidity.push(item.main.humidity);
        dailyForecast[day].icons.push(item.weather[0].icon);
        dailyForecast[day].descriptions.push(item.weather[0].main);
      });
      
      // Get the next 5 days
      const forecastDays = Object.keys(dailyForecast).slice(0, 5);
      
      let forecastHTML = '';
      
      forecastDays.forEach(day => {
        const data = dailyForecast[day];
        const minTemp = Math.min(...data.temps);
        const maxTemp = Math.max(...data.temps);
        const avgHumidity = Math.round(data.humidity.reduce((a, b) => a + b) / data.humidity.length);
        
        // Find the most frequent weather icon/description
        const iconCounts = {};
        data.icons.forEach(icon => {
          iconCounts[icon] = (iconCounts[icon] || 0) + 1;
        });
        const mostFrequentIcon = Object.keys(iconCounts).reduce((a, b) => 
          iconCounts[a] > iconCounts[b] ? a : b
        );
        
        const descriptionCounts = {};
        data.descriptions.forEach(desc => {
          descriptionCounts[desc] = (descriptionCounts[desc] || 0) + 1;
        });
        const mostFrequentDesc = Object.keys(descriptionCounts).reduce((a, b) => 
          descriptionCounts[a] > descriptionCounts[b] ? a : b
        );
        
        // Format date
        const formattedDate = data.date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        });
        
        // Convert temps if needed
        const displayMin = tempUnit === 'c' ? minTemp : celsiusToFahrenheit(minTemp);
        const displayMax = tempUnit === 'c' ? maxTemp : celsiusToFahrenheit(maxTemp);
        const tempSymbol = tempUnit === 'c' ? '°C' : '°F';
        
        forecastHTML += `
          <div class="forecast-day">
            <div class="forecast-date">${formattedDate}</div>
            <div>
              <img src="https://openweathermap.org/img/wn/${mostFrequentIcon}.png" 
                   alt="${mostFrequentDesc}" class="forecast-icon" />
            </div>
            <div class="forecast-temp">
              ${displayMin.toFixed(0)}${tempSymbol} / ${displayMax.toFixed(0)}${tempSymbol}<br>
              <small>💧 ${avgHumidity}%</small>
            </div>
          </div>
        `;
      });
      
      forecastContainer.innerHTML = forecastHTML;
    }

    function displayWeather(data) {
      // Convert country code to emoji flag
      const countryCode = data.sys.country;
      const emojiFlag = countryCode
        .toUpperCase()
        .split('')
        .map(char => String.fromCodePoint(127397 + char.charCodeAt()))
        .join('');
      
      const icon = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
      const localTime = new Date((data.dt + data.timezone) * 1000).toUTCString().replace("GMT", "Local Time");
      const weatherType = data.weather[0].main.toLowerCase();

      // Set weather background and animation
      setWeatherBackground(weatherType);
      loadWeatherAnimation(weatherType);

      // Convert temperatures if needed
      const temp = tempUnit === 'c' ? data.main.temp : celsiusToFahrenheit(data.main.temp);
      const tempMin = tempUnit === 'c' ? data.main.temp_min : celsiusToFahrenheit(data.main.temp_min);
      const tempMax = tempUnit === 'c' ? data.main.temp_max : celsiusToFahrenheit(data.main.temp_max);
      const tempSymbol = tempUnit === 'c' ? '°C' : '°F';

      weatherInfo.innerHTML = `
        <p><strong>${data.name}, ${data.sys.country} ${emojiFlag}</strong>
        </p>
        <p>${localTime}</p>
        <p><strong>${data.weather[0].main}</strong> - ${data.weather[0].description}</p>
        <p>🌡 Temp: ${temp.toFixed(1)}${tempSymbol}</p>
        <p>📉 Min: ${tempMin.toFixed(1)}${tempSymbol} | 📈 Max: ${tempMax.toFixed(1)}${tempSymbol}</p>
        <p>💧 Humidity: ${data.main.humidity}%</p>
        <div class="temp-toggle">
          <button onclick="toggleTempUnit('c')" data-unit="c" class="${tempUnit === 'c' ? 'active' : ''}">°C</button>
          <button onclick="toggleTempUnit('f')" data-unit="f" class="${tempUnit === 'f' ? 'active' : ''}">°F</button>
        </div>
      `;
    }

    // AI Analysis Functions using local intelligent analysis
    async function generateAIAnalysis() {
      if (!currentWeatherData) {
        aiError.textContent = "Please get current weather data first.";
        aiError.style.display = "block";
        return;
      }

      // Reset UI
      aiError.style.display = "none";
      aiAnalysisContent.innerHTML = "";
      aiLoading.style.display = "block";

      try {
        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate intelligent weather analysis based on current data
        const analysis = generateIntelligentWeatherAnalysis(currentWeatherData);
        
        // Format the response as HTML for better display
        const formattedResponse = formatAIResponse(analysis);
        aiAnalysisContent.innerHTML = formattedResponse;
        
      } catch (error) {
        console.error('AI Analysis Error:', error);
        aiError.textContent = "Failed to generate analysis: " + error.message;
        aiError.style.display = "block";
      } finally {
        aiLoading.style.display = "none";
      }
    }

    // Generate intelligent weather analysis without external AI
    function generateIntelligentWeatherAnalysis(weatherData) {
      const temp = weatherData.main.temp;
      const humidity = weatherData.main.humidity;
      const windSpeed = weatherData.wind.speed;
      const condition = weatherData.weather[0].main.toLowerCase();
      const description = weatherData.weather[0].description;
      const cityName = weatherData.name;
      const country = weatherData.sys.country;

      let analysis = `# Weather Analysis for ${cityName}, ${country}\n\n`;

      // Current Conditions Summary
      analysis += `## Current Conditions Summary\n`;
      analysis += `The weather in ${cityName} is currently ${description} with a temperature of ${temp}°C. `;
      
      if (temp > 30) {
        analysis += `This is quite hot weather. `;
      } else if (temp > 20) {
        analysis += `This is pleasant warm weather. `;
      } else if (temp > 10) {
        analysis += `This is mild weather. `;
      } else if (temp > 0) {
        analysis += `This is cool weather. `;
      } else {
        analysis += `This is cold weather with freezing temperatures. `;
      }

      analysis += `Humidity levels are at ${humidity}%, and wind speeds are ${windSpeed} m/s.\n\n`;

      // Activity Recommendations
      analysis += `## Activity Recommendations\n`;
      
      if (condition.includes('rain')) {
        analysis += `- Indoor activities are recommended due to rainy conditions\n`;
        analysis += `- If going outside, carry an umbrella and wear waterproof clothing\n`;
        analysis += `- Great weather for reading, museums, or indoor sports\n`;
      } else if (condition.includes('snow')) {
        analysis += `- Perfect weather for winter sports like skiing or snowboarding\n`;
        analysis += `- Dress warmly in layers and wear appropriate winter gear\n`;
        analysis += `- Be cautious when driving or walking on potentially icy surfaces\n`;
      } else if (condition.includes('clear') || condition.includes('sun')) {
        if (temp > 25) {
          analysis += `- Excellent weather for outdoor activities like hiking, cycling, or picnics\n`;
          analysis += `- Stay hydrated and wear sunscreen\n`;
          analysis += `- Perfect for swimming or water sports\n`;
        } else if (temp > 15) {
          analysis += `- Great weather for walking, jogging, or outdoor sightseeing\n`;
          analysis += `- Light layers recommended for comfort\n`;
          analysis += `- Ideal for photography and outdoor dining\n`;
        } else {
          analysis += `- Good for brisk walks or light outdoor activities\n`;
          analysis += `- Wear warm clothing and layers\n`;
          analysis += `- Enjoy the clear skies for stargazing in the evening\n`;
        }
      } else if (condition.includes('cloud')) {
        analysis += `- Comfortable weather for most outdoor activities\n`;
        analysis += `- No need for sun protection, but keep a light jacket handy\n`;
        analysis += `- Good conditions for photography with soft, even lighting\n`;
      }

      analysis += `\n## Health Considerations\n`;
      
      // Health recommendations based on conditions
      if (humidity > 80) {
        analysis += `- High humidity may cause discomfort; stay in air-conditioned areas when possible\n`;
        analysis += `- Drink plenty of water to stay hydrated\n`;
      } else if (humidity < 30) {
        analysis += `- Low humidity may cause dry skin and throat; use moisturizer and drink water\n`;
        analysis += `- Consider using a humidifier indoors\n`;
      }

      if (temp > 30) {
        analysis += `- High temperatures increase risk of heat exhaustion; avoid prolonged sun exposure\n`;
        analysis += `- Wear light-colored, loose-fitting clothing\n`;
      } else if (temp < 0) {
        analysis += `- Risk of hypothermia and frostbite; dress warmly and limit outdoor exposure\n`;
        analysis += `- Cover exposed skin and wear insulated footwear\n`;
      }

      if (windSpeed > 10) {
        analysis += `- Strong winds may affect outdoor activities and cause windchill\n`;
        analysis += `- Secure loose objects and be cautious when driving\n`;
      }

      analysis += `\n## Weather Alerts and Warnings\n`;
      
      if (temp > 35) {
        analysis += `- ⚠️ Heat Warning: Extremely high temperatures detected\n`;
      } else if (temp < -10) {
        analysis += `- ❄️ Cold Warning: Very low temperatures with risk of frostbite\n`;
      }

      if (windSpeed > 15) {
        analysis += `- 💨 Wind Warning: Strong winds may affect travel and outdoor activities\n`;
      }

      if (condition.includes('storm') || condition.includes('thunder')) {
        analysis += `- ⛈️ Storm Warning: Thunderstorm conditions - stay indoors and avoid open areas\n`;
      }

      analysis += `\n## What to Expect Next\n`;
      analysis += `Based on current conditions, you can expect:\n`;
      
      if (condition.includes('clear')) {
        analysis += `- Continued clear skies for the next few hours\n`;
        analysis += `- Temperature may rise during midday and cool in the evening\n`;
      } else if (condition.includes('cloud')) {
        analysis += `- Cloudy conditions may persist with possible breaks in cloud cover\n`;
        analysis += `- Temperature should remain relatively stable\n`;
      } else if (condition.includes('rain')) {
        analysis += `- Rain may continue intermittently for the next few hours\n`;
        analysis += `- Temperatures will likely remain cool and stable\n`;
      }

      analysis += `- Wind conditions should remain similar to current levels\n`;
      analysis += `- Check weather updates regularly as conditions can change\n`;

      return analysis;
    }

    // Helper function to format AI response into HTML
    function formatAIResponse(response) {
      if (!response || typeof response !== 'string') {
        return "<p>No response received from AI.</p>";
      }
      
      // Clean up the response text
      let cleanedResponse = response.trim();
      
      // Convert markdown-style formatting to HTML
      let formattedHTML = cleanedResponse
        // Handle headers (lines ending with :)
        .replace(/^([A-Z][^:\n]*:)$/gm, '<h3>$1</h3>')
        // Handle numbered lists
        .replace(/^\d+\.\s(.+)$/gm, '<strong>$&</strong>')
        // Handle bullet points
        .replace(/^[-*]\s(.+)$/gm, '<li>$1</li>')
        // Handle double line breaks as paragraph breaks
        .replace(/\n\n/g, '</p><p>')
        // Handle single line breaks as <br>
        .replace(/\n/g, '<br>');
      
      // Wrap list items in ul tags
      formattedHTML = formattedHTML.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
      
      // Ensure the content is wrapped in paragraphs
      if (!formattedHTML.startsWith('<h3>') && !formattedHTML.startsWith('<p>')) {
        formattedHTML = '<p>' + formattedHTML + '</p>';
      }
      
      return `<div class="ai-response">${formattedHTML}</div>`;
    }

    // Historical Weather Data Functions
    let historicalDataCache = {};

    async function getHistoricalData() {
      const startDate = startDateInput.value;
      const endDate = endDateInput.value;
      
      if (!startDate || !endDate) {
        alert("Please select both start and end dates.");
        return;
      }
      
      if (!currentWeatherData) {
        alert("Please get current weather data first.");
        return;
      }
      
      // Create cache key based on location and date range
      const cacheKey = `${currentWeatherData.name}_${startDate}_${endDate}`;
      
      // Check if data is already cached
      let mockHistoricalData;
      if (historicalDataCache[cacheKey]) {
        console.log('Using cached historical data');
        mockHistoricalData = historicalDataCache[cacheKey];
      } else {
        console.log('Generating new historical data');
        // For demonstration, we'll generate mock historical data
        // In a real app, you would use a weather API that supports historical data
        mockHistoricalData = generateMockHistoricalData(startDate, endDate, currentWeatherData);
        
        // Cache the generated data
        historicalDataCache[cacheKey] = mockHistoricalData;
      }
      
      renderHistoricalChart(mockHistoricalData);
    }

    // Simple seeded random number generator for consistent results
    function seededRandom(seed) {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    }

    function generateMockHistoricalData(startDate, endDate, currentData) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
      
      const historicalData = [];
      const baseTemp = currentData.main.temp;
      const baseHumidity = currentData.main.humidity;
      
      // Create a seed based on location and date range for consistent results
      const locationSeed = currentData.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const dateSeed = start.getTime() + end.getTime();
      const baseSeed = locationSeed + dateSeed;
      
      for (let i = 0; i <= daysDiff; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        
        // Generate consistent variations using seeded random
        const tempSeed = baseSeed + i * 37; // Use prime number for better distribution
        const humiditySeed = baseSeed + i * 41;
        
        const tempVariation = (seededRandom(tempSeed) * 8) - 4; // -4 to +4 degrees
        const humidityVariation = (seededRandom(humiditySeed) * 20) - 10; // -10 to +10%
        
        // Add some seasonal patterns based on month
        const month = date.getMonth();
        let seasonalTemp = 0;
        if (month >= 11 || month <= 1) seasonalTemp = -2; // Winter
        else if (month >= 2 && month <= 4) seasonalTemp = 0; // Spring
        else if (month >= 5 && month <= 7) seasonalTemp = 2; // Summer
        else seasonalTemp = 1; // Fall
        
        historicalData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          temperature: baseTemp + tempVariation + seasonalTemp,
          humidity: Math.max(20, Math.min(100, baseHumidity + humidityVariation))
        });
      }
      
      return historicalData;
    }

    function renderHistoricalChart(data) {
      const ctx = historicalChart.getContext('2d');
      
      // Destroy previous chart if it exists
      if (weatherChart) {
        weatherChart.destroy();
      }
      
      // Create new chart
      weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(d => d.date),
          datasets: [
            {
              label: 'Temperature (°C)',
              data: data.map(d => d.temperature),
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              yAxisID: 'y',
              tension: 0.3
            },
            {
              label: 'Humidity (%)',
              data: data.map(d => d.humidity),
              borderColor: 'rgb(54, 162, 235)',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              yAxisID: 'y1',
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Temperature (°C)'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              grid: {
                drawOnChartArea: false,
              },
              title: {
                display: true,
                text: 'Humidity (%)'
              }
            }
          }
        }
      });
    }

    // Puter authentication removed - not required for weather app

    // Email.js Feedback System
    (function() {
      // Initialize EmailJS with your public key
      emailjs.init("_oNb1898SjS6iMNi_");
    })();

    // Feedback Form Handling
    document.addEventListener('DOMContentLoaded', function() {
      const feedbackForm = document.getElementById('feedbackForm');
      const starRating = document.getElementById('starRating');
      const userRating = document.getElementById('userRating');
      const feedbackStatus = document.getElementById('feedbackStatus');

      // Star rating functionality
      if (starRating) {
        const stars = starRating.querySelectorAll('.star');
        
        stars.forEach((star, index) => {
          star.addEventListener('click', function() {
            const rating = parseInt(star.dataset.rating);
            userRating.value = rating;
            
            // Update star display
            stars.forEach((s, i) => {
              if (i < rating) {
                s.classList.add('active');
              } else {
                s.classList.remove('active');
              }
            });
          });
          
          star.addEventListener('mouseover', function() {
            const rating = parseInt(star.dataset.rating);
            stars.forEach((s, i) => {
              if (i < rating) {
                s.style.filter = 'grayscale(0%)';
                s.style.transform = 'scale(1.1)';
              } else {
                s.style.filter = 'grayscale(100%)';
                s.style.transform = 'scale(1)';
              }
            });
          });
          
          starRating.addEventListener('mouseleave', function() {
            const currentRating = parseInt(userRating.value);
            stars.forEach((s, i) => {
              if (i < currentRating) {
                s.classList.add('active');
              } else {
                s.classList.remove('active');
              }
            });
          });
        });
      }

      // Form submission
      if (feedbackForm) {
        feedbackForm.addEventListener('submit', function(e) {
          e.preventDefault();
          submitFeedback();
        });
      }
    });

    async function submitFeedback() {
      const form = document.getElementById('feedbackForm');
      const submitBtn = form.querySelector('.submit-feedback-btn');
      const btnText = submitBtn.querySelector('.btn-text');
      const btnLoading = submitBtn.querySelector('.btn-loading');
      const statusDiv = document.getElementById('feedbackStatus');

      // Show loading state
      submitBtn.disabled = true;
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline';
      statusDiv.style.display = 'none';

      try {
        // Prepare form data
        const formData = new FormData(form);
        const feedbackData = Object.fromEntries(formData.entries());

        // Add current weather data if requested
        if (document.getElementById('includeWeatherData').checked && currentWeatherData) {
          feedbackData.weather_data = JSON.stringify({
            city: currentWeatherData.name,
            country: currentWeatherData.sys.country,
            temperature: currentWeatherData.main.temp,
            condition: currentWeatherData.weather[0].main,
            humidity: currentWeatherData.main.humidity,
            windSpeed: currentWeatherData.wind.speed,
            timestamp: new Date().toISOString()
          });
        }

        // Add timestamp
        feedbackData.submitted_at = new Date().toLocaleString();

        // Send email using EmailJS
        const response = await emailjs.send(
          'service_yb7l0fc',
          'template_lk31df2',
          feedbackData
        );

        // Success
        showFeedbackStatus('success', '✅ Thank you! Your feedback has been sent successfully. We\'ll get back to you soon!');
        form.reset();
        document.getElementById('userRating').value = '0';
        document.querySelectorAll('.star').forEach(star => star.classList.remove('active'));

      } catch (error) {
        console.error('Feedback submission error:', error);
        showFeedbackStatus('error', '❌ Sorry, there was an error sending your feedback. Please try again or contact us directly.');
      } finally {
        // Reset button state
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
      }
    }

    function showFeedbackStatus(type, message) {
      const statusDiv = document.getElementById('feedbackStatus');
      statusDiv.className = `feedback-status ${type}`;
      statusDiv.textContent = message;
      statusDiv.style.display = 'block';

      // Auto-hide after 5 seconds
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 5000);
    }

    // Enhanced showPage function to handle all pages including home
    function showPage(pageId) {
      // Hide all pages
      document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
      });
      
      // Show selected page
      document.getElementById(`${pageId}-page`).classList.add('active');
      
      // Update tab styling
      document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
      });
      
      // Find and activate the correct tab
      const targetTab = document.querySelector(`[onclick="showPage('${pageId}')"]`);
      if (targetTab) {
        targetTab.classList.add('active');
      }

      // Initialize feedback form if switching to feedback page
      if (pageId === 'feedback') {
        initializeFeedbackPage();
      }
    }

    function initializeFeedbackPage() {
      // Pre-fill user email if available (from localStorage or other sources)
      const savedEmail = localStorage.getItem('userEmail');
      if (savedEmail) {
        document.getElementById('userEmail').value = savedEmail;
      }

      // Save email to localStorage when user types
      const emailInput = document.getElementById('userEmail');
      if (emailInput) {
        emailInput.addEventListener('blur', function() {
          if (this.value && this.value.includes('@')) {
            localStorage.setItem('userEmail', this.value);
          }
        });
      }
    }

    // Start Exploring Weather button functionality
    function startExploring() {
      showPage('current');
      // Scroll to the search input and focus on it
      setTimeout(function() {
        const cityInput = document.getElementById('cityInput');
        if (cityInput) {
          cityInput.focus();
          cityInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }