"""Shared config for OpenFans reel production agents."""

from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
TMP = BASE / "tmp"
TMP.mkdir(exist_ok=True)
LOGS_DIR = BASE / "logs" / "agents"
LOGS_DIR.mkdir(parents=True, exist_ok=True)

FFMPEG = "C:/Users/Claud/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe"

GEMINI_KEYS = [
    "AIzaSyB_8sKMOp-3MGNV2WcWPUJF3cXA-uSK4ME",
    "AIzaSyAyDqVpIEozKnOweTWd-hShVth6RoOs9OE",
    "AIzaSyBGtPendB0zAOuMiepc3M1Np_X2H-Ak8Vk",
]
GEMINI_KEY = GEMINI_KEYS[0]  # Rotate if rate-limited

# Relative font paths (avoids Windows drive colon escaping in FFmpeg)
FONT_BOLD = "assets/fonts/Montserrat-ExtraBold.ttf"
FONT_SEMI = "assets/fonts/Montserrat-SemiBold.ttf"

# OpenFans brand
BRAND = {
    "name": "OpenFans",
    "url": "openfans.online",
    "instagram": "@openfans.online",
    "colors": {
        "cyan": "#00AFF0",
        "orange": "#F5A623",
        "midnight": "#0A0E1A",
        "charcoal": "#1A1F2E",
    },
    "tone": "Creator-to-creator. Confident, empowering, a little provocative. Never corporate.",
    "visual_rule": "Attractive women, CLOTHED, night-out glamour, VIP energy, OpenFans cyan overlays.",
}

# Color grade presets
COLOR_GRADES = {
    "cool_cyan": "eq=contrast=1.15:brightness=0.02:saturation=1.15,colorbalance=bs=0.1:bm=0.05:bh=0.08",
    "warm_golden": "eq=contrast=1.1:brightness=0.03:saturation=1.2,colorbalance=rs=0.08:gm=0.03",
    "desaturated_cold": "eq=contrast=1.05:brightness=-0.02:saturation=0.6,colorbalance=bs=0.15:bm=0.1",
    "dark_moody": "eq=contrast=1.2:brightness=-0.05:saturation=0.9",
}
