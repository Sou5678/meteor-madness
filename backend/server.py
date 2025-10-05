from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
import httpx
from contextlib import asynccontextmanager
import math

ROOT_DIR = Path(__file__).parent
load_dotenv()

# NASA API configuration - Hazardous Near Earth Objects
NASA_API_KEY = "LwPe3c5Cvm7RXED47QaT6l8WmeZzqepgHUMggOI5"
NASA_BASE_URL = "https://api.nasa.gov/neo/rest/v1"

# Global clients
http_client: httpx.AsyncClient = None
mongo_client: AsyncIOMotorClient = None
db = None

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client, mongo_client, db

    # ----- STARTUP -----
    logging.info("🚀 Starting Meteor Madness API...")

    # Initialize HTTP client for NASA API
    http_client = httpx.AsyncClient(timeout=30.0)
    logging.info("✅ NASA API client initialized with key")

    # Initialize MongoDB client
    try:
        mongo_client = AsyncIOMotorClient(os.environ["mongodb://localhost:27017"])
        db = mongo_client[os.environ['test_database']]
        logging.info("✅ MongoDB client initialized")
    except Exception as e:
        logging.warning(f"⚠️ MongoDB initialization failed: {e}")

    yield

    # ----- SHUTDOWN -----
    logging.info("🛑 Shutting down...")

    if http_client:
        await http_client.aclose()
        logging.info("✅ NASA API client closed")

    if mongo_client:
        mongo_client.close()
        logging.info("✅ MongoDB client closed")


# FastAPI app
app = FastAPI(
    title="Meteor Madness - Asteroid Impact Portal",
    description="Advanced asteroid visualization and mitigation platform with NASA NeoWs API",
    version="1.0.0",
    lifespan=lifespan
)

api_router = APIRouter(prefix="/api")

origins = [
    "http://10.239.131.158:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"  # Development ke liye, production mein hata dena
]

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class AsteroidSummary(BaseModel):
    id: str
    name: str
    diameter_km: Optional[float] = None
    velocity_kmh: Optional[float] = None
    miss_distance_km: Optional[float] = None
    is_hazardous: bool = False
    approach_date: Optional[str] = None

class AsteroidDetails(BaseModel):
    id: str
    name: str
    nasa_jpl_url: str
    absolute_magnitude: Optional[float] = None
    diameter_min_km: Optional[float] = None
    diameter_max_km: Optional[float] = None
    is_hazardous: bool = False
    orbital_data: Optional[Dict[str, Any]] = None
    close_approaches: List[Dict[str, Any]] = []

class SimulationInput(BaseModel):
    diameter_km: float = Field(..., ge=0.001, le=100, description="Asteroid diameter in kilometers")
    velocity_kms: float = Field(..., ge=1, le=100, description="Impact velocity in km/s")
    angle_degrees: float = Field(45, ge=10, le=90, description="Impact angle in degrees")
    composition: str = Field("rocky", description="Asteroid composition")
    target_location: str = Field("land", description="Impact location type")

class SimulationResult(BaseModel):
    crater_diameter_km: float
    energy_megatons: float
    affected_radius_km: float
    population_at_risk: int
    damage_assessment: Dict[str, str]
    seismic_magnitude: float
    fireball_radius_km: float

class MitigationStrategy(BaseModel):
    id: str
    name: str
    description: str
    effectiveness_percent: float
    cost_billions_usd: float
    timeline_years: float
    technology_readiness: int
    pros: List[str]
    cons: List[str]

