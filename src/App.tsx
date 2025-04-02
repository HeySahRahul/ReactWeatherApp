import { useState, useEffect } from 'react';
import { Search, Heart, Wind, Droplets} from 'lucide-react';
import { format } from 'date-fns';
import type { WeatherData, FavoriteLocation } from './types';


const API_KEY = 'e433867738ecf77ef9b2d633016bce27';
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState<FavoriteLocation[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const fetchWeather = async (cityName: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `${API_BASE_URL}/weather?q=${cityName}&appid=${API_KEY}&units=metric`
      );
      if (!response.ok) throw new Error('City not found');
      
      const data = await response.json();
      
      // Fetch 5-day forecast
      const forecastResponse = await fetch(
        `${API_BASE_URL}/forecast?q=${cityName}&appid=${API_KEY}&units=metric`
      );
      const forecastData = await forecastResponse.json();
      console.log(forecastData)

      // Process forecast data to get one entry per day
      const dailyForecast = forecastData.list
        .filter((_: unknown, index: number) => index % 8 === 0)
        .slice(0, 5)
        .map((day: { dt: number; main: { temp: number }; weather: { description: string; icon: string }[] }) => ({
          date: format(new Date(day.dt * 1000), 'EEE, MMM d'),
          temp: Math.round(day.main.temp),
          description: day.weather[0].description,
          icon: day.weather[0].icon,
        }));

      setWeather({
        city: data.name,
        current: {
          temp: Math.round(data.main.temp),
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed),
          description: data.weather[0].description,
          icon: data.weather[0].icon,
        },
        forecast: dailyForecast,
      });
    } catch (err) {
      console.log(err)
      setError('Could not fetch weather data. Please try again.');
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (cityName: string) => {
    setFavorites(prev => {
      const isFavorite = prev.some(fav => fav.name === cityName);
      if (isFavorite) {
        return prev.filter(fav => fav.name !== cityName);
      }
      return [...prev, { id: Date.now().toString(), name: cityName }];
    });
  };

  const isFavorite = (cityName: string) => {
    return favorites.some(fav => fav.name === cityName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-grey-400 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Weather Forecast</h1>
          
          {/* Search Bar */}
          <div className="relative mb-6">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchWeather(city)}
              placeholder="Enter city name..."
              className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => fetchWeather(city)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-500"
            >
              <Search size={20} />
            </button>
          </div>

          {/* Favorites */}
          {favorites.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Favorite Locations</h2>
              <div className="flex flex-wrap gap-2">
                {favorites.map(fav => (
                  <button
                    key={fav.id}
                    onClick={() => {
                      setCity(fav.name);
                      fetchWeather(fav.name);
                    }}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    {fav.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className=" h-12 w-12 border-b-2 mx-auto">Loading ....</div>
            </div>
          )}

          {/* Weather Display */}
          {weather && !loading && (
            <div>
              {/* Current Weather */}
              <div className="mb-8">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-gray-800">{weather.city}</h2>
                  <button
                    onClick={() => toggleFavorite(weather.city)}
                    className={`p-2 rounded-full ${
                      isFavorite(weather.city)
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-gray-400 hover:text-gray-500'
                    }`}
                  >
                    <Heart fill={isFavorite(weather.city) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center">
                    <img
                      src={`https://openweathermap.org/img/wn/${weather.current.icon}@2x.png`}
                      alt={weather.current.description}
                      className="w-20 h-20"
                    />
                    <div>
                      <div className="text-5xl font-bold text-gray-800">
                        {weather.current.temp}°C
                      </div>
                      <div className="text-gray-600 capitalize">
                        {weather.current.description}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Wind size={20} />
                      <span>{weather.current.windSpeed} m/s</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Droplets size={20} />
                      <span>{weather.current.humidity}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5-Day Forecast */}
              <div>
                <h3 className="text-xl font-semibold mb-4">5-Day Forecast</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {weather.forecast.map((day, index) => (
                    <div
                      key={index}
                      className="bg-white/50 rounded-lg p-4 text-center"
                    >
                      <div className="text-sm font-medium text-gray-600 mb-2">
                        {day.date}
                      </div>
                      <img
                        src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                        alt={day.description}
                        className="w-12 h-12 mx-auto"
                      />
                      <div className="text-2xl font-bold text-gray-800">
                        {day.temp}°C
                      </div>
                      <div className="text-sm text-gray-600 capitalize">
                        {day.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;