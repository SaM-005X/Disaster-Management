import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { User } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

// Declare Leaflet library to TypeScript to avoid type errors with the global 'L' variable
declare var L: any;

interface TectonicMapProps {
    user: User;
}

interface EarthquakeFeature {
    type: "Feature";
    properties: {
        mag: number;
        place: string;
        time: number;
    };
    geometry: {
        type: "Point";
        coordinates: [number, number, number]; // lon, lat, depth
    };
}

const TectonicMap: React.FC<TectonicMapProps> = ({ user }) => {
  const { translate } = useTranslate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null); // To hold the map instance
  const earthquakeLayerRef = useRef<any>(null); // To hold the earthquake layer group

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allEarthquakesData, setAllEarthquakesData] = useState<any>(null);

  // Filter state
  const [magnitudeFilter, setMagnitudeFilter] = useState('2.5');
  const [timeFilter, setTimeFilter] = useState('day'); // 'hour', 'day', 'week'

  // Helper function for earthquake marker color based on depth
  const getEarthquakeColor = (depth: number) => {
    return depth > 90 ? '#800026' :
           depth > 70 ? '#BD0026' :
           depth > 50 ? '#E31A1C' :
           depth > 30 ? '#FC4E2A' :
           depth > 10 ? '#FD8D3C' :
                        '#FEB24C';
  };
  
  const getTimeFilterUrl = (filter: string) => {
    switch (filter) {
        case 'hour': return 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson';
        case 'week': return 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';
        case 'day':
        default: return 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
    }
  };

  const fetchAndDisplayEarthquakes = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      if (earthquakeLayerRef.current) {
          mapRef.current.removeLayer(earthquakeLayerRef.current);
      }
      try {
        const earthquakeResponse = await fetch(getTimeFilterUrl(timeFilter));
        if (!earthquakeResponse.ok) throw new Error(translate('Earthquake data fetch failed!'));
        const earthquakeData = await earthquakeResponse.json();
        setAllEarthquakesData(earthquakeData);
      } catch (e) {
          if (e instanceof Error) {
            setError(translate("Could not load earthquake data:") + ` ${e.message}`);
          } else {
            setError(translate("An unknown error occurred while loading earthquake data."));
          }
      } finally {
          setIsLoading(false);
      }
  }, [timeFilter, translate]);
  
   // Effect for initial map setup and static layers
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, { center: [20, 0], zoom: 2, minZoom: 2 });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(mapRef.current);

      const fetchData = async () => {
        try {
            const [platesResponse, ringOfFireResponse, volcanoesResponse] = await Promise.all([
                fetch('data/tectonic-plates.json'),
                fetch('data/ring-of-fire.json'),
                fetch('data/volcanoes.json'),
            ]);

            if (!platesResponse.ok) throw new Error(translate(`Tectonic plates data fetch failed!`));
            const platesData = await platesResponse.json();
            L.geoJSON(platesData, { style: { color: "#f59e0b", weight: 2, opacity: 0.7 } }).addTo(mapRef.current);

            if (!ringOfFireResponse.ok) throw new Error(translate(`Ring of Fire data fetch failed!`));
            const ringOfFireData = await ringOfFireResponse.json();
            L.geoJSON(ringOfFireData, { style: { color: "#dc2626", weight: 1, fillColor: "#dc2626", fillOpacity: 0.2 } }).addTo(mapRef.current);
            
            if (!volcanoesResponse.ok) throw new Error(translate(`Volcanoes data fetch failed!`));
            const volcanoesData = await volcanoesResponse.json();
            const volcanoIcon = L.divIcon({
                html: '<svg viewBox="0 0 24 24" class="h-4 w-4 drop-shadow-md"><path fill="%23f43f5e" d="M12 0 L24 22 H0 Z"/></svg>',
                className: '', iconSize: [16, 16], iconAnchor: [8, 16]
            });
            L.geoJSON(volcanoesData, {
                pointToLayer: (feature: any, latlng: any) => L.marker(latlng, { icon: volcanoIcon }),
                 onEachFeature: (feature: any, layer: any) => {
                    if (feature.properties && feature.properties.Volcano_Name) {
                        layer.bindPopup(
                            `<h3 class="font-bold text-lg">${translate('Volcano')}: ${translate(feature.properties.Volcano_Name)}</h3><hr class="my-1">
                             <p><strong>${translate('Type')}:</strong> ${translate(feature.properties.Primary_Volcano_Type)}</p>
                             <p><strong>${translate('Country')}:</strong> ${translate(feature.properties.Country)}</p>`
                        );
                    }
                }
            }).addTo(mapRef.current);

        } catch (e) {
            if (e instanceof Error) {
                setError(prev => prev ? `${prev}\n${e.message}` : e.message);
            }
        }
      };

      fetchData();
      fetchAndDisplayEarthquakes();
      
      const legend = L.control({ position: 'bottomright' });
      legend.onAdd = function () {
            const div = L.DomUtil.create('div', 'info legend');
            const depths = [0, 10, 30, 50, 70, 90];
            div.innerHTML += `<h4>${translate('Earthquake Depth (km)')}</h4>`;
            for (let i = 0; i < depths.length; i++) {
                div.innerHTML +=
                    `<i style="background:${getEarthquakeColor(depths[i] + 1)}"></i> ` +
                    depths[i] + (depths[i + 1] ? `&ndash;${depths[i + 1]}<br>` : '+');
            }
            div.innerHTML += '<hr>';
            div.innerHTML += `<h4>${translate('Other Symbols')}</h4>`;
            div.innerHTML += '<i class="ring-of-fire-legend-icon"></i> ' + translate('Ring of Fire') + '<br>';
            div.innerHTML += '<i class="volcano-legend-icon"></i> ' + translate('Active Volcano') + '<br>';
            div.innerHTML += '<i class="plate-legend-icon"></i> ' + translate('Tectonic Plate') + '<br>';
            return div;
        };
      legend.addTo(mapRef.current);
    }
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translate]); 
  
  // Effect to re-fetch earthquakes when time filter changes
  useEffect(() => {
    if (mapRef.current) {
        fetchAndDisplayEarthquakes();
    }
  }, [timeFilter, fetchAndDisplayEarthquakes]);

  // Effect to filter and re-render earthquakes when magnitude or data changes
  useEffect(() => {
    if (!allEarthquakesData || !mapRef.current) return;

    if (earthquakeLayerRef.current) {
        mapRef.current.removeLayer(earthquakeLayerRef.current);
    }
    
    const filteredFeatures = allEarthquakesData.features.filter((feature: EarthquakeFeature) => 
        feature.properties.mag >= parseFloat(magnitudeFilter)
    );

    const filteredGeoJSON = { ...allEarthquakesData, features: filteredFeatures };

    earthquakeLayerRef.current = L.geoJSON(filteredGeoJSON, {
        pointToLayer: (feature: EarthquakeFeature, latlng: any) => {
            return L.circleMarker(latlng, {
                radius: feature.properties.mag * 2.5,
                fillColor: getEarthquakeColor(feature.geometry.coordinates[2]),
                color: "#000", weight: 0.5, opacity: 1, fillOpacity: 0.8
            });
        },
        onEachFeature: (feature: EarthquakeFeature, layer: any) => {
            if (feature.properties && feature.properties.place) {
                layer.bindPopup(
                    `<h3 class="font-bold text-lg">${feature.properties.place}</h3><hr class="my-1">
                     <p><strong>${translate('Magnitude')}:</strong> ${feature.properties.mag}</p>
                     <p><strong>${translate('Depth')}:</strong> ${feature.geometry.coordinates[2]} km</p>
                     <p><strong>${translate('Time')}:</strong> ${new Date(feature.properties.time).toLocaleString()}</p>`
                );
            }
        }
    }).addTo(mapRef.current);
  }, [magnitudeFilter, allEarthquakesData, translate]);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white">
            {translate('Tectonic Activity Map')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
            {translate('Interactive map showing tectonic plates, seismic zones, active volcanoes, and live earthquake data.')}
        </p>
      </div>
      {error && (
        <div className="p-4 mb-4 text-sm text-red-800 bg-red-100 rounded-lg dark:bg-red-900/50 dark:text-red-200" role="alert">
          {error}
        </div>
      )}
       <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-x-6 gap-y-4">
                <h3 className="font-bold text-gray-800 dark:text-white text-lg flex-shrink-0">
                    {translate('Filter Earthquakes')}
                </h3>
                <div className="flex-grow flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <div className="flex-1 min-w-[200px]">
                        <label htmlFor="magnitude-filter" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                            {translate('Minimum Magnitude')}
                        </label>
                        <div className="relative">
                            <select 
                                id="magnitude-filter"
                                value={magnitudeFilter}
                                onChange={(e) => setMagnitudeFilter(e.target.value)}
                                className="w-full appearance-none bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 pl-3 pr-8 text-sm font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="0">{translate('All Magnitudes')}</option>
                                <option value="2.5">{translate('2.5+')}</option>
                                <option value="4.5">{translate('4.5+ (Significant)')}</option>
                                <option value="6.0">{translate('6.0+ (Major)')}</option>
                            </select>
                            <ChevronDownIcon className="h-4 w-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400"/>
                        </div>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label htmlFor="time-filter" className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                            {translate('Time Range')}
                        </label>
                        <div className="relative">
                            <select
                                id="time-filter"
                                value={timeFilter}
                                onChange={(e) => setTimeFilter(e.target.value)}
                                className="w-full appearance-none bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 pl-3 pr-8 text-sm font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="hour">{translate('Past Hour')}</option>
                                <option value="day">{translate('Past Day')}</option>
                                <option value="week">{translate('Past Week')}</option>
                            </select>
                            <ChevronDownIcon className="h-4 w-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      <div 
        className="relative w-full aspect-video max-h-[500px] bg-gray-200 dark:bg-gray-900 rounded-2xl shadow-lg z-10"
      >
        {/* Map Container */}
        <div 
            ref={mapContainerRef}
            className="h-full w-full rounded-2xl overflow-hidden"
            aria-label={translate('Interactive world map showing tectonic plates and earthquakes')}
        />

        {/* Loading Overlay */}
        {isLoading && (
            <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center z-20 backdrop-blur-sm">
                <div className="flex items-center space-x-2 text-white text-lg font-semibold">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                    <span>{translate('Loading live seismic data...')}</span>
                </div>
            </div>
        )}
      </div>
       <style>{`
        .legend {
            padding: 6px 10px;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 14px;
            background: rgba(255,255,255,0.85);
            box-shadow: 0 0 15px rgba(0,0,0,0.2);
            border-radius: 5px;
            line-height: 20px;
            color: #555;
        }
        .dark .legend {
            background: rgba(31, 41, 55, 0.85);
            color: #d1d5db;
        }
        .legend i {
            width: 18px;
            height: 18px;
            float: left;
            margin-right: 8px;
            opacity: 0.9;
        }
        .legend h4 {
            margin: 0 0 5px;
            font-size: 14px;
            font-weight: bold;
        }
        .legend hr {
            margin: 5px 0;
            border-top: 1px solid #999;
        }
        .ring-of-fire-legend-icon {
            background: rgba(220, 38, 38, 0.4); 
            border: 1px solid #dc2626;
        }
        .dark .ring-of-fire-legend-icon {
            background: rgba(239, 68, 68, 0.5);
            border-color: #ef4444;
        }
        .volcano-legend-icon {
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f43f5e"><path d="M12 0 L24 22 H0 Z"/></svg>');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
        }
        .plate-legend-icon {
            border: 2px solid #f59e0b;
        }

        /* Dark Mode Popup Styles */
        .dark .leaflet-popup-content-wrapper {
            background-color: #1f2937; /* gray-800 */
            color: #d1d5db; /* gray-300 */
            border-radius: 8px;
            box-shadow: 0 3px 14px rgba(0,0,0,0.4);
        }
        .dark .leaflet-popup-content h3 {
            color: #f9fafb; /* gray-50 */
        }
        .dark .leaflet-popup-content hr {
            border-top-color: #4b5563; /* gray-600 */
        }
        .dark .leaflet-popup-tip {
            background-color: #1f2937; /* gray-800 */
        }
        .dark .leaflet-popup-close-button {
            color: #9ca3af !important; /* gray-400, !important to override leaflet inline style */
        }
        .dark .leaflet-popup-close-button:hover {
            color: #f9fafb !important; /* gray-50 */
        }
        /* Utility classes for popup content */
        .leaflet-popup-content .font-bold {
            font-weight: 700;
        }
        .leaflet-popup-content .text-lg {
            font-size: 1.125rem;
            line-height: 1.75rem;
        }
        .leaflet-popup-content .my-1 {
            margin-top: 0.25rem;
            margin-bottom: 0.25rem;
        }
      `}</style>
    </div>
  );
};

export default TectonicMap;
