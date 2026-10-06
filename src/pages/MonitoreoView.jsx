import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Truck, MapPinned, ArrowLeft } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const truckSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`;

const getTruckIcon = (last_updated) => {
  const isOffline = (new Date() - new Date(last_updated)) > 180000; 
  const bgColor = isOffline ? '#64748b' : '#16a34a'; 
  
  return new L.divIcon({
    className: 'custom-truck-icon',
    html: `<div style="background-color: ${bgColor}; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.4); border: 3px solid white; padding: 4px; transition: all 0.3s;">${truckSvg}</div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
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


const MapController = ({ panTarget }) => {
  const map = useMap();
  React.useEffect(() => {
    if (panTarget) {
      map.flyTo([panTarget.lat, panTarget.lng], 15, { duration: 1.5 });
    }
  }, [panTarget, map]);
  return null;
};

export const MonitoreoView = () => {
  const [activeView, setActiveView] = useState('menu');
  const [selectedLiveTruck, setSelectedLiveTruck] = useState(null);
  const [panTarget, setPanTarget] = useState(null); // 'menu', 'live', 'history'
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const [locations, setLocations] = useState([]);
  const [history, setHistory] = useState({});
  const [, setTick] = useState(0);
  
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [dateFilter, setDateFilter] = useState(todayDateStr);
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
        setLocations(current => {
          const index = current.findIndex(loc => loc.telegram_id === payload.new.telegram_id);
          if (index !== -1) {
            const updated = [...current];
            updated[index] = payload.new;
            return updated;
          }
          return [...current, payload.new];
        });
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

    validLocations.forEach(loc => {
      if (!operatorDetails[loc.telegram_id]) {
        // Para evitar llamadas repetidas mientras se resuelve la promesa, lo marcamos como 'cargando'
        setOperatorDetails(prev => ({ ...prev, [loc.telegram_id]: { name: 'Cargando...', unit: '...', raw: null } }));
        fetchOperatorData(loc.telegram_id);
      }
    });
  }, [validLocations, operatorDetails]);

  const uniqueOperators = useMemo(() => {
    return Array.from(new Set(validLocations.map(loc => loc.telegram_id))).map(tid => {
      const loc = validLocations.find(l => l.telegram_id === tid);
      const details = operatorDetails[tid] || {};
      return {
        id: tid,
        // Priorizamos lo que viene de Google Sheets, si no hay, intentamos lo de la base de datos
        name: (details.name !== 'Desconocido' && details.name !== 'Cargando...') ? details.name : (loc.driver_name || details.name || 'Desconocido'),
        unit: (details.unit !== 'Sin Asignar' && details.unit !== '...') ? details.unit : (loc.unit_id || details.unit || 'Sin Asignar'),
        raw: details.raw || null
      };
    });
  }, [locations, operatorDetails]);

  const distances = useMemo(() => {
    const list = [];
    Object.entries(history).forEach(([tid, trips]) => {
      if (operatorFilter !== 'ALL' && operatorFilter !== tid) return;

      const unit = validLocations.find(loc => loc.telegram_id === tid);
      const unitName = unit ? (unit.unit_id || 'Sin Asignar') : 'Desconocida';
        
        let totalDistance = 0;
      const parsedTrips = trips.map((trip, idx) => {
          const coords = trip.map(p => [p.lat, p.lng]);
          const distance = getTotalDistance(coords);
          totalDistance += distance;
          return {
             id: `${tid}-trip-${idx}`,
             num: idx + 1,
             startTime: trip[0].time,
             endTime: trip[trip.length-1].time,
             distance,
             coords,
             colors: ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#9333ea'][idx % 5] // Colores distintos para cada tramo
          };
      });

      list.push({ tid, unitName, totalDistance, trips: parsedTrips });
    });
    return list;
  }, [history, locations, operatorFilter]);


  // ==========================================
  // VISTA DE MENÃƒÅ¡ PRINCIPAL
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
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '24px' }}>
          <button onClick={() => setActiveView('menu')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', color: '#475569' }}>
            <ArrowLeft size={18} /> Volver
          </button>
          <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold' }}>Live Tracking</h2>
                      <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 12px', borderRadius: '999px', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', animation: 'pulse 2s infinite' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#dc2626', borderRadius: '50%' }}></div>
              REC Live
            </div>
            
            <div style={{ marginLeft: '16px', display: 'flex', alignItems: 'center' }}>
              <select 
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', cursor: 'pointer', backgroundColor: 'white', fontSize: '14px', fontWeight: '500', minWidth: '250px' }}
                value={selectedLiveTruck || ''}
                onChange={(e) => {
                  const tid = e.target.value;
                  if (!tid) {
                    setSelectedLiveTruck(null);
                    return;
                  }
                  setSelectedLiveTruck(tid);
                  const loc = validLocations.find(l => l.telegram_id === tid);
                  if (loc) {
                    setPanTarget({ lat: loc.latitude, lng: loc.longitude, ts: Date.now() });
                  }
                }}
              >
                <option value="">-- Todos los Operadores --</option>
                {uniqueOperators.map(op => (
                  <option key={op.id} value={op.id}>{op.unit} - {op.name}</option>
                ))}
              </select>
            </div>
          <button onClick={() => setIsFullScreen(true)} style={{ marginLeft: 'auto', padding: '8px 16px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Pantalla Completa
          </button>
        </div>
        
        <div style={isFullScreen ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', zIndex: 9999, backgroundColor: '#f8fafc' } : { height: '600px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', marginTop: '16px' }}>
          {isFullScreen && (
            <button onClick={() => setIsFullScreen(false)} style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10000, padding: '12px 24px', backgroundColor: 'white', color: '#0f172a', border: '2px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
              Salir de Pantalla Completa
            </button>
          )}
          <MapContainer center={[23.6345, -102.5528]} zoom={5} style={{ height: '100%', width: '100%', backgroundColor: '#aad3df' }}>
                <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapController panTarget={panTarget} />
                
                {distances.map(driver => {
                   if (!selectedLiveTruck) return null; // SOLO MOSTRAR SI HAY SELECCIONADO
                   if (selectedLiveTruck && driver.tid !== selectedLiveTruck) return null;
                   return driver.trips.map(trip => (
                     <Polyline key={"live-hist-line-" + trip.id} positions={trip.coords} color={trip.colors} weight={4} opacity={0.6} smoothFactor={1} dashArray="8, 8" />
                   ));
                })}
  
                {validLocations.filter(loc => !selectedLiveTruck || loc.telegram_id === selectedLiveTruck).map((loc) => {
                  // Buscar los detalles enriquecidos (Google Sheets) en uniqueOperators
                  const operatorData = uniqueOperators.find(op => op.id === loc.telegram_id) || { unit: loc.unit_id || 'Sin Asignar', name: loc.driver_name || 'Desconocido' };
                  
                  return (
                    <Marker 
                      key={"live-" + loc.telegram_id} 
                      position={[loc.latitude, loc.longitude]} 
                      icon={getTruckIcon(loc.last_updated)}
                      eventHandlers={{
                        click: () => setSelectedLiveTruck(loc.telegram_id === selectedLiveTruck ? null : loc.telegram_id),
                        dblclick: () => setPanTarget({ lat: loc.latitude, lng: loc.longitude, ts: Date.now() })
                      }}
                    >
                      <Popup>
                        <div style={{ minWidth: '200px' }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                            Unidad: <strong>{operatorData.unit}</strong>
                          </h3>
                          <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
                            <div><strong>Operador:</strong> {operatorData.name}</div>
                            {operatorData.raw?.Telefono && <div><strong>Teléfono:</strong> {operatorData.raw.Telefono}</div>}
                            {operatorData.raw?.Empresa && <div><strong>Empresa:</strong> {operatorData.raw.Empresa}</div>}
                            {operatorData.raw?.status && <div><strong>Estatus:</strong> {operatorData.raw.status}</div>}
                            {operatorData.raw?.licenciaConductor && <div><strong>Licencia:</strong> {operatorData.raw.licenciaConductor}</div>}
                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0', color: '#64748b', fontSize: '11px' }}>
                              Actualizado: {new Date(loc.last_updated).toLocaleTimeString()}
                              <br/><em>Doble click al icono para acercar</em>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
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
      <div style={{ padding: '16px', minHeight: 'calc(100dvh - 100px)', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <button onClick={() => setActiveView('menu')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', color: '#475569' }}>
                <ArrowLeft size={18} /> Volver
              </button>
              <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold' }}>Historial de Rutas</h2>
              <button onClick={() => setIsFullScreen(true)} style={{ padding: '8px 16px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Pantalla Completa
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontWeight: '500', color: '#475569', fontSize: '14px' }}>Operador:</label>
              <select value={operatorFilter} onChange={(e) => setOperatorFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', cursor: 'pointer', backgroundColor: 'white', fontSize: '14px' }}>
                <option value="ALL">Todos los operadores</option>
                {uniqueOperators.map(op => (
                  <option key={op.id} value={op.id}>{op.name} ({op.unit})</option>
                ))}
              </select>
            </div>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontWeight: '500', color: '#475569', fontSize: '14px' }}>Tiempo:</label>
              <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', cursor: 'pointer', fontSize: '14px' }} />
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', cursor: 'pointer', fontSize: '14px' }} />
              <span style={{ color: '#64748b', fontSize: '14px' }}>a</span>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', cursor: 'pointer', fontSize: '14px' }} />
            </div>
          </div>
        </div>

        {/* Tablita de Rutas si hay un operador seleccionado o un resumen */}
        {distances.length > 0 && (
          <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
            {distances.map(driver => (
              <div key={driver.tid} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', minWidth: '350px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '16px' }}>{driver.unitName}</strong>
                  <span style={{ fontWeight: 'bold', color: '#0f172a' }}>Total: {driver.totalDistance.toFixed(2)} km</span>
                </div>
                
                {/* Desglose de viajes (si es ALL solo muestra total, si es uno, muestra tabla) */}
                {(operatorFilter !== 'ALL' || distances.length === 1) && (
                  <div style={{ padding: '12px 16px' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b' }}>Se detectaron {driver.trips.length} viajes distintos hoy:</p>
                    <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ paddingBottom: '4px' }}>#</th>
                          <th style={{ paddingBottom: '4px' }}>Inicio</th>
                          <th style={{ paddingBottom: '4px' }}>Fin</th>
                          <th style={{ paddingBottom: '4px', textAlign: 'right' }}>Distancia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {driver.trips.map(trip => (
                          <tr key={trip.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '6px 0' }}>
                              <span style={{ backgroundColor: trip.colors, color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{trip.num}</span>
                            </td>
                            <td style={{ padding: '6px 0' }}>{trip.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                            <td style={{ padding: '6px 0' }}>{trip.endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                            <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '500' }}>{trip.distance.toFixed(2)} km</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div style={isFullScreen ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', zIndex: 9999, backgroundColor: '#f8fafc' } : { height: '600px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', marginTop: '16px' }}>
          {isFullScreen && (
            <button onClick={() => setIsFullScreen(false)} style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10000, padding: '12px 24px', backgroundColor: 'white', color: '#0f172a', border: '2px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
              Salir de Pantalla Completa
            </button>
          )}
          <MapContainer center={[23.6345, -102.5528]} zoom={5} style={{ height: '100%', width: '100%', backgroundColor: '#aad3df' }}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            {distances.map(driver => (
               driver.trips.map(trip => (
                 <Polyline key={`hist-line-${trip.id}`} positions={trip.coords} color={trip.colors} weight={4} opacity={0.8} smoothFactor={1} />
               ))
            ))}
          </MapContainer>
        </div>
      </div>
    );
  }

  return null;
};














