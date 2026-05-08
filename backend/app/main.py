from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, documents, sadir, system, users, warid
from app.models.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Railway Secretariat API starting...")
    Base.metadata.create_all(bind=engine)
    yield
    print("Railway Secretariat API shutting down...")


app = FastAPI(lifespan=lifespan, title="Railway Secretariat API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(warid.router)
app.include_router(sadir.router)
app.include_router(documents.router)
app.include_router(system.router)
