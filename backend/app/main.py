import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.services.alert_dispatcher import dispatcher
from app.services.incident_manager import incident_manager
from app.api.routes_tourist import router as tourist_router
from app.api.routes_incidents import router as incidents_router
from app.api.routes_uav import router as uav_router
from app.api.routes_demo import router as demo_router
from app.simulation.uav_flight_sim import uav_sim

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: launch background simulation and broadcast loop
    incident_manager.start_background_loop()
    print("[Guardian Xcel] Background simulation & state broadcast engine started.")
    yield
    print("[Guardian Xcel] Shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Unified backend and simulation engine for the Guardian Xcel autonomous rescue coordination system.",
    lifespan=lifespan
)

# CORS middleware for local frontend connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST Routers
app.include_router(tourist_router, prefix=settings.API_V1_STR)
app.include_router(incidents_router, prefix=settings.API_V1_STR)
app.include_router(uav_router, prefix=settings.API_V1_STR)
app.include_router(demo_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "endpoints": {
            "websocket": "/ws",
            "api_docs": "/docs",
            "tourist_api": f"{settings.API_V1_STR}/tourist",
            "incidents_api": f"{settings.API_V1_STR}/incidents",
            "uav_api": f"{settings.API_V1_STR}/uav",
            "demo_api": f"{settings.API_V1_STR}/demo"
        }
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await dispatcher.connect(websocket)
    try:
        # Immediately send initial system state upon connecting
        initial_state = incident_manager.get_full_system_state()
        await websocket.send_text(json.dumps(initial_state))
        
        while True:
            # Handle incoming WebSocket commands from client interfaces
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
                action = msg.get("action")
                
                if action == "SIM_ACTION":
                    sim_mode = msg.get("mode")
                    if sim_mode == "NORMAL":
                        from app.simulation.sensor_sim import sensor_sim
                        from app.simulation.lora_sim import lora_sim
                        sensor_sim.set_mode("NORMAL_WALK")
                        lora_sim.set_channel("CELLULAR_4G")
                    elif sim_mode == "FALL":
                        from app.simulation.sensor_sim import sensor_sim
                        sensor_sim.set_mode("FALLING")
                    elif sim_mode == "IMMOBILE":
                        from app.simulation.sensor_sim import sensor_sim
                        sensor_sim.set_mode("IMMOBILE")
                    elif sim_mode == "LORA_DROP":
                        from app.simulation.lora_sim import lora_sim
                        lora_sim.set_channel("LORA_MESH")
                    elif sim_mode == "SOS":
                        incident_manager.trigger_emergency(
                            incident_manager.current_tourist_ugid, "MANUAL_SOS", "Manual SOS from WebSocket"
                        )
                
                elif action == "START_DEMO":
                    incident_manager.start_full_rescue_demo()
                
                elif action == "RESET_SYSTEM":
                    incident_manager.reset_system()

                elif action == "DISPATCH_UAV":
                    inc_id = msg.get("incident_id")
                    if inc_id:
                        incident_manager.dispatch_uav(int(inc_id))
                    else:
                        uav_sim.dispatch_to_lkp(37.7420, -119.5975)

                elif action == "START_SEARCH":
                    incident_manager.start_uav_search()

                elif action == "TRIGGER_THERMAL":
                    incident_manager.trigger_thermal_scan()

                elif action == "RETURN_TO_BASE":
                    uav_sim.status = "RETURNING"

                elif action == "DISPATCH_RESCUE":
                    inc_id = msg.get("incident_id")
                    if inc_id:
                        incident_manager.dispatch_ground_rescue(int(inc_id))
                    else:
                        incident_manager.dispatch_ground_rescue(1)

                elif action == "RESOLVE_INCIDENT":
                    inc_id = msg.get("incident_id")
                    if inc_id:
                        incident_manager.resolve_incident(int(inc_id))
                    elif incident_manager.active_incident_id:
                        incident_manager.resolve_incident(incident_manager.active_incident_id)

            except json.JSONDecodeError:
                pass
            except Exception as inner_err:
                print(f"[WS Action Error] {inner_err}")
    except WebSocketDisconnect:
        await dispatcher.disconnect(websocket)
    except Exception as e:
        print(f"[WebSocket Loop Error] {e}")
        await dispatcher.disconnect(websocket)
