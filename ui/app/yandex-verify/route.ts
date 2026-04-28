const YANDEX_VERIFICATION_CODE = "v253159vnegi5s8d";

export async function GET() {
  return new Response(YANDEX_VERIFICATION_CODE, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}
