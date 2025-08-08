// iTwin Authentication Configuration
export const authConfig = {
  clientId: import.meta.env.VITE_CLIENT_ID, // Your client ID from developer.bentley.com
  redirectUri: `${window.location.origin}/`,
  postSignoutRedirectUri: `${window.location.origin}/`,
  scope: "itwin-platform",
  authority: "https://ims.bentley.com",
  responseType: "code" as const,
};