# NASA API helper functions
async def fetch_nasa_data(endpoint: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
    """Fetch data from NASA NeoWs API with API key"""
    global http_client
    if not http_client:
        raise HTTPException(status_code=503, detail="HTTP client not initialized")
    
    url = f"{NASA_BASE_URL}{endpoint}"
    params = params or {}
    params["api_key"] = NASA_API_KEY  # NASA API key use kar rahe hain
    
    try:
        logging.info(f"📡 Fetching from NASA: {endpoint}")
        logging.debug(f"URL: {url}")
        logging.debug(f"Params: {params}")
        
        response = await http_client.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        logging.info(f"✅ NASA API response received successfully")
        return data
        
    except httpx.HTTPStatusError as e:
        logging.error(f"❌ NASA API HTTP error: {e.response.status_code}")
        logging.error(f"Response: {e.response.text}")
        
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail="Asteroid not found in NASA database")
        elif e.response.status_code == 429:
            raise HTTPException(status_code=429, detail="NASA API rate limit exceeded. Please try again later.")
        elif e.response.status_code == 403:
            raise HTTPException(status_code=403, detail="NASA API access denied. Check API key.")
        else:
            raise HTTPException(status_code=503, detail=f"NASA API error: {e.response.status_code}")
            
    except httpx.TimeoutException:
        logging.error("❌ NASA API timeout")
        raise HTTPException(status_code=504, detail="NASA API timeout. Please try again.")
        
    except Exception as e:
        logging.error(f"❌ NASA API request failed: {str(e)}")
        raise HTTPException(status_code=503, detail=f"NASA API unavailable: {str(e)}")

def parse_asteroid_summary(asteroid_data: Dict[str, Any]) -> AsteroidSummary:
    """Parse NASA asteroid data into summary format"""
    try:
        close_approaches = asteroid_data.get("close_approach_data", [])
        closest_approach = None
        
        if close_approaches:
            closest_approach = min(
                close_approaches, 
                key=lambda x: float(x.get("miss_distance", {}).get("kilometers", float('inf')))
            )
        
        # Diameter data
        diameter_data = asteroid_data.get("estimated_diameter", {}).get("kilometers", {})
        diameter_km = None
        if diameter_data:
            diameter_max = diameter_data.get("estimated_diameter_max")
            diameter_min = diameter_data.get("estimated_diameter_min")
            if diameter_max and diameter_min:
                diameter_km = (diameter_max + diameter_min) / 2
            elif diameter_max:
                diameter_km = diameter_max
        
        # Approach data
        velocity_kmh = None
        miss_distance_km = None
        approach_date = None
        
        if closest_approach:
            velocity_data = closest_approach.get("relative_velocity", {})
            velocity_kmh = float(velocity_data.get("kilometers_per_hour", 0))
            
            distance_data = closest_approach.get("miss_distance", {})
            miss_distance_km = float(distance_data.get("kilometers", 0))
            
            approach_date = closest_approach.get("close_approach_date")
        
        return AsteroidSummary(
            id=asteroid_data["id"],
            name=asteroid_data.get("name", "Unknown"),
            diameter_km=diameter_km,
            velocity_kmh=velocity_kmh,
            miss_distance_km=miss_distance_km,
            is_hazardous=asteroid_data.get("is_potentially_hazardous_asteroid", False),
            approach_date=approach_date
        )
    except Exception as e:
        logging.error(f"Error parsing asteroid {asteroid_data.get('id', 'unknown')}: {e}")
        raise

