/** Central site / domain configuration for DocuForge */
export const SITE = {
  name: "DocuForge",
  legalName: "DocuForge",
  domain: "docuforge.pro",
  url: "https://docuforge.pro",
  email: "support@docuforge.pro",
  appPath: "/create",
} as const;

export const siteUrl = (path = "") =>
  `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
