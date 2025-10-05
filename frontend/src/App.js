import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Import UI components
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Slider } from './components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Progress } from './components/ui/progress';
import { Separator } from './components/ui/separator';
import { Alert, AlertDescription } from './components/ui/alert';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Navigation Component
const Navigation = ({ currentPage, setCurrentPage }) => {
  const navItems = [
    { id: 'home', label: 'Mission Control', icon: '🌍' },
    { id: 'database', label: 'Asteroid Database', icon: '🔍' },
    { id: 'simulation', label: 'Impact Simulation', icon: '💥' },
    { id: 'mitigation', label: 'Mitigation Strategies', icon: '🚀' }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">☄️</div>
            <div>
              <h1 className="text-xl font-bold text-white">Meteor Madness</h1>
              <p className="text-xs text-slate-400">Asteroid Impact Visualization Portal</p>
            </div>
          </div>
          
          <div className="flex space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? "default" : "ghost"}
                onClick={() => setCurrentPage(item.id)}
                className={`${
                  currentPage === item.id 
                    ? "bg-orange-600 hover:bg-orange-700 text-white" 
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
                data-testid={`nav-${item.id}`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Home Page Component
const HomePage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API}/statistics/dashboard`);
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        toast.error('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <div className="animate-spin text-6xl mb-4">☄️</div>
            <p className="text-slate-400">Loading mission control data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1710268470228-6d77e6d999b3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwxfHxhc3Rlcm9pZCUyMHNwYWNlJTIwZWFydGh8ZW58MHx8fHwxNzU5NTc3MjY0fDA&ixlib=rb-4.1.0&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-slate-950/70"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl font-bold text-white mb-6" style={{ fontFamily: 'Exo 2, sans-serif' }}>
              Asteroid Threat
              <span className="block text-orange-400">Assessment Portal</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Advanced visualization and analysis platform for near-Earth objects, impact simulations, 
              and planetary defense strategies using real NASA data.
            </p>
            <div className="flex justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg"
                data-testid="explore-database-btn"
              >
                🔍 Explore Database
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-slate-600 text-white hover:bg-slate-800 px-8 py-4 text-lg"
                data-testid="run-simulation-btn"
              >
                💥 Run Simulation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Dashboard */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Mission Control Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-slate-900/50 border-slate-700" data-testid="total-asteroids-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-200 text-sm font-medium">Total Asteroids Tracked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-400">{stats?.total_asteroids || 0}</div>
              <p className="text-slate-400 text-sm mt-1">Last 7 days</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700" data-testid="hazardous-asteroids-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-200 text-sm font-medium">Potentially Hazardous</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{stats?.hazardous_asteroids || 0}</div>
              <p className="text-slate-400 text-sm mt-1">
                {stats?.hazardous_percentage?.toFixed(1) || 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700" data-testid="closest-approach-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-200 text-sm font-medium">Closest Approach</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">
                {stats?.closest_approach?.distance 
                  ? (stats.closest_approach.distance / 1000000).toFixed(2) + 'M km'
                  : 'N/A'
                }
              </div>
              <p className="text-slate-400 text-sm mt-1 truncate">
                {stats?.closest_approach?.name || 'No data'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700" data-testid="size-distribution-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-200 text-sm font-medium">Size Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Large (>1km)</span>
                  <span className="text-white">{stats?.size_distribution?.large || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Medium</span>
                  <span className="text-white">{stats?.size_distribution?.medium || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Small</span>
                  <span className="text-white">{stats?.size_distribution?.small || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mission Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-orange-400 flex items-center gap-2">
                🔍 Detection & Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <p>Real-time monitoring of near-Earth objects using NASA's extensive database. 
              Track orbital paths, size estimates, and approach distances.</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-orange-400 flex items-center gap-2">
                💥 Impact Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <p>Advanced physics simulations to model potential impact scenarios. 
              Calculate damage zones, energy release, and population risk assessment.</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-orange-400 flex items-center gap-2">
                🚀 Defense Strategies
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <p>Evaluate planetary defense technologies including kinetic impactors, 
              gravity tractors, and nuclear deflection systems.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

// Database Page Component
const DatabasePage = () => {
  const [asteroids, setAsteroids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAsteroid, setSelectedAsteroid] = useState(null);
  const [activeTab, setActiveTab] = useState('recent');

  const fetchAsteroids = async (endpoint) => {
    setLoading(true);
    try {
      let url = `${API}${endpoint}`;
      if (endpoint === '/asteroids/feed') {
        url += `?start_date=${selectedDate}`;
      }
      
      const response = await axios.get(url);
      setAsteroids(response.data);
    } catch (error) {
      console.error('Failed to fetch asteroids:', error);
      toast.error('Failed to load asteroid data');
      setAsteroids([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'recent') {
      fetchAsteroids('/asteroids/feed');
    } else if (activeTab === 'hazardous') {
      fetchAsteroids('/asteroids/hazardous');
    } else if (activeTab === 'browse') {
      fetchAsteroids('/asteroids/browse');
    }
  }, [activeTab, selectedDate]);

  const getDistanceColor = (distance) => {
    if (!distance) return 'text-slate-400';
    const distanceKm = distance / 1000000; // Convert to million km
    if (distanceKm < 1) return 'text-red-400';
    if (distanceKm < 5) return 'text-orange-400';
    if (distanceKm < 20) return 'text-yellow-400';
    return 'text-green-400';
  };

  const formatDistance = (distance) => {
    if (!distance) return 'Unknown';
    const distanceKm = distance / 1000000;
    return `${distanceKm.toFixed(2)}M km`;
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Asteroid Database</h1>
          <p className="text-slate-400 text-lg">Real-time NASA data on near-Earth objects</p>
        </div>

        <div className="mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-700">
              <TabsTrigger 
                value="recent" 
                className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
                data-testid="recent-tab"
              >
                Recent Approaches
              </TabsTrigger>
              <TabsTrigger 
                value="hazardous" 
                className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
                data-testid="hazardous-tab"
              >
                Potentially Hazardous
              </TabsTrigger>
              <TabsTrigger 
                value="browse" 
                className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
                data-testid="browse-tab"
              >
                Browse All
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {activeTab === 'recent' && (
                <div className="flex gap-4 mb-6">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="date" className="text-slate-300">Observation Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                      data-testid="date-picker"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={() => fetchAsteroids('/asteroids/feed')}
                      className="bg-orange-600 hover:bg-orange-700"
                      data-testid="search-btn"
                    >
                      🔍 Search
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <TabsContent value="recent" className="mt-6">
              <AsteroidList asteroids={asteroids} loading={loading} onSelect={setSelectedAsteroid} />
            </TabsContent>
            
            <TabsContent value="hazardous" className="mt-6">
              <AsteroidList asteroids={asteroids} loading={loading} onSelect={setSelectedAsteroid} />
            </TabsContent>
            
            <TabsContent value="browse" className="mt-6">
              <AsteroidList asteroids={asteroids} loading={loading} onSelect={setSelectedAsteroid} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// Asteroid List Component
const AsteroidList = ({ asteroids, loading, onSelect }) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">☄️</div>
        <p className="text-slate-400">Loading asteroid data...</p>
      </div>
    );
  }

  if (asteroids.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🌌</div>
        <p className="text-slate-400">No asteroids found for the selected criteria</p>
      </div>
    );
  }

  const getDistanceColor = (distance) => {
    if (!distance) return 'text-slate-400';
    const distanceKm = distance / 1000000;
    if (distanceKm < 1) return 'text-red-400';
    if (distanceKm < 5) return 'text-orange-400';
    if (distanceKm < 20) return 'text-yellow-400';
    return 'text-green-400';
  };

  const formatDistance = (distance) => {
    if (!distance) return 'Unknown';
    const distanceKm = distance / 1000000;
    return `${distanceKm.toFixed(2)}M km`;
  };

  return (
    <div className="grid gap-4">
      {asteroids.map((asteroid) => (
        <Card 
          key={asteroid.id} 
          className="bg-slate-900/50 border-slate-700 hover:border-orange-500 transition-all cursor-pointer"
          onClick={() => onSelect(asteroid)}
          data-testid={`asteroid-${asteroid.id}`}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{asteroid.name}</h3>
                <p className="text-slate-400 text-sm">ID: {asteroid.id}</p>
              </div>
              <div className="flex gap-2">
                {asteroid.is_hazardous && (
                  <Badge variant="destructive" className="bg-red-600">
                    ⚠️ Hazardous
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Diameter</p>
                <p className="text-white font-medium">
                  {asteroid.diameter_km ? `${asteroid.diameter_km.toFixed(3)} km` : 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Velocity</p>
                <p className="text-white font-medium">
                  {asteroid.velocity_kmh ? `${Math.round(asteroid.velocity_kmh).toLocaleString()} km/h` : 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Miss Distance</p>
                <p className={`font-medium ${getDistanceColor(asteroid.miss_distance_km)}`}>
                  {formatDistance(asteroid.miss_distance_km)}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Approach Date</p>
                <p className="text-white font-medium">
                  {asteroid.approach_date ? new Date(asteroid.approach_date).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Simulation Page Component
const SimulationPage = () => {
  const [simulationParams, setSimulationParams] = useState({
    diameter_km: 1.0,
    velocity_kms: 20,
    angle_degrees: 45,
    composition: 'rocky',
    target_location: 'land'
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/simulation/impact", simulationParams);
      setResult(response.data);
      toast.success('Impact simulation completed');
    } catch (error) {
      console.error('Simulation failed:', error);
      toast.error('Failed to run simulation');
    } finally {
      setLoading(false);
    }
  };

  const updateParam = (key, value) => {
    setSimulationParams(prev => ({
      ...prev,
      [key]: Array.isArray(value) ? value[0] : value
    }));
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Impact Simulation</h1>
          <p className="text-slate-400 text-lg">Model asteroid impact scenarios with advanced physics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Simulation Parameters */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-orange-400">Simulation Parameters</CardTitle>
              <CardDescription className="text-slate-400">
                Adjust parameters to model different impact scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-slate-300 mb-3 block">
                  Diameter: {simulationParams.diameter_km.toFixed(2)} km
                </Label>
                <Slider
                  value={[simulationParams.diameter_km]}
                  onValueChange={(value) => updateParam('diameter_km', value)}
                  max={10}
                  min={0.01}
                  step={0.01}
                  className="w-full"
                  data-testid="diameter-slider"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>10m</span>
                  <span>10km</span>
                </div>
              </div>

              <div>
                <Label className="text-slate-300 mb-3 block">
                  Impact Velocity: {simulationParams.velocity_kms} km/s
                </Label>
                <Slider
                  value={[simulationParams.velocity_kms]}
                  onValueChange={(value) => updateParam('velocity_kms', value)}
                  max={70}
                  min={11}
                  step={1}
                  className="w-full"
                  data-testid="velocity-slider"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>11 km/s</span>
                  <span>70 km/s</span>
                </div>
              </div>

              <div>
                <Label className="text-slate-300 mb-3 block">
                  Impact Angle: {simulationParams.angle_degrees}°
                </Label>
                <Slider
                  value={[simulationParams.angle_degrees]}
                  onValueChange={(value) => updateParam('angle_degrees', value)}
                  max={90}
                  min={10}
                  step={5}
                  className="w-full"
                  data-testid="angle-slider"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>10°</span>
                  <span>90°</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300 mb-2 block">Composition</Label>
                  <Select 
                    value={simulationParams.composition} 
                    onValueChange={(value) => updateParam('composition', value)}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="rocky">Rocky</SelectItem>
                      <SelectItem value="metallic">Metallic</SelectItem>
                      <SelectItem value="icy">Icy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">Target</Label>
                  <Select 
                    value={simulationParams.target_location} 
                    onValueChange={(value) => updateParam('target_location', value)}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="land">Land</SelectItem>
                      <SelectItem value="ocean">Ocean</SelectItem>
                      <SelectItem value="urban">Urban Area</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={runSimulation} 
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700"
                data-testid="run-simulation-btn"
              >
                {loading ? (
                  <>🔄 Running Simulation...</>
                ) : (
                  <>💥 Run Impact Simulation</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Simulation Results */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-orange-400">Simulation Results</CardTitle>
              <CardDescription className="text-slate-400">
                Impact assessment and damage analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6" data-testid="simulation-results">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Crater Diameter</p>
                      <p className="text-2xl font-bold text-orange-400">
                        {result.crater_diameter_km.toFixed(1)} km
                      </p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Energy Released</p>
                      <p className="text-2xl font-bold text-red-400">
                        {result.energy_megatons.toFixed(1)} Mt
                      </p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Affected Radius</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {result.affected_radius_km.toFixed(1)} km
                      </p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Population at Risk</p>
                      <p className="text-2xl font-bold text-cyan-400">
                        {result.population_at_risk.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <Separator className="bg-slate-700" />

                  <div>
                    <h4 className="text-white font-semibold mb-3">Damage Assessment</h4>
                    <div className="space-y-2">
                      <Alert className="border-orange-600 bg-orange-600/10">
                        <AlertDescription className="text-orange-200">
                          {result.damage_assessment.overall}
                        </AlertDescription>
                      </Alert>
                      {Object.entries(result.damage_assessment).slice(1).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="text-slate-400">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Seismic Magnitude</p>
                      <p className="text-white font-medium">{result.seismic_magnitude.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Fireball Radius</p>
                      <p className="text-white font-medium">{result.fireball_radius_km.toFixed(1)} km</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">💥</div>
                  <p className="text-slate-400">Run a simulation to see impact analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Mitigation Page Component
const MitigationPage = () => {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState(null);

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const response = await axios.get(`${API}/mitigation/strategies`);
        setStrategies(response.data);
      } catch (error) {
        console.error('Failed to fetch mitigation strategies:', error);
        toast.error('Failed to load mitigation strategies');
      } finally {
        setLoading(false);
      }
    };

    fetchStrategies();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <div className="animate-spin text-6xl mb-4">🚀</div>
            <p className="text-slate-400">Loading defense strategies...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Planetary Defense Strategies</h1>
          <p className="text-slate-400 text-lg">Evaluate mitigation technologies and their effectiveness</p>
        </div>

        <div className="grid gap-6">
          {strategies.map((strategy) => (
            <Card 
              key={strategy.id} 
              className="bg-slate-900/50 border-slate-700 hover:border-orange-500 transition-all cursor-pointer"
              onClick={() => setSelectedStrategy(selectedStrategy === strategy.id ? null : strategy.id)}
              data-testid={`strategy-${strategy.id}`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-orange-400 text-xl">{strategy.name}</CardTitle>
                    <CardDescription className="text-slate-300 mt-2">
                      {strategy.description}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`
                      ${strategy.effectiveness_percent >= 80 ? 'border-green-500 text-green-400' : 
                        strategy.effectiveness_percent >= 60 ? 'border-yellow-500 text-yellow-400' : 
                        'border-red-500 text-red-400'}
                    `}
                  >
                    {strategy.effectiveness_percent}% Effective
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-slate-400 text-sm">Cost</p>
                    <p className="text-white font-medium">${strategy.cost_billions_usd}B USD</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Timeline</p>
                    <p className="text-white font-medium">{strategy.timeline_years} years</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Tech Readiness</p>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={strategy.technology_readiness * 10} 
                        className="flex-1 h-2" 
                      />
                      <span className="text-white text-sm">{strategy.technology_readiness}/10</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Effectiveness</p>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={strategy.effectiveness_percent} 
                        className="flex-1 h-2" 
                      />
                      <span className="text-white text-sm">{strategy.effectiveness_percent}%</span>
                    </div>
                  </div>
                </div>

                {selectedStrategy === strategy.id && (
                  <div className="border-t border-slate-700 pt-4 mt-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-green-400 font-semibold mb-2">✅ Advantages</h4>
                        <ul className="space-y-1">
                          {strategy.pros.map((pro, index) => (
                            <li key={index} className="text-slate-300 text-sm">• {pro}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-red-400 font-semibold mb-2">⚠️ Limitations</h4>
                        <ul className="space-y-1">
                          {strategy.cons.map((con, index) => (
                            <li key={index} className="text-slate-300 text-sm">• {con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Strategy Comparison */}
        <Card className="bg-slate-900/50 border-slate-700 mt-12">
          <CardHeader>
            <CardTitle className="text-orange-400">Strategy Comparison Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-2 text-slate-300">Strategy</th>
                    <th className="text-center p-2 text-slate-300">Effectiveness</th>
                    <th className="text-center p-2 text-slate-300">Cost</th>
                    <th className="text-center p-2 text-slate-300">Timeline</th>
                    <th className="text-center p-2 text-slate-300">Readiness</th>
                  </tr>
                </thead>
                <tbody>
                  {strategies.map((strategy) => (
                    <tr key={strategy.id} className="border-b border-slate-700/50">
                      <td className="p-2 text-white">{strategy.name}</td>
                      <td className="text-center p-2">
                        <span className={`
                          ${strategy.effectiveness_percent >= 80 ? 'text-green-400' : 
                            strategy.effectiveness_percent >= 60 ? 'text-yellow-400' : 
                            'text-red-400'}
                        `}>
                          {strategy.effectiveness_percent}%
                        </span>
                      </td>
                      <td className="text-center p-2 text-slate-300">${strategy.cost_billions_usd}B</td>
                      <td className="text-center p-2 text-slate-300">{strategy.timeline_years}y</td>
                      <td className="text-center p-2 text-slate-300">{strategy.technology_readiness}/10</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'database':
        return <DatabasePage />;
      case 'simulation':
        return <SimulationPage />;
      case 'mitigation':
        return <MitigationPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="App">
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
      {renderPage()}
    </div>
  );
}

export default App;