def calculate_impact_simulation(params: SimulationInput) -> SimulationResult:
    """Calculate asteroid impact simulation results"""
    diameter_m = params.diameter_km * 1000
    velocity_ms = params.velocity_kms * 1000
    
    # Asteroid mass estimation
    radius_m = diameter_m / 2
    volume_m3 = (4/3) * math.pi * (radius_m ** 3)
    mass_kg = volume_m3 * 2600
    
    # Kinetic energy calculation
    energy_joules = 0.5 * mass_kg * (velocity_ms ** 2)
    energy_megatons = energy_joules / (4.184e15)
    
    # Crater diameter
    crater_diameter_km = 1.8 * (params.diameter_km ** 0.13) * (params.velocity_kms ** 0.44) * (math.sin(math.radians(params.angle_degrees)) ** 0.33)
    
    # Affected radius
    fireball_radius_km = 0.028 * (energy_megatons ** 0.33)
    blast_radius_km = 0.4 * (energy_megatons ** 0.33)
    thermal_radius_km = 1.9 * (energy_megatons ** 0.33)
    
    affected_radius_km = max(fireball_radius_km, blast_radius_km, thermal_radius_km)
    
    # Population estimation
    affected_area_km2 = math.pi * (affected_radius_km ** 2)
    population_density_per_km2 = 15
    population_at_risk = int(affected_area_km2 * population_density_per_km2)
    
    # Seismic magnitude estimation
    seismic_magnitude = 0.67 * math.log10(energy_megatons) + 5.87 if energy_megatons > 0 else 0
    
    # Damage assessment
    if energy_megatons < 1:
        damage_level = "Local damage, buildings destroyed within blast radius"
    elif energy_megatons < 100:
        damage_level = "Regional catastrophe, severe damage across metropolitan area"
    elif energy_megatons < 10000:
        damage_level = "National disaster, continent-wide effects"
    else:
        damage_level = "Global catastrophe, mass extinction event"
    
    damage_assessment = {
        "overall": damage_level,
        "crater": f"Crater diameter: {crater_diameter_km:.1f} km",
        "fireball": f"Fireball radius: {fireball_radius_km:.1f} km",
        "blast": f"Blast damage radius: {blast_radius_km:.1f} km",
        "thermal": f"Thermal radiation radius: {thermal_radius_km:.1f} km"
    }
    
    return SimulationResult(
        crater_diameter_km=round(crater_diameter_km, 2),
        energy_megatons=round(energy_megatons, 2),
        affected_radius_km=round(affected_radius_km, 2),
        population_at_risk=population_at_risk,
        damage_assessment=damage_assessment,
        seismic_magnitude=round(seismic_magnitude, 2),
        fireball_radius_km=round(fireball_radius_km, 2)
    )

# API Routes
@api_router.get("/")
async def root():
    return {
        "message": "Meteor Madness - Asteroid Impact Portal API",
        "version": "1.0.0",
        "status": "online",
        "nasa_api": "connected",
        "endpoints": {
            "feed": "/api/asteroids/feed",
            "hazardous": "/api/asteroids/hazardous",
            "details": "/api/asteroids/{id}",
            "browse": "/api/asteroids/browse",
            "simulation": "/api/simulation/impact",
            "mitigation": "/api/mitigation/strategies",
            "dashboard": "/api/statistics/dashboard"
        }
    }

@api_router.get("/health")
async def health_check():
    """API health check"""
    return {
        "status": "healthy",
        "http_client": http_client is not None,
        "mongo_client": mongo_client is not None,
        "nasa_api_key": "configured" if NASA_API_KEY else "missing"
    }

@api_router.get("/asteroids/feed", response_model=List[AsteroidSummary])
async def get_asteroid_feed(
    start_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD)")
):
    """
    Get asteroid feed from NASA NeoWs API for specified date range.
    If no dates provided, returns today's asteroids.
    """
    # Default to today if no dates provided
    if start_date is None:
        start_date = date.today()
    if end_date is None:
        end_date = start_date
    
    # NASA API limit: 7 days maximum
    if (end_date - start_date).days > 7:
        raise HTTPException(
            status_code=400, 
            detail="Date range cannot exceed 7 days due to NASA API limitations"
        )
    
    params = {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat()
    }
    
    logging.info(f"📅 Fetching asteroids from {start_date} to {end_date}")
    data = await fetch_nasa_data("/feed", params)
    
    asteroids = []
    near_earth_objects = data.get("near_earth_objects", {})
    
    logging.info(f"📊 Found {len(near_earth_objects)} days with asteroid data")
    
    for date_key, daily_asteroids in near_earth_objects.items():
        logging.info(f"📅 {date_key}: {len(daily_asteroids)} asteroids")
        for asteroid in daily_asteroids:
            try:
                asteroids.append(parse_asteroid_summary(asteroid))
            except Exception as e:
                logging.warning(f"⚠️ Failed to parse asteroid {asteroid.get('id', 'unknown')}: {e}")
                continue
    
    # Sort by closest approach distance
    asteroids.sort(key=lambda x: x.miss_distance_km if x.miss_distance_km else float('inf'))
    
    logging.info(f"✅ Returning {len(asteroids)} asteroids")
    return asteroids

