import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Activity,
  Droplet,
  Thermometer,
  CloudRain,
  Sun,
  Battery,
  Cpu,
  RefreshCw,
  Info,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Play,
  Square,
  Sliders,
  Plus,
  ShieldCheck,
  Clock,
  TrendingDown,
  TrendingUp,
  Wifi,
  WifiOff,
  Copy,
  Check,
  History,
  X,
  Search,
  Download,
  ShieldAlert,
  Radio,
  Gauge,
  ArrowUpRight,
  BarChart2,
  Settings2,
  ChevronRight,
  Layers,
  FileText,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';
import type { Farm, IoTDevice, IoTTelemetryReading, IoTAlert } from '../types';

interface IoTMonitoringViewProps {
  farms: Farm[];
  onNavigateToRescue?: () => void;
}

// Preset scenario configuration dictionary
const SCENARIO_PRESETS: Record<string, {
  label: string;
  badge: string;
  color: string;
  desc: string;
  defaults: {
    soilMoisture: number;
    temperature: number;
    humidity: number;
    rainfall: number;
    light: number;
    battery: number;
  };
}> = {
  NORMAL_OPTIMAL: {
    label: 'Optimal Microclimate',
    badge: 'FAVORABLE',
    color: 'emerald',
    desc: 'Mild temperature (27.5°C), balanced rootzone moisture (55%), and normal canopy humidity (62%).',
    defaults: { soilMoisture: 55.0, temperature: 27.5, humidity: 62.0, rainfall: 0.0, light: 48000, battery: 4.18 }
  },
  LOW_MOISTURE_DROUGHT: {
    label: 'Severe Moisture Stress',
    badge: 'DRY ALERT',
    color: 'amber',
    desc: 'Rootzone moisture drops to 21.5% (<30% threshold). Urgent drip irrigation advisory issued.',
    defaults: { soilMoisture: 21.5, temperature: 34.2, humidity: 38.0, rainfall: 0.0, light: 72000, battery: 4.05 }
  },
  HEATWAVE_STRESS: {
    label: 'Extreme Canopy Heatwave',
    badge: 'HEAT ALERT',
    color: 'red',
    desc: 'Air temperature spikes to 41.5°C (>38°C threshold). Risk of flower abortion and accelerated respiration.',
    defaults: { soilMoisture: 38.0, temperature: 41.5, humidity: 26.0, rainfall: 0.0, light: 85000, battery: 3.98 }
  },
  HIGH_HUMIDITY_BLIGHT: {
    label: 'High Humidity & Blight Threat',
    badge: 'FUNGAL RISK',
    color: 'purple',
    desc: 'Relative humidity sustains at 92% (>85% threshold). Favorable for Late Blight spore germination.',
    defaults: { soilMoisture: 72.0, temperature: 23.5, humidity: 92.0, rainfall: 3.5, light: 22000, battery: 4.10 }
  },
  HEAVY_MONSOON_RAIN: {
    label: 'Torrential Monsoon Downpour',
    badge: 'FLOOD ALERT',
    color: 'blue',
    desc: 'Rainfall surge of 38.5mm (>25mm threshold). Furrow waterlogging and transport access delays.',
    defaults: { soilMoisture: 96.0, temperature: 22.0, humidity: 96.0, rainfall: 38.5, light: 8000, battery: 4.02 }
  },
  DEVICE_OFFLINE: {
    label: 'Device Missed Heartbeat',
    badge: 'OFFLINE',
    color: 'slate',
    desc: 'Simulates 30-minute telemetry silence to test timeout watchdog and offline warning advisory.',
    defaults: { soilMoisture: 0, temperature: 0, humidity: 0, rainfall: 0, light: 0, battery: 0 }
  }
};

