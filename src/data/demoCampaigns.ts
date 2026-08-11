import type { CampaignAnalysisRequest } from "@/lib/thincApi";

export type DemoCampaignRow = {
  id: string;
  name: string;
  goal: string;
  status: "active" | "paused";
  spend: number;
  leads: number;
  delivered: number;
  metaCpa: number;
  realCpa: number;
  gap: string;
  risk?: boolean;
};

export const demoCampaignRows: DemoCampaignRow[] = [
  { id: "karohat-ramadan", name: "Karohat رمضان", goal: "Conversions", status: "active", spend: 12450, leads: 327, delivered: 127, metaCpa: 38, realCpa: 98, gap: "+158%" },
  { id: "air-fryer-generic-q2", name: "Air Fryer Generic Q2", goal: "Lead Gen", status: "active", spend: 9820, leads: 218, delivered: 77, metaCpa: 45, realCpa: 128, gap: "+184%" },
  { id: "free-event-lead-gen", name: "Free Event Lead Gen", goal: "Lead Gen", status: "active", spend: 7350, leads: 237, delivered: 99, metaCpa: 31, realCpa: 74, gap: "+139%" },
  { id: "retargeting-whatsapp", name: "Retargeting WhatsApp", goal: "Messages", status: "active", spend: 4280, leads: 195, delivered: 104, metaCpa: 22, realCpa: 41, gap: "+86%" },
  { id: "home-summer-26", name: "منتجات منزلية صيف 26", goal: "Conversions", status: "paused", spend: 1920, leads: 70, delivered: 5, metaCpa: 27, realCpa: 384, gap: "+1322%", risk: true },
];

export const karohatCampaignAnalysisPayload: CampaignAnalysisRequest = {
  product: {
    name: "Karohat Air Fryer 5L",
    cost: 245,
    price: 500,
    inventory_units: 500,
    category: "Home Appliances",
    positioning: "Practical household upgrade with clear savings and safety proof",
    target_market: "Egypt",
  },
  campaign: {
    name: "Karohat رمضان",
    spend: 12450,
    meta_leads: 327,
    confirmed_orders: 127,
    delivered_orders: 98,
    returned_orders: 29,
    channel: "Meta Ads",
    objective: "Conversions",
    time_window_days: 30,
  },
  economics: {
    shipping_success_cost: 45,
    shipping_return_cost: 25,
    packaging_cost_per_order: 15,
    overhead: 500,
    vat_rate: 0.14,
  },
};

export const demoModeNotice = "Demo Mode — numbers are illustrative and not connected to live accounts.";
