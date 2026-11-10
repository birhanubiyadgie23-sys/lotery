export default function handler(request, response) {
  response.setHeader("Cache-Control", "no-store, max-age=0");

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  return response.status(200).json({
    ok: true,
    service: "classroom-turn-picker"
  });
}
