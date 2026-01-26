import React from 'react';
import { CloudSun, MapPin } from 'lucide-react';
import { UI_THEME } from '../../../../utils/constants';
import { TAIWAN_LOCATIONS } from '../../utils/dashboardConstants';
import SettingsSection from './SettingsSection'; // 引入剛剛建立的外框

const WeatherSettings = ({ 
  weatherConfig, 
  setWeatherConfig, 
  isOpen, 
  onToggle 
}) => {
  
  // 將搜尋邏輯搬進來，讓主檔案更乾淨
  const handleSearchLocation = async () => {
    if (!weatherConfig.district) return;
    try {
      // 顯示搜尋中... (建議未來可以加 loading state)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${weatherConfig.district}&format=json&limit=1`);
      const data = await res.json();

      if (data && data.length > 0) {
        const result = data[0];
        setWeatherConfig({
          ...weatherConfig,
          city: 'custom',
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon)
        });
        alert(`已找到地點：${result.display_name}\n座標更新為：${result.lat}, ${result.lon}`);
      } else {
        alert('找不到該地點，請嘗試輸入更完整的名稱（例如：嘉義縣阿里山鄉）');
      }
    } catch (error) {
      console.error(error);
      alert('搜尋失敗，請檢查網路連線');
    }
  };

  // 通用樣式定義
  const inputStyle = `bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/50 outline-none rounded-lg transition-all ${UI_THEME.TEXT_PRIMARY}`;

  return (
    <SettingsSection 
      title="天氣與地區設定" 
      icon={CloudSun} 
      theme="blue"
      isOpen={isOpen} 
      onToggle={onToggle}
    >
        <div className="flex flex-col gap-4">
        
        {/* 顯示開關 */}
        <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col">
                <span className={`font-bold text-lg ${UI_THEME.TEXT_PRIMARY}`}>顯示天氣小工具</span>
                <span className={`text-xs ${UI_THEME.TEXT_MUTED}`}>在主畫面右上角顯示即時氣溫與降雨機率</span>
            </div>
            <button
            onClick={() => setWeatherConfig({ ...weatherConfig, enabled: !weatherConfig.enabled })}
            className={`relative w-14 h-8 rounded-full transition-all duration-300 ease-in-out ${
                weatherConfig.enabled ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
            }`}
            >
            <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                weatherConfig.enabled ? 'translate-x-6' : 'translate-x-0'
            }`} />
            </button>
        </div>

        {/* 詳細設定區 */}
        <div className={`transition-all duration-300 ${weatherConfig.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
            
            {/* 快速選單 */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className={`block text-sm font-bold mb-2 ${UI_THEME.TEXT_SECONDARY}`}>縣市 (快速樣板)</label>
                <select 
                    value={weatherConfig.city} 
                    onChange={(e) => {
                        const newCity = e.target.value;
                        if (newCity === 'custom') {
                        setWeatherConfig({ ...weatherConfig, city: 'custom', district: '' });
                        } else {
                        const firstDist = TAIWAN_LOCATIONS[newCity][0]; 
                        setWeatherConfig({
                            city: newCity,
                            district: firstDist.name,
                            lat: firstDist.lat,
                            lon: firstDist.lon
                        });
                        }
                    }}
                    className={`w-full p-3 font-bold cursor-pointer ${inputStyle}`}
                >
                    {Object.keys(TAIWAN_LOCATIONS).map(city => (
                    <option key={city} value={city}>{city}</option>
                    ))}
                    <option value="custom">📍 自訂地點 (手動輸入)</option>
                </select>
                </div>
                <div>
                <label className={`block text-sm font-bold mb-2 ${UI_THEME.TEXT_SECONDARY}`}>地點搜尋 / 行政區</label>
                {weatherConfig.city === 'custom' ? (
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            value={weatherConfig.district}
                            onChange={(e) => setWeatherConfig({ ...weatherConfig, district: e.target.value })}
                            placeholder="輸入地點 (如: 阿里山)"
                            className={`flex-1 p-3 font-bold ${inputStyle}`}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                        />
                        <button 
                            onClick={handleSearchLocation}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors"
                        >
                            搜尋
                        </button>
                    </div>
                ) : (
                    <select 
                        value={weatherConfig.district} 
                        onChange={(e) => {
                            const newDistName = e.target.value;
                            const distData = TAIWAN_LOCATIONS[weatherConfig.city].find(d => d.name === newDistName);
                            setWeatherConfig({
                            ...weatherConfig,
                            district: newDistName,
                            lat: distData.lat,
                            lon: distData.lon
                            });
                        }}
                        className={`w-full p-3 font-bold cursor-pointer ${inputStyle}`}
                    >
                        {TAIWAN_LOCATIONS[weatherConfig.city]?.map(dist => (
                        <option key={dist.name} value={dist.name}>{dist.name}</option>
                        ))}
                    </select>
                )}
                </div>
            </div>

            <div className="w-full h-px bg-slate-200 dark:bg-slate-700 my-4"></div>

            {/* 精準座標 */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className={`block text-sm font-bold mb-2 ${UI_THEME.TEXT_SECONDARY}`}>緯度 (Latitude)</label>
                <input 
                    type="number" 
                    step="0.0001"
                    value={weatherConfig.lat}
                    onChange={(e) => setWeatherConfig({ ...weatherConfig, lat: parseFloat(e.target.value) })}
                    className={`w-full p-3 font-mono font-bold ${inputStyle}`}
                />
                </div>
                <div>
                <label className={`block text-sm font-bold mb-2 ${UI_THEME.TEXT_SECONDARY}`}>經度 (Longitude)</label>
                <input 
                    type="number" 
                    step="0.0001"
                    value={weatherConfig.lon}
                    onChange={(e) => setWeatherConfig({ ...weatherConfig, lon: parseFloat(e.target.value) })}
                    className={`w-full p-3 font-mono font-bold ${inputStyle}`}
                />
                </div>
            </div>

            <div className={`mt-4 text-xs flex items-center gap-2 ${UI_THEME.TEXT_MUTED} bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800`}>
                <MapPin size={14} />
                <span>
                提示：您可以透過 Google Maps 右鍵點選地點來取得精準座標。選單僅供快速填入，實際天氣將依據下方座標抓取。
                </span>
            </div>
        </div>
        </div>
    </SettingsSection>
  );
};

export default WeatherSettings;