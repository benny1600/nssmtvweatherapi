exports.handler = async (event) => {
  const qs = event.queryStringParameters || {};
  const park = qs.park || "epcot";
  const units = qs.units || "us";

  // Prefer Netlify-provided site URL if available
  const base =
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    (event.headers && event.headers.host ? `https://${event.headers.host}` : "");

  const url = `${base}/.netlify/functions/weather?park=${encodeURIComponent(park)}&units=${encodeURIComponent(units)}`;

  try {
    const resp = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await resp.json();

    if (!data.ok) return text(200, `I couldn't get weather for "${park}" right now.`);

    const unitSym = (data.units === "metric") ? "°C" : "°F";
    const rain = (data.rainChance === null) ? "N/A" : `${data.rainChance}%`;

    const msg =
      `Weather at ${data.park}: ${Math.round(data.temp)}${unitSym}, ` +
      `${data.conditions || "Conditions unavailable"}. ` +
      `Rain chance: ${rain}.`;

    return text(200, msg);
  } catch {
    return text(200, `I couldn't get weather for "${park}" right now.`);
  }
};

function text(code, body) {
  return {
    statusCode: code,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    body,
  };
}
