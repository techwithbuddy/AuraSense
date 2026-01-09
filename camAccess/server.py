from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
YOLO("yolov8n.pt")
import cv2
import numpy as np

app = FastAPI()


# Allow browser requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLOv8 model (choose size: n, s, m, l, x)
model = YOLO("yolov8n.pt")

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    img_bytes = await file.read()
    np_arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    results = model(img)

    detections = []
    for r in results:
        for box in r.boxes:
            cls = model.names[int(box.cls[0])]
            conf = float(box.conf[0])
            detections.append({"class": cls, "confidence": conf})

    return {"detections": detections}