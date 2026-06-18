/** 5 credits = 1 complete video render */
export const CREDITS_PER_VIDEO = 5;
export const FREE_PLAN_CREDITS = 5;
export const FREE_PLAN_VIDEOS = 1;
export const PRO_PLAN_CREDITS = 30;
export const PRO_PLAN_VIDEOS = 6;
export const PRO_PLAN_PRICE = 29;

export function videosFromCredits(credits: number): number {
  return Math.floor(credits / CREDITS_PER_VIDEO);
}

export function proPricePerVideo(): string {
  return `$${(PRO_PLAN_PRICE / PRO_PLAN_VIDEOS).toFixed(2)}`;
}
