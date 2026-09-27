from routes.refills import router as refills_router
from routes.patients import router as patients_router
from routes.pharmacy import router as pharmacy_router

__all__ = ["refills_router", "patients_router", "pharmacy_router"]
