exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const parkKey = (params.park || "epcot").toLowerCase().trim();
    const units = (params.units || "us").toLowerCase().trim(); // us or metric
    const key = process.env.VISUALCROSSING_KEY;

    if (!key) {
      return json(500, { ok: false, error: "Missing VISUALCROSSING_KEY env var" });
    }

    // Park dictionary (edit/add anytime)
    const PARKS = {
      "magic kingdom": { name: "Magic Kingdom", q: "28.4177,-81.5812" },
      "mk":            { name: "Magic Kingdom", q: "28.4177,-81.5812" },

      "epcot":         { name: "EPCOT", q: "28.3747,-81.5494" },

      "hollywood studios": { name: "Hollywood Studios", q: "28.3575,-81.5585" },
      "hs":            { name: "Hollywood Studios", q: "28.3575,-81.5585" },

      "animal kingdom": { name: "Animal Kingdom", q: "28.3553,-81.5901" },
      "ak":             { name: "Animal Kingdom", q: "28.3553,-81.5901" },

      "disney springs": { name: "Disney Springs", q: "28.3704,-81.5190" },
      "springs":        { name: "Disney Springs", q: "28.3704,-81.5190" },
    };

    const park = PARKS[parkKey] || {
      name: params.park || "EPCOT",
      q: params.park || "28.3747,-81.5494", // fallback: treat as location string or coords
    };

    const unitGroup = units === "metric" ? "metric" : "us";

    const url =
      "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/" +
      encodeURIComponent(park.q) +
      "?unitGroup=" + encodeURIComponent(unitGroup) +
      "&include=current,days" +
      "&key=" + encodeURIComponent(key) +
      "&contentType=json";

    const resp = await fetch(url, { headers: { Accept: "application/json" } });

    if (!resp.ok) {
      const text = await resp.text();
      return json(502, {
        ok: false,
        error: "Upstream error from Visual Crossing",
        status: resp.status,
        body: text,
      });
    }

    const data = await resp.json();
    const current = data.currentConditions || {};
    const today = (data.days && data.days[0]) ? data.days[0] : {};

    // Rain chance NOW (current), and TODAY (forecast)
    const rainChanceNow =
      (typeof current.precipprob === "number") ? Math.round(current.precipprob) : null;

    const rainChanceToday =
      (typeof today.precipprob === "number") ? Math.round(today.precipprob) :
      (typeof rainChanceNow === "number") ? rainChanceNow :
      null;

    const payload = {
      ok: true,
      park: park.name,
      units: unitGroup,

      temp: num(current.temp),
      feelslike: num(current.feelslike),
      conditions: current.conditions || null,
      icon: current.icon || today.icon || null,

      rainChanceNow,
      rainChanceToday,

      updatedEpoch: current.datetimeEpoch || null,
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
      body: JSON.stringify(payload),
    };
  } catch (err) {
    return json(500, { ok: false, error: String(err && err.message ? err.message : err) });
  }
};

function json(code, obj) {
  return {
    statusCode: code,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(obj),
  };
}

function num(v) {
  return (typeof v === "number" && Number.isFinite(v)) ? v : null;
}
