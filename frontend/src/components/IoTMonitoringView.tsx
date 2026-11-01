import React, { useState, useEffect, useRef } from 'react';
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
  Wifi,
  WifiOff,
  Copy,
  Check,
  History,
  X
} from 'lucide-react';
import { api } from '../api';
import type { Farm, IoTDevice, IoTTelemetryReading, IoTAlert } from '../types';

interface IoTMonitoringViewProps {
  farms: Farm[];
  onNavigateToRescue?: () => void;
}

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

  // Irrigation threshold configuration (configurable by farmer)
  const [irrigationThreshold, setIrrigationThreshold] = useState<number>(30.0);

  // Simulator controls
  const [selectedScenario, setSelectedScenario] = useState<string>('NORMAL_OPTIMAL');
  const [isSimulatingContinuous, setIsSimulatingContinuous] = useState<boolean>(false);
  const [simIntervalSeconds, setSimIntervalSeconds] = useState<number>(5);
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
      const data = await api.getDeviceTelemetry(deviceId, undefined, 30);
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
    (recentReadings.find(r => r.sensor_type === 'SOIL_MOISTURE')?.value ?? 48.5);
  const currentAirTemp = summaryMap['AIR_TEMP']?.value ?? 
    (recentReadings.find(r => r.sensor_type === 'AIR_TEMP')?.value ?? 28.2);
  const currentHumidity = summaryMap['HUMIDITY']?.value ?? 
    (recentReadings.find(r => r.sensor_type === 'HUMIDITY')?.value ?? 62.0);
  const currentRainfall = summaryMap['RAINFALL']?.value ?? 
    (recentReadings.find(r => r.sensor_type === 'RAINFALL')?.value ?? 0.0);
  const currentLight = summaryMap['LIGHT_INTENSITY']?.value ?? 
    (recentReadings.find(r => r.sensor_type === 'LIGHT_INTENSITY')?.value ?? 48000);
  const currentBattery = summaryMap['BATTERY_VOLTAGE']?.value ?? 
    (recentReadings.find(r => r.sensor_type === 'BATTERY_VOLTAGE')?.value ?? 4.12);

  // Determine online/offline status (last seen within 15 minutes)
  const isOnline = activeDevice?.last_seen_at
    ? (Date.now() - new Date(activeDevice.last_seen_at).getTime()) < 15 * 60 * 1000
    : false;

  // Trigger single scenario simulation via backend
  const handleRunPreset = async () => {
    if (!activeDevice) return;
    try {
      const res = await api.runSimulatorPreset({
        device_id: activeDevice.id,
        scenario: selectedScenario,
      });
      setLastApiStatus({
        status: `SUCCESS: Ingested '${res.scenario}'`,
        message: res.disclaimer,
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
        message: 'Continuous simulation halted.',
        time: new Date().toLocaleTimeString(),
      });
    } else {
      if (!activeDevice) return;
      setIsSimulatingContinuous(true);
      setLastApiStatus({
        status: 'STREAMING',
        message: `Posting gradual readings to /api/v1/iot/telemetry every ${simIntervalSeconds}s.`,
        time: new Date().toLocaleTimeString(),
      });

      // Run immediately once then schedule
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

  const selectedFarm = farms.find(f => f.id === selectedFarmId) || farms[0];
  const unresolvedAlerts = alerts.filter(a => !a.is_resolved);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="card p-6 sm:p-8 space-y-2 border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Activity className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-display">
                IoT & Edge Microclimate Telematics
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Virtual device simulation, real-time farm sensor telemetry ingestion, and configurable smart irrigation advisories.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-yellow">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SIMULATION-FIRST TELEMETRY</span>
            </span>
            <button
              onClick={() => {
                setNewDeviceCode(`ESP32-NODE-${Math.floor(100 + Math.random() * 900)}`);
                setNewDeviceName('North Orchard Virtual Sensor');
                setCreatedDeviceKey(null);
                setShowRegisterModal(true);
              }}
              className="btn-primary text-xs py-1.5 px-3"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Provision Virtual Node</span>
            </button>
            <button
              onClick={handleManualRefresh}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hardware Simulation Disclosure Banner */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs text-amber-900 leading-relaxed">
          <div className="font-extrabold text-amber-950">
            Hardware Simulation Disclosure (Phase 4A Architecture)
          </div>
          <p>
            No physical ESP32 boards or physical sensors are connected. All readings are synthetic telemetry generated by Agri2Value’s virtual device simulator and transmitted through the authenticated <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-mono">POST /api/v1/iot/telemetry</code> API path.
          </p>
        </div>
      </div>

      {/* Farm & Device Selector Card */}
      <div className="card p-5 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border-slate-200">
        <div>
          <label className="label text-[11px] mb-1">Select Farm Location</label>
          <select
            value={selectedFarmId}
            onChange={(e) => setSelectedFarmId(e.target.value)}
            className="input text-xs bg-white font-medium"
          >
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.farm_name} ({farm.village}, {farm.district})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label text-[11px] mb-1">Select Registered IoT Node</label>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="input text-xs bg-white font-mono font-bold"
            disabled={devices.length === 0}
          >
            {devices.map((dev) => (
              <option key={dev.id} value={dev.id}>
                {dev.device_code} — {dev.device_name} ({dev.status})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col justify-end">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Total Nodes: <strong className="text-slate-900 font-mono">{devices.length}</strong></span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5 font-semibold">
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500">Standby</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Device Status Ribbon */}
      {activeDevice ? (
        <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <Cpu className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900 font-mono">{activeDevice.device_code}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeDevice.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {activeDevice.status}
                </span>
                <span className="badge-slate text-[10px]">{activeDevice.data_source}</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {activeDevice.device_name} • Farm: <strong className="text-slate-800">{selectedFarm?.farm_name}</strong>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500">
            <div>Key Prefix: <strong className="text-slate-800">{activeDevice.api_key_prefix}</strong></div>
            <span>•</span>
            <div>Firmware: <strong className="text-slate-800">{activeDevice.firmware_version}</strong></div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Last Ingest: <strong className="text-emerald-700">
                {activeDevice.last_seen_at ? new Date(activeDevice.last_seen_at).toLocaleTimeString() : 'Never'}
              </strong></span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center space-y-3">
          <Cpu className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No IoT Nodes Found on this Farm</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Provision a virtual telemetry node to simulate soil moisture, ambient temperature, humidity, and rainfall readings.
          </p>
        </div>
      )}

      {/* Virtual IoT Simulator Console Card */}
      <div className="card p-6 border-emerald-200 bg-gradient-to-br from-emerald-50/40 via-white to-slate-50 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono">
                Virtual Device Simulator Console
              </h2>
              <p className="text-[11px] text-slate-500">
                Generate authentic edge microclimate scenarios and transmit them to the backend API.
              </p>
            </div>
          </div>

          {lastApiStatus && (
            <div className={`text-xs px-3 py-1.5 rounded-lg border font-mono flex items-center gap-1.5 ${
              lastApiStatus.isError ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {lastApiStatus.isError ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{lastApiStatus.status} ({lastApiStatus.time})</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="label text-[11px] mb-1">Environmental Scenario Preset</label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="input text-xs bg-white font-medium"
              disabled={isSimulatingContinuous}
            >
              <option value="NORMAL_OPTIMAL">Optimal Microclimate (Moisture 55%, Temp 27.5°C, Rain 0mm)</option>
              <option value="LOW_MOISTURE_DROUGHT">Severe Moisture Stress (Moisture 21.5% — Triggers Dry Alert)</option>
              <option value="HEATWAVE_STRESS">Extreme Canopy Heatwave (Temp 41.5°C — Triggers Heat Alert)</option>
              <option value="HIGH_HUMIDITY_BLIGHT">High Humidity & Blight Threat (Humidity 92% — Fungal Risk)</option>
              <option value="HEAVY_MONSOON_RAIN">Torrential Downpour Surge (Rainfall 38.5mm — Waterlogging)</option>
              <option value="DEVICE_OFFLINE">Device Missed Heartbeat (Simulate Offline Warning)</option>
            </select>
          </div>

          <div>
            <label className="label text-[11px] mb-1">Stream Frequency</label>
            <select
              value={simIntervalSeconds}
              onChange={(e) => setSimIntervalSeconds(Number(e.target.value))}
              className="input text-xs bg-white font-mono"
              disabled={isSimulatingContinuous}
            >
              <option value={3}>Every 3 seconds</option>
              <option value={5}>Every 5 seconds</option>
              <option value={10}>Every 10 seconds</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRunPreset}
              disabled={isSimulatingContinuous || !activeDevice}
              className="btn-primary text-xs py-2 px-3 flex-1 justify-center"
            >
              <span>Inject Once</span>
            </button>
            <button
              onClick={toggleContinuousSimulation}
              disabled={!activeDevice}
              className={`text-xs py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                isSimulatingContinuous 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              {isSimulatingContinuous ? (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Stream</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 6 Microclimate Metric Gauges (FarmMonitor Inspired) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Metric 1: Soil Moisture */}
        <div className="card p-6 space-y-3 hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Droplet className="w-6 h-6" />
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              currentSoilMoisture < irrigationThreshold ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {currentSoilMoisture < irrigationThreshold ? 'MOISTURE DEFICIT' : 'OPTIMAL HYDRATION'}
            </span>
          </div>
          <div>
            <div className="label text-[10px] mb-0.5">Soil Volumetric Moisture</div>
            <div className="text-3xl font-black font-mono text-slate-900">
              {currentSoilMoisture}%
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-500">
            <span>Configured Threshold: &lt;{irrigationThreshold}%</span>
            <span className={currentSoilMoisture < irrigationThreshold ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
              {currentSoilMoisture < irrigationThreshold ? 'Irrigation Advised' : 'Safe Rootzone Range'}
            </span>
          </div>
        </div>

        {/* Metric 2: Air Temperature */}
        <div className="card p-6 space-y-3 hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Thermometer className="w-6 h-6" />
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              currentAirTemp > 38 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {currentAirTemp > 38 ? 'HEAT STRESS (>38°C)' : 'CANOPY NORMAL'}
            </span>
          </div>
          <div>
            <div className="label text-[10px] mb-0.5">Ambient Air Temperature</div>
            <div className="text-3xl font-black font-mono text-slate-900">
              {currentAirTemp}°C
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-500">
            <span>Threshold Alert: &gt;38°C</span>
            <span className="text-slate-700 font-bold">Tomato Polyhouse</span>
          </div>
        </div>

        {/* Metric 3: Relative Humidity */}
        <div className="card p-6 space-y-3 hover:border-cyan-300 transition-colors">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
              <CloudRain className="w-6 h-6" />
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              currentHumidity > 85 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {currentHumidity > 85 ? 'BLIGHT RISK (>85%)' : 'NORMAL'}
            </span>
          </div>
          <div>
            <div className="label text-[10px] mb-0.5">Relative Air Humidity</div>
            <div className="text-3xl font-black font-mono text-slate-900">
              {currentHumidity}%
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-500">
            <span>Fungal Risk: &gt;85%</span>
            <span className="text-emerald-700 font-bold">Foliage Clean</span>
          </div>
        </div>

        {/* Metric 4: Rainfall Accumulation */}
        <div className="card p-6 space-y-3 hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <CloudRain className="w-6 h-6" />
            </div>
            <span className="badge-slate text-[10px]">
              {currentRainfall > 0 ? `${currentRainfall} mm PRECIP` : 'CLEAR FIELD'}
            </span>
          </div>
          <div>
            <div className="label text-[10px] mb-0.5">Field Precipitation</div>
            <div className="text-3xl font-black font-mono text-slate-900">
              {currentRainfall} <span className="text-base font-normal text-slate-500">mm</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-500">
            <span>Precipitation Threshold: &gt;25 mm</span>
            <span className="text-slate-700 font-bold">Field Drainage OK</span>
          </div>
        </div>

        {/* Metric 5: Solar Light Intensity */}
        <div className="card p-6 space-y-3 hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Sun className="w-6 h-6" />
            </div>
            <span className="badge-green text-[10px]">PHOTOSYNTHESIS</span>
          </div>
          <div>
            <div className="label text-[10px] mb-0.5">Photosynthetic Light</div>
            <div className="text-3xl font-black font-mono text-slate-900">
              {Number(currentLight).toLocaleString()} <span className="text-base font-normal text-slate-500">Lux</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-500">
            <span>Sensor: BH1750 (Sim)</span>
            <span className="text-emerald-700 font-bold">Adequate Photoperiod</span>
          </div>
        </div>

        {/* Metric 6: Edge Battery Voltage */}
        <div className="card p-6 space-y-3 hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Battery className="w-6 h-6" />
            </div>
            <span className="badge-green text-[10px]">95% HEALTH</span>
          </div>
          <div>
            <div className="label text-[10px] mb-0.5">Edge Node Battery</div>
            <div className="text-3xl font-black font-mono text-slate-900">
              {currentBattery} <span className="text-base font-normal text-slate-500">V</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-500">
            <span>Solar Charging: 300 mA</span>
            <span className="text-emerald-700 font-bold">Nominal State</span>
          </div>
        </div>

      </div>

      {/* Smart Irrigation Advisory & Configuration Panel */}
      <div className="card p-6 space-y-4 border-emerald-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="badge-green">ADVISORY DECISION</span>
              <h2 className="text-base font-extrabold text-slate-900">
                Configurable Smart Irrigation Decision Engine
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Transparent, farmer-configurable thresholds for rootzone hydration. No blackbox calculations.
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
                className="w-28 accent-emerald-600"
              />
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                {irrigationThreshold}%
              </span>
            </div>
          </div>
        </div>

        {/* Advisory Status Box */}
        <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
          currentSoilMoisture < irrigationThreshold 
            ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
        }`}>
          {currentSoilMoisture < irrigationThreshold ? (
            <TrendingDown className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 text-xs">
            <div className="font-extrabold text-sm">
              {currentSoilMoisture < irrigationThreshold 
                ? 'Actionable Advisory: Soil Moisture Deficit Detected' 
                : 'Hydration Status: Rootzone Moisture is Adequate'}
            </div>
            <p className="leading-relaxed">
              {currentSoilMoisture < irrigationThreshold 
                ? `Current soil moisture is ${currentSoilMoisture}%, which is below the configured threshold of ${irrigationThreshold}%. Inspect the field rootzone and consider initiating standard drip irrigation for tomato cultivation.`
                : `Current soil moisture is ${currentSoilMoisture}%, satisfying your configured threshold of ${irrigationThreshold}%. Evapotranspiration is within safe limits. No additional irrigation required today.`}
            </p>
            <div className="text-[11px] font-semibold text-slate-500 pt-1">
              Safety Guardrail: <strong className="text-slate-700">Advisory Only.</strong> Automated pump actuation is disabled by design in Phase 4A to protect farm infrastructure and farmer autonomy.
            </div>
          </div>
        </div>
      </div>

      {/* Environmental Anomaly Alerts List */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-extrabold text-slate-900">
              Active Microclimate Advisory Alerts ({unresolvedAlerts.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Auto-deduplicated • Auto-recovery active
          </span>
        </div>

        {unresolvedAlerts.length > 0 ? (
          <div className="space-y-3">
            {unresolvedAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-900 uppercase">
                      {alert.alert_type.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                    {alert.explanation}
                  </p>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Threshold: <strong>{alert.threshold_used}</strong>
                  </div>
                </div>

                <button
                  onClick={() => handleResolveAlert(alert.id)}
                  className="btn-secondary text-xs py-1.5 px-3 shrink-0"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mark Resolved</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
            <span className="font-semibold text-slate-700">No active microclimate alerts.</span> All telemetry readings are within configured safe bounds.
          </div>
        )}
      </div>

      {/* Historical Telemetry Stream Table */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-extrabold text-slate-900">
              Live Sensor Telemetry Ingestion Log ({recentReadings.length})
            </h2>
          </div>
          <span className="badge-slate text-[10px]">
            Persisted in PostgreSQL/SQLite
          </span>
        </div>

        {recentReadings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Device Event ID</th>
                  <th className="py-2.5 px-3">Sensor Type</th>
                  <th className="py-2.5 px-3">Reading Value</th>
                  <th className="py-2.5 px-3">Recorded Time</th>
                  <th className="py-2.5 px-3">Source Tag</th>
                  <th className="py-2.5 px-3">Quality Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentReadings.slice(0, 10).map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 font-mono">
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{row.reading_id}</td>
                    <td className="py-2.5 px-3 text-slate-800 font-bold">{row.sensor_type}</td>
                    <td className="py-2.5 px-3 font-black text-emerald-800">{row.value} {row.unit}</td>
                    <td className="py-2.5 px-3 text-slate-500">{new Date(row.device_timestamp).toLocaleTimeString()}</td>
                    <td className="py-2.5 px-3">
                      <span className="badge-slate text-[10px]">{row.source_type}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="badge-green text-[10px]">{row.quality_flag}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
            No telemetry records logged yet for this node. Run the simulator above to stream initial readings.
          </div>
        )}
      </div>

      {/* Advisory Integration Linkage to Crop Rescue */}
      <div className="card p-6 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="badge-green">ADVISORY LINKAGE</span>
            <h3 className="font-extrabold text-slate-900 text-sm">
              Supplementary Crop Rescue Watchdog Integration
            </h3>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            When microclimate stress conditions are detected (such as persistent soil moisture &lt; 25% or temperatures &gt; 38°C), Agri2Value automatically surfaces supplementary advisory signals to Crop Rescue Mode without mutating financial calculations.
          </p>
        </div>

        {onNavigateToRescue && (
          <button
            onClick={onNavigateToRescue}
            className="btn-primary text-xs py-2 px-3.5 shadow-xs shrink-0"
          >
            <span>View Crop Rescue Watchdog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Modal: Provision Virtual IoT Node */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card p-6 max-w-md w-full bg-white space-y-4 shadow-xl border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Provision Virtual IoT Node
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowRegisterModal(false);
                  setCreatedDeviceKey(null);
                }}
                className="text-slate-400 hover:text-slate-600"
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
                  <label className="label text-[11px]">Device Secret API Key (Token)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdDeviceKey}
                      className="input text-xs font-mono font-bold bg-slate-100 text-slate-900 select-all"
                    />
                    <button
                      onClick={handleCopyKey}
                      className="btn-secondary text-xs py-2 px-3 shrink-0"
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
                  className="btn-primary w-full text-xs py-2.5 mt-2"
                >
                  Done & Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterDevice} className="space-y-3">
                <div>
                  <label className="label text-[11px] mb-1">Device Hardware Code (ID)</label>
                  <input
                    type="text"
                    required
                    value={newDeviceCode}
                    onChange={(e) => setNewDeviceCode(e.target.value)}
                    placeholder="e.g. ESP32-POLYHOUSE-02"
                    className="input text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="label text-[11px] mb-1">Friendly Node Name</label>
                  <input
                    type="text"
                    required
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    placeholder="e.g. Tomato Plot North Sensor"
                    className="input text-xs"
                  />
                </div>

                <div>
                  <label className="label text-[11px] mb-1">Farm Assignment</label>
                  <select
                    value={selectedFarmId}
                    onChange={(e) => setSelectedFarmId(e.target.value)}
                    className="input text-xs"
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
                    className="btn-secondary text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary text-xs py-2 px-4"
                  >
                    Generate Credentials
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
