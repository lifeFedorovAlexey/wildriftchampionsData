export function GET() {
  return Response.json(
    { error: "api_route_not_found" },
    {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
