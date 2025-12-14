export const getPublicAppUrl = () => {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";
};