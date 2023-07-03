from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import util, docGPT


origins = [
    "http://localhost",
    "http://localhost:3000",
]

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(util.router)
app.include_router(docGPT.router)

@app.get("/")
async def root():
    return {"message": "Hello World"}
