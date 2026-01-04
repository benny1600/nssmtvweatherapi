exports.handler = async (event) => {
  try {
    const qs = event.queryStringParameters || {};
    const parkRaw = (qs.park || "epcot").trim();
    const units = (qs.units || "us").trim();

    // same-site base URL
    const host = event.headers?.host;
    const base = host ? `https://${host}` : "https://nssmtvweatherapi.netlify.app";

    const url =
      `${base}/.netlify/functions/weather?park=${encodeURIComponent(parkRaw)}&units=${encodeURIComponent(units)}`;

    const resp = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await resp.json();

    if (!data.ok) {
      return text(200, `I couldn't get weather for "${parkRaw}" right now.`);
    }

    const unitSym = (data.units === "metric") ? "°C" : "°F";

   const rainNow = (data.rainChanceNow == null) ? "N/A" : `${data.rainChanceNow}%`;

const msg =
  `Weather at ${data.park}: ${Math.round(data.temp)}${unitSym}, ` +
  `${data.conditions || "Conditions unavailable"}. ` +
  `Rain now: ${rainNow}.`;


    return text(200, msg);
  } catch (e) {
    return text(200, `I couldn't get weather right now.`);
  }
};

function text(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body,
  };
}



