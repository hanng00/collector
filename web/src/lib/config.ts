export const getBackendUrl = () => {
  // `sam local start-api` defaults to 3000.
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
};