import gzip
import json
import os
import re
import urllib.request

APP_ROOT = r"C:\Users\Usuario\Desktop\CS\CS2Escrow"
PUBLIC_DIR = os.path.join(APP_ROOT, "public")
FONTS_DIR = os.path.join(PUBLIC_DIR, "fonts")
os.makedirs(FONTS_DIR, exist_ok=True)


def fetch_bytes(url: str, timeout: int = 30) -> bytes:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept-Encoding": "gzip, identity",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
        if raw[:2] == b"\x1f\x8b":
            return gzip.decompress(raw)
        return raw


def try_download_cs_font():
    """Intenta descargar cs_regular.ttf desde repos públicos open-source."""
    candidates = [
        "https://raw.githubusercontent.com/h2337/cs-font/master/cs_regular.ttf",
        "https://raw.githubusercontent.com/searchivarius/cs-font/master/cs_regular.ttf",
        "https://cdn.jsdelivr.net/gh/FontFaceKit/counter-strike@master/fonts/cs_regular.ttf",
        "https://dl.dafont.com/dl/?f=counter_strike",
    ]
    import io
    import zipfile

    out_ttf = os.path.join(FONTS_DIR, "cs_regular.ttf")
    for url in candidates:
        try:
            data = fetch_bytes(url, timeout=15)
            if data[:4] in (b"\x00\x01\x00\x00", b"OTTO", b"true"):
                with open(out_ttf, "wb") as f:
                    f.write(data)
                print(f"FONT OK (direct): {url} ({len(data):,} B)")
                return True
            if data[:2] == b"PK":
                with zipfile.ZipFile(io.BytesIO(data)) as zf:
                    for name in zf.namelist():
                        if name.lower().endswith(".ttf"):
                            ttf = zf.read(name)
                            with open(out_ttf, "wb") as f:
                                f.write(ttf)
                            print(f"FONT OK (zip {name}): {url} ({len(ttf):,} B)")
                            return True
        except Exception as e:
            print(f"Font candidate failed ({url}): {e}")
    print("FONT: Could not download cs_regular.ttf automatically; will fallback to tactical Google Font.")
    return False


def pick_price(prices_steam: dict, prices_csfloat: dict, skin_name: str, wear: str, stattrak: bool = False):
    prefix = "StatTrak™ " if stattrak else ""
    candidates = [f"{prefix}{skin_name} ({wear})"] if wear != "NONE" else [skin_name]
    for mhn in candidates:
        # Prefer CSFloat P2P price, fallback to Steam price
        p_cf = prices_csfloat.get(mhn)
        cf_val = None
        if isinstance(p_cf, dict):
            cf_val = p_cf.get("price")
        elif isinstance(p_cf, (int, float)):
            cf_val = p_cf

        p_st = prices_steam.get(mhn)
        st_val = None
        if isinstance(p_st, dict):
            st_val = p_st.get("last_24h") or p_st.get("last_7d") or p_st.get("last_30d") or p_st.get("last_90d")
        elif isinstance(p_st, (int, float)):
            st_val = p_st

        if cf_val and cf_val > 0.5:
            steam_ref = st_val if (st_val and st_val > cf_val) else round(cf_val * 1.14, 2)
            return round(float(cf_val), 2), round(float(steam_ref), 2), mhn
        if st_val and st_val > 0.5:
            p2p = round(float(st_val) * 0.86, 2)
            return p2p, round(float(st_val), 2), mhn
    return None, None, None


def get_wear_for_skin(min_f: float, max_f: float, preferred=None):
    wears = [
        ("Factory New", "FN", 0.00, 0.07),
        ("Minimal Wear", "MW", 0.07, 0.15),
        ("Field-Tested", "FT", 0.15, 0.38),
        ("Well-Worn", "WW", 0.38, 0.45),
        ("Battle-Scarred", "BS", 0.45, 1.00),
    ]
    if preferred:
        for w_name, w_code, lo, hi in wears:
            if w_name == preferred and min_f < hi and max_f > lo:
                f_lo = max(min_f, lo)
                f_hi = min(max_f, hi)
                return w_name, w_code, round(f_lo + (f_hi - f_lo) * 0.32, 4)
    for w_name, w_code, lo, hi in wears:
        if min_f < hi and max_f > lo:
            f_lo = max(min_f, lo)
            f_hi = min(max_f, hi)
            return w_name, w_code, round(f_lo + (f_hi - f_lo) * 0.28, 4)
    return "Field-Tested", "FT", 0.2145


