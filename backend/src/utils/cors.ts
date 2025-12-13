export function withCors(headers: Record<string, string> = {}) {
  return {
    ...headers,
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
    "Access-Control-Allow-Origin": "*",
  };
}
