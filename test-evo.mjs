const url = 'https://devevo.nubetech.shop/instance/create';
const headers = {
  'apikey': '1915756f00448683ee57999c518f808a',
  'Content-Type': 'application/json'
};
const body = JSON.stringify({
  instanceName: 'test-from-script-1234',
  token: 'test',
  qrcode: true,
  integration: 'WHATSAPP-BAILEYS'
});

console.log("Fetching: " + url);
try {
  const res = await fetch(url, { method: 'POST', headers, body });
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Response JSON:", data);
} catch (e) {
  console.error("Error fetching:", e);
}
