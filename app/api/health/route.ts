export async function GET() {
  return await fetch(`${process.env.OPENAI_SERVICE_PROVIDER}/health`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
}