@api_router.get("/asteroids/{asteroid_id}", response_model=AsteroidDetails)
async def get_asteroid_details(asteroid_id: str):
    """Get detailed information about a specific asteroid from NASA database"""
    logging.info(f"🔍 Fetching details for asteroid: {asteroid_id}")
    
    data = await fetch_nasa_data(f"/neo/{asteroid_id}")
    
    diameter_data = data.get("estimated_diameter", {}).get("kilometers", {})
    
    return AsteroidDetails(
        id=data["id"],
        name=data.get("name", "Unknown"),
        nasa_jpl_url=data.get("nasa_jpl_url", ""),
        absolute_magnitude=data.get("absolute_magnitude_h"),
        diameter_min_km=diameter_data.get("estimated_diameter_min"),
        diameter_max_km=diameter_data.get("estimated_diameter_max"),
        is_hazardous=data.get("is_potentially_hazardous_asteroid", False),
        orbital_data=data.get("orbital_data"),
        close_approaches=data.get("close_approach_data", [])
    )

@api_router.get("/asteroids/browse", response_model=List[AsteroidSummary])
async def browse_asteroids(
    page: int = Query(0, ge=0, description="Page number"),
    size: int = Query(20, ge=1, le=50, description="Page size")
):
    """Browse all asteroids in NASA database with pagination"""
    logging.info(f"📖 Browse asteroids: page={page}, size={size}")
    
    params = {"page": page, "size": size}
    data = await fetch_nasa_data("/neo/browse", params)
    
    asteroids = []
    for asteroid in data.get("near_earth_objects", []):
        try:
            asteroids.append(parse_asteroid_summary(asteroid))
        except Exception as e:
            logging.warning(f"⚠️ Failed to parse asteroid {asteroid.get('id', 'unknown')}: {e}")
            continue
    
    logging.info(f"✅ Returning {len(asteroids)} asteroids from browse")
    return asteroids

