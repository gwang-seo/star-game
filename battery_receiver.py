# StickS3 battery receiver - Python standard library only
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from datetime import datetime
from pathlib import Path
import json
import threading

HOST = "0.0.0.0"  # StickS3 sends to the academy PC's LAN IP
PORT = 8765
DATA_FILE = Path(__file__).with_name("battery_latest.json")
lock = threading.Lock()
latest = {"battery": None, "updated_at": None}
if DATA_FILE.exists():
    try:
        loaded = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        if isinstance(loaded, dict):
            latest.update({k: loaded.get(k) for k in latest})
    except (ValueError, OSError):
        pass

class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        origin = self.headers.get("Origin", "")
        if origin == "https://gwang-seo.github.io":
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Cache-Control", "no-store")

    def _reply(self, code, payload):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self._cors()
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path == "/battery":
            with lock:
                data = latest.copy()
            self._reply(200, data)
        elif self.path == "/health":
            self._reply(200, {"ok": True})
        else:
            self._reply(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/battery":
            return self._reply(404, {"error": "not found"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > 1024:
                return self._reply(400, {"error": "invalid payload length"})
            body = json.loads(self.rfile.read(length))
            value = body.get("battery")
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not 0 <= value <= 100:
                return self._reply(400, {"error": "battery must be 0-100"})
            record = {"battery": round(value), "updated_at": datetime.now().astimezone().isoformat(timespec="seconds")}
            with lock:
                latest.update(record)
                DATA_FILE.write_text(json.dumps(latest, ensure_ascii=False), encoding="utf-8")
            print("Received:", record, flush=True)
            self._reply(200, {"ok": True, **record})
        except (ValueError, TypeError, OSError, AttributeError):
            self._reply(400, {"error": "invalid request"})

if __name__ == "__main__":
    print(f"StickS3 receiver running on port {PORT}")
    print(f"On this PC: http://127.0.0.1:{PORT}/battery")
    print("On StickS3: http://<ACADEMY_PC_IP>:8765/battery")
    print("Allow Python through Windows Firewall for private networks if prompted.")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
