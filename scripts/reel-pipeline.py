#!/usr/bin/env python3
"""
OpenFans — Reel Production & Posting Pipeline

Produces and posts 10 story-driven Instagram Reels from pre-written scripts.
Each reel is rendered from AI-generated images + FFmpeg, then posted via Playwright.

Usage:
  py scripts/reel-pipeline.py                    # produce + post all 10, 70min apart
  py scripts/reel-pipeline.py --no-post          # produce only, don't post
  py scripts/reel-pipeline.py --start 3          # start from reel 3
  py scripts/reel-pipeline.py --only 5           # produce + post only reel 5
  py scripts/reel-pipeline.py --preview          # produce reel 1 and open it
"""

import sys
import os
import time
import argparse
from datetime import datetime

sys.path.insert(0, str(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from agents import producer, publisher

RATE_LIMIT_SECONDS = 70 * 60  # 70 minutes between posts


# =============================================================================
# 10 REEL DEFINITIONS — Scene-by-scene with AI image prompts
# =============================================================================

REELS = [
    # ── REEL 1: The Creator Who Almost Quit ──────────────────────────────
    {
        "title": "The Creator Who Almost Quit",
        "caption": (
            "she was one bad month away from deleting everything.\n\n"
            "then she found a platform that actually pays what she's worth.\n\n"
            "95% of every dollar. no waiting. no games. no middleman.\n\n"
            "some creators quit. some creators switch.\n\n"
            "link in bio.\n\n"
            "#creatoreconomy #openfans #financialfreedom #sidehustle "
            "#independentwoman #crypto #usdc #solana #web3creators "
            "#contentcreator #knowyourworth"
        ),
        "scenes": [
            {
                "visual_description": "Close-up of a woman's elegant hands slowly closing a silver laptop in a dim apartment. She has manicured nails and wears a nice black top. A single warm lamp illuminates the scene. Her phone is face-down on the table. The mood is heavy and defeated.",
                "visual_mood": "moody, dim warm lamp light, cinematic shallow depth of field, melancholic",
                "duration": 3.0,
                "color_mood": "desaturated_cold",
                "zoom_speed": 0.0006,
            },
            {
                "visual_description": "Medium shot from behind of a young woman sitting on the edge of her bed, shoulders slumped, back to camera. City lights glow through sheer curtains behind her. She's in a black top and jeans. Blue-cold moonlight from the window.",
                "visual_mood": "isolated, cold blue window light, silhouette against cityscape, lonely",
                "duration": 3.0,
                "color_mood": "desaturated_cold",
                "zoom_speed": 0.0005,
            },
            {
                "visual_description": "Over-the-shoulder shot of a woman looking at her phone in bed. The phone screen casts a dim glow on her face. She looks frustrated and exhausted. Warm phone glow contrasts with the dark room.",
                "visual_mood": "intimate, phone glow on face, frustrated expression, dark bedroom",
                "duration": 2.5,
                "color_mood": "dark_moody",
                "zoom_speed": 0.0008,
            },
            {
                "visual_description": "Close-up profile of a beautiful woman's face. Her eyes are closed in a slow blink. City lights bokeh in the background create soft cyan and orange circles. Macro lens, dramatic shallow depth of field. A single tear or glistening eye.",
                "visual_mood": "emotional close-up, bokeh city lights in cyan and orange, macro lens",
                "duration": 2.5,
                "color_mood": "dark_moody",
                "zoom_speed": 0.0004,
            },
            {
                "visual_description": "Top-down shot of a phone lighting up on a dark table. The phone screen shows a text message with a cyan-tinted link. A woman's hand with manicured nails reaches toward the phone. The cyan glow is the only light source.",
                "visual_mood": "dramatic, cyan phone glow, top-down angle, dark surroundings, hopeful",
                "duration": 2.5,
                "color_mood": "cool_cyan",
                "zoom_speed": 0.0007,
            },
            {
                "visual_description": "Close-up front-facing shot of a young woman's face lit by cyan light from a phone screen. Her expression is shifting from sadness to curiosity — eyebrows lifting slightly, lips parting. The cyan glow washes across her features gradually. Beautiful, photorealistic.",
                "visual_mood": "cyan screen glow on face, hope dawning, close-up portrait, cinematic",
                "duration": 3.0,
                "color_mood": "cool_cyan",
                "zoom_speed": 0.0006,
            },
            {
                "visual_description": "Wide shot of a woman standing at a window in her apartment at night, phone in hand casting cyan light on her body. City lights outside. Her posture is confident — shoulders back, head up. She's backlit by the city. Transformation moment.",
                "visual_mood": "empowered silhouette, cyan phone glow, city lights, confident posture",
                "duration": 3.0,
                "color_mood": "cool_cyan",
                "zoom_speed": 0.0005,
            },
            {
                "visual_description": "Mirror shot of a glamorous woman getting ready — applying lipstick, wearing a fitted black dress. Warm vanity lighting. A phone on the counter shows a cyan dashboard interface. She catches her own eye in the mirror with quiet confidence. Night-out glamour.",
                "visual_mood": "warm vanity light, glamorous getting-ready, confident, cyan phone glow accent",
                "duration": 2.5,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0007,
            },
        ],
    },

    # ── REEL 2: The DM That Changed Everything ──────────────────────────
    {
        "title": "The DM That Changed Everything",
        "caption": (
            "the face when you realize your money's been sitting in someone else's pocket this whole time\n\n"
            "jess really came through with that link tho\n\n"
            "openfans.online -- 95% yours, instant USDC, no wait.\n\n"
            "#moneymoves #sidehustlecheck #openfans #usdcpayouts "
            "#cryptopayments #creatoreconomy #girlmath #bossmoves "
            "#getpaid #web3 #solana"
        ),
        "scenes": [
            {
                "visual_description": "Top-down close-up of a phone on a marble bathroom counter next to a cocktail glass and a small clutch purse. The phone screen is illuminated showing a text message notification. Warm bathroom lighting with golden tones.",
                "visual_mood": "luxurious bathroom counter, warm golden light, phone notification glow",
                "duration": 2.0,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0008,
            },
            {
                "visual_description": "A beautiful woman in a silk robe standing at a bathroom vanity, half-glammed — one eye with makeup, one without. She's looking at her phone with curiosity. Her reflection is visible in the mirror. Ring light and warm lamp lighting. She has manicured nails and a thin gold bracelet.",
                "visual_mood": "getting-ready glamour, warm vanity lighting, mirror reflection, curious expression",
                "duration": 2.5,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0006,
            },
            {
                "visual_description": "Close-up of a phone screen showing a sleek dark dashboard with cyan (#00AFF0) accent colors. Numbers and earnings are visible with a modern fintech interface. The screen has a professional, premium feel with glowing cyan elements.",
                "visual_mood": "tech interface, cyan glow, dark premium UI, fintech dashboard",
                "duration": 2.5,
                "color_mood": "cool_cyan",
                "zoom_speed": 0.0004,
            },
            {
                "visual_description": "Medium close-up front-facing portrait of a young woman with her mascara wand frozen mid-air. Her mouth is slightly open in genuine surprise. Her eyes are wide. Cyan light from a phone below illuminates her face from beneath. She has half-done glamorous makeup.",
                "visual_mood": "genuine surprise expression, cyan uplighting from phone, dramatic portrait",
                "duration": 3.0,
                "color_mood": "cool_cyan",
                "zoom_speed": 0.0005,
            },
            {
                "visual_description": "A glamorous woman laughing with genuine joy while texting one-handed and holding a cocktail in the other. She's sitting at a vanity with warm lighting. The mood has completely shifted to celebration and relief. Her eyes are bright and alive.",
                "visual_mood": "joyful celebration, warm lighting, laughing woman, cocktail in hand, relief",
                "duration": 2.5,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0007,
            },
            {
                "visual_description": "A woman walking toward her apartment door, fully dressed for a night out — fitted black dress, heels, hair done, clutch purse. She's looking back over her shoulder with a confident smile. Golden hallway light spills in from the open door. Her phone glows cyan on the vanity behind her.",
                "visual_mood": "night-out ready, confident exit, golden hallway light, cyan phone glow in background",
                "duration": 2.5,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0006,
            },
        ],
    },

    # ── REEL 3: Her Money, Her Rules ─────────────────────────────────────
    {
        "title": "Her Money Her Rules",
        "caption": (
            "she earned it in february.\nshe got paid in march.\n\"processing.\"\n\n"
            "now she gets paid the second someone subscribes.\n"
            "no hold. no review. no 14-day wait.\n\n"
            "her money. immediately.\n\nopenfans.online\n\n"
            "#financialfreedom #getpaidnow #openfans #cryptopayouts "
            "#usdc #solana #creatoreconomy #independentwoman "
            "#moneymindset #knowyourworth #nomiddleman"
        ),
        "scenes": [
            {
                "visual_description": "Wide shot of a woman sitting alone at a kitchen table in blue-gray early morning light. She's staring at a laptop. On the table: an unopened stack of mail bills, a cold cup of coffee. She wears an oversized hoodie, messy bun. She looks exhausted and defeated. Harsh overhead fluorescent light.",
                "visual_mood": "cold, suffocating, fluorescent kitchen light, lonely morning, stressed",
                "duration": 3.0,
                "color_mood": "desaturated_cold",
                "zoom_speed": 0.0005,
            },
            {
                "visual_description": "A woman with her head in her hands at a kitchen table. Bills and envelopes are scattered on the table. She looks small and overwhelmed. Dim, cold lighting. The weight of financial stress is visible in her body language.",
                "visual_mood": "despair, head in hands, bills on table, cold fluorescent, overwhelming",
                "duration": 2.5,
                "color_mood": "desaturated_cold",
                "zoom_speed": 0.0004,
            },
            {
                "visual_description": "A phone screen lighting up in complete darkness. The screen shows a text message with a cyan-tinted link. The phone is the only light source, creating a dramatic beam in the dark room. Hope breaking through darkness.",
                "visual_mood": "single light source in darkness, phone glow, hope, dramatic contrast",
                "duration": 2.0,
                "color_mood": "dark_moody",
                "zoom_speed": 0.0008,
            },
            {
                "visual_description": "The same woman now sitting cross-legged on a beautiful couch in a sunlit apartment. Warm golden afternoon light streams through windows. She has a laptop open showing a cyan-tinted interface. Her posture is open and relaxed. She looks peaceful and confident. Complete transformation.",
                "visual_mood": "warm golden hour, sunlit apartment, relaxed confident posture, transformation",
                "duration": 3.0,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0006,
            },
            {
                "visual_description": "A woman walking down a sunny street with shopping bags, sunlight catching her hair. She's laughing at something off-camera. Warm, golden tones. She looks unburdened and free. Natural light, documentary-style.",
                "visual_mood": "golden sunlight, shopping bags, laughing, carefree, documentary warmth",
                "duration": 2.0,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0007,
            },
            {
                "visual_description": "A woman at a restaurant with friends, clinking glasses. Warm candlelight. Everyone is laughing. One friend has her phone showing a cyan-tinted screen. The mood is celebratory and connected. Night-out glamour.",
                "visual_mood": "candlelight dinner, friends clinking glasses, warm celebration, night-out glamour",
                "duration": 2.5,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0006,
            },
            {
                "visual_description": "The same kitchen from scene 1, but transformed. Golden morning light instead of gray. The mail is organized. Coffee is steaming fresh. A laptop shows a cyan dashboard with healthy numbers. The space feels warm and alive. Same composition, completely different energy.",
                "visual_mood": "warm golden kitchen, same space transformed, fresh coffee, morning light, peace",
                "duration": 3.0,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0005,
            },
        ],
    },

    # ── REEL 4: Split Screen — Two Creators, Same Month ──────────────────
    {
        "title": "Split Screen Two Creators",
        "caption": (
            "she worked just as hard. she just picked the wrong platform.\n\n"
            "same creator. same month. different results.\n\n"
            "the one on the right keeps 95%.\n\nlink in bio.\n\n"
            "#openfans #platformmatters #usdcpayouts #creatorlife "
            "#independentcreator #switchplatforms #financialfreedom #onlinecreator"
        ),
        "scenes": [
            {
                "visual_description": "Split screen composition: two beautiful women sitting at identical vanity mirrors doing makeup. Left side has slightly desaturated warm tones. Right side has vibrant cool cyan-tinted tones. Both women are gorgeous and putting in equal effort. Mirror image symmetry. Same angle, same lighting setup.",
                "visual_mood": "split screen comparison, symmetrical vanities, left desaturated right vibrant cyan",
                "duration": 3.0,
                "color_mood": "cool_cyan",
                "zoom_speed": 0.0004,
            },
            {
                "visual_description": "A stressed woman sitting on a couch in sweats, scrolling her phone with a furrowed brow. Flat, static lighting. She looks anxious and waiting. The apartment feels small and the lighting is unflattering. Financial stress visible in her posture.",
                "visual_mood": "flat lighting, stressed on couch, anxious scrolling, cramped apartment feel",
                "duration": 2.5,
                "color_mood": "desaturated_cold",
                "zoom_speed": 0.0005,
            },
            {
                "visual_description": "A confident woman at a boutique trying on a leather jacket, smiling at herself in a mirror. Bright, vibrant retail lighting. She looks happy and unburdened. Shopping bags visible. The energy is alive and prosperous.",
                "visual_mood": "vibrant boutique shopping, trying on leather jacket, confident smile, bright lighting",
                "duration": 2.5,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0007,
            },
            {
                "visual_description": "A woman at a rooftop bar at golden hour, clinking a cocktail glass with a friend. She's laughing genuinely. City skyline glows behind her. Cyan ambient light from a nearby neon sign catches her face. Low angle making her look powerful against the skyline.",
                "visual_mood": "rooftop bar golden hour, cocktail clinking, city skyline, cyan neon accent, powerful",
                "duration": 3.0,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0006,
            },
            {
                "visual_description": "Close-up of a woman's face in dim light, lit only by a cyan phone glow. Her eyes are wide with recognition and hope. Her lips part slightly. The cyan light washes across her features. She's discovering something that could change everything. Beautiful, photorealistic portrait.",
                "visual_mood": "cyan phone glow revelation, hope dawning, close-up portrait, dim room",
                "duration": 3.0,
                "color_mood": "cool_cyan",
                "zoom_speed": 0.0005,
            },
            {
                "visual_description": "A confident woman walking down a city street at night. Wet pavement reflects neon lights. She's wearing a fitted outfit and walking with purpose. She looks back over her shoulder directly at the camera with a slight knowing smile. Cyan and orange neon reflections on the wet sidewalk.",
                "visual_mood": "night city walk, wet pavement reflections, cyan and orange neon, confident stride, looking back",
                "duration": 3.0,
                "color_mood": "cool_cyan",
                "zoom_speed": 0.0006,
            },
        ],
    },

    # ── REEL 5: The 2AM Notification ─────────────────────────────────────
    {
        "title": "The 2AM Notification",
        "caption": (
            "she used to lie awake checking if it cleared.\n\n"
            "now it hits before her drink is empty.\n\n"
            "95% payouts. instant USDC. no waiting, no \"processing,\" no permission needed.\n\n"
            "this is what creator income should feel like.\n\n"
            "openfans.online -- link in bio.\n\n"
            "#instantpayouts #usdc #creatormoney #openfans #paidinstantly "
            "#nomore21days #cryptopayouts #creatorplatform #financialfreedom"
        ),
        "scenes": [
            {
                "visual_description": "Extreme close-up of a phone face-up on a dark wooden bar table. The screen illuminates with a cyan notification. Condensation droplets on a nearby cocktail glass catch the light. A hand with dark nail polish enters frame from the right. Warm bar lights blur in the background — amber and gold bokeh.",
                "visual_mood": "bar table macro, cyan phone glow, cocktail condensation, warm bokeh background",
                "duration": 2.5,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0007,
            },
            {
                "visual_description": "Three gorgeous women at a rooftop lounge, all dressed in night-out glamour — heels, styled hair. They are mid-laugh about something. City skyline behind them slightly out of focus. String lights overhead. One woman is picking up her phone casually. Warm, social, alive.",
                "visual_mood": "rooftop lounge night out, three women laughing, city skyline, string lights, warm social",
                "duration": 2.5,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0005,
            },
            {
                "visual_description": "Over-the-shoulder shot of a woman looking at her phone which shows a USDC payment notification on a cyan-accented interface. She has a small, private half-smile. Her friends are blurred in the background, still talking. Private satisfaction moment.",
                "visual_mood": "private phone glance, USDC notification, half-smile, friends blurred behind",
                "duration": 2.5,
                "color_mood": "cool_cyan",
                "zoom_speed": 0.0006,
            },
            {
                "visual_description": "The same woman lying in bed alone in the dark, three months ago. Phone held above her face, casting cold light. She looks exhausted and frustrated. The room is dark and isolating. Cold blue-gray tones. Lots of empty dark space around her. The loneliness of waiting for money.",
                "visual_mood": "dark bedroom, cold blue light, lying in bed alone, frustrated, isolating",
                "duration": 3.0,
                "color_mood": "desaturated_cold",
                "zoom_speed": 0.0004,
            },
            {
                "visual_description": "Back at the rooftop — the warmth floods back. Three women standing, arm around each other, posing for a photo. City lights behind them. Low angle making them look larger than life against the skyline. Warm tones, alive, present. The contrast with the previous dark scene should be stark.",
                "visual_mood": "rooftop group photo, city skyline, low angle powerful, warm alive tones, celebration",
                "duration": 2.5,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0006,
            },
            {
                "visual_description": "Close-up of a phone glowing cyan on a dark bar table. Another notification has arrived. But no hand reaches for it. The phone just glows alone while warm bar lights blur in the background. The ultimate flex — she doesn't even need to check anymore.",
                "visual_mood": "unattended phone glowing cyan, bar table, no hand reaching, warm bokeh, indifference to money",
                "duration": 2.5,
                "color_mood": "cool_cyan",
                "zoom_speed": 0.0005,
            },
        ],
    },

    # ── REEL 6: The Group Chat ───────────────────────────────────────────
    {
        "title": "The Group Chat",
        "caption": (
            "jade dropped a screenshot and changed five bank accounts in one afternoon.\n\n"
            "here is the part nobody talks about: when your friends sign up through your link, "
            "you earn 1% of everything they make. not once. forever.\n\n"
            "she didn't just find a better platform. she built a network.\n\n"
            "your squad is your business now.\n\n"
            "openfans.online -- link in bio.\n\n"
            "#openfans #creatorsquad #referralprogram #earnwithfriends "
            "#creatornetwork #passiveincome #usdcpayouts #squadgoals #platformswitch"
        ),
        "scenes": [
            {
                "visual_description": "Close-up of a phone screen showing a group chat with multiple message bubbles. One message has a screenshot of earnings with cyan accents. Multiple typing indicators at the bottom. The phone is held by a woman with acrylic nails sitting in a car. Natural daylight through a car window.",
                "visual_mood": "phone screen group chat, car interior daylight, acrylic nails, excited messages",
                "duration": 2.5,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0006,
            },
            {
                "visual_description": "A woman on her couch in a silk robe, mouth dropping open in shock while looking at her phone. She's sitting up straight with wide eyes. Warm apartment lighting, cozy interior. Genuine surprise reaction.",
                "visual_mood": "shock reaction on couch, silk robe, warm apartment, mouth open, phone in hand",
                "duration": 2.0,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0008,
            },
            {
                "visual_description": "A woman at a coffee shop pulling her designer sunglasses down to stare at her phone with wide eyes. Bright cafe lighting, iced coffee on the table. Her expression is disbelief mixed with excitement.",
                "visual_mood": "bright cafe, sunglasses pulled down, disbelief expression, iced coffee, daytime",
                "duration": 2.0,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0008,
            },
            {
                "visual_description": "A woman sitting cross-legged on her bed with a laptop open, cyan-tinted screen reflecting on her face. She's signing up for something. Warm bedroom lighting with fairy lights in the background. She leans back with a satisfied exhale after clicking. Decisive and confident.",
                "visual_mood": "bedroom signup moment, laptop cyan glow, fairy lights, satisfied expression",
                "duration": 2.5,
                "color_mood": "cool_cyan",
                "zoom_speed": 0.0006,
            },
            {
                "visual_description": "A woman in her apartment walking toward the kitchen. Her phone buzzes with multiple notifications — cyan light flashing from the screen. She stops walking, looks at the phone, and a slow knowing grin spreads across her face. She looks strategic, not surprised. Mastermind energy.",
                "visual_mood": "referral notifications, knowing grin, strategic expression, cyan phone flashes, mastermind",
                "duration": 3.0,
                "color_mood": "cool_cyan",
                "zoom_speed": 0.0005,
            },
            {
                "visual_description": "Five women on a FaceTime-style video call, all laughing and celebrating. The grid of their faces fills the screen. Each is in a different location. They all radiate excitement and connection. Squad energy. One tile has a cyan glow border. Diverse, beautiful, confident women.",
                "visual_mood": "video call celebration, five women grid, diverse locations, squad energy, cyan accents",
                "duration": 2.5,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0004,
            },
        ],
    },

    # ── REEL 7: Delete the App ───────────────────────────────────────────
    {
        "title": "Delete the App",
        "caption": (
            "Some apps don't deserve your screen space.\n\n"
            "95% of what you earn. Instant USDC payouts. No middleman taking a fifth of your money.\n\n"
            "Link in bio. Founder spots closing soon.\n\n"
            "#creatorsoverplatforms #financialfreedom #usdcpayouts "
            "#openfans #newchapter #creatoreconomy #web3creators #knowyourworth"
        ),
        "scenes": [
            {
                "visual_description": "Extreme close-up of a phone screen showing app icons wobbling in iOS delete mode. A manicured finger with dark red nails and gold rings hovers over the delete X of a pink/blue gradient app icon. The wobbling icons feel anxious. Cool, slightly desaturated lighting.",
                "visual_mood": "phone screen macro, wobbling app icons, finger hovering, tense decision moment",
                "duration": 2.5,
                "color_mood": "desaturated_cold",
                "zoom_speed": 0.0004,
            },
            {
                "visual_description": "Close-up of a mid-20s woman's face. Natural glam makeup, hair pulled back. She's sitting on the edge of her bed in a dimly lit apartment. Her jaw is tight, she's exhaling through her nose, eyes narrowing. Determined. A single warm lamp behind her, rest of room in shadow.",
                "visual_mood": "determined face close-up, dim bedroom, warm lamp behind, decisive expression",
                "duration": 2.0,
                "color_mood": "dark_moody",
                "zoom_speed": 0.0006,
            },
            {
                "visual_description": "A woman's hand lowering a phone to her lap. She's sitting on a bed, and letting out a long breath. Her shoulders drop visibly. Tension leaving her body. The first moment of relief. Warm lighting that lifts slightly — dawn creeping in through a window.",
                "visual_mood": "relief exhale, shoulders dropping, dawn light creeping in, tension release",
                "duration": 2.5,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0005,
            },
            {
                "visual_description": "A woman standing at a window, having just pulled the curtain aside. Morning golden light floods across her face and the room. She's silhouetted against the bright window. She looks out, breathing freely. Not smiling yet — just free. Beautiful golden hour wash.",
                "visual_mood": "morning window, golden light flooding in, silhouette, freedom, new beginning",
                "duration": 2.5,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0006,
            },
            {
                "visual_description": "Close-up of a woman's face reflected in the cyan glow of a phone screen. She's browsing a website with electric cyan (#00AFF0) branding. The faintest smile starts at the corner of her mouth. Cyan light on her skin. Beautiful, photorealistic portrait.",
                "visual_mood": "cyan screen glow on face, beginning of smile, new discovery, hopeful",
                "duration": 2.5,
                "color_mood": "cool_cyan",
                "zoom_speed": 0.0007,
            },
        ],
    },

    # ── REEL 8: What $18K Buys ───────────────────────────────────────────
    {
        "title": "What 18K Buys",
        "caption": (
            "$18,000.\n\n"
            "That's the difference between keeping 80% and keeping 95% of what you earn.\n\n"
            "That's a furnished apartment. A trip with mom. A car you actually own.\n\n"
            "It's not abstract. It's your life.\n\n"
            "openfans.online -- link in bio\n\n"
            "#creatorfirst #earnmore #openfans #usdcpayouts "
            "#financialfreedom #creatoreconomy #web3 #knowyourworth #buildyourlife"
        ),
        "scenes": [
            {
                "visual_description": "A young woman standing in a completely empty apartment. White walls, bare hardwood floors, no furniture. Big windows with natural light streaming in. She's holding a single set of keys, looking around at the vast empty space. She wears an oversized blazer and gold earrings. Possibility and potential.",
                "visual_mood": "empty apartment, natural light, holding keys, vast potential, new beginning",
                "duration": 2.5,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0005,
            },
            {
                "visual_description": "The same apartment now being furnished — a delivery crew carrying in a beautiful deep teal velvet couch. The woman is directing them with one hand. Movement, purpose, things happening. Energy and excitement.",
                "visual_mood": "apartment filling up, teal couch delivery, directing movers, purposeful energy",
                "duration": 2.0,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0008,
            },
            {
                "visual_description": "An emotional airport reunion. A young woman holding a small bouquet of flowers at an arrivals gate. Her mother walks through — a 50s woman with modest clothing and a small bag. The mother's hand goes to her mouth, tears immediately. They are about to embrace. Deeply emotional.",
                "visual_mood": "airport reunion, mother and daughter, hand to mouth tears, bouquet, deeply emotional",
                "duration": 3.0,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0004,
            },
            {
                "visual_description": "Mother and daughter at a beachside restaurant at sunset, laughing over wine. Golden hour light. Arm in arm, heads close together. The ocean visible behind them. Pure joy and gratitude. Travel-diary aesthetic.",
                "visual_mood": "beachside dinner sunset, mother daughter laughing, wine, ocean view, golden joy",
                "duration": 2.5,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0006,
            },
            {
                "visual_description": "A young woman at a car dealership, running her hand along the hood of a sleek white car. She's in heels and a nice outfit. Camera is low, looking up at her. She looks at her reflection in the car's surface with a satisfied smile. Aspirational but achievable.",
                "visual_mood": "car dealership, hand on hood, low angle, aspirational, satisfied smile, white car",
                "duration": 2.0,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0007,
            },
            {
                "visual_description": "Back in the apartment — now fully furnished and beautiful. She's sitting on the teal velvet couch with her laptop, the screen casting cyan glow on her face. Warm apartment lighting. She closes the laptop gently and leans back, looking around at everything she built. Full circle. Contentment.",
                "visual_mood": "furnished apartment, teal couch, laptop cyan glow, contentment, full circle",
                "duration": 3.0,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0005,
            },
        ],
    },

    # ── REEL 9: The Bank Said No ─────────────────────────────────────────
    {
        "title": "The Bank Said No",
        "caption": (
            "They froze her account because they didn't approve of how she earned it.\n\n"
            "She earned every dollar. They took it anyway.\n\n"
            "So she found a platform that pays in USDC. Instant. No bank. No permission. "
            "No one between her and her money.\n\n"
            "openfans.online -- link in bio\n\n"
            "#financialsovereignty #openfans #creatorfreedom #usdcpayouts "
            "#cryptopayouts #nobankneeded #creatoreconomy #web3creators #knowyourworth"
        ),
        "scenes": [
            {
                "visual_description": "Close-up of a phone showing a banking app with a red 'Account Restricted' banner. The balance reads zero. Cold, clinical lighting. A woman's thumb taps the screen uselessly. Macro lens on the phone, everything else blurred.",
                "visual_mood": "banking app restricted, red banner, zero balance, clinical cold, helpless tapping",
                "duration": 2.5,
                "color_mood": "desaturated_cold",
                "zoom_speed": 0.0004,
            },
            {
                "visual_description": "A woman at her kitchen table, phone pressed to her ear, other hand gripping the edge of the table. Her jaw is set. She looks humiliated — not crying, not angry, just quietly devastated. The quiet kind of despair. Harsh overhead fluorescent lighting.",
                "visual_mood": "phone call, jaw set, quiet humiliation, fluorescent kitchen, gripping table",
                "duration": 2.5,
                "color_mood": "desaturated_cold",
                "zoom_speed": 0.0005,
            },
            {
                "visual_description": "Quick close-up of bills on a counter — a rent check unsigned, an empty fridge interior with bare shelves, a laptop showing an overdue notice. Cold, clinical, oppressive framing. Financial suffocation.",
                "visual_mood": "bills and empty fridge, overdue notices, clinical cold framing, suffocation",
                "duration": 2.0,
                "color_mood": "desaturated_cold",
                "zoom_speed": 0.0006,
            },
            {
                "visual_description": "A woman sitting on her bed in the dark, phone in hand. The phone screen shifts to cyan — her face illuminated by OpenFans-colored light. Her eyes widen with recognition. She sits up straighter, leans in. The turning point. Cyan is the only color in the dark room.",
                "visual_mood": "dark bedroom, cyan phone discovery, eyes widening, sitting up, turning point",
                "duration": 2.5,
                "color_mood": "cool_cyan",
                "zoom_speed": 0.0006,
            },
            {
                "visual_description": "A woman at her desk with a ring light on — she's been creating content. Her phone buzzes and she picks it up. Close-up shows a crypto wallet notification with USDC received. She exhales slowly — deep physical relief. Her shoulders drop. Warm ring light and cyan phone glow mix on her face.",
                "visual_mood": "ring light creator desk, crypto payout notification, deep relief exhale, warm and cyan light",
                "duration": 3.0,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0005,
            },
            {
                "visual_description": "The same kitchen from the opening, but now transformed. The fridge is full. The rent check is signed and sealed. She's standing at the counter pouring water, leaning against it, just existing peacefully in her own space. Warm golden light. Financial sovereignty achieved.",
                "visual_mood": "transformed kitchen, full fridge, warm golden light, peaceful standing, sovereignty",
                "duration": 2.5,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0005,
            },
        ],
    },

    # ── REEL 10: First Day on OpenFans ───────────────────────────────────
    {
        "title": "First Day on OpenFans",
        "caption": (
            "Day one.\n\n"
            "One sign-up. One profile. One post. One subscriber. One payout straight to her wallet.\n\n"
            "Every creator empire started exactly like this.\n\n"
            "Founder spots open now. openfans.online -- link in bio.\n\n"
            "#dayone #openfans #creatorfirst #usdcpayouts "
            "#creatoreconomy #firstsubscriber #buildyourbrand #web3creators #starttoday"
        ),
        "scenes": [
            {
                "visual_description": "Close-up overhead shot of hands over a laptop keyboard. The laptop screen shows a sign-up page with cyan and orange branding. She cracks her knuckles — a ritualistic 'let's do this' gesture. Then starts typing fast, committed. Cozy room with fairy lights visible.",
                "visual_mood": "overhead keyboard shot, sign-up page cyan glow, knuckle crack, committed typing, fairy lights",
                "duration": 2.5,
                "color_mood": "cool_cyan",
                "zoom_speed": 0.0006,
            },
            {
                "visual_description": "A woman biting her lip in concentration, looking at her laptop. She's building something — her expression shows focus and excitement. Warm bedroom lighting, fairy lights on the wall behind her. Cyan laptop glow on her face. She tilts her head evaluating, then nods with approval.",
                "visual_mood": "concentrating on laptop, biting lip, fairy lights, cyan glow, nodding approval",
                "duration": 2.5,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0007,
            },
            {
                "visual_description": "A woman lying on her bed with a phone on her chest, staring at the ceiling. She's waiting. The room is getting darker — afternoon turning to evening. She looks restless and anxious, checking her phone, putting it down, picking it up again. Anticipation.",
                "visual_mood": "waiting on bed, phone on chest, ceiling stare, restless anticipation, dimming light",
                "duration": 2.5,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0004,
            },
            {
                "visual_description": "A woman sitting bolt upright in bed, phone pressed against her chest with both hands, face showing pure genuine shock and joy. She has the widest, most authentic smile. Warm fairy-light bokeh in the background. She just got her first subscriber. Pillow beside her. Raw, unperformative joy.",
                "visual_mood": "pure joy reaction, phone to chest, bolt upright, fairy light bokeh, genuine shock smile",
                "duration": 3.0,
                "color_mood": "warm_golden",
                "zoom_speed": 0.0005,
            },
            {
                "visual_description": "Close-up of a woman's face looking at a phone screen. The screen shows a crypto wallet with a small USDC amount — her first payout. She touches the screen softly, making sure it's real. OpenFans cyan glow illuminates the bottom half of her face. Fairy lights create soft bokeh behind her. Emotional, quiet, powerful.",
                "visual_mood": "first payout close-up, touching screen softly, cyan glow on face, fairy bokeh, emotional",
                "duration": 3.0,
                "color_mood": "cool_cyan",
                "zoom_speed": 0.0004,
            },
            {
                "visual_description": "A woman sitting at her desk, laptop and phone both glowing cyan, lit entirely by the screens. She's not looking at the camera — she's looking at her dashboard, one hand on her chin, planning her next post. The faintest confident smile. Not celebrating. Building. The beginning of something.",
                "visual_mood": "dual cyan screen glow, planning expression, building energy, chin on hand, quiet confidence",
                "duration": 2.5,
                "color_mood": "cool_cyan",
                "zoom_speed": 0.0005,
            },
        ],
    },
]


# =============================================================================
# PIPELINE ORCHESTRATION
# =============================================================================

def produce_reel(reel_def: dict) -> dict | None:
    """Produce a single reel from its definition."""
    return producer.run(reel_def)


def post_reel(reel_result: dict, caption: str) -> dict:
    """Post a produced reel to Instagram."""
    return publisher.run(reel_result, caption)


def run_pipeline(start: int = 1, end: int = 10, post: bool = True, only: int | None = None):
    """Run the full pipeline: produce and post reels."""
    if only is not None:
        indices = [only - 1]
    else:
        indices = list(range(start - 1, min(end, len(REELS))))

    total = len(indices)
    results = []

    for i, idx in enumerate(indices):
        reel_def = REELS[idx]
        reel_num = idx + 1

        print(f"\n{'=' * 60}")
        print(f"  OPENFANS REEL {reel_num}/{len(REELS)}: {reel_def['title']}")
        print(f"  ({i + 1}/{total} in this batch)")
        print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'=' * 60}")

        # Produce the reel
        reel_result = produce_reel(reel_def)
        if not reel_result:
            print(f"\n[PIPELINE] Reel {reel_num} production FAILED. Skipping.")
            results.append({"reel": reel_num, "title": reel_def["title"], "ok": False, "stage": "producer"})
            continue

        print(f"\n[PIPELINE] Reel {reel_num} produced: {reel_result['file']}")

        # Post if requested
        if post:
            caption = reel_def["caption"]
            post_result = post_reel(reel_result, caption)
            results.append({
                "reel": reel_num,
                "title": reel_def["title"],
                "ok": post_result.get("ok", False),
                "stage": "complete",
                "file": reel_result["file"],
            })

            if post_result.get("ok"):
                print(f"[PIPELINE] Reel {reel_num} POSTED successfully!")
            else:
                print(f"[PIPELINE] Reel {reel_num} post may have failed.")
        else:
            results.append({
                "reel": reel_num,
                "title": reel_def["title"],
                "ok": True,
                "stage": "produced",
                "file": reel_result["file"],
            })

        # Rate limit: wait 70 minutes before next post
        if post and i < total - 1:
            next_reel = REELS[indices[i + 1]]
            print(f"\n[PIPELINE] Rate limit: waiting 70 minutes before reel {indices[i + 1] + 1} ({next_reel['title']})...")
            print(f"[PIPELINE] Next post at: {datetime.fromtimestamp(time.time() + RATE_LIMIT_SECONDS).strftime('%H:%M:%S')}")
            time.sleep(RATE_LIMIT_SECONDS)

    # Summary
    print(f"\n{'=' * 60}")
    print(f"  PIPELINE COMPLETE — {len(results)} reels processed")
    print(f"{'=' * 60}")
    for r in results:
        status = "POSTED" if r.get("stage") == "complete" and r["ok"] else (
            "PRODUCED" if r.get("stage") == "produced" else "FAILED"
        )
        print(f"  Reel {r['reel']}: {r['title']} — {status}")

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OpenFans Reel Production Pipeline")
    parser.add_argument("--no-post", action="store_true", help="Produce reels without posting")
    parser.add_argument("--start", type=int, default=1, help="Start from reel N (default: 1)")
    parser.add_argument("--end", type=int, default=10, help="End at reel N (default: 10)")
    parser.add_argument("--only", type=int, help="Only produce/post reel N")
    parser.add_argument("--preview", action="store_true", help="Produce reel 1 and open it")

    args = parser.parse_args()

    if args.preview:
        result = run_pipeline(only=1, post=False)
        if result and result[0].get("file"):
            import subprocess
            subprocess.Popen(["start", "", result[0]["file"]], shell=True)
    else:
        run_pipeline(
            start=args.start,
            end=args.end,
            post=not args.no_post,
            only=args.only,
        )
