import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import { Truck, MapPinned, ArrowLeft, Search, ChevronDown, X, Crosshair } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const truckSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`;

const getTruckIcon = (last_updated) => {
  const isOffline = (new Date() - new Date(last_updated)) > 180000; 
  const bgColor = isOffline ? '#64748b' : '#16a34a'; 
  const size = isOffline ? 22 : 44; // 50% más pequeño cuando está inactivo
  const anchor = isOffline ? 11 : 22;
  const padding = isOffline ? 2 : 4;
  const borderWidth = isOffline ? 2 : 3;
  const opacity = isOffline ? 0.8 : 1;
  const shadow = isOffline ? '0 2px 4px rgba(0,0,0,0.3)' : '0 4px 8px rgba(0,0,0,0.4)';
  
  return new L.divIcon({
    className: 'custom-truck-icon',
    html: `<div style="background-color: ${bgColor}; width: ${size}px; height: ${size}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: ${shadow}; border: ${borderWidth}px solid white; padding: ${padding}px; opacity: ${opacity}; transition: all 0.3s;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" style="width: 100%; height: 100%; display: block;"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg></div>`,
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
    popupAnchor: [0, -anchor],
  });
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const getTotalDistance = (coords) => {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += calculateDistance(coords[i-1][0], coords[i-1][1], coords[i][0], coords[i][1]);
  }
  return total;
};

const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const lat1Rad = lat1 * (Math.PI / 180);
  const lat2Rad = lat2 * (Math.PI / 180);
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
};

const createArrowIcon = (bearing, color = '#2563eb') => {
  return new L.divIcon({
    className: 'custom-direction-arrow',
    html: `
      <div style="
        transform: rotate(${Math.round(bearing)}deg);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.55));
        pointer-events: none;
      ">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L20 21L12 17L4 21L12 2Z" fill="${color}" stroke="#ffffff" stroke-width="2.2" stroke-linejoin="round" />
        </svg>
      </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
};

const createStartIcon = (label = 'A') => new L.divIcon({
  className: 'custom-start-marker',
  html: `
    <div style="
      background-color: #16a34a;
      color: white;
      font-size: 11px;
      font-weight: 800;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.45);
      cursor: pointer;
    ">
      ${label}
    </div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

const createEndIcon = (label = 'B') => new L.divIcon({
  className: 'custom-end-marker',
  html: `
    <div style="
      background-color: #dc2626;
      color: white;
      font-size: 11px;
      font-weight: 800;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.45);
      cursor: pointer;
    ">
      ${label}
    </div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

const getSampledDirectionArrows = (coords, color = '#2563eb', targetCount = 30) => {
  if (!coords || coords.length < 2) return [];
  const totalKm = getTotalDistance(coords);
  if (totalKm <= 0.05) return [];

  // Espaciado uniforme para cubrir el 100% de la ruta (tanto ciudad como carretera)
  // En rutas cortas (<5km): cada ~150m-200m
  // En carreteras largas (>40km): cada ~1.5km - 2.5km
  const idealStepKm = Math.max(0.15, totalKm / targetCount);
  const arrows = [];
  
  let accumulatedKm = 0;
  let nextTargetKm = idealStepKm * 0.4; // Primera flecha poco después del inicio
  let lastBearing = null;
  let lastArrowPoint = null;

  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const segDist = calculateDistance(p1[0], p1[1], p2[0], p2[1]);
    if (segDist < 0.002) continue;

    const bearing = calculateBearing(p1[0], p1[1], p2[0], p2[1]);
    const segStartKm = accumulatedKm;
    const segEndKm = accumulatedKm + segDist;

    // Detectar vueltas / esquinas pronunciadas en ciudad
    let isSharpTurn = false;
    if (lastBearing !== null) {
      let diff = Math.abs(bearing - lastBearing);
      if (diff > 180) diff = 360 - diff;
      if (diff >= 40) isSharpTurn = true;
    }

    // 1. Flechas regulares por distancia acumulada (Garantiza flechas continuas en carretera)
    while (nextTargetKm <= segEndKm && arrows.length < targetCount + 10) {
      const offset = nextTargetKm - segStartKm;
      const fraction = segDist > 0 ? Math.max(0.05, Math.min(0.95, offset / segDist)) : 0.5;
      const lat = p1[0] + (p2[0] - p1[0]) * fraction;
      const lng = p1[1] + (p2[1] - p1[1]) * fraction;

      arrows.push({
        key: `arr-dist-${i}-${arrows.length}-${lat.toFixed(4)}-${lng.toFixed(4)}`,
        lat,
        lng,
        bearing,
        color
      });

      lastArrowPoint = [lat, lng];
      lastBearing = bearing;
      nextTargetKm += idealStepKm;
    }

    // 2. Si hubo una vuelta cerrada en ciudad y no hay una flecha muy cerca
    if (isSharpTurn && arrows.length < targetCount + 10) {
      const midLat = (p1[0] + p2[0]) / 2;
      const midLng = (p1[1] + p2[1]) / 2;
      const distFromLast = lastArrowPoint 
        ? calculateDistance(lastArrowPoint[0], lastArrowPoint[1], midLat, midLng)
        : 999;

      if (distFromLast >= 0.08) {
        arrows.push({
          key: `arr-turn-${i}-${midLat.toFixed(4)}-${midLng.toFixed(4)}`,
          lat: midLat,
          lng: midLng,
          bearing,
          color
        });
        lastArrowPoint = [midLat, midLng];
        lastBearing = bearing;
      }
    }

    accumulatedKm = segEndKm;
    lastBearing = bearing;
  }

  // Fallback si por alguna razón no se colocaron flechas
  if (arrows.length === 0 && coords.length >= 2) {
    const midIdx = Math.floor(coords.length / 2);
    const p1 = coords[Math.max(0, midIdx - 1)];
    const p2 = coords[Math.min(coords.length - 1, midIdx + 1)];
    arrows.push({
      key: `arr-fallback`,
      lat: (coords[0][0] + coords[coords.length - 1][0]) / 2,
      lng: (coords[0][1] + coords[coords.length - 1][1]) / 2,
      bearing: calculateBearing(p1[0], p1[1], p2[0], p2[1]),
      color
    });
  }

  return arrows;
};


