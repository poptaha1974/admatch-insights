import { create } from "zustand";

export type PlannerInputs = {
  productName: string;
  cost: number;
  price: number;
  minComp: number;
  maxComp: number;
  leadsPerDay: number;
  cvr: number;
  cpc: number;
  confirmRate: number;
  deliveryRate: number;
  damageRate: number;
  overhead: number;
  packagingPerUnit: number;
  shippingSuccess: number;
  shippingReturn: number;
  vatRate: number;
  inventory: number;
};

export type PlannerOutputs = {
  confirmedCount: number;
  deliveredCount: number;
  netDelivered: number;
  revenue: number;
  cogs: number;
  adSpend: number;
  shippingCost: number;
  packagingCost: number;
  tax: number;
  totalExpenses: number;
  netProfit: number;
  realCpa: number;
  roas: number;
  roi: number;
  breakEven: number | "مستحيل";
  daysOfInventory: number;
  pricingStatus: "low" | "ok" | "high";
};

const defaults: PlannerInputs = {
  productName: "Karohat Air Fryer 5L",
  cost: 245,
  price: 500,
  minComp: 450,
  maxComp: 650,
  leadsPerDay: 28,
  cvr: 2,
  cpc: 2.5,
  confirmRate: 75,
  deliveryRate: 70,
  damageRate: 3,
  overhead: 500,
  packagingPerUnit: 15,
  shippingSuccess: 45,
  shippingReturn: 25,
  vatRate: 14,
  inventory: 500,
};

export function compute(i: PlannerInputs): PlannerOutputs {
  const confirmedCount = i.leadsPerDay * (i.confirmRate / 100);
  const deliveredCount = confirmedCount * (i.deliveryRate / 100);
  const damaged = deliveredCount * (i.damageRate / 100);
  const netDelivered = Math.max(deliveredCount - damaged, 0);
  const revenue = netDelivered * i.price;
  const cogs = netDelivered * i.cost;
  const cpl = i.cvr > 0 ? i.cpc * (1 / (i.cvr / 100)) : 0;
  const adSpend = i.leadsPerDay * cpl;
  const shippingCost =
    deliveredCount * i.shippingSuccess + Math.max(confirmedCount - deliveredCount, 0) * i.shippingReturn;
  const packagingCost = confirmedCount * i.packagingPerUnit;
  const taxableBase = Math.max(revenue - cogs, 0);
  const tax = taxableBase * (i.vatRate / 100);
  const totalExpenses = cogs + adSpend + shippingCost + packagingCost + i.overhead + tax;
  const netProfit = revenue - totalExpenses;
  const realCpa = netDelivered > 0 ? adSpend / netDelivered : Infinity;
  const roas = adSpend > 0 ? revenue / adSpend : 0;
  const roi = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0;
  const perUnitContribution =
    i.price - i.cost - (netDelivered > 0 ? adSpend / netDelivered : 0) - i.shippingSuccess - i.packagingPerUnit;
  const breakEven: number | "مستحيل" =
    netProfit < 0 || perUnitContribution <= 0 ? "مستحيل" : Math.ceil(i.overhead / perUnitContribution);
  const daysOfInventory = netDelivered > 0 ? Math.floor(i.inventory / netDelivered) : 0;
  const pricingStatus: "low" | "ok" | "high" =
    i.price < i.minComp ? "low" : i.price > i.maxComp ? "high" : "ok";

  return {
    confirmedCount,
    deliveredCount,
    netDelivered,
    revenue,
    cogs,
    adSpend,
    shippingCost,
    packagingCost,
    tax,
    totalExpenses,
    netProfit,
    realCpa,
    roas,
    roi,
    breakEven,
    daysOfInventory,
    pricingStatus,
  };
}

type Store = {
  inputs: PlannerInputs;
  outputs: PlannerOutputs;
  set: <K extends keyof PlannerInputs>(k: K, v: PlannerInputs[K]) => void;
  loadFromCampaign: (id: string) => void;
};

export const usePlannerStore = create<Store>((set) => ({
  inputs: defaults,
  outputs: compute(defaults),
  set: (k, v) =>
    set((s) => {
      const inputs = { ...s.inputs, [k]: v };
      return { inputs, outputs: compute(inputs) };
    }),
  loadFromCampaign: (id) =>
    set((s) => {
      const map: Record<string, Partial<PlannerInputs>> = {
        karohat: { productName: "Karohat رمضان", cost: 245, price: 500, leadsPerDay: 30, cvr: 2.2, cpc: 2.4, confirmRate: 78, deliveryRate: 72 },
      };
      const inputs = { ...s.inputs, ...(map[id] ?? map.karohat) };
      return { inputs, outputs: compute(inputs) };
    }),
}));