def map_category(cat_name: str, weapon_name: str):
    c = (cat_name or "").lower()
    w = (weapon_name or "").lower()
    if "knive" in c or "knife" in w or "bayonet" in w or "karambit" in w or "daggers" in w:
        return "knives"
    if "glove" in c or "gloves" in w or "wraps" in w:
        return "gloves"
    if "pistol" in c:
        return "pistols"
    if "rifle" in c or "smg" in c or "heavy" in c:
        return "rifles"
    return "rifles"


def map_rarity(rarity_name: str):
    r = (rarity_name or "").lower()
    if "extraordinary" in r or "contraband" in r:
        return "gold"
    if "covert" in r:
        return "covert"
    if "classified" in r:
        return "classified"
    if "restricted" in r:
        return "restricted"
    return "milspec"


def main():
    has_cs_font = try_download_cs_font()

    print("Downloading ByMykel skins.json...")
    skins = json.loads(fetch_bytes("https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json"))
    print(f"Loaded {len(skins)} skins.")

    print("Downloading ByMykel crates.json...")
    crates = json.loads(fetch_bytes("https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/crates.json"))
    print(f"Loaded {len(crates)} crates.")

    print("Downloading CSGOTrader steam.json & csfloat.json...")
    prices_steam = json.loads(fetch_bytes("https://prices.csgotrader.app/latest/steam.json"))
    prices_csfloat = json.loads(fetch_bytes("https://prices.csgotrader.app/latest/csfloat.json"))
    print(f"Loaded prices -> steam:{len(prices_steam)}, csfloat:{len(prices_csfloat)}")

    # Featured priority list (matching the client's mockups + iconic CS2 items)
    priority_names = [
        ("M4A1-S | Player Two", "Factory New", False, 0),
        ("★ M9 Bayonet | Crimson Web", "Minimal Wear", False, 7),
        ("★ M9 Bayonet | Lore", "Factory New", False, 0),
        ("★ Karambit | Doppler", "Factory New", False, 7),
        ("★ Butterfly Knife | Lore", "Factory New", False, 0),
        ("AWP | Asiimov", "Field-Tested", False, 7),
        ("AK-47 | Vulcan", "Factory New", False, 0),
        ("M4A1-S | Printstream", "Factory New", False, 0),
        ("AWP | Dragon Lore", "Factory New", False, 7),
        ("★ Sport Gloves | Vice", "Minimal Wear", False, 0),
        ("★ Specialist Gloves | Crimson Kimono", "Field-Tested", False, 7),
        ("Desert Eagle | Blaze", "Factory New", False, 0),
        ("USP-S | Kill Confirmed", "Factory New", True, 0),
        ("Glock-18 | Fade", "Factory New", False, 7),
        ("AK-47 | Fire Serpent", "Minimal Wear", False, 0),
        ("AWP | Gungnir", "Factory New", False, 0),
        ("★ Butterfly Knife | Fade", "Factory New", False, 0),
        ("★ Karambit | Gamma Doppler", "Factory New", False, 7),
        ("M4A4 | Howl", "Minimal Wear", False, 0),
        ("AK-47 | Wild Lotus", "Field-Tested", False, 0),
        ("AWP | Printstream", "Factory New", False, 0),
        ("M4A1-S | Blue Phosphor", "Factory New", False, 0),
        ("★ Skeleton Knife | Fade", "Factory New", False, 7),
        ("★ Talon Knife | Doppler", "Factory New", False, 0),
        ("★ Sport Gloves | Pandora's Box", "Field-Tested", False, 7),
        ("★ Driver Gloves | King Snake", "Minimal Wear", False, 0),
        ("Desert Eagle | Printstream", "Factory New", True, 0),
        ("USP-S | Printstream", "Factory New", False, 0),
        ("AK-47 | Inheritance", "Factory New", False, 0),
        ("AK-47 | Bloodsport", "Factory New", True, 0),
        ("M4A4 | Temukau", "Factory New", False, 0),
        ("AWP | Fade", "Factory New", False, 0),
        ("AWP | Hyper Beast", "Factory New", False, 0),
        ("AWP | Containment Breach", "Factory New", False, 7),
        ("Glock-18 | Gamma Doppler", "Factory New", False, 0),
        ("P250 | See Ya Later", "Factory New", False, 0),
        ("Five-SeveN | Hyper Beast", "Factory New", False, 0),
        ("★ M9 Bayonet | Fade", "Factory New", False, 0),
        ("★ M9 Bayonet | Doppler", "Factory New", False, 0),
        ("★ Butterfly Knife | Doppler", "Factory New", False, 7),
        ("★ Karambit | Marble Fade", "Factory New", False, 0),
        ("★ Karambit | Lore", "Minimal Wear", False, 0),
    ]

    sellers = [
        {"steamName": "Valkyrie_CS2", "steamLevel": 84, "cs2Hours": 4120, "accountYears": 9, "vacClean": True, "completedTrades": 318, "steamGuardMobile": True},
        {"steamName": "Kuroi_Trader", "steamLevel": 62, "cs2Hours": 2840, "accountYears": 7, "vacClean": True, "completedTrades": 194, "steamGuardMobile": True},
        {"steamName": "NovaTrade_VE", "steamLevel": 41, "cs2Hours": 1650, "accountYears": 5, "vacClean": True, "completedTrades": 87, "steamGuardMobile": False},
        {"steamName": "SniperLatam", "steamLevel": 112, "cs2Hours": 5920, "accountYears": 11, "vacClean": True, "completedTrades": 512, "steamGuardMobile": True},
        {"steamName": "FloatHunter_SOL", "steamLevel": 55, "cs2Hours": 2190, "accountYears": 6, "vacClean": True, "completedTrades": 143, "steamGuardMobile": False},
        {"steamName": "DeltaOps_Skins", "steamLevel": 73, "cs2Hours": 3310, "accountYears": 8, "vacClean": True, "completedTrades": 229, "steamGuardMobile": True},
    ]

    by_name = {}
    for s in skins:
        nm = s.get("name")
        if nm and s.get("image") and nm not in by_name:
            by_name[nm] = s

    catalog = []
    used_names = set()

    def build_entry(s, pref_wear=None, stattrak=False, force_escrow=None, featured=False, idx=0):
        name = s.get("name", "")
        if not name or not s.get("image"):
            return None
        min_f = s.get("min_float")
        max_f = s.get("max_float")
        min_f = 0.0 if min_f is None else float(min_f)
        max_f = 1.0 if max_f is None else float(max_f)

        # Try preferred wear, then available wears until priced
        wear_order = [pref_wear] if pref_wear else []
        wear_order += ["Factory New", "Minimal Wear", "Field-Tested", "Well-Worn", "Battle-Scarred"]
        chosen = None
        for w in wear_order:
            if not w:
                continue
            w_name, w_code, f_val = get_wear_for_skin(min_f, max_f, w)
            price, steam_ref, mhn = pick_price(prices_steam, prices_csfloat, name, w_name, stattrak=stattrak)
            if price is not None:
                chosen = (w_name, w_code, f_val, price, steam_ref, mhn)
                break
        if not chosen:
            return None

        w_name, w_code, f_val, price, steam_ref, mhn = chosen
        weapon = (s.get("weapon") or {}).get("name") or name.split("|")[0].strip()
        skin_part = name.split("|")[1].strip() if "|" in name else name
        cat = map_category((s.get("category") or {}).get("name"), weapon)
        rarity_obj = s.get("rarity") or {}
        rarity = map_rarity(rarity_obj.get("name"))
        rarity_color = rarity_obj.get("color") or "#eb4b4b"

        seller = sellers[idx % len(sellers)]
        if force_escrow is not None:
            escrow_days = force_escrow
        else:
            escrow_days = 7 if (idx % 5 == 1) else 0

        escrow_elapsed = (idx % 5) + 1 if escrow_days == 7 else 0

        return {
            "id": s.get("id") or f"item-{idx}",
            "marketHashName": mhn,
            "name": name,
            "weapon": weapon,
            "skinName": skin_part,
            "category": cat,
            "rarity": rarity,
            "rarityName": rarity_obj.get("name") or "Covert",
            "rarityColor": rarity_color,
            "wear": w_code,
            "wearName": w_name,
            "floatValue": f_val,
            "minFloat": min_f,
            "maxFloat": max_f,
            "patternSeed": 100 + ((idx * 137) % 899),
            "statTrak": bool(stattrak and s.get("stattrak")),
            "priceUsdc": price,
            "steamMarketPrice": steam_ref,
            "image": s.get("image"),
            "inspectLink": f"steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198842019412A{39000000000 + idx * 17431}D{14189000000000000 + idx * 9123}",
            "tradeHoldDays": escrow_days,
            "escrowDaysElapsed": escrow_elapsed,
            "featured": featured,
            "seller": {
                **seller,
                "steamGuardMobile": escrow_days == 0,
            },
        }

    # 1. Add priority featured skins first
    for idx, (nm, pw, st, hold) in enumerate(priority_names):
        s = by_name.get(nm)
        if not s:
            continue
        entry = build_entry(s, pref_wear=pw, stattrak=st, force_escrow=hold, featured=True, idx=idx)
        if entry:
            catalog.append(entry)
            used_names.add(nm)

    # 2. Fill balanced real items across knives, gloves, rifles, pistols
    quotas = {"knives": 42, "gloves": 28, "rifles": 64, "pistols": 36}
    counts = {k: sum(1 for x in catalog if x["category"] == k) for k in quotas}

    # Prefer Covert / Classified / Extraordinary / popular weapons
    preferred_weapons = {
        "AK-47", "M4A1-S", "M4A4", "AWP", "Desert Eagle", "USP-S", "Glock-18",
        "P250", "Five-SeveN", "Tec-9", "CZ75-Auto", "P2000", "Dual Berettas",
        "SSG 08", "FAMAS", "Galil AR", "SG 553", "AUG", "MP9", "MAC-10", "P90",
    }

    for idx, s in enumerate(skins):
        nm = s.get("name", "")
        if not nm or nm in used_names or not s.get("image"):
            continue
        weapon = (s.get("weapon") or {}).get("name", "")
        cat = map_category((s.get("category") or {}).get("name"), weapon)
        if counts.get(cat, 0) >= quotas.get(cat, 0):
            continue
        r_name = (s.get("rarity") or {}).get("name", "").lower()
        if cat in ("rifles", "pistols") and weapon not in preferred_weapons:
            continue
        if cat in ("rifles", "pistols") and not any(k in r_name for k in ("covert", "classified", "restricted", "contraband")):
            continue
        entry = build_entry(s, pref_wear=None, stattrak=(idx % 9 == 0), force_escrow=None, featured=False, idx=len(catalog) + idx)
        if entry and entry["priceUsdc"] >= 3.0:
            catalog.append(entry)
            used_names.add(nm)
            counts[cat] = counts.get(cat, 0) + 1

    # 3. Add top real CS2 Cases (Cajas)
    priority_cases = [
        "Operation Bravo Case",
        "Gamma 2 Case",
        "Kilowatt Case",
        "Dreams & Nightmares Case",
        "Revolution Case",
        "Recoil Case",
        "Fracture Case",
        "Clutch Case",
        "Operation Riptide Case",
        "Operation Broken Fang Case",
        "Chroma 3 Case",
        "Spectrum 2 Case",
        "Prisma 2 Case",
        "CS:GO Weapon Case",
        "Gallery Case",
        "Fever Case",
    ]
    crate_by_name = {c.get("name"): c for c in crates if c.get("name") and c.get("image")}
    for c_idx, cname in enumerate(priority_cases):
        c = crate_by_name.get(cname)
        if not c:
            continue
        price, steam_ref, mhn = pick_price(prices_steam, prices_csfloat, cname, "NONE")
        if price is None:
            continue
        seller = sellers[c_idx % len(sellers)]
        catalog.append(
            {
                "id": c.get("id") or f"crate-{c_idx}",
                "marketHashName": mhn,
                "name": cname,
                "weapon": "Weapon Case",
                "skinName": cname,
                "category": "cases",
                "rarity": "gold" if price > 25 else "restricted",
                "rarityName": "Container",
                "rarityColor": "#e4ae39" if price > 25 else "#8847ff",
                "wear": "NONE",
                "wearName": "Sellada · Drop Oficial",
                "priceUsdc": price,
                "steamMarketPrice": steam_ref,
                "image": c.get("image"),
                "inspectLink": f"steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20M{c_idx + 9001}",
                "tradeHoldDays": 0 if c_idx % 4 != 3 else 7,
                "escrowDaysElapsed": 3 if c_idx % 4 == 3 else 0,
                "featured": c_idx < 3,
                "seller": {
                    **seller,
                    "steamGuardMobile": c_idx % 4 != 3,
                },
            }
        )

    out_path = os.path.join(PUBLIC_DIR, "catalog.json")
    payload = {
        "updatedAt": "2026-11-24T21:26:00-04:00",
        "sources": {
            "catalog": "ByMykel CSGO-API (Valve Steamstatic CDN)",
            "prices": "CSGOTrader (csfloat.json + steam.json)",
        },
        "hasCsFont": has_cs_font,
        "count": len(catalog),
        "items": catalog,
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))

    cat_summary = {}
    for it in catalog:
        cat_summary[it["category"]] = cat_summary.get(it["category"], 0) + 1
    print(f"SUCCESS! Wrote {len(catalog)} real CS2 items to {out_path} ({os.path.getsize(out_path):,} B)")
    print("Breakdown by category:", cat_summary)


if __name__ == "__main__":
    main()