const ResizeController = ({ isFullScreen }) => {
  const map = useMap();
  React.useEffect(() => {
    const handleResize = () => {
      try {
        if (map) map.invalidateSize();
      } catch (e) {
        // ignore if unmounted
      }
    };

    handleResize();
    const t1 = setTimeout(handleResize, 100);
    const t2 = setTimeout(handleResize, 300);
    const t3 = setTimeout(handleResize, 600);

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleResize);
    };
  }, [isFullScreen, map]);
  return null;
};

const getTripBounds = (coords) => {
  if (!coords || coords.length === 0) return null;
  let minLat = coords[0][0], maxLat = coords[0][0];
  let minLng = coords[0][1], maxLng = coords[0][1];
  for (let i = 1; i < coords.length; i++) {
    const [lat, lng] = coords[i];
    if (isNaN(lat) || isNaN(lng)) continue;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  if (minLat === maxLat && minLng === maxLng) {
    return [[minLat - 0.005, minLng - 0.005], [maxLat + 0.005, maxLng + 0.005]];
  }
  return [[minLat, minLng], [maxLat, maxLng]];
};

const MapController = ({ panTarget }) => {
  const map = useMap();
  React.useEffect(() => {
    if (panTarget && map) {
      try {
        if (panTarget.bounds && Array.isArray(panTarget.bounds) && panTarget.bounds.length === 2) {
          map.fitBounds(panTarget.bounds, { padding: [40, 40], maxZoom: 15 });
        } else if (panTarget.lat && panTarget.lng && !isNaN(panTarget.lat) && !isNaN(panTarget.lng)) {
          map.flyTo([panTarget.lat, panTarget.lng], 15, { duration: 1.5 });
        }
      } catch (err) {
        console.warn('MapController error:', err);
      }
    }
  }, [panTarget, map]);
  return null;
};

const OperatorSearchSelect = ({ 
  value, 
  onChange, 
  operators = [], 
  allLabel = 'Todos los operadores',
  placeholder = 'Buscar operador...',
  isCompact = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = React.useRef(null);
  const inputRef = React.useRef(null);

  const normalize = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  const selectedOperator = useMemo(() => {
    if (!value || value === 'ALL') return null;
    return operators.find(op => String(op.id) === String(value)) || null;
  }, [value, operators]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOperators = useMemo(() => {
    if (!query.trim()) return operators;
    const qNorm = normalize(query);
    
    return operators
      .filter(op => {
        const nameNorm = normalize(op.name);
        const unitNorm = normalize(op.unit);
        return nameNorm.includes(qNorm) || unitNorm.includes(qNorm);
      })
      .sort((a, b) => {
        const aNorm = normalize(a.name);
        const bNorm = normalize(b.name);
        const aStarts = aNorm.startsWith(qNorm);
        const bStarts = bNorm.startsWith(qNorm);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [operators, query]);

  const handleSelect = (opId) => {
    onChange(opId);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('ALL');
    setQuery('');
    setIsOpen(false);
  };

  const selectedDisplayName = selectedOperator 
    ? `${selectedOperator.name}${selectedOperator.unit && selectedOperator.unit !== 'Sin Asignar' ? ` (${selectedOperator.unit})` : ''}` 
    : `${allLabel} (${operators.length})`;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minWidth: 0 }}>
      {/* Input de búsqueda / selector */}
      <div 
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: 'white',
          border: isOpen ? '1px solid #2563eb' : '1px solid #cbd5e1',
          boxShadow: isOpen ? '0 0 0 2px rgba(37,99,235,0.15)' : 'none',
          borderRadius: isCompact ? '6px' : '8px',
          padding: isCompact ? '2px 6px' : '6px 12px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          height: isCompact ? '26px' : '38px',
          boxSizing: 'border-box'
        }}
      >
        <Search size={isCompact ? 12 : 15} style={{ color: '#94a3b8', flexShrink: 0 }} />
        
        <input 
          ref={inputRef}
          type="text"
          value={isOpen ? query : selectedDisplayName}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setQuery('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
              setQuery('');
            } else if (e.key === 'Enter') {
              if (filteredOperators.length > 0) {
                handleSelect(filteredOperators[0].id);
              }
            }
          }}
          placeholder={isOpen ? (selectedOperator ? selectedOperator.name : placeholder) : placeholder}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: isCompact ? '11px' : '13px',
            color: (isOpen && query) ? '#0f172a' : (selectedOperator ? '#1d4ed8' : '#334155'),
            fontWeight: selectedOperator ? '600' : '500',
            backgroundColor: 'transparent',
            minWidth: 0,
            cursor: 'text',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}
        />

        {/* Botón de limpiar o flecha indicadora */}
        {selectedOperator ? (
          <button 
            type="button"
            onClick={handleClear}
            style={{
              border: 'none',
              background: '#f1f5f9',
              borderRadius: '50%',
              width: isCompact ? '16px' : '20px',
              height: isCompact ? '16px' : '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              padding: 0,
              flexShrink: 0
            }}
            title="Mostrar todos los operadores"
          >
            <X size={isCompact ? 10 : 13} />
          </button>
        ) : (
          <ChevronDown size={isCompact ? 12 : 16} style={{ color: '#94a3b8', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
        )}
      </div>

      {/* Menú flotante desplegable */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          minWidth: isCompact ? '260px' : '100%',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
          maxHeight: '230px',
          overflowY: 'auto',
          zIndex: 1100,
          padding: '4px'
        }}>
          {/* Opción 'Todos los operadores' */}
          <div 
            onClick={() => handleSelect('ALL')}
            style={{
              padding: isCompact ? '5px 8px' : '8px 12px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: isCompact ? '11px' : '13px',
              fontWeight: (!value || value === 'ALL') ? '700' : '500',
              color: (!value || value === 'ALL') ? '#2563eb' : '#334155',
              backgroundColor: (!value || value === 'ALL') ? '#eff6ff' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '2px',
              borderBottom: '1px solid #f1f5f9'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = (!value || value === 'ALL') ? '#eff6ff' : '#f8fafc'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = (!value || value === 'ALL') ? '#eff6ff' : 'transparent'}
          >
            <span>{allLabel} ({operators.length})</span>
            {(!value || value === 'ALL') && <span style={{ fontSize: '10px' }}>✓</span>}
          </div>

          {/* Lista de operadores filtrados */}
          {filteredOperators.length === 0 ? (
            <div style={{ padding: '8px', textAlign: 'center', fontSize: isCompact ? '11px' : '13px', color: '#94a3b8' }}>
              No se encontraron operadores para "{query}"
            </div>
          ) : (
            filteredOperators.map(op => {
              const isSelected = String(value) === String(op.id);
              return (
                <div 
                  key={op.id}
                  onClick={() => handleSelect(op.id)}
                  style={{
                    padding: isCompact ? '5px 8px' : '7px 12px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: isCompact ? '11px' : '13px',
                    fontWeight: isSelected ? '700' : '400',
                    color: isSelected ? '#2563eb' : '#1e293b',
                    backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isSelected ? '#eff6ff' : '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isSelected ? '#eff6ff' : 'transparent'}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {op.name}
                  </span>
                  {op.unit && op.unit !== 'Sin Asignar' && (
                    <span style={{ 
                      fontSize: isCompact ? '9.5px' : '11px', 
                      backgroundColor: isSelected ? '#dbeafe' : '#f1f5f9', 
                      color: isSelected ? '#1e40af' : '#64748b', 
                      padding: '1px 5px', 
                      borderRadius: '4px',
                      flexShrink: 0,
                      fontWeight: '600'
                    }}>
                      {op.unit}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export const MonitoreoView = () => {
  const [activeView, setActiveView] = useState('menu');
  const [selectedLiveTruck, setSelectedLiveTruck] = useState(null);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [panTarget, setPanTarget] = useState(null); // 'menu', 'live', 'history'
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [onlyActiveUnits, setOnlyActiveUnits] = useState(false);
  
  const [locations, setLocations] = useState([]);
  const [history, setHistory] = useState({});
  const [, setTick] = useState(0);
  
  const getLocalDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [dateFilter, setDateFilter] = useState(getLocalDateStr());
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');
  const [operatorFilter, setOperatorFilter] = useState('ALL');

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const fetchLiveLocations = async () => {
      const { data: locData } = await supabase.from('romo_live_tracking').select('*');
      if (locData) setLocations(locData);
    };
    fetchLiveLocations();

    const subscription = supabase
      .channel('romo_live_tracking_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'romo_live_tracking' }, payload => {
        if (!payload.new) return;
        setLocations(current => {
          const index = current.findIndex(loc => String(loc.telegram_id) === String(payload.new.telegram_id));
          if (index !== -1) {
            const updated = [...current];
            updated[index] = payload.new;
            return updated;
          }
          return [...current, payload.new];
        });

        // Actualizar la estela viva en tiempo real si el camión envía nuevas coordenadas
        if (payload.new.latitude && payload.new.longitude) {
          const tid = String(payload.new.telegram_id);
          const newPoint = {
            lat: Number(payload.new.latitude),
            lng: Number(payload.new.longitude),
            time: new Date(payload.new.last_updated || Date.now())
          };
          setHistory(prev => {
            const prevTrips = prev[tid] ? [...prev[tid]] : [];
            if (prevTrips.length === 0) {
              return { ...prev, [tid]: [[newPoint]] };
            }
            const updatedTrips = [...prevTrips];
            const lastTrip = [...updatedTrips[updatedTrips.length - 1]];
            const lastPoint = lastTrip[lastTrip.length - 1];
            if (!lastPoint || (newPoint.time.getTime() - lastPoint.time.getTime() > 30 * 60 * 1000)) {
              updatedTrips.push([newPoint]);
            } else {
              if (lastPoint.lat !== newPoint.lat || lastPoint.lng !== newPoint.lng) {
                lastTrip.push(newPoint);
                updatedTrips[updatedTrips.length - 1] = lastTrip;
              }
            }
            return { ...prev, [tid]: updatedTrips };
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured() || activeView === 'menu') return;

    const fetchHistory = async () => {
      try {
        const startTimestamp = new Date(`${dateFilter}T${startTime}:00`).toISOString();
        const endTimestamp = new Date(`${dateFilter}T${endTime}:59.999`).toISOString();
        
        const { data: histData } = await supabase
          .from('romo_live_tracking_history')
          .select('telegram_id, latitude, longitude, recorded_at')
          .gte('recorded_at', startTimestamp)
          .lte('recorded_at', endTimestamp)
          .order('recorded_at', { ascending: true })
          .limit(50000);

        if (histData) {
          const histGrouped = {};
          const validHistData = histData.filter(r => { const lat = parseFloat(r.latitude); const lng = parseFloat(r.longitude); return lat > 14 && lat < 33 && lng < -86 && lng > -119; });
          validHistData.forEach(row => {
             if (!histGrouped[row.telegram_id]) histGrouped[row.telegram_id] = [];
             histGrouped[row.telegram_id].push({
               lat: row.latitude, 
               lng: row.longitude, 
               time: new Date(row.recorded_at)
             });
          });
          
          // Agrupar en "Rutas/Viajes" si hay una brecha mayor a 30 minutos sin movimiento
          const splitGrouped = {};
          Object.keys(histGrouped).forEach(tid => {
            const points = histGrouped[tid];
            if(points.length === 0) return;
            
            let currentTrip = [points[0]];
            let trips = [currentTrip];
            
            for(let i = 1; i < points.length; i++) {
               const timeDiff = points[i].time.getTime() - points[i-1].time.getTime();
               if (timeDiff > 30 * 60 * 1000) { // 30 minutos
                  currentTrip = [points[i]];
                  trips.push(currentTrip);
               } else {
                  currentTrip.push(points[i]);
               }
            }
            splitGrouped[tid] = trips;
          });
          
          setHistory(splitGrouped);
        } else {
          setHistory({});
        }
      } catch (e) {
        console.error("Error cargando historial", e);
      }
    };
    fetchHistory();
  }, [dateFilter, startTime, endTime, activeView]);

  const validLocations = locations.filter(l => { const lat = parseFloat(l.latitude); const lng = parseFloat(l.longitude); return lat > 14 && lat < 33 && lng < -86 && lng > -119; });

  const [operatorDetails, setOperatorDetails] = useState({});

  useEffect(() => {
    const fetchOperatorData = async (tid) => {
      try {
        const url = `https://script.google.com/macros/s/AKfycbxKf-GrXIkxtEisOMyvPNrxNPgHqWzujf4PtgapjejstWJC4ogaAkQ7IpQDBzn9g0F-yw/exec?source=REGISTRO_BOT&field=TELEGRAM&key=${tid}`;
        const response = await fetch(url);
        const json = await response.json();
        if (json.ok && json.found && json.data) {
          setOperatorDetails(prev => ({
            ...prev,
            [tid]: {
              name: json.data.full_name || json.data.Nombre || 'Desconocido',
              unit: json.data.Flotilla || json.data.Unidad || 'Sin Asignar',
              raw: json.data
            }
          }));
        } else {
          setOperatorDetails(prev => ({
            ...prev,
            [tid]: { name: 'Desconocido', unit: 'Sin Asignar', raw: null }
          }));
        }
      } catch (error) {
        console.error("Error obteniendo datos de Google Sheets para", tid, error);
      }
    };

    const allTids = Array.from(new Set([
      ...validLocations.map(loc => String(loc.telegram_id)),
      ...Object.keys(history).map(String)
    ]));

    allTids.forEach(tid => {
      if (!operatorDetails[tid]) {
        // Para evitar llamadas repetidas mientras se resuelve la promesa, lo marcamos como 'cargando'
        setOperatorDetails(prev => ({ ...prev, [tid]: { name: 'Cargando...', unit: '...', raw: null } }));
        fetchOperatorData(tid);
      }
    });
  }, [validLocations, history, operatorDetails]);

  const uniqueOperators = useMemo(() => {
    const allTids = Array.from(new Set([
      ...validLocations.map(loc => String(loc.telegram_id)),
      ...Object.keys(history).map(String)
    ]));

    return allTids.map(tid => {
      const loc = validLocations.find(l => String(l.telegram_id) === tid);
      const details = operatorDetails[tid] || {};
      
      let name = 'Desconocido';
      if (details.name && details.name !== 'Desconocido' && details.name !== 'Cargando...') {
        name = details.name;
      } else if (loc?.driver_name && !loc.driver_name.includes('http')) {
        name = loc.driver_name;
      } else if (details.name) {
        name = details.name;
      } else {
        name = `Operador ${tid.slice(-4)}`;
      }

      const unit = (details.unit && details.unit !== 'Sin Asignar' && details.unit !== '...') 
        ? details.unit 
        : (loc?.unit_id || '');

      return {
        id: tid,
        name,
        unit,
        raw: details.raw || null
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [validLocations, history, operatorDetails]);

  const activeTrucksCount = useMemo(() => {
    return validLocations.filter(loc => (new Date() - new Date(loc.last_updated)) <= 180000).length;
  }, [validLocations]);

  const liveOperators = useMemo(() => {
    if (!onlyActiveUnits) return uniqueOperators;
    return uniqueOperators.filter(op => {
      const loc = validLocations.find(l => String(l.telegram_id) === String(op.id));
      if (!loc) return false;
      return (new Date() - new Date(loc.last_updated)) <= 180000;
    });
  }, [uniqueOperators, validLocations, onlyActiveUnits]);

  const allDistances = useMemo(() => {
    const list = [];
    Object.entries(history).forEach(([tid, trips]) => {
      const tidStr = String(tid);
      const op = uniqueOperators.find(o => String(o.id) === tidStr);
      const loc = validLocations.find(l => String(l.telegram_id) === tidStr);
      const details = operatorDetails[tidStr] || {};
      
      const operatorName = (details.name && details.name !== 'Desconocido' && details.name !== 'Cargando...') 
        ? details.name 
        : (op?.name && op.name !== 'Desconocido' && op.name !== 'Cargando...'
          ? op.name
          : (loc?.driver_name && !loc.driver_name.includes('http') ? loc.driver_name : `Operador ${tidStr.slice(-4)}`));

      const unitName = (op?.unit && op.unit !== 'Sin Asignar') ? op.unit : (loc?.unit_id || null);
        
      let totalDistance = 0;
      const parsedTrips = trips.map((trip, idx) => {
          const coords = trip.map(p => [Number(p.lat), Number(p.lng)]);
          const distance = getTotalDistance(coords);
          totalDistance += distance;
          return {
             id: `${tidStr}-trip-${idx}`,
             num: idx + 1,
             startTime: trip[0].time,
             endTime: trip[trip.length-1].time,
             distance,
             coords,
             colors: ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#dc2626'][idx % 5]
          };
      });

      list.push({ 
        tid: tidStr, 
        operatorName, 
        unitName, 
        totalDistance, 
        trips: parsedTrips 
      });
    });
    return list;
  }, [history, validLocations, uniqueOperators, operatorDetails]);

  const distances = useMemo(() => {
    if (operatorFilter === 'ALL') return allDistances;
    return allDistances.filter(d => String(d.tid) === String(operatorFilter));
  }, [allDistances, operatorFilter]);

  const lastFitKeyRef = useRef('');

  useEffect(() => {
    if (activeView === 'history' && distances.length > 0) {
      const currentFitKey = `${operatorFilter}_${dateFilter}_${startTime}_${endTime}_${selectedTripId || 'all'}`;
      if (lastFitKeyRef.current !== currentFitKey) {
        lastFitKeyRef.current = currentFitKey;
        let allCoords = [];
        if (selectedTripId) {
          const trip = distances.flatMap(d => d.trips || []).find(t => t.id === selectedTripId);
          if (trip && trip.coords) allCoords = trip.coords;
        } else {
          allCoords = distances.flatMap(d => (d.trips || []).flatMap(t => t.coords));
        }
        if (allCoords.length >= 2) {
          const b = getTripBounds(allCoords);
          if (b) setPanTarget({ bounds: b, ts: Date.now() });
        }
      }
    }
  }, [distances, activeView, operatorFilter, dateFilter, startTime, endTime, selectedTripId]);

  const handleCenterMap = () => {
    let allCoords = [];
    if (selectedTripId) {
      const trip = distances.flatMap(d => d.trips || []).find(t => t.id === selectedTripId);
      if (trip && trip.coords) allCoords = trip.coords;
    } else {
      allCoords = distances.flatMap(d => (d.trips || []).flatMap(t => t.coords));
    }
    if (allCoords.length >= 2) {
      const b = getTripBounds(allCoords);
      if (b) setPanTarget({ bounds: b, ts: Date.now() });
    }
  };


  // ==========================================
  // VISTA DE MENÚ PRINCIPAL
  // ==========================================
  if (activeView === 'menu') {
    return (
      <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', height: 'calc(100dvh - 80px)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', textAlign: 'center' }}>
          Sistema de Rastreo Satelital
        </h1>
        <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '48px', fontSize: '1.1rem' }}>
          Selecciona el submódulo al que deseas ingresar
        </p>

        <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div 
            onClick={() => setActiveView('live')}
            style={{
              flex: '1', minWidth: '300px', maxWidth: '400px', backgroundColor: 'white', borderRadius: '24px', 
              padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', 
              cursor: 'pointer', transition: 'all 0.3s ease', border: '2px solid #e2e8f0', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = '#dc2626'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            <div style={{ backgroundColor: '#fee2e2', padding: '24px', borderRadius: '50%', marginBottom: '24px' }}>
              <Truck size={64} color="#dc2626" />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px' }}>Live Tracking</h2>
            <p style={{ color: '#64748b', textAlign: 'center' }}>
              Monitorea la ubicación de todas tus unidades en ruta en tiempo real.
            </p>
            <div style={{ marginTop: '24px', backgroundColor: '#fee2e2', color: '#dc2626', padding: '6px 16px', borderRadius: '999px', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', animation: 'pulse 2s infinite' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#dc2626', borderRadius: '50%' }}></div>
              REC Live
            </div>
          </div>

          <div 
            onClick={() => setActiveView('history')}
            style={{
              flex: '1', minWidth: '300px', maxWidth: '400px', backgroundColor: 'white', borderRadius: '24px', 
              padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', 
              cursor: 'pointer', transition: 'all 0.3s ease', border: '2px solid #e2e8f0', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = '#2563eb'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            <div style={{ backgroundColor: '#dbeafe', padding: '24px', borderRadius: '50%', marginBottom: '24px' }}>
              <MapPinned size={64} color="#2563eb" />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px' }}>Historial de Rutas</h2>
            <p style={{ color: '#64748b', textAlign: 'center' }}>
              Analiza los trayectos pasados, filtra por fechas y calcula el kilometraje recorrido por unidad.
            </p>
          </div>
        </div>
        <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style>
      </div>
    );
  }

  // ==========================================
  // VISTA DE LIVE TRACKING
  // ==========================================
  if (activeView === 'live') {
    return (
      <div style={{ padding: '16px', minHeight: 'calc(100dvh - 100px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '14px', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveView('menu')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', color: '#475569' }}>
            <ArrowLeft size={18} /> Volver
          </button>
          <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold' }}>Live Tracking</h2>
          <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 12px', borderRadius: '999px', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', animation: 'pulse 2s infinite' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#dc2626', borderRadius: '50%' }}></div>
            REC Live
          </div>

          {/* Botón para alternar solo unidades activas (verdes) */}
          <button
            onClick={() => {
              setOnlyActiveUnits(prev => {
                const nextVal = !prev;
                if (nextVal && selectedLiveTruck) {
                  const activeTruck = validLocations.find(l => String(l.telegram_id) === String(selectedLiveTruck));
                  const isOnline = activeTruck && (new Date() - new Date(activeTruck.last_updated)) <= 180000;
                  if (!isOnline) setSelectedLiveTruck(null);
                }
                return nextVal;
              });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              backgroundColor: onlyActiveUnits ? '#16a34a' : 'white',
              color: onlyActiveUnits ? 'white' : '#1e293b',
              border: onlyActiveUnits ? '1px solid #15803d' : '1px solid #cbd5e1',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              boxShadow: onlyActiveUnits ? '0 2px 6px rgba(22, 163, 74, 0.35)' : '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.15s ease'
            }}
            title={onlyActiveUnits ? 'Mostrando únicamente unidades activas (verdes). Clic para ver todas.' : 'Clic para filtrar y ver únicamente las unidades activas (verdes)'}
          >
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: onlyActiveUnits ? 'white' : '#16a34a',
              boxShadow: onlyActiveUnits ? '0 0 6px white' : '0 0 4px #16a34a'
            }} />
            <span>{onlyActiveUnits ? '✓ Solo unidades activas' : 'Solo ver Unidades activas'}</span>
            <span style={{
              backgroundColor: onlyActiveUnits ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
              color: onlyActiveUnits ? 'white' : '#475569',
              padding: '1px 7px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              {activeTrucksCount}
            </span>
          </button>
            
          <div style={{ display: 'flex', alignItems: 'center', width: '280px' }}>
            <OperatorSearchSelect 
              value={selectedLiveTruck || 'ALL'}
              onChange={(tid) => {
                if (!tid || tid === 'ALL') {
                  setSelectedLiveTruck(null);
                  return;
                }
                setSelectedLiveTruck(String(tid));
                const loc = validLocations.find(l => String(l.telegram_id) === String(tid));
                if (loc) {
                  setPanTarget({ lat: loc.latitude, lng: loc.longitude, ts: Date.now() });
                }
              }}
              operators={liveOperators}
              allLabel={onlyActiveUnits ? `Solo activas (${liveOperators.length})` : "Todos los Operadores"}
              placeholder="Buscar operador en vivo..."
              isCompact={false}
            />
          </div>
          <button onClick={() => setIsFullScreen(true)} style={{ marginLeft: 'auto', padding: '8px 16px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Pantalla Completa
          </button>
        </div>
        
        <div style={isFullScreen ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, backgroundColor: '#f8fafc' } : { height: '600px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', marginTop: '16px', position: 'relative' }}>
          {isFullScreen && (
            <button onClick={() => setIsFullScreen(false)} style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10000, padding: '12px 24px', backgroundColor: 'white', color: '#0f172a', border: '2px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
              Salir de Pantalla Completa
            </button>
          )}

          {/* Tarjeta flotante en la esquina superior izquierda con la información del operador */}
          {selectedLiveTruck && (() => {
            const activeTruck = validLocations.find(l => String(l.telegram_id) === String(selectedLiveTruck));
            const activeOp = uniqueOperators.find(op => String(op.id) === String(selectedLiveTruck)) || (activeTruck ? { unit: activeTruck.unit_id || 'Sin Asignar', name: activeTruck.driver_name || 'Desconocido', raw: null } : null);
            const activeDist = allDistances.find(d => String(d.tid) === String(selectedLiveTruck));
            const totalKmToday = activeDist ? activeDist.totalDistance.toFixed(2) : '0.00';
            const isOnline = activeTruck && (new Date() - new Date(activeTruck.last_updated)) <= 180000;

            if (!activeOp) return null;

            return (
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '60px',
                zIndex: 1000,
                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                border: '1px solid #cbd5e1',
                padding: '16px',
                width: '320px',
                maxWidth: 'calc(100% - 80px)',
                pointerEvents: 'auto'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: isOnline ? '#16a34a' : '#64748b',
                      boxShadow: isOnline ? '0 0 6px #16a34a' : 'none'
                    }} />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                      Unidad: {activeOp.unit}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setSelectedLiveTruck(null)}
                    style={{ 
                      border: 'none', 
                      background: '#f1f5f9', 
                      cursor: 'pointer', 
                      color: '#64748b', 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '14px', 
                      fontWeight: 'bold' 
                    }}
                    title="Cerrar panel"
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#334155' }}>
                  <div><strong style={{ color: '#64748b' }}>Operador:</strong> <span style={{ fontWeight: 600 }}>{activeOp.name}</span></div>
                  {activeOp.raw?.Telefono && <div><strong style={{ color: '#64748b' }}>Teléfono:</strong> {activeOp.raw.Telefono}</div>}
                  {activeOp.raw?.Empresa && <div><strong style={{ color: '#64748b' }}>Empresa:</strong> {activeOp.raw.Empresa}</div>}
                  {activeOp.raw?.status && <div><strong style={{ color: '#64748b' }}>Estatus:</strong> {activeOp.raw.status}</div>}
                  {activeOp.raw?.licenciaConductor && <div><strong style={{ color: '#64748b' }}>Licencia:</strong> {activeOp.raw.licenciaConductor}</div>}
                  
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Recorrido hoy</span>
                      <strong style={{ fontSize: '15px', color: '#2563eb' }}>{totalKmToday} km</strong>
                    </div>
                    {activeTruck && (
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Última señal</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                          {new Date(activeTruck.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          <MapContainer center={[23.6345, -102.5528]} zoom={5} style={{ height: '100%', width: '100%', minHeight: '600px', backgroundColor: '#aad3df' }}>
                <ResizeController isFullScreen={isFullScreen} />
                <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapController panTarget={panTarget} />
                
                {/* Estela del recorrido para el operador seleccionado */}
                {selectedLiveTruck && (() => {
                  const driverData = allDistances.find(d => String(d.tid) === String(selectedLiveTruck));
                  const currentLoc = validLocations.find(l => String(l.telegram_id) === String(selectedLiveTruck));
                  if (!driverData || !driverData.trips || driverData.trips.length === 0) return null;

                  return driverData.trips.map((trip, idx) => {
                    let coords = trip.coords;
                    if (idx === driverData.trips.length - 1 && currentLoc) {
                      const lastPoint = coords[coords.length - 1];
                      if (!lastPoint || (lastPoint[0] !== currentLoc.latitude || lastPoint[1] !== currentLoc.longitude)) {
                        coords = [...coords, [currentLoc.latitude, currentLoc.longitude]];
                      }
                    }
                    if (coords.length < 2) return null;

                    const arrows = getSampledDirectionArrows(coords, '#2563eb', 30);

                    return (
                      <React.Fragment key={`live-hist-group-${trip.id}`}>
                        {/* Contorno exterior para resaltar sobre el mapa */}
                        <Polyline positions={coords} color="#1d4ed8" weight={8} opacity={0.3} smoothFactor={1} />
                        {/* Trazo principal azul vibrante */}
                        <Polyline positions={coords} color="#2563eb" weight={4} opacity={0.9} smoothFactor={1} />

                        {/* Flechitas de sentido de recorrido */}
                        {arrows.map(arr => (
                          <Marker
                            key={arr.key}
                            position={[arr.lat, arr.lng]}
                            icon={createArrowIcon(arr.bearing, '#2563eb')}
                            interactive={false}
                          />
                        ))}

                        {/* Punto A (Inicio del recorrido) */}
                        {coords[0] && (
                          <Marker position={coords[0]} icon={createStartIcon('A')}>
                            <Tooltip permanent={false} direction="top" offset={[0, -12]}>
                              <div style={{ fontSize: '11px', fontWeight: 600 }}>
                                🟢 <strong>Inicio del recorrido</strong><br />
                                {trip.startTime ? `Hora: ${new Date(trip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                              </div>
                            </Tooltip>
                          </Marker>
                        )}
                      </React.Fragment>
                    );
                  });
                })()}
  
                {validLocations
                  .filter(loc => !selectedLiveTruck || String(loc.telegram_id) === String(selectedLiveTruck))
                  .filter(loc => {
                    if (!onlyActiveUnits) return true;
                    return (new Date() - new Date(loc.last_updated)) <= 180000;
                  })
                  .map((loc) => {
                  return (
                    <Marker 
                      key={"live-" + loc.telegram_id} 
                      position={[loc.latitude, loc.longitude]} 
                      icon={getTruckIcon(loc.last_updated)}
                      eventHandlers={{
                        click: () => {
                          const tidStr = String(loc.telegram_id);
                          setSelectedLiveTruck(prev => prev === tidStr ? null : tidStr);
                        },
                        dblclick: () => setPanTarget({ lat: loc.latitude, lng: loc.longitude, ts: Date.now() })
                      }}
                    />
                  );
                })}
            </MapContainer>
        </div>
        <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style>
      </div>
    );
  }

  // ==========================================
  // VISTA DE HISTORIAL DE RUTAS
  // ==========================================
  if (activeView === 'history') {
    return (
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Barra superior compacta en 2 columnas: Izquierda (Título + Filtros) y Derecha (Tablita de Rutas) */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: distances.length > 0 ? 'auto 1fr' : '1fr', 
          gap: '12px', 
          marginBottom: '10px', 
          alignItems: 'stretch' 
        }}>
          
          {/* Columna Izquierda: Botones de navegación y Filtros compactos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '345px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                onClick={() => setActiveView('menu')} 
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#475569', fontSize: '12px', flexShrink: 0 }}
              >
                <ArrowLeft size={14} /> Volver
              </button>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>Historial</h2>
              <button 
                onClick={handleCenterMap} 
                style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 9px', backgroundColor: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '11px', whiteSpace: 'nowrap', flexShrink: 0 }}
                title="Centrar mapa en la ruta actual"
              >
                <Crosshair size={13} style={{ color: '#2563eb' }} /> Centrar
              </button>
              <button 
                onClick={() => setIsFullScreen(true)} 
                style={{ padding: '5px 10px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Pantalla Completa
              </button>
            </div>
            
            {/* Filtros ultra compactos */}
            <div style={{ backgroundColor: '#f8fafc', padding: '6px 8px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontWeight: '600', color: '#475569', fontSize: '11px', width: '50px', flexShrink: 0 }}>Operador:</label>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <OperatorSearchSelect 
                    value={operatorFilter}
                    onChange={(val) => {
                      setOperatorFilter(val);
                      setSelectedTripId(null);
                    }}
                    operators={uniqueOperators}
                    allLabel="Todos los operadores"
                    placeholder="Buscar operador..."
                    isCompact={true}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                <label style={{ fontWeight: '600', color: '#475569', fontSize: '11px', width: '50px', flexShrink: 0 }}>Tiempo:</label>
                <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ padding: '2px 4px', borderRadius: '5px', border: '1px solid #cbd5e1', outline: 'none', cursor: 'pointer', fontSize: '11px', width: '108px' }} />
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ padding: '2px 2px', borderRadius: '5px', border: '1px solid #cbd5e1', outline: 'none', cursor: 'pointer', fontSize: '11px', width: '68px' }} />
                <span style={{ color: '#94a3b8', fontSize: '11px' }}>-</span>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ padding: '2px 2px', borderRadius: '5px', border: '1px solid #cbd5e1', outline: 'none', cursor: 'pointer', fontSize: '11px', width: '68px' }} />
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tablita de viajes arriba a la derecha */}
          {distances.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', minHeight: '85px', paddingBottom: '2px' }}>
              {distances.map(driver => (
                <div key={driver.tid} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', flex: '0 0 auto', minWidth: '260px', maxWidth: '300px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '5px 8px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                    <strong 
                      style={{ 
                        fontSize: '11.5px', 
                        color: '#0f172a', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        maxWidth: '160px'
                      }} 
                      title={driver.operatorName}
                    >
                      {driver.operatorName}
                    </strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{ fontWeight: 'bold', color: '#2563eb', fontSize: '11px', whiteSpace: 'nowrap' }}>
                        {driver.totalDistance.toFixed(2)} km
                      </span>
                      {selectedTripId && (
                        <button 
                          onClick={() => setSelectedTripId(null)}
                          style={{
                            padding: '1px 5px',
                            fontSize: '9.5px',
                            fontWeight: 'bold',
                            backgroundColor: '#e0e7ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          👁️ Todas
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Desglose de viajes */}
                  <div style={{ padding: '2px 8px', overflowY: 'auto', maxHeight: '68px' }}>
                    <table style={{ width: '100%', fontSize: '10.5px', borderCollapse: 'collapse' }}>
                      <tbody>
                        {driver.trips.map(trip => {
                          const isSelected = selectedTripId === trip.id;
                          return (
                            <tr 
                              key={trip.id} 
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedTripId(null);
                                } else {
                                  setSelectedTripId(trip.id);
                                  const b = getTripBounds(trip.coords);
                                  if (b) setPanTarget({ bounds: b, ts: Date.now() });
                                }
                              }}
                              style={{ 
                                borderBottom: '1px solid #f1f5f9',
                                backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                                cursor: 'pointer'
                              }}
                            >
                              <td style={{ padding: '2px 2px', width: '20px' }}>
                                <span style={{ 
                                  backgroundColor: trip.colors, 
                                  color: 'white', 
                                  padding: '1px 4px', 
                                  borderRadius: '3px', 
                                  fontSize: '9.5px', 
                                  fontWeight: 'bold',
                                  boxShadow: isSelected ? '0 0 0 2px #2563eb' : 'none'
                                }}>
                                  #{trip.num}
                                </span>
                              </td>
                              <td style={{ padding: '2px 4px', fontSize: '10px', fontWeight: isSelected ? '600' : '400', whiteSpace: 'nowrap' }}>
                                {trip.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {trip.endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </td>
                              <td style={{ padding: '2px 4px', textAlign: 'right', fontWeight: '600', color: isSelected ? '#2563eb' : '#0f172a', fontSize: '10px', whiteSpace: 'nowrap' }}>
                                {trip.distance.toFixed(2)} km
                              </td>
                              <td style={{ padding: '2px 2px', textAlign: 'right', width: '54px' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isSelected) {
                                      setSelectedTripId(null);
                                    } else {
                                      setSelectedTripId(trip.id);
                                      const b = getTripBounds(trip.coords);
                                      if (b) setPanTarget({ bounds: b, ts: Date.now() });
                                    }
                                  }}
                                  style={{
                                    padding: '1px 5px',
                                    fontSize: '9px',
                                    fontWeight: '600',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    border: '1px solid',
                                    backgroundColor: isSelected ? '#2563eb' : '#ffffff',
                                    color: isSelected ? '#ffffff' : '#475569',
                                    borderColor: isSelected ? '#1d4ed8' : '#cbd5e1',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {isSelected ? '✓ Activa' : 'Solo esta'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Contenedor del Mapa - Elevado con máximo espacio visual */}
        <div style={isFullScreen ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, backgroundColor: '#f8fafc' } : { height: 'calc(100vh - 200px)', minHeight: '620px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', position: 'relative' }}>
          {isFullScreen && (
            <button onClick={() => setIsFullScreen(false)} style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10000, padding: '12px 24px', backgroundColor: 'white', color: '#0f172a', border: '2px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
              Salir de Pantalla Completa
            </button>
          )}
          <MapContainer center={[23.6345, -102.5528]} zoom={5} style={{ height: '100%', width: '100%', minHeight: '620px', backgroundColor: '#aad3df' }}>
              <ResizeController isFullScreen={isFullScreen} />
              <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapController panTarget={panTarget} />
            
            {distances.flatMap(driver => driver.trips || []).map(trip => {
              if (selectedTripId && trip.id !== selectedTripId) return null;
              if (!trip.coords || trip.coords.length < 2) return null;
              const isSelected = selectedTripId === trip.id;
              const tripColor = trip.colors || '#2563eb';
              const shouldRenderArrows = (operatorFilter !== 'ALL' || Boolean(selectedTripId));
              const arrows = shouldRenderArrows ? getSampledDirectionArrows(trip.coords, tripColor, 30) : [];

              return (
                <React.Fragment key={`hist-group-${trip.id}`}>
                  {isSelected && (
                    <Polyline 
                      positions={trip.coords} 
                      color="#1e293b" 
                      weight={8} 
                      opacity={0.3} 
                      smoothFactor={1} 
                    />
                  )}
                  <Polyline 
                    key={`hist-line-${trip.id}`} 
                    positions={trip.coords} 
                    color={tripColor} 
                    weight={isSelected ? 5 : 4} 
                    opacity={0.85} 
                    smoothFactor={1} 
                  />

                  {/* Flechitas indicadoras de dirección del recorrido */}
                  {arrows.map(arr => (
                    <Marker
                      key={arr.key}
                      position={[arr.lat, arr.lng]}
                      icon={createArrowIcon(arr.bearing, tripColor)}
                      interactive={false}
                    />
                  ))}

                  {/* Punto de Inicio (A) */}
                  {trip.coords[0] && (
                    <Marker position={trip.coords[0]} icon={createStartIcon(trip.num > 1 ? `A${trip.num}` : 'A')}>
                      <Tooltip permanent={false} direction="top" offset={[0, -12]}>
                        <div style={{ fontSize: '11px', fontWeight: 600 }}>
                          🟢 <strong>Inicio - Viaje #{trip.num}</strong><br />
                          {trip.startTime ? `Salida: ${new Date(trip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                        </div>
                      </Tooltip>
                    </Marker>
                  )}

                  {/* Punto de Fin / Llegada (B) */}
                  {trip.coords[trip.coords.length - 1] && (
                    <Marker position={trip.coords[trip.coords.length - 1]} icon={createEndIcon(trip.num > 1 ? `B${trip.num}` : 'B')}>
                      <Tooltip permanent={false} direction="top" offset={[0, -12]}>
                        <div style={{ fontSize: '11px', fontWeight: 600 }}>
                          🔴 <strong>Fin - Viaje #{trip.num}</strong><br />
                          {trip.endTime ? `Llegada: ${new Date(trip.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}<br />
                          Distancia: {trip.distance.toFixed(2)} km
                        </div>
                      </Tooltip>
                    </Marker>
                  )}
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>
      </div>
    );
  }

  return null;
};