@api_router.get("/asteroids/hazardous", response_model=List[AsteroidSummary])
async def get_hazardous_asteroids(
    days: int = Query(7, ge=1, le=7, description="Number of days to look back")
):
    """
    Get ONLY potentially hazardous asteroids (PHAs) from recent NASA data.
    These are asteroids that come within 0.05 AU of Earth and are large enough to cause regional damage.
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    
    params = {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat()
    }
    
    logging.info(f"⚠️ Fetching HAZARDOUS asteroids from {start_date} to {end_date}")
    data = await fetch_nasa_data("/feed", params)
    
    hazardous_asteroids = []
    total_asteroids = 0
    
    for date_key, daily_asteroids in data.get("near_earth_objects", {}).items():
        total_asteroids += len(daily_asteroids)
        for asteroid in daily_asteroids:
            # NASA API marks potentially hazardous asteroids
            if asteroid.get("is_potentially_hazardous_asteroid", False):
                try:
                    hazardous_asteroids.append(parse_asteroid_summary(asteroid))
                except Exception as e:
                    logging.warning(f"⚠️ Failed to parse hazardous asteroid {asteroid.get('id', 'unknown')}: {e}")
                    continue
    
    # Sort by size (largest first) - most dangerous
    hazardous_asteroids.sort(key=lambda x: x.diameter_km if x.diameter_km else 0, reverse=True)
    
    logging.info(f"⚠️ Found {len(hazardous_asteroids)} HAZARDOUS asteroids out of {total_asteroids} total")
    return hazardous_asteroids

@api_router.post("/simulation/impact", response_model=SimulationResult)
async def simulate_impact(params: SimulationInput):
    """Simulate asteroid impact with given parameters"""
    logging.info(f"💥 Simulating impact: diameter={params.diameter_km}km, velocity={params.velocity_kms}km/s")
    result = calculate_impact_simulation(params)
    logging.info(f"✅ Simulation complete: {result.energy_megatons} megatons")
    return result

@api_router.get("/mitigation/strategies", response_model=List[MitigationStrategy])
async def get_mitigation_strategies():
    """Get available asteroid mitigation strategies"""
    strategies = [
        MitigationStrategy(
            id="kinetic_impactor",
            name="Kinetic Impactor",
            description="High-speed spacecraft collision to deflect asteroid trajectory (like NASA's DART mission)",
            effectiveness_percent=75,
            cost_billions_usd=2.5,
            timeline_years=5,
            technology_readiness=8,
            pros=["Proven technology (DART 2022)", "Relatively low cost", "Quick deployment", "Works on solid asteroids"],
            cons=["Limited to smaller asteroids (<500m)", "Requires 5-10 years warning", "May fragment rubble pile asteroids"]
        ),
        MitigationStrategy(
            id="gravity_tractor",
            name="Gravity Tractor",
            description="Spacecraft hovers near asteroid using gravitational attraction to gradually alter orbit",
            effectiveness_percent=60,
            cost_billions_usd=5.0,
            timeline_years=10,
            technology_readiness=6,
            pros=["Very precise control", "No debris creation", "Works on any composition", "Reversible if needed"],
            cons=["Extremely slow process", "High sustained cost", "Requires 15+ years warning", "Complex station-keeping"]
        ),
        MitigationStrategy(
            id="nuclear_deflection",
            name="Nuclear Deflection",
            description="Standoff nuclear detonation creates asymmetric heating to change trajectory",
            effectiveness_percent=95,
            cost_billions_usd=15.0,
            timeline_years=3,
            technology_readiness=7,
            pros=["Extremely effective", "Works on asteroids >1km", "Proven nuclear technology", "Last resort option"],
            cons=["International treaty issues", "Risk of fragmentation", "Radioactive debris", "Political barriers"]
        ),
        MitigationStrategy(
            id="ion_beam",
            name="Ion Beam Shepherd",
            description="Ion propulsion system directs plasma at asteroid surface for continuous low thrust",
            effectiveness_percent=70,
            cost_billions_usd=8.0,
            timeline_years=15,
            technology_readiness=5,
            pros=["Precise continuous control", "No asteroid contact", "Scalable power", "No contamination"],
            cons=["Requires 20+ years warning", "Unproven at scale", "Very long deployment", "Power requirements"]
        ),
        MitigationStrategy(
            id="solar_sail",
            name="Solar Sail Deflection",
            description="Large reflective sail attached to asteroid uses solar radiation pressure",
            effectiveness_percent=40,
            cost_billions_usd=3.0,
            timeline_years=20,
            technology_readiness=4,
            pros=["No fuel required", "Sustainable long-term", "Minimal launch mass", "Continuous acceleration"],
            cons=["Very slow deflection", "Limited by solar distance", "Deployment extremely difficult", "Requires decades"]
        ),
        MitigationStrategy(
            id="mass_driver",
            name="Mass Driver",
            description="Mining equipment on asteroid ejects material to create thrust",
            effectiveness_percent=65,
            cost_billions_usd=12.0,
            timeline_years=12,
            technology_readiness=3,
            pros=["Uses asteroid material", "Continuous thrust", "No fuel needed", "Modular approach"],
            cons=["Requires landing mission", "Complex robotics", "Unproven technology", "High development cost"]
        )
    ]
    
    return strategies

@api_router.get("/statistics/dashboard")
async def get_dashboard_statistics():
    """Get comprehensive statistics for dashboard using NASA data"""
    try:
        end_date = date.today()
        start_date = end_date - timedelta(days=7)
        
        params = {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }
        
        logging.info(f"📊 Fetching dashboard statistics from {start_date} to {end_date}")
        data = await fetch_nasa_data("/feed", params)
        
        total_asteroids = 0
        hazardous_count = 0
        size_categories = {"small": 0, "medium": 0, "large": 0, "very_large": 0, "unknown": 0}
        closest_approach = {"distance": float('inf'), "name": "", "date": "", "is_hazardous": False}
        fastest_asteroid = {"velocity": 0, "name": "", "date": ""}
        largest_asteroid = {"diameter": 0, "name": "", "is_hazardous": False}
        
        for date_key, daily_asteroids in data.get("near_earth_objects", {}).items():
            total_asteroids += len(daily_asteroids)
            
            for asteroid in daily_asteroids:
                # Hazardous count
                is_hazardous = asteroid.get("is_potentially_hazardous_asteroid", False)
                if is_hazardous:
                    hazardous_count += 1
                
                # Size categorization
                diameter_data = asteroid.get("estimated_diameter", {}).get("kilometers", {})
                if diameter_data:
                    max_diameter = diameter_data.get("estimated_diameter_max", 0)
                    if max_diameter < 0.1:  # < 100m
                        size_categories["small"] += 1
                    elif max_diameter < 0.5:  # 100m - 500m
                        size_categories["medium"] += 1
                    elif max_diameter < 1.0:  # 500m - 1km
                        size_categories["large"] += 1
                    else:  # > 1km
                        size_categories["very_large"] += 1
                    
                    # Track largest
                    if max_diameter > largest_asteroid["diameter"]:
                        largest_asteroid = {
                            "diameter": max_diameter,
                            "name": asteroid.get("name", "Unknown"),
                            "is_hazardous": is_hazardous
                        }
                else:
                    size_categories["unknown"] += 1
                
                # Find closest approach and fastest asteroid
                for approach in asteroid.get("close_approach_data", []):
                    distance_km = float(approach.get("miss_distance", {}).get("kilometers", float('inf')))
                    velocity_kmh = float(approach.get("relative_velocity", {}).get("kilometers_per_hour", 0))
                    
                    if distance_km < closest_approach["distance"]:
                        closest_approach = {
                            "distance": distance_km,
                            "name": asteroid.get("name", "Unknown"),
                            "date": approach.get("close_approach_date", ""),
                            "is_hazardous": is_hazardous
                        }
                    
                    if velocity_kmh > fastest_asteroid["velocity"]:
                        fastest_asteroid = {
                            "velocity": velocity_kmh,
                            "name": asteroid.get("name", "Unknown"),
                            "date": approach.get("close_approach_date", "")
                        }
        
        result = {
            "total_asteroids": total_asteroids,
            "hazardous_asteroids": hazardous_count,
            "hazardous_percentage": round((hazardous_count / total_asteroids * 100), 2) if total_asteroids > 0 else 0,
            "size_distribution": size_categories,
            "closest_approach": {
                "distance_km": round(closest_approach["distance"], 2),
                "distance_lunar": round(closest_approach["distance"] / 384400, 2),  # Lunar distances
                "name": closest_approach["name"],
                "date": closest_approach["date"],
                "is_hazardous": closest_approach["is_hazardous"]
            },
            "fastest_asteroid": {
                "velocity_kmh": round(fastest_asteroid["velocity"], 2),
                "velocity_kms": round(fastest_asteroid["velocity"] / 3600, 2),
                "name": fastest_asteroid["name"],
                "date": fastest_asteroid["date"]
            },
            "largest_asteroid": {
                "diameter_km": round(largest_asteroid["diameter"], 3),
                "name": largest_asteroid["name"],
                "is_hazardous": largest_asteroid["is_hazardous"]
            },
            "observation_period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
                "days": (end_date - start_date).days + 1
            }
        }
        
        logging.info(f"✅ Dashboard stats: {total_asteroids} asteroids, {hazardous_count} hazardous")
        return result
        
    except Exception as e:
        logging.error(f"❌ Failed to get dashboard statistics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard statistics: {str(e)}")

# Include router
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")