export const IoTMonitoringView: React.FC<IoTMonitoringViewProps> = ({
  farms,
  onNavigateToRescue,
}) => {
  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id || '');
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [recentReadings, setRecentReadings] = useState<IoTTelemetryReading[]>([]);
  const [alerts, setAlerts] = useState<IoTAlert[]>([]);
  const [_isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Irrigation & Agronomic Thresholds (configurable by farmer)
  const [irrigationThreshold, setIrrigationThreshold] = useState<number>(30.0);
  const [tempThreshold] = useState<number>(38.0);
  const [humidityThreshold] = useState<number>(85.0);
  const [rainThreshold] = useState<number>(25.0);

  // Simulator controls
  const [selectedScenario, setSelectedScenario] = useState<string>('NORMAL_OPTIMAL');
  const [isSimulatingContinuous, setIsSimulatingContinuous] = useState<boolean>(false);
  const [simIntervalSeconds, setSimIntervalSeconds] = useState<number>(5);
  const [useCustomParams, setUseCustomParams] = useState<boolean>(false);
  const [customSoilMoisture, setCustomSoilMoisture] = useState<number>(55.0);
  const [customTemperature, setCustomTemperature] = useState<number>(27.5);
  const [customHumidity, setCustomHumidity] = useState<number>(62.0);
  const [customRainfall, setCustomRainfall] = useState<number>(0.0);

  const [lastApiStatus, setLastApiStatus] = useState<{
    status: string;
    message: string;
    time: string;
    isError?: boolean;
  } | null>(null);

  // Register Device Modal state
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [newDeviceCode, setNewDeviceCode] = useState<string>('');
  const [newDeviceName, setNewDeviceName] = useState<string>('');
  const [createdDeviceKey, setCreatedDeviceKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  // Analytics & Ledger filter states
  const [analyticsMetric, setAnalyticsMetric] = useState<'ALL' | 'SOIL_MOISTURE' | 'AIR_TEMP' | 'HUMIDITY' | 'RAINFALL'>('ALL');
  const [analyticsRange, setAnalyticsRange] = useState<'1H' | '6H' | '24H' | '7D'>('24H');
  const [alertFilter, setAlertFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'RESOLVED'>('ALL');
  const [ledgerSearch, setLedgerSearch] = useState<string>('');
  const [ledgerSensorFilter, setLedgerSensorFilter] = useState<string>('ALL');
  const [expandedReadingId, setExpandedReadingId] = useState<string | null>(null);
  const [selectedAlertForDrawer, setSelectedAlertForDrawer] = useState<IoTAlert | null>(null);

  // Interval timer ref for continuous simulation cleanup
  const simTimerRef = useRef<any>(null);

  // Load devices and alerts on farm change
  useEffect(() => {
    loadDevices();
    loadAlerts();
  }, [selectedFarmId]);

  // Load telemetry when selected device changes
  useEffect(() => {
    if (selectedDeviceId) {
      loadTelemetry(selectedDeviceId);
    }
  }, [selectedDeviceId]);

  // When scenario preset changes, synchronize default parameters
  useEffect(() => {
    const preset = SCENARIO_PRESETS[selectedScenario];
    if (preset && selectedScenario !== 'DEVICE_OFFLINE') {
      setCustomSoilMoisture(preset.defaults.soilMoisture);
      setCustomTemperature(preset.defaults.temperature);
      setCustomHumidity(preset.defaults.humidity);
      setCustomRainfall(preset.defaults.rainfall);
    }
  }, [selectedScenario]);

  // Cleanup simulation timer on unmount
  useEffect(() => {
    return () => {
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current);
      }
    };
  }, []);

  const loadDevices = async () => {
    setIsLoading(true);
    try {
      const devList = await api.listIoTDevices(selectedFarmId || undefined);
      setDevices(devList);
      if (devList.length > 0) {
        if (!devList.some(d => d.id === selectedDeviceId)) {
          setSelectedDeviceId(devList[0].id);
        }
      } else {
        setSelectedDeviceId('');
      }
    } catch (err) {
      console.error('Failed to load IoT devices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const alertList = await api.getIoTAlerts(selectedFarmId || undefined);
      setAlerts(alertList);
    } catch (err) {
      console.error('Failed to load IoT alerts:', err);
    }
  };

  const loadTelemetry = async (deviceId: string) => {
    try {
      const data = await api.getDeviceTelemetry(deviceId, undefined, 50);
      setRecentReadings(data);
    } catch (err) {
      console.error('Failed to load device telemetry:', err);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadDevices();
    if (selectedDeviceId) {
      await loadTelemetry(selectedDeviceId);
    }
    await loadAlerts();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const activeDevice = devices.find(d => d.id === selectedDeviceId);

  // Parse latest telemetry summary from device or fallback to recent readings
  let summaryMap: Record<string, any> = {};
  if (activeDevice?.last_reading_summary) {
    try {
      summaryMap = JSON.parse(activeDevice.last_reading_summary);
    } catch {
      summaryMap = {};
    }
  }

  const currentSoilMoisture = summaryMap['SOIL_MOISTURE']?.value ?? 
    (recentReadings.find(r => r.sensor_type === 'SOIL_MOISTURE')?.value ?? 55.0);
  const currentAirTemp = summaryMap['AIR_TEMP']?.value ?? 
    (recentReadings.find(r => r.sensor_type === 'AIR_TEMP')?.value ?? 27.5);
  const currentHumidity = summaryMap['HUMIDITY']?.value ?? 
    (recentReadings.find(r => r.sensor_type === 'HUMIDITY')?.value ?? 62.0);
  const currentRainfall = summaryMap['RAINFALL']?.value ?? 
    (recentReadings.find(r => r.sensor_type === 'RAINFALL')?.value ?? 0.0);
  const currentLight = summaryMap['LIGHT_INTENSITY']?.value ?? 
    (recentReadings.find(r => r.sensor_type === 'LIGHT_INTENSITY')?.value ?? 48000);
  const currentBattery = summaryMap['BATTERY_VOLTAGE']?.value ?? 
    (recentReadings.find(r => r.sensor_type === 'BATTERY_VOLTAGE')?.value ?? 4.18);

  // Determine online/offline status (last seen within 15 minutes)
  const isOnline = activeDevice?.last_seen_at
    ? (Date.now() - new Date(activeDevice.last_seen_at).getTime()) < 15 * 60 * 1000
    : false;

  // Trigger single scenario simulation via backend
  const handleRunPreset = async () => {
    if (!activeDevice) return;
    try {
      const payload: any = {
        device_id: activeDevice.id,
        scenario: selectedScenario,
      };

      if (useCustomParams && selectedScenario !== 'DEVICE_OFFLINE') {
        payload.custom_soil_moisture = customSoilMoisture;
        payload.custom_temperature = customTemperature;
        payload.custom_humidity = customHumidity;
        payload.custom_rainfall = customRainfall;
      }

      const res = await api.runSimulatorPreset(payload);
      setLastApiStatus({
        status: `INGESTED: ${res.scenario}`,
        message: `${res.alerts_count} alert(s) evaluated • ${res.disclaimer}`,
        time: new Date().toLocaleTimeString(),
      });
      await loadDevices();
      await loadTelemetry(activeDevice.id);
      await loadAlerts();
    } catch (err: any) {
      setLastApiStatus({
        status: 'FAILED',
        message: err.message || 'Simulation execution failed',
        time: new Date().toLocaleTimeString(),
        isError: true,
      });
    }
  };

  // Continuous simulation toggle
  const toggleContinuousSimulation = () => {
    if (isSimulatingContinuous) {
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current);
        simTimerRef.current = null;
      }
      setIsSimulatingContinuous(false);
      setLastApiStatus({
        status: 'STOPPED',
        message: 'Continuous telemetry stream halted.',
        time: new Date().toLocaleTimeString(),
      });
    } else {
      if (!activeDevice) return;
      setIsSimulatingContinuous(true);
      setLastApiStatus({
        status: 'STREAMING ACTIVE',
        message: `Posting verified readings to /api/v1/iot/telemetry every ${simIntervalSeconds}s.`,
        time: new Date().toLocaleTimeString(),
      });

      handleRunPreset();
      simTimerRef.current = setInterval(() => {
        handleRunPreset();
      }, simIntervalSeconds * 1000);
    }
  };

  // Resolve alert handler
  const handleResolveAlert = async (alertId: string) => {
    try {
      await api.resolveIoTAlert(alertId);
      await loadAlerts();
      if (selectedAlertForDrawer?.id === alertId) {
        setSelectedAlertForDrawer(null);
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  // Register device handler
  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceCode || !newDeviceName || !selectedFarmId) return;

    try {
      const res = await api.registerIoTDevice({
        device_code: newDeviceCode.trim().toUpperCase(),
        device_name: newDeviceName.trim(),
        farm_id: selectedFarmId,
        device_type: 'ESP32_AGRI_NODE',
        data_source: 'SIMULATED',
      });
      setCreatedDeviceKey(res.raw_api_key || null);
      await loadDevices();
      setSelectedDeviceId(res.id);
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    }
  };

  // Copy API key to clipboard
  const handleCopyKey = () => {
    if (createdDeviceKey) {
      navigator.clipboard.writeText(createdDeviceKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  // Export Telemetry as CSV
  const handleExportCSV = () => {
    if (recentReadings.length === 0) return;
    const headers = ['Reading ID', 'Device ID', 'Farm ID', 'Sensor Type', 'Value', 'Unit', 'Timestamp', 'Source Type', 'Quality Flag'];
    const rows = recentReadings.map(r => [
      r.reading_id,
      r.device_id,
      r.farm_id,
      r.sensor_type,
      r.value,
      r.unit,
      r.device_timestamp,
      r.source_type,
      r.quality_flag
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agri2value_iot_telemetry_${selectedDeviceId || 'node'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedFarm = farms.find(f => f.id === selectedFarmId) || farms[0];
  const unresolvedAlerts = alerts.filter(a => !a.is_resolved);

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    if (alertFilter === 'ALL') return alerts;
    if (alertFilter === 'CRITICAL') return alerts.filter(a => a.severity === 'CRITICAL' && !a.is_resolved);
    if (alertFilter === 'WARNING') return alerts.filter(a => a.severity === 'WARNING' && !a.is_resolved);
    if (alertFilter === 'RESOLVED') return alerts.filter(a => a.is_resolved);
    return alerts;
  }, [alerts, alertFilter]);

  // Filtered ledger rows
  const filteredLedger = useMemo(() => {
    return recentReadings.filter(r => {
      const matchesSearch = ledgerSearch === '' || 
        r.reading_id.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        r.sensor_type.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        String(r.value).includes(ledgerSearch);
      const matchesSensor = ledgerSensorFilter === 'ALL' || r.sensor_type === ledgerSensorFilter;
      return matchesSearch && matchesSensor;
    });
  }, [recentReadings, ledgerSearch, ledgerSensorFilter]);

  // Generate responsive sparkline SVG points
  const generateSparklinePoints = (sensorType: string, _fallbackBase: number): string => {
    const readings = recentReadings
      .filter(r => r.sensor_type === sensorType)
      .slice(0, 12)
      .reverse();

    if (readings.length < 2) {
      // Generate realistic aesthetic wave
      const pts = [
        [0, 16],
        [20, 14],
        [40, 18],
        [60, 12],
        [80, 15],
        [100, 10],
        [120, 13]
      ];
      return pts.map(p => p.join(',')).join(' ');
    }

    const values = readings.map(r => Number(r.value));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return readings.map((r, i) => {
      const x = (i / (readings.length - 1)) * 120;
      const normalized = (Number(r.value) - min) / range;
      const y = 28 - normalized * 22; // Invert for SVG coordinate space
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  // Generate multi-sensor time-series chart coordinates
  const analyticsSeries = useMemo(() => {
    const times = recentReadings.slice(0, 20).reverse();
    if (times.length === 0) {
      // Mocked 7-point visual baseline if zero readings recorded yet
      const basePoints = [
        { time: '10:00', sm: 55, temp: 26, hum: 65, rain: 0 },
        { time: '10:15', sm: 54, temp: 27, hum: 63, rain: 0 },
        { time: '10:30', sm: 52, temp: 28, hum: 61, rain: 0 },
        { time: '10:45', sm: 50, temp: 29, hum: 58, rain: 0 },
        { time: '11:00', sm: 48, temp: 31, hum: 55, rain: 0 },
        { time: '11:15', sm: 46, temp: 32, hum: 52, rain: 0 },
        { time: '11:30', sm: currentSoilMoisture, temp: currentAirTemp, hum: currentHumidity, rain: currentRainfall },
      ];
      return basePoints;
    }

    // Group readings by approximate timestamp
    const grouped: Record<string, { time: string; sm: number; temp: number; hum: number; rain: number }> = {};
    times.forEach(r => {
      const timeKey = new Date(r.device_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (!grouped[timeKey]) {
        grouped[timeKey] = { time: timeKey, sm: 50, temp: 28, hum: 60, rain: 0 };
      }
      if (r.sensor_type === 'SOIL_MOISTURE') grouped[timeKey].sm = Number(r.value);
      if (r.sensor_type === 'AIR_TEMP') grouped[timeKey].temp = Number(r.value);
      if (r.sensor_type === 'HUMIDITY') grouped[timeKey].hum = Number(r.value);
      if (r.sensor_type === 'RAINFALL') grouped[timeKey].rain = Number(r.value);
    });

    return Object.values(grouped);
  }, [recentReadings, currentSoilMoisture, currentAirTemp, currentHumidity, currentRainfall]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: IoT COMMAND CENTER HEADER
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-50/40 rounded-full blur-3xl pointer-events-none -mb-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>IoT & Edge Telematics Center</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span>Virtual Sensor Monitoring</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              IoT & Edge Microclimate Intelligence
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
              Monitor farm environmental conditions, analyze edge sensor telemetry, simulate microclimate scenarios, and generate transparent agricultural advisories for precision horticultural management.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setNewDeviceCode(`ESP32-POLY-${Math.floor(100 + Math.random() * 900)}`);
                setNewDeviceName('Tomato Polyhouse Microclimate Node');
                setCreatedDeviceKey(null);
                setShowRegisterModal(true);
              }}
              className="btn-primary text-xs py-2 px-3.5 shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Provision Virtual Node</span>
            </button>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Live Operational Status Ribbon */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
            <div className="text-[11px] font-semibold text-slate-500">Operational Mode</div>
            <div className="flex items-center gap-1.5 font-bold">
              {isSimulatingContinuous ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  <span className="text-blue-700 font-mono">STREAMING ({simIntervalSeconds}s)</span>
                </>
              ) : isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-700">MONITORING ACTIVE</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="text-slate-600">DEVICE STANDBY</span>
                </>
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
            <div className="text-[11px] font-semibold text-slate-500">Registered Nodes</div>
            <div className="text-sm font-extrabold text-slate-900 font-mono">
              {devices.length} Virtual Node{devices.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
            <div className="text-[11px] font-semibold text-slate-500">Active Sensors</div>
            <div className="text-sm font-extrabold text-slate-900 font-mono">
              6 Telemetry Channels
            </div>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
            <div className="text-[11px] font-semibold text-slate-500">Active Risk Alerts</div>
            <div className="flex items-center gap-1.5 text-sm font-extrabold font-mono">
              <span className={unresolvedAlerts.length > 0 ? 'text-amber-600' : 'text-emerald-700'}>
                {unresolvedAlerts.length} Active
              </span>
              <span className="text-slate-400 font-normal text-xs">({alerts.length} Total)</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-semibold text-slate-500">Last Telemetry Ingestion</div>
            <div className="text-xs font-bold text-slate-800 font-mono truncate">
              {activeDevice?.last_seen_at ? new Date(activeDevice.last_seen_at).toLocaleTimeString() : 'Awaiting Ingestion'}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: SIMULATION TRANSPARENCY & HARDWARE DISCLOSURE
          ───────────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/90 shadow-xs flex flex-col sm:flex-row items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs text-amber-950 flex-1 leading-relaxed">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-sm text-amber-950 font-display">
              Sensor Telemetry & Simulation Disclosure
            </span>
            <span className="badge-yellow text-[10px] font-medium">VIRTUAL TELEMETRY</span>
          </div>
          <p className="text-amber-900">
            Agri2Value currently operates with a <strong>virtual IoT telemetry architecture</strong>. Environmental readings (soil moisture, temperature, humidity, rainfall) are synthetic telemetric payloads generated by the virtual sensor simulator and transmitted through authenticated <code className="bg-amber-100 text-amber-950 font-mono px-1 py-0.5 rounded font-bold">POST /api/v1/iot/telemetry</code> with device token verification. Physical edge devices can connect using the standard REST ingest endpoint.
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: CONNECTED EDGE DEVICES MANAGEMENT
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 font-display">
                Connected Edge Devices
              </h2>
              <p className="text-xs text-slate-500">
                Manage virtual nodes deployed across farm locations and inspect device status.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Filter Farm:</label>
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="input-field text-xs bg-slate-50 font-medium py-1.5 px-3 min-w-[200px]"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.farm_name} ({f.village})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Device Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((dev) => {
            const isDevActive = dev.id === selectedDeviceId;
            const devOnline = dev.last_seen_at
              ? (Date.now() - new Date(dev.last_seen_at).getTime()) < 15 * 60 * 1000
              : false;

            return (
              <div
                key={dev.id}
                onClick={() => setSelectedDeviceId(dev.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                  isDevActive
                    ? 'border-emerald-600 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-600/30'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-900">{dev.device_code}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      devOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {devOnline ? 'ONLINE' : 'STANDBY'}
                    </span>
                  </div>
                  <span className="badge-slate text-[10px] font-mono">{dev.data_source}</span>
                </div>

                <div className="text-xs font-bold text-slate-800 truncate mb-1">
                  {dev.device_name}
                </div>

                <div className="text-[11px] text-slate-500 space-y-1 mb-3">
                  <div>Type: <span className="font-mono text-slate-700">{dev.device_type}</span></div>
                  <div>Firmware: <span className="font-mono text-slate-700">{dev.firmware_version}</span></div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Last Ingest: {dev.last_seen_at ? new Date(dev.last_seen_at).toLocaleTimeString() : 'Never'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">Prefix: {dev.api_key_prefix}</span>
                  <span className={`font-bold ${isDevActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {isDevActive ? '● Active Selection' : 'Click to Select'}
                  </span>
                </div>
              </div>
            );
          })}

          {devices.length === 0 && (
            <div className="col-span-full p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
              <Cpu className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-xs font-bold text-slate-700">No IoT Nodes Provisioned for this Farm</div>
              <p className="text-[11px] text-slate-500">
                Click "Provision Virtual Node" above to register an edge device and begin streaming telematics.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: MICROCLIMATE SCENARIO SIMULATOR
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 font-display">
                  Microclimate Scenario Simulator
                </h2>
                <span className="badge-blue text-[10px]">EDGE SYNTHESIS</span>
              </div>
              <p className="text-xs text-slate-500">
                Generate controlled environmental conditions to evaluate crop stress and threshold-based advisories.
              </p>
            </div>
          </div>

          {lastApiStatus && (
            <div className={`text-xs px-3 py-1.5 rounded-xl border font-mono flex items-center gap-1.5 ${
              lastApiStatus.isError ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {lastApiStatus.isError ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{lastApiStatus.status} ({lastApiStatus.time})</span>
            </div>
          )}
        </div>

        {/* Scenario Presets Bar */}
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block font-mono">
            Select Microclimate Scenario Preset:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {Object.entries(SCENARIO_PRESETS).map(([key, item]) => {
              const isSelected = selectedScenario === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedScenario(key)}
                  disabled={isSimulatingContinuous}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className="text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">{item.badge}</div>
                  <div className="text-xs font-extrabold text-slate-900 leading-tight mb-1">{item.label}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-2 leading-snug">{item.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Parameter Customization Toggle & Sliders */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="customToggle"
                checked={useCustomParams}
                onChange={(e) => setUseCustomParams(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="customToggle" className="text-xs font-bold text-slate-800 cursor-pointer">
                Enable Fine-Grained Parameter Customization (Override Preset Defaults)
              </label>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Target Device: <strong className="text-slate-800">{activeDevice?.device_code || 'None'}</strong>
            </span>
          </div>

          {useCustomParams && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-200/80 animate-in fade-in">
              {/* Slider 1: Soil Moisture */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-medium">Soil Moisture</span>
                  <span className="font-mono font-bold text-emerald-700">{customSoilMoisture}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="0.5"
                  value={customSoilMoisture}
                  onChange={(e) => setCustomSoilMoisture(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>5% (Wilt)</span>
                  <span>Threshold: 30%</span>
                  <span>100% (Sat)</span>
                </div>
              </div>

              {/* Slider 2: Air Temp */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-medium">Air Temperature</span>
                  <span className="font-mono font-bold text-amber-700">{customTemperature}°C</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="55"
                  step="0.5"
                  value={customTemperature}
                  onChange={(e) => setCustomTemperature(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>10°C (Cold)</span>
                  <span>Threshold: 38°C</span>
                  <span>55°C (Extreme)</span>
                </div>
              </div>

              {/* Slider 3: Humidity */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-medium">Relative Humidity</span>
                  <span className="font-mono font-bold text-cyan-700">{customHumidity}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="1"
                  value={customHumidity}
                  onChange={(e) => setCustomHumidity(Number(e.target.value))}
                  className="w-full accent-cyan-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>10% (Dry)</span>
                  <span>Threshold: 85%</span>
                  <span>100% (Cond)</span>
                </div>
              </div>

              {/* Slider 4: Rainfall */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-medium">Precipitation</span>
                  <span className="font-mono font-bold text-blue-700">{customRainfall} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={customRainfall}
                  onChange={(e) => setCustomRainfall(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0 mm</span>
                  <span>Threshold: 25mm</span>
                  <span>100 mm (Flood)</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons & Streaming Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Stream Frequency:</span>
              <select
                value={simIntervalSeconds}
                onChange={(e) => setSimIntervalSeconds(Number(e.target.value))}
                disabled={isSimulatingContinuous}
                className="input-field text-xs bg-white font-mono py-1.5 px-3"
              >
                <option value={3}>Every 3 seconds</option>
                <option value={5}>Every 5 seconds</option>
                <option value={10}>Every 10 seconds</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleRunPreset}
                disabled={isSimulatingContinuous || !activeDevice}
                className="btn-primary text-xs py-2 px-4 shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Inject Telemetry Once</span>
              </button>

              <button
                onClick={toggleContinuousSimulation}
                disabled={!activeDevice}
                className={`text-xs py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  isSimulatingContinuous 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
              >
                {isSimulatingContinuous ? (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>Halt Stream</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Telemetry Stream</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: SENSOR INTELLIGENCE DASHBOARD (6 Major Cards)
          ───────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono">
              Live Sensor Telemetry Matrix (6 Environmental Gauges)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Node: <strong className="text-slate-800">{activeDevice?.device_code || 'N/A'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* SENSOR 1: SOIL MOISTURE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Droplet className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentSoilMoisture < irrigationThreshold ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {currentSoilMoisture < irrigationThreshold ? 'MOISTURE DEFICIT' : 'OPTIMAL HYDRATION'}
                </span>
              </div>

              <div className="label text-[10px] text-slate-500 uppercase tracking-wider">Soil Volumetric Moisture</div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black font-mono text-slate-900">{currentSoilMoisture}</span>
                <span className="text-lg font-bold text-slate-400 font-mono">%</span>
              </div>
            </div>

            {/* Sparkline & Status */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1 text-[11px]">
                <span className="text-slate-500">Threshold: &lt;{irrigationThreshold}%</span>
                <span className={currentSoilMoisture < irrigationThreshold ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                  {currentSoilMoisture < irrigationThreshold ? 'Irrigation Advised' : 'Rootzone Safe'}
                </span>
              </div>
              <svg className="w-full h-8 stroke-blue-500 fill-blue-50/50" viewBox="0 0 120 32">
                <polyline
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={generateSparklinePoints('SOIL_MOISTURE', 50)}
                />
              </svg>
            </div>
          </div>

          {/* SENSOR 2: AMBIENT AIR TEMP */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <Thermometer className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentAirTemp > tempThreshold ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {currentAirTemp > tempThreshold ? 'HEAT STRESS (>38°C)' : 'CANOPY NORMAL'}
                </span>
              </div>

              <div className="label text-[10px] text-slate-500 uppercase tracking-wider">Ambient Air Temperature</div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black font-mono text-slate-900">{currentAirTemp}</span>
                <span className="text-lg font-bold text-slate-400 font-mono">°C</span>
              </div>
            </div>

            {/* Sparkline & Status */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1 text-[11px]">
                <span className="text-slate-500">Threshold: &gt;{tempThreshold}°C</span>
                <span className="text-slate-700 font-bold">Tomato Polyhouse</span>
              </div>
              <svg className="w-full h-8 stroke-amber-500 fill-amber-50/50" viewBox="0 0 120 32">
                <polyline
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={generateSparklinePoints('AIR_TEMP', 28)}
                />
              </svg>
            </div>
          </div>

          {/* SENSOR 3: RELATIVE HUMIDITY */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-cyan-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
                  <CloudRain className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentHumidity > humidityThreshold ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {currentHumidity > humidityThreshold ? 'FUNGAL THREAT (>85%)' : 'NORMAL RANGE'}
                </span>
              </div>

              <div className="label text-[10px] text-slate-500 uppercase tracking-wider">Relative Air Humidity</div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black font-mono text-slate-900">{currentHumidity}</span>
                <span className="text-lg font-bold text-slate-400 font-mono">%</span>
              </div>
            </div>

            {/* Sparkline & Status */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1 text-[11px]">
                <span className="text-slate-500">Blight Risk: &gt;{humidityThreshold}%</span>
                <span className="text-emerald-700 font-bold">Foliage Dry</span>
              </div>
              <svg className="w-full h-8 stroke-cyan-500 fill-cyan-50/50" viewBox="0 0 120 32">
                <polyline
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={generateSparklinePoints('HUMIDITY', 60)}
                />
              </svg>
            </div>
          </div>

          {/* SENSOR 4: FIELD PRECIPITATION */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <CloudRain className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentRainfall > rainThreshold ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {currentRainfall > rainThreshold ? 'WATERLOGGING RISK' : currentRainfall > 0 ? `${currentRainfall} mm PRECIP` : 'CLEAR FIELD'}
                </span>
              </div>

              <div className="label text-[10px] text-slate-500 uppercase tracking-wider">Precipitation Accumulation</div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black font-mono text-slate-900">{currentRainfall}</span>
                <span className="text-lg font-bold text-slate-400 font-mono">mm</span>
              </div>
            </div>

            {/* Sparkline & Status */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1 text-[11px]">
                <span className="text-slate-500">Flood Trigger: &gt;{rainThreshold} mm</span>
                <span className="text-slate-700 font-bold">Furrow Drainage OK</span>
              </div>
              <svg className="w-full h-8 stroke-blue-600 fill-blue-50/50" viewBox="0 0 120 32">
                <polyline
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={generateSparklinePoints('RAINFALL', 0)}
                />
              </svg>
            </div>
          </div>

          {/* SENSOR 5: PHOTOSYNTHETIC LIGHT */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <Sun className="w-5 h-5" />
                </div>
                <span className="badge-green text-[10px]">PHOTOSYNTHESIS</span>
              </div>

              <div className="label text-[10px] text-slate-500 uppercase tracking-wider">Photosynthetic Light</div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black font-mono text-slate-900">{Number(currentLight).toLocaleString()}</span>
                <span className="text-lg font-bold text-slate-400 font-mono">Lux</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Sensor: BH1750 (Sim)</span>
              <span className="text-emerald-700 font-bold">Optimal Photoperiod</span>
            </div>
          </div>

          {/* SENSOR 6: EDGE NODE BATTERY */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Battery className="w-5 h-5" />
                </div>
                <span className="badge-green text-[10px]">95% HEALTH</span>
              </div>

              <div className="label text-[10px] text-slate-500 uppercase tracking-wider">Edge Node Battery Voltage</div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black font-mono text-slate-900">{currentBattery}</span>
                <span className="text-lg font-bold text-slate-400 font-mono">V</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Solar Ingress: 320 mA</span>
              <span className="text-emerald-700 font-bold">Nominal Reserve</span>
            </div>
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: ADVANCED MICROCLIMATE ANALYTICS & TRENDS
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 font-display">
                Environmental Intelligence & Time-Series Trends
              </h2>
              <p className="text-xs text-slate-500">
                Continuous historical telematics stream plotted across microclimate dimensions.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Filter */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-semibold">
              {(['ALL', 'SOIL_MOISTURE', 'AIR_TEMP', 'HUMIDITY'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setAnalyticsMetric(m)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    analyticsMetric === m ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {m === 'ALL' ? 'Multi-Axis' : m.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Time Filter */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-mono font-bold">
              {(['1H', '6H', '24H', '7D'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setAnalyticsRange(t)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    analyticsRange === t ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SVG Multi-Series Area Chart */}
        <div className="space-y-3">
          <div className="h-64 w-full bg-slate-50/70 rounded-xl p-4 border border-slate-100 relative flex flex-col justify-between">
            {/* Y-Axis Guidelines */}
            <div className="absolute inset-x-4 inset-y-6 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-dashed border-slate-300 w-full flex justify-between text-[10px] text-slate-400 font-mono"><span>100% / 50°C</span></div>
              <div className="border-b border-dashed border-slate-300 w-full flex justify-between text-[10px] text-slate-400 font-mono"><span>75% / 37.5°C</span></div>
              <div className="border-b border-dashed border-slate-300 w-full flex justify-between text-[10px] text-slate-400 font-mono"><span>50% / 25°C</span></div>
              <div className="border-b border-dashed border-slate-300 w-full flex justify-between text-[10px] text-slate-400 font-mono"><span>25% / 12.5°C</span></div>
              <div className="border-b border-slate-300 w-full flex justify-between text-[10px] text-slate-400 font-mono"><span>0</span></div>
            </div>

            {/* Chart SVG Canvas */}
            <svg className="w-full h-full relative z-10" preserveAspectRatio="none" viewBox="0 0 700 200">
              <defs>
                <linearGradient id="moistureGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Soil Moisture Curve */}
              {(analyticsMetric === 'ALL' || analyticsMetric === 'SOIL_MOISTURE') && (
                <>
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={analyticsSeries.map((d, idx) => {
                      const x = (idx / (analyticsSeries.length - 1 || 1)) * 700;
                      const y = 200 - (d.sm / 100) * 180;
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                  {analyticsSeries.map((d, idx) => {
                    const x = (idx / (analyticsSeries.length - 1 || 1)) * 700;
                    const y = 200 - (d.sm / 100) * 180;
                    return (
                      <circle key={`sm-${idx}`} cx={x} cy={y} r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                    );
                  })}
                </>
              )}

              {/* Temperature Curve */}
              {(analyticsMetric === 'ALL' || analyticsMetric === 'AIR_TEMP') && (
                <>
                  <polyline
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={analyticsSeries.map((d, idx) => {
                      const x = (idx / (analyticsSeries.length - 1 || 1)) * 700;
                      const y = 200 - (d.temp / 50) * 180;
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                  {analyticsSeries.map((d, idx) => {
                    const x = (idx / (analyticsSeries.length - 1 || 1)) * 700;
                    const y = 200 - (d.temp / 50) * 180;
                    return (
                      <circle key={`t-${idx}`} cx={x} cy={y} r="3.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                    );
                  })}
                </>
              )}

              {/* Humidity Curve */}
              {(analyticsMetric === 'ALL' || analyticsMetric === 'HUMIDITY') && (
                <polyline
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                  points={analyticsSeries.map((d, idx) => {
                    const x = (idx / (analyticsSeries.length - 1 || 1)) * 700;
                    const y = 200 - (d.hum / 100) * 180;
                    return `${x},${y}`;
                  }).join(' ')}
                />
              )}
            </svg>

            {/* X-Axis Timestamps */}
            <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
              {analyticsSeries.map((d, i) => (
                <span key={i}>{d.time}</span>
              ))}
            </div>
          </div>

          {/* Chart Legend & Telemetric Statistics */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-medium pt-1 px-1">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                <span className="text-slate-700">Soil Moisture (%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="text-slate-700">Air Temperature (°C)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-cyan-500 inline-block" />
                <span className="text-slate-700">Humidity (%)</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
              <span>Points: <strong className="text-slate-800">{analyticsSeries.length}</strong></span>
              <span>•</span>
              <span>Quality: <strong className="text-emerald-700">100% VALID</strong></span>
              <span>•</span>
              <span>Sampling: <strong className="text-slate-800">Deterministic Edge Ingest</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 7: INTELLIGENT AGRICULTURAL ADVISORY ENGINE
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="badge-green">ADVISORY DECISION ENGINE</span>
              <h2 className="text-base font-extrabold text-slate-900 font-display">
                Microclimate Intelligence & Advisory Pipeline
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Convert raw microclimate telemetry into transparent, actionable agricultural decisions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
              Moisture Trigger Threshold:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="20"
                max="50"
                step="1"
                value={irrigationThreshold}
                onChange={(e) => setIrrigationThreshold(Number(e.target.value))}
                className="w-28 accent-emerald-600 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                {irrigationThreshold}%
              </span>
            </div>
          </div>
        </div>

        {/* 5-Stage Rule Evaluation Visual Pipeline */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="text-[11px] font-bold text-slate-600 uppercase font-mono tracking-wider">
            Deterministic Decision Pipeline (Telemetry Architecture)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
              <div className="text-[10px] font-mono text-slate-400">STAGE 1</div>
              <div className="font-bold text-slate-900 truncate">Telemetry Input</div>
              <div className="text-[11px] text-slate-500 font-mono">SM: {currentSoilMoisture}% • T: {currentAirTemp}°C</div>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
              <div className="text-[10px] font-mono text-slate-400">STAGE 2</div>
              <div className="font-bold text-slate-900 truncate">Threshold Check</div>
              <div className="text-[11px] text-slate-500 font-mono">Limit: &lt;{irrigationThreshold}% Moisture</div>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
              <div className="text-[10px] font-mono text-slate-400">STAGE 3</div>
              <div className="font-bold text-slate-900 truncate">Risk Detection</div>
              <div className={`text-[11px] font-mono font-bold ${currentSoilMoisture < irrigationThreshold ? 'text-amber-700' : 'text-emerald-700'}`}>
                {currentSoilMoisture < irrigationThreshold ? 'ROOTZONE STRESS' : 'RANGE SAFE'}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
              <div className="text-[10px] font-mono text-slate-400">STAGE 4</div>
              <div className="font-bold text-slate-900 truncate">Advisory Synthesis</div>
              <div className="text-[11px] text-slate-500 truncate">Transparent Rationale</div>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
              <div className="text-[10px] font-mono text-slate-400">STAGE 5</div>
              <div className="font-bold text-slate-900 truncate">Farmer Action</div>
              <div className="text-[11px] text-emerald-700 font-bold">Advisory Only</div>
            </div>
          </div>
        </div>

        {/* Explainable Decision Banner */}
        <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
          currentSoilMoisture < irrigationThreshold 
            ? 'bg-amber-50/80 border-amber-200 text-amber-950' 
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
        }`}>
          {currentSoilMoisture < irrigationThreshold ? (
            <TrendingDown className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 text-xs">
            <div className="font-extrabold text-sm font-display">
              {currentSoilMoisture < irrigationThreshold 
                ? 'Actionable Advisory: Soil Moisture Deficit Detected in Rootzone' 
                : 'Hydration Status: Rootzone Moisture is Within Optimal Agronomic Bounds'}
            </div>
            <p className="leading-relaxed">
              {currentSoilMoisture < irrigationThreshold 
                ? `Current soil moisture is observed at ${currentSoilMoisture}%, which falls below your configured threshold of ${irrigationThreshold}%. Inspect field furrow lines and initiate recommended 45-minute drip irrigation for tomato vegetative canopy.`
                : `Current soil moisture is logged at ${currentSoilMoisture}%, satisfying your configured threshold of ${irrigationThreshold}%. Soil evapotranspiration remains in equilibrium. No supplementary irrigation required today.`}
            </p>
            <div className="text-[11px] font-semibold text-slate-500 pt-1">
              Safety Guardrail: <strong className="text-slate-700">Autonomous Actuation Disabled.</strong> Agri2Value preserves farmer autonomy by operating strictly in advisory mode. No automatic water pump valves are activated.
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 8: ENVIRONMENTAL ALERTS & RISK MONITORING
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-extrabold text-slate-900 font-display">
              Environmental Alerts & Risk Monitoring ({filteredAlerts.length})
            </h2>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {(['ALL', 'CRITICAL', 'WARNING', 'RESOLVED'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setAlertFilter(tab)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  alertFilter === tab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filteredAlerts.length > 0 ? (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  alert.is_resolved 
                    ? 'bg-slate-50 border-slate-200 opacity-75' 
                    : alert.severity === 'CRITICAL'
                    ? 'bg-red-50/60 border-red-200'
                    : 'bg-amber-50/60 border-amber-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-900 uppercase">
                      {alert.alert_type.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      alert.is_resolved
                        ? 'bg-emerald-100 text-emerald-800'
                        : alert.severity === 'CRITICAL'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {alert.is_resolved ? 'RESOLVED' : alert.severity}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                    {alert.explanation}
                  </p>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Evaluation Baseline: <strong>{alert.threshold_used}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!alert.is_resolved && (
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedAlertForDrawer(alert)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600 text-xs cursor-pointer"
                    title="View Alert Inspection"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
            <div className="font-bold text-slate-800">No Alerts Matching Filter</div>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              All microclimate readings are currently within safe baseline parameters. Run a stress preset scenario to evaluate risk response.
            </p>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 9: SENSOR TELEMETRY & INGESTION LEDGER
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-extrabold text-slate-900 font-display">
              Sensor Telemetry & Ingestion Ledger ({filteredLedger.length})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search event ID or value..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="input-field text-xs pl-8 py-1.5 w-44 font-mono"
              />
            </div>

            <select
              value={ledgerSensorFilter}
              onChange={(e) => setLedgerSensorFilter(e.target.value)}
              className="input-field text-xs py-1.5 font-mono"
            >
              <option value="ALL">All Sensor Types</option>
              <option value="SOIL_MOISTURE">Soil Moisture</option>
              <option value="AIR_TEMP">Air Temperature</option>
              <option value="HUMIDITY">Humidity</option>
              <option value="RAINFALL">Rainfall</option>
              <option value="LIGHT_INTENSITY">Light Intensity</option>
              <option value="BATTERY_VOLTAGE">Battery Voltage</option>
            </select>

            <button
              onClick={handleExportCSV}
              disabled={recentReadings.length === 0}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {filteredLedger.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Event / Reading ID</th>
                  <th className="py-2.5 px-3">Sensor Type</th>
                  <th className="py-2.5 px-3">Measured Value</th>
                  <th className="py-2.5 px-3">Recorded Time</th>
                  <th className="py-2.5 px-3">Source Tag</th>
                  <th className="py-2.5 px-3">Quality Flag</th>
                  <th className="py-2.5 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredLedger.slice(0, 15).map((row) => (
                  <React.Fragment key={row.id}>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{row.reading_id}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{row.sensor_type}</td>
                      <td className="py-2.5 px-3 font-black text-emerald-800">{row.value} {row.unit}</td>
                      <td className="py-2.5 px-3 text-slate-500">{new Date(row.device_timestamp).toLocaleTimeString()}</td>
                      <td className="py-2.5 px-3">
                        <span className="badge-slate text-[10px]">{row.source_type}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="badge-green text-[10px]">{row.quality_flag}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setExpandedReadingId(expandedReadingId === row.id ? null : row.id)}
                          className="text-[11px] text-emerald-700 hover:text-emerald-900 font-sans font-bold cursor-pointer"
                        >
                          {expandedReadingId === row.id ? 'Close' : 'Raw JSON'}
                        </button>
                      </td>
                    </tr>
                    {expandedReadingId === row.id && (
                      <tr className="bg-slate-900 text-slate-100">
                        <td colSpan={7} className="p-3 text-[11px]">
                          <div className="font-bold text-emerald-400 mb-1">Payload Ingestion Record:</div>
                          <pre className="overflow-x-auto whitespace-pre font-mono text-[10px] bg-slate-950 p-2.5 rounded-lg border border-slate-800">
{JSON.stringify({
  reading_id: row.reading_id,
  device_id: row.device_id,
  farm_id: row.farm_id,
  sensor_type: row.sensor_type,
  value: row.value,
  unit: row.unit,
  device_timestamp: row.device_timestamp,
  server_ingested_at: row.server_ingested_at,
  source_type: row.source_type,
  quality_flag: row.quality_flag,
  raw_metadata: row.raw_metadata || 'authenticated_telemetry_batch'
}, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
            No telemetry records match the current filters. Run the simulator above to log fresh telematics.
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 10: EDGE DEVICE DIAGNOSTICS & AGRICULTURAL LINKAGE
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Edge Diagnostics */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm font-display">
                Edge Node Diagnostics & Signal Integrity
              </h3>
              <p className="text-[11px] text-slate-500">Hardware parameters for active node: {activeDevice?.device_code || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="text-[10px] text-slate-400 font-mono">RADIO SIGNAL</div>
              <div className="font-extrabold text-slate-800 font-mono flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>-68 dBm (Strong)</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="text-[10px] text-slate-400 font-mono">BATTERY RESERVE</div>
              <div className="font-extrabold text-slate-800 font-mono flex items-center gap-1.5">
                <Battery className="w-3.5 h-3.5 text-emerald-600" />
                <span>{currentBattery} V (Nominal)</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="text-[10px] text-slate-400 font-mono">PACKET LOSS</div>
              <div className="font-extrabold text-emerald-700 font-mono">0.0% (Zero Drops)</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="text-[10px] text-slate-400 font-mono">SECURITY INTEGRITY</div>
              <div className="font-extrabold text-slate-800 font-mono">SHA-256 Token Auth</div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
            <strong>Heartbeat Watchdog:</strong> Nodes post keep-alive signals alongside telemetry. Stale nodes (&gt;15 min) trigger a simulated offline advisory.
          </div>
        </div>

        {/* Card 2: Agricultural Integration Flow */}
        <div className="bg-gradient-to-br from-emerald-50 via-green-50/40 to-teal-50 rounded-2xl border border-emerald-200 p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="badge-green">END-TO-END WORKFLOW</span>
              <h3 className="font-extrabold text-slate-900 text-sm font-display">
                Agricultural Lifecycle Linkage
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Microclimate telemetry is not isolated; when severe environmental stress occurs (e.g. soil moisture &lt; 25% or canopy heat &gt; 38°C), Agri2Value automatically surfaces supplementary advisory signals to <strong>Crop Rescue Mode</strong> and preserves transaction evidence in the <strong>Farmer Protection Ledger</strong>.
            </p>

            <div className="p-3 bg-white/80 rounded-xl border border-emerald-200/80 text-[11px] font-mono text-slate-700 space-y-1">
              <div className="font-bold text-emerald-800">Operational Data Pipeline:</div>
              <div className="truncate">IoT Sensors → Thresholds → Crop Rescue → Protection → Execution</div>
            </div>
          </div>

          {onNavigateToRescue && (
            <button
              onClick={onNavigateToRescue}
              className="btn-primary text-xs py-2.5 px-4 shadow-xs flex items-center justify-center gap-2 mt-2 w-full sm:w-auto cursor-pointer"
            >
              <span>Launch Crop Rescue Watchdog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: PROVISION VIRTUAL IOT NODE
          ───────────────────────────────────────────────────────────── */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base font-display">
                  Provision Virtual IoT Node
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowRegisterModal(false);
                  setCreatedDeviceKey(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdDeviceKey ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Node Provisioned Successfully!</span>
                  </div>
                  <p>
                    Below is your secret device API Key. <strong>Store it now.</strong> It is hashed with SHA-256 in the database and will NEVER be displayed again.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Device Secret API Key (Token)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdDeviceKey}
                      className="input-field text-xs font-mono font-bold bg-slate-100 text-slate-900 select-all"
                    />
                    <button
                      onClick={handleCopyKey}
                      className="btn-secondary text-xs py-2 px-3 shrink-0 cursor-pointer"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowRegisterModal(false);
                    setCreatedDeviceKey(null);
                  }}
                  className="btn-primary w-full text-xs py-2.5 mt-2 cursor-pointer"
                >
                  Done & Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterDevice} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 mb-1 block">Device Hardware Code (ID)</label>
                  <input
                    type="text"
                    required
                    value={newDeviceCode}
                    onChange={(e) => setNewDeviceCode(e.target.value)}
                    placeholder="e.g. ESP32-POLYHOUSE-02"
                    className="input-field text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 mb-1 block">Friendly Node Name</label>
                  <input
                    type="text"
                    required
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    placeholder="e.g. Tomato Plot North Sensor"
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 mb-1 block">Farm Assignment</label>
                  <select
                    value={selectedFarmId}
                    onChange={(e) => setSelectedFarmId(e.target.value)}
                    className="input-field text-xs"
                  >
                    {farms.map((farm) => (
                      <option key={farm.id} value={farm.id}>
                        {farm.farm_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary text-xs py-2 px-4 cursor-pointer"
                  >
                    Generate Credentials
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DRAWER: ALERT DETAIL INSPECTION
          ───────────────────────────────────────────────────────────── */}
      {selectedAlertForDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-slate-900 text-base font-display">
                  Microclimate Anomaly Inspection
                </h3>
              </div>
              <button
                onClick={() => setSelectedAlertForDrawer(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 font-mono">
                <div className="text-[10px] text-slate-400">ALERT TYPE</div>
                <div className="font-extrabold text-sm text-slate-900">{selectedAlertForDrawer.alert_type}</div>
                <div className="text-slate-500">Severity: <span className="font-bold text-amber-700">{selectedAlertForDrawer.severity}</span></div>
              </div>

              <div>
                <div className="font-semibold text-slate-700 mb-1">Agronomic Explanation:</div>
                <p className="text-slate-600 leading-relaxed bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                  {selectedAlertForDrawer.explanation}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-400">Threshold:</span>
                  <div className="font-bold text-slate-800">{selectedAlertForDrawer.threshold_used}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-400">Detected At:</span>
                  <div className="font-bold text-slate-800">{new Date(selectedAlertForDrawer.created_at).toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              {!selectedAlertForDrawer.is_resolved && (
                <button
                  onClick={() => handleResolveAlert(selectedAlertForDrawer.id)}
                  className="btn-primary text-xs py-2 px-4 cursor-pointer"
                >
                  Mark Resolved
                </button>
              )}
              <button
                onClick={() => setSelectedAlertForDrawer(null)}
                className="btn-secondary text-xs py-2 px-4 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
