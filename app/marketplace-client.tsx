"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { CountryConfig } from "./country-config";
import { countryLinks } from "./country-config";

type Listing = {
  id: number;
  title: string;
  location: string;
  category: string;
  format: string;
  audience: string;
  price: number;
  vendor: string;
  tone: string;
  tag: string;
  latitude: number;
  longitude: number;
  hourlyViews: number;
  dailyViews: number;
  traffic: string;
  facing: string;
  illumination: string;
};

type CampaignCreativeMetadata = {
  width: number;
  height: number;
  duration?: number;
};

type CampaignCreativeRequirement = {
  listingId: number;
  title: string;
  format: string;
  physicalSize: string;
  width: number;
  height: number;
  staticArtworkSize: string;
};

type CreatedCampaign = {
  id: string;
  name: string;
  objective: string;
  status: "Draft" | "Owner review" | "Eligible";
  campaignType: string;
  budget: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  emirates: string[];
  adGroups: Array<{
    id: string;
    name: string;
    category: string;
    budget: number;
    billboardNames: string[];
  }>;
};

const testCampaignModel: CreatedCampaign = {
  id: "test-campaign-model",
  name: "AE-DS-DXB-ASNADS-LAUNCH",
  objective: "Brand awareness",
  status: "Eligible",
  campaignType: "Mixed",
  budget: 50000,
  startDate: "15/08/2026",
  endDate: "14/09/2026",
  createdAt: "2026-08-01T00:00:00.000Z",
  emirates: ["Dubai"],
  adGroups: [
    { id: "test-digital", name: "Digital Ad Group", category: "Digital Billboard", budget: 15000, billboardNames: ["City Walk Boulevard Screen", "Sheikh Zayed Road Premium Digital Screen"] },
    { id: "test-static", name: "Static Ad Group", category: "Static Billboard", budget: 35000, billboardNames: ["Al Khail Road Landmark"] },
  ],
};

type ListingAvailability = {
  sellingPlans: SellingPlan[];
  availableHours: number[];
  peakHours: number[];
  availableDays: string[];
  peakDays: string[];
};

const categories = [
  "All billboards",
  "Static Billboard",
  "Digital Billboard",
  "Digital Kiosk",
  "Mall Billboard",
  "Road Billboard",
  "Bridge",
  "Building",
];

const digitalKioskMalls = [
  "The Dubai Mall",
  "Mall of the Emirates",
  "Dubai Hills Mall",
  "Dubai Festival City Mall",
  "City Centre Mirdif",
  "City Centre Deira",
  "Ibn Battuta Mall",
  "Palm Jumeirah Mall — formerly Nakheel Mall",
  "Dubai Marina Mall",
  "BurJuman Mall",
];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayHours = Array.from({ length: 24 }, (_, hour) => hour);

type SellingPlan = "hourly_base" | "peak_hours" | "selected_days" | "peak_days" | "weekly" | "monthly";

type OwnerInventorySchedule = {
  plans: SellingPlan[];
  availableDays: string[];
  availableHours: number[];
  peakDays: string[];
  peakHours: number[];
  peakDayPercent: number;
  peakHourPercent: number;
};

const sellingPlanOptions: Array<{ id: SellingPlan; title: string; description: string }> = [
  { id: "hourly_base", title: "Hourly base", description: "Standard hours without peak surcharge" },
  { id: "peak_hours", title: "Peak hours only", description: "Advertisers book selected high-demand hours" },
  { id: "selected_days", title: "Selected days", description: "Standard daily rate on chosen days" },
  { id: "peak_days", title: "Peak days only", description: "Advertisers book selected high-demand days" },
  { id: "weekly", title: "Weekly", description: "Continuous seven-day booking" },
  { id: "monthly", title: "Monthly", description: "Long-term monthly booking" },
];

const campaignPlanTitles: Record<SellingPlan, string> = {
  hourly_base: "Hourly",
  selected_days: "Days",
  peak_hours: "Peak Hours",
  peak_days: "Peak Days",
  weekly: "Weekly",
  monthly: "Monthly",
};

const ownerScheduleTemplates: OwnerInventorySchedule[] = [
  {
    plans: ["hourly_base", "peak_hours", "selected_days", "peak_days", "monthly"],
    availableDays: weekDays,
    availableHours: Array.from({ length: 18 }, (_, index) => index + 6),
    peakDays: ["Fri", "Sat", "Sun"],
    peakHours: [7, 8, 9, 17, 18, 19, 20, 21],
    peakDayPercent: 25,
    peakHourPercent: 20,
  },
  {
    plans: ["hourly_base", "selected_days", "monthly"],
    availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    availableHours: Array.from({ length: 14 }, (_, index) => index + 8),
    peakDays: [],
    peakHours: [],
    peakDayPercent: 0,
    peakHourPercent: 0,
  },
  {
    plans: ["peak_hours", "peak_days", "monthly"],
    availableDays: ["Thu", "Fri", "Sat", "Sun"],
    availableHours: [8, 9, 10, 17, 18, 19, 20, 21, 22],
    peakDays: ["Fri", "Sat"],
    peakHours: [8, 9, 10, 17, 18, 19, 20, 21],
    peakDayPercent: 30,
    peakHourPercent: 25,
  },
  {
    plans: ["hourly_base", "peak_hours", "selected_days", "monthly"],
    availableDays: ["Sun", "Mon", "Tue", "Wed", "Thu"],
    availableHours: Array.from({ length: 17 }, (_, index) => index + 7),
    peakDays: [],
    peakHours: [7, 8, 9, 16, 17, 18, 19],
    peakDayPercent: 0,
    peakHourPercent: 18,
  },
  {
    plans: ["selected_days", "peak_days", "monthly"],
    availableDays: ["Wed", "Thu", "Fri", "Sat", "Sun"],
    availableHours: Array.from({ length: 12 }, (_, index) => index + 10),
    peakDays: ["Thu", "Fri", "Sat"],
    peakHours: [],
    peakDayPercent: 22,
    peakHourPercent: 0,
  },
];

const listings: Listing[] = [
  { id: 1, title: "Sheikh Zayed Road Mega Screen", location: "Trade Centre, Dubai", category: "Road Billboard", format: "Digital · 24 × 8 m", audience: "1.8M weekly views", price: 42000, vendor: "Skyline Outdoor", tone: "violet", tag: "High impact", latitude: 25.2285, longitude: 55.2867, hourlyViews: 10700, dailyViews: 257000, traffic: "Heavy · 8 traffic lanes", facing: "Northbound and southbound", illumination: "Digital LED · 24 hours" },
  { id: 2, title: "Dubai Mall Fashion Avenue", location: "Downtown Dubai", category: "Mall Billboard", format: "Digital · 12 × 6 m", audience: "920K weekly views", price: 28500, vendor: "Metro Media", tone: "amber", tag: "Premium", latitude: 25.1972, longitude: 55.2796, hourlyViews: 5500, dailyViews: 131000, traffic: "Premium mall footfall", facing: "Main atrium entrance", illumination: "Indoor digital LED" },
  { id: 3, title: "Al Khail Road Landmark", location: "Business Bay, Dubai", category: "Static Billboard", format: "Static · 18 × 6 m", audience: "740K weekly views", price: 18000, vendor: "Vista OOH", tone: "cyan", tag: "Best value", latitude: 25.1851, longitude: 55.2672, hourlyViews: 4400, dailyViews: 106000, traffic: "Heavy · 6 traffic lanes", facing: "Northbound traffic", illumination: "Front-lit static" },
  { id: 4, title: "Al Garhoud Bridge Gateway", location: "Garhoud, Dubai", category: "Bridge", format: "Digital · 30 × 4 m", audience: "1.2M weekly views", price: 34000, vendor: "BridgeLine Media", tone: "coral", tag: "New", latitude: 25.2408, longitude: 55.3518, hourlyViews: 7100, dailyViews: 171000, traffic: "Heavy bridge traffic", facing: "Dubai-bound traffic", illumination: "Digital LED · 24 hours" },
  { id: 5, title: "Marina Tower Wrap", location: "Dubai Marina", category: "Building", format: "Building · 42 × 16 m", audience: "680K weekly views", price: 52000, vendor: "Urban Canvas", tone: "blue", tag: "Iconic", latitude: 25.0806, longitude: 55.1403, hourlyViews: 4000, dailyViews: 97000, traffic: "Road and pedestrian traffic", facing: "Marina promenade", illumination: "Back-lit building wrap" },
  { id: 6, title: "City Walk Boulevard Screen", location: "City Walk, Dubai", category: "Digital Billboard", format: "Digital · 9 × 5 m", audience: "510K weekly views", price: 24000, vendor: "Lumina Ads", tone: "green", tag: "Available now", latitude: 25.2075, longitude: 55.2624, hourlyViews: 3000, dailyViews: 73000, traffic: "Retail and pedestrian traffic", facing: "Main boulevard", illumination: "Digital LED · 18 hours" },
];

const listingAvailability: Record<number, ListingAvailability> = {
  1: { sellingPlans: ["hourly_base", "peak_hours", "selected_days", "peak_days", "weekly", "monthly"], availableHours: [6,7,8,9,10,16,17,18,19,20,21,22], peakHours: [7,8,9,17,18,19,20], availableDays: weekDays, peakDays: ["Fri","Sat","Sun"] },
  2: { sellingPlans: ["hourly_base", "peak_hours", "selected_days", "peak_days", "weekly", "monthly"], availableHours: [10,11,12,13,14,15,16,17,18,19,20,21,22], peakHours: [17,18,19,20,21], availableDays: weekDays, peakDays: ["Thu","Fri","Sat","Sun"] },
  3: { sellingPlans: ["weekly", "monthly"], availableHours: [], peakHours: [], availableDays: weekDays, peakDays: [] },
  4: { sellingPlans: ["hourly_base", "peak_hours", "selected_days", "weekly", "monthly"], availableHours: [5,6,7,8,9,15,16,17,18,19,20], peakHours: [6,7,8,9,16,17,18,19], availableDays: ["Mon","Tue","Wed","Thu","Fri","Sat"], peakDays: [] },
  5: { sellingPlans: ["selected_days", "peak_days", "weekly", "monthly"], availableHours: [], peakHours: [], availableDays: weekDays, peakDays: ["Fri","Sat","Sun"] },
  6: { sellingPlans: ["hourly_base", "selected_days", "peak_days", "weekly", "monthly"], availableHours: [9,10,11,12,13,14,15,16,17,18,19,20,21,22], peakHours: [], availableDays: weekDays, peakDays: ["Fri","Sat"] },
};

const campaignObjectives = ["Brand awareness", "Product launch", "Store visits", "Event promotion", "Special offer"];
const emirates = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"];
const emirateCardImages: Record<string, string> = {
  Dubai: "/campaign/emirates/dubai.webp",
  "Abu Dhabi": "/campaign/emirates/abu-dhabi.webp",
  Sharjah: "/campaign/emirates/sharjah.webp",
  Ajman: "/campaign/emirates/ajman.webp",
  "Ras Al Khaimah": "/campaign/emirates/ras-al-khaimah.webp",
  Fujairah: "/campaign/emirates/fujairah.webp",
  "Umm Al Quwain": "/campaign/emirates/umm-al-quwain.webp",
};
const emirateAreas: Record<string, string[]> = {
  Dubai: ["Downtown Dubai", "Sheikh Zayed Road", "Dubai Marina", "Business Bay", "Jumeirah", "Deira"],
  "Abu Dhabi": ["Abu Dhabi Corniche", "Yas Island", "Al Reem Island", "Saadiyat Island", "Airport Road"],
  Sharjah: ["Al Majaz", "Al Khan", "University City", "Muwaileh", "Rolla"],
  Ajman: ["Ajman Corniche", "Al Jurf", "Al Nuaimiya", "City Centre Ajman"],
  "Ras Al Khaimah": ["Al Hamra", "Mina Al Arab", "Al Marjan Island", "RAK City"],
  Fujairah: ["Fujairah City", "Fujairah Corniche", "Sheikh Hamad Bin Abdullah Road"],
  "Umm Al Quwain": ["UAQ City", "Al Salamah", "Al Raas"],
};
const campaignBillboardTypes = [
  { label: "Static Billboards", matches: ["Static Billboard"], description: "Large-format roadside displays", image: "/campaign/uae-city-billboard.png" },
  { label: "Digital Billboards", matches: ["Digital Billboard"], description: "LED screens with flexible slots", image: "/campaign/uae-city-billboard.png" },
  { label: "Building", matches: ["Building"], description: "Façades, wraps and wall displays", image: "/campaign/building-advertising.png" },
  { label: "Mall Kiosk", matches: ["Mall Billboard", "Digital Kiosk"], description: "Premium indoor footfall locations", image: "/campaign/mall-digital-kiosk.png" },
  { label: "Road Kiosk", matches: ["Road Billboard"], description: "Roadside and street-level screens", image: "/campaign/uae-city-billboard.png" },
];

const campaignPlacementOptions = [
  { id: "road", label: "Road", description: "Highways, main roads and roadside locations", staticMatches: ["Static Billboard", "Road Billboard"], digitalMatches: ["Digital Billboard", "Road Billboard"] },
  { id: "mall", label: "Malls", description: "Shopping malls, indoor screens and kiosks", staticMatches: ["Mall Billboard"], digitalMatches: ["Mall Billboard", "Digital Kiosk"] },
  { id: "bridge", label: "Bridges", description: "Bridge panels and landmark crossings", staticMatches: ["Bridge"], digitalMatches: ["Bridge"] },
] as const;

const campaignBillboardCodes: Record<string, string> = {
  "Static Billboard": "SB",
  "Digital Billboard": "DB",
  Building: "BL",
  "Mall Billboard": "MK",
  "Digital Kiosk": "MK",
  "Road Billboard": "RK",
  Bridge: "BR",
};

const campaignEmirateCodes: Record<string, string> = {
  Dubai: "D",
  "Abu Dhabi": "A",
  Sharjah: "S",
  Ajman: "J",
  "Ras Al Khaimah": "R",
  Fujairah: "F",
  "Umm Al Quwain": "U",
};

const roundToEven = (value: number) => Math.max(2, Math.round(value / 2) * 2);

const getCampaignCreativeRequirement = (listing: Listing): CampaignCreativeRequirement => {
  const metricMatch = listing.format.match(/(\d+(?:\.\d+)?)\s*×\s*(\d+(?:\.\d+)?)\s*m/i);
  const metricWidth = metricMatch ? Number(metricMatch[1]) : 9;
  const metricHeight = metricMatch ? Number(metricMatch[2]) : 16;
  const isPortrait4k = /4k portrait/i.test(listing.format);
  const width = isPortrait4k
    ? 2160
    : metricWidth >= metricHeight
      ? 3840
      : roundToEven(3840 * metricWidth / metricHeight);
  const height = isPortrait4k
    ? 3840
    : metricWidth >= metricHeight
      ? roundToEven(3840 * metricHeight / metricWidth)
      : 3840;

  return {
    listingId: listing.id,
    title: listing.title,
    format: listing.format,
    physicalSize: metricMatch ? `${metricWidth} × ${metricHeight} m` : "Portrait digital display",
    width,
    height,
    staticArtworkSize: metricMatch ? `${metricWidth * 10} × ${metricHeight * 10} cm at 1:10 scale` : "Confirm final print size with owner",
  };
};

const formatCreativeFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const campaignVenueTemplates: Record<string, { title: string; format: string; price: number; audience: string }> = {
  "Static Billboard": { title: "Landmark Static Billboard", format: "Static · 18 × 6 m", price: 18000, audience: "620K weekly views" },
  "Digital Billboard": { title: "Premium Digital Screen", format: "Digital · 12 × 7 m", price: 26000, audience: "880K weekly views" },
  Building: { title: "Iconic Building Display", format: "Building · 36 × 14 m", price: 48000, audience: "710K weekly views" },
  "Mall Billboard": { title: "Mall Digital Kiosk", format: "Digital · 4K portrait", price: 14500, audience: "390K weekly views" },
  "Road Billboard": { title: "Roadside Digital Kiosk", format: "Digital · 8 × 4 m", price: 22000, audience: "760K weekly views" },
};

const regionalCampaignListings: Listing[] = emirates.flatMap((emirate, emirateIndex) => {
  const areas = emirateAreas[emirate];
  return Object.entries(campaignVenueTemplates).map(([category, template], categoryIndex) => {
    const area = areas[categoryIndex % areas.length];
    const coordinateSeeds: Record<string, [number, number]> = {
      Dubai: [25.2048, 55.2708],
      "Abu Dhabi": [24.4539, 54.3773],
      Sharjah: [25.3463, 55.4209],
      Ajman: [25.4052, 55.5136],
      "Ras Al Khaimah": [25.8007, 55.9762],
      Fujairah: [25.1288, 56.3265],
      "Umm Al Quwain": [25.5647, 55.5552],
    };
    const [latitude, longitude] = coordinateSeeds[emirate];
    return {
      id: 100 + emirateIndex * 10 + categoryIndex,
      title: `${area} ${template.title}`,
      location: `${area}, ${emirate}`,
      category,
      format: template.format,
      audience: template.audience,
      price: template.price + emirateIndex * 900,
      vendor: `${emirate.split(" ")[0]} Media Network`,
      tone: ["violet", "amber", "cyan", "coral", "blue"][categoryIndex],
      tag: categoryIndex % 2 === 0 ? "Available now" : "Verified",
      latitude: latitude + categoryIndex * 0.008,
      longitude: longitude + categoryIndex * 0.006,
      hourlyViews: 3200 + categoryIndex * 1100,
      dailyViews: 76000 + categoryIndex * 22000,
      traffic: category.includes("Mall") ? "Premium mall footfall" : "High traffic visibility",
      facing: category === "Building" ? "Prominent city-facing façade" : "Primary traffic flow",
      illumination: category.includes("Static") ? "Front-lit static" : "Digital LED display",
    };
  });
});

const campaignInventory = [...listings, ...regionalCampaignListings];
const getCampaignImage = (category: string) => {
  if (category === "Building") return "/campaign/building-advertising.png";
  if (category === "Mall Billboard" || category === "Digital Kiosk") return "/campaign/mall-digital-kiosk.png";
  return "/campaign/uae-city-billboard.png";
};
const getMarketplaceListingImage = (listing: Listing) => {
  const emirate = emirates.find((name) => listing.location.includes(name));
  return emirate ? emirateCardImages[emirate] : getCampaignImage(listing.category);
};
const inventoryMapPins = [
  { emirate: "Abu Dhabi", reach: "970k", sites: 92, latitude: 24.4539, longitude: 54.3773 },
  { emirate: "Dubai", reach: "1.8M", sites: 214, latitude: 25.2048, longitude: 55.2708 },
  { emirate: "Sharjah", reach: "640k", sites: 116, latitude: 25.3463, longitude: 55.4209 },
  { emirate: "Ajman", reach: "260k", sites: 68, latitude: 25.4052, longitude: 55.5136 },
  { emirate: "Umm Al Quwain", reach: "90k", sites: 34, latitude: 25.5647, longitude: 55.5552 },
  { emirate: "Ras Al Khaimah", reach: "180k", sites: 72, latitude: 25.8007, longitude: 55.9762 },
  { emirate: "Fujairah", reach: "140k", sites: 44, latitude: 25.1288, longitude: 56.3265 },
];

function UaeInventoryMap({ onSelectEmirate, onExploreAll }: { onSelectEmirate: (emirate: string) => void; onExploreAll: () => void }) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const selectEmirateRef = useRef(onSelectEmirate);

  useEffect(() => {
    selectEmirateRef.current = onSelectEmirate;
  }, [onSelectEmirate]);

  useEffect(() => {
    let disposed = false;
    let map: import("leaflet").Map | null = null;

    void import("leaflet").then((leaflet) => {
      if (disposed || !mapElementRef.current) return;

      map = leaflet.map(mapElementRef.current, {
        center: [24.95, 55.35],
        zoom: 7,
        minZoom: 6,
        maxZoom: 12,
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true,
      });

      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const bounds = leaflet.latLngBounds([]);
      inventoryMapPins.forEach((pin) => {
        const marker = leaflet.circleMarker([pin.latitude, pin.longitude], {
          radius: 9,
          color: "#ffffff",
          weight: 2,
          fillColor: "#285fee",
          fillOpacity: 1,
        });
        marker.bindTooltip(
          `<strong>${pin.emirate}</strong><span>${pin.reach} weekly reach · ${pin.sites} locations</span>`,
          { className: "inventory-map-tooltip", direction: "top", offset: [0, -11] },
        );
        marker.on("click", () => selectEmirateRef.current(pin.emirate));
        marker.addTo(map!);
        bounds.extend([pin.latitude, pin.longitude]);
      });

      map.fitBounds(bounds, {
        paddingTopLeft: [55, 55],
        paddingBottomRight: [300, 105],
        maxZoom: 8,
      });
    });

    return () => {
      disposed = true;
      map?.remove();
    };
  }, []);

  return (
    <div className="inventory-map-frame">
      <div ref={mapElementRef} className="inventory-map-canvas" aria-label="Interactive UAE billboard inventory map" />
      <div className="inventory-map-shade" />
      <div className="inventory-map-label"><span>●</span> LIVE UAE INVENTORY <b>—</b> SELECT A MARKER</div>
      <aside className="inventory-map-emirates" aria-label="Select an Emirate from the map">
        <div><span>7 EMIRATES</span><strong>Choose a market</strong></div>
        {inventoryMapPins.map((pin) => (
          <button type="button" key={pin.emirate} onClick={() => onSelectEmirate(pin.emirate)}>
            <span>{pin.emirate}</span><small>{pin.sites} locations</small>
          </button>
        ))}
      </aside>
      <div className="inventory-map-summary">
        <div><span>LIVE UAE COVERAGE</span><strong>640+ verified billboard locations</strong></div>
        <button type="button" onClick={onExploreAll}>Explore all inventory <span>→</span></button>
      </div>
    </div>
  );
}
const marketplaceVenueFilters = [
  { label: "Roads", icon: "🛣️", categories: ["Road Billboard", "Static Billboard", "Digital Billboard", "Bridge"] },
  { label: "Malls", icon: "🏬", categories: ["Mall Billboard"] },
  { label: "Buildings", icon: "🏢", categories: ["Building"] },
  { label: "Kiosks", icon: "🟩", categories: ["Digital Kiosk", "Road Billboard"] },
];
const marketplaceFormats = ["Digital", "Static", "Bridge", "Megacom", "Building", "Lifts"];

const getListingPrices = (listing: Listing) => {
  if (listing.format.startsWith("Static")) return { week: listing.price, month: Math.round(listing.price * 4 * 0.85) };
  const hourly = Math.max(1, Math.round(listing.price / (24 * 7 * 0.9)));
  return { hourly, day: Math.round(hourly * 24 * 0.95), week: listing.price, month: Math.round(hourly * 24 * 30 * 0.8) };
};

const formatHourLabel = (hour: number) => {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
};

const getOwnerInventorySchedule = (listing: Listing): OwnerInventorySchedule => {
  if (listing.format.startsWith("Static")) {
    return {
      plans: ["weekly", "monthly"],
      availableDays: weekDays,
      availableHours: [],
      peakDays: [],
      peakHours: [],
      peakDayPercent: 0,
      peakHourPercent: 0,
    };
  }
  if (listing.category === "Digital Billboard" || listing.id === 1) return ownerScheduleTemplates[0];
  return ownerScheduleTemplates[listing.id % ownerScheduleTemplates.length];
};

const getListingPlanPrice = (listing: Listing, plan: SellingPlan, schedule: OwnerInventorySchedule) => {
  const prices = getListingPrices(listing);
  if (plan === "weekly") return prices.week;
  if (plan === "monthly") return prices.month;
  if (!("hourly" in prices)) return prices.week;
  if (plan === "hourly_base") return prices.hourly;
  if (plan === "peak_hours") return Math.round(prices.hourly * (1 + schedule.peakHourPercent / 100));
  if (plan === "selected_days") return prices.day;
  return Math.round(prices.day * (1 + schedule.peakDayPercent / 100));
};

const getPlanUnit = (plan: SellingPlan) => {
  if (plan === "hourly_base" || plan === "peak_hours") return "hour";
  if (plan === "selected_days" || plan === "peak_days") return "day";
  if (plan === "weekly") return "week";
  return "month";
};

const formatDmyDateInput = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const parseDmyDate = (value: string) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
};

const isValidDmyDate = (value: string) => parseDmyDate(value) !== null;

const countBookingDaysInRange = (startValue: string, endValue: string, selectedWeekDays: string[]) => {
  if (!startValue || !endValue || selectedWeekDays.length === 0) return null;
  const start = parseDmyDate(startValue);
  const end = parseDmyDate(endValue);
  if (!start || !end || end < start) return null;
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let count = 0;
  let guard = 0;
  for (const date = new Date(start); date <= end && guard < 1100; date.setDate(date.getDate() + 1), guard += 1) {
    if (selectedWeekDays.includes(dayNames[date.getDay()])) count += 1;
  }
  return count;
};

type MarketplaceClientProps = {
  country: CountryConfig;
  startCampaign: boolean;
  resetToken: string;
  adminEntry?: boolean;
};

type AuthUser = {
  id: number;
  companyId: number;
  companyName?: string;
  companyLogoUrl?: string;
  businessSector?: string;
  contactNumber?: string;
  whatsappNumber?: string;
  fullName: string;
  email: string;
  role: string;
  accountStatus?: string;
};

type AdminCompany = {
  id: number;
  companyName: string;
  businessSector: string;
  contactPerson: string;
  contactNumber: string;
  whatsappNumber: string;
  companyEmail: string;
  companyLogoUrl?: string;
  accountType: "advertiser" | "billboard_owner";
  accountStatus: string;
  emailVerified: boolean;
  createdAt?: string;
};

type VendorDocument = {
  document_type: "trade_license" | "vat_certificate" | "bank_letter";
  file_name: string;
  updated_at?: string;
};

type AdminRole = string;

type AdminStaff = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: AdminRole;
  status: "active" | "invited" | "suspended";
};

type AdminBilling = {
  id: string;
  company: string;
  reference: string;
  description: string;
  amount: number;
  dueDate: string;
  status: "paid" | "due" | "overdue" | "processing";
};

const defaultAdminRoleDetails: Record<AdminRole, { label: string; work: string }> = {
  super_admin: { label: "Super Admin", work: "Full system access, staff roles and approvals" },
  accountant: { label: "Accountant", work: "Invoices, payments, VAT and financial reports" },
  creative: { label: "Creative", work: "Artwork review, resizing and creative approvals" },
  campaign_operations: { label: "Campaign Operations", work: "Campaign scheduling, inventory and delivery" },
  sales: { label: "Sales", work: "Leads, proposals, advertisers and campaign quotes" },
  vendor_management: { label: "Vendor Management", work: "Vendor onboarding, inventory and documents" },
  viewer: { label: "Read-only Viewer", work: "View dashboards and reports without editing" },
};

const adminDemoStaff: AdminStaff[] = [
  { id: 1, fullName: "Joshy Francis", email: "admin@asnads.com", phone: "+971 50 000 0000", role: "super_admin", status: "active" },
  { id: 2, fullName: "Finance Team", email: "accounts@asnads.com", phone: "+971 50 000 0001", role: "accountant", status: "active" },
  { id: 3, fullName: "Creative Team", email: "creative@asnads.com", phone: "+971 50 000 0002", role: "creative", status: "invited" },
];

const vendorBillingDemo: AdminBilling[] = [
  { id: "VB-2026-018", company: "Skyline Outdoor", reference: "SH-47-SKY-01", description: "Digital billboard campaign payout", amount: 18750, dueDate: "05/08/2026", status: "due" },
  { id: "VB-2026-017", company: "Metro Media", reference: "DX-ME-MET-04", description: "Mall kiosk campaign payout", amount: 8400, dueDate: "01/08/2026", status: "processing" },
  { id: "VB-2026-016", company: "Road Vision Media", reference: "AK-12-RVM-02", description: "Static billboard monthly payout", amount: 32000, dueDate: "28/07/2026", status: "paid" },
];

const advertiserBillingDemo: AdminBilling[] = [
  { id: "INV-2026-104", company: "ASNads Test Company", reference: "AE-DS-DXB-LAUNCH", description: "Digital and static campaign", amount: 50000, dueDate: "08/08/2026", status: "due" },
  { id: "INV-2026-103", company: "Gulf Retail Group", reference: "GRG-SUMMER-26", description: "Dubai mall kiosk campaign", amount: 24600, dueDate: "31/07/2026", status: "overdue" },
  { id: "INV-2026-102", company: "Emirates Lifestyle", reference: "EL-AUG-AWARENESS", description: "Road digital campaign deposit", amount: 18500, dueDate: "25/07/2026", status: "paid" },
];

type VendorInventoryLocation = {
  page: number;
  name: string;
  road: string;
  type: string;
  size: string;
  landmark: string;
  traffic: string;
  map: string;
  aerial?: string;
  upcoming?: boolean;
  submitted?: boolean;
  ownerCompanyId?: number;
  ownerCompanyName?: string;
};

type VendorBillboardPricing = {
  hourly: number;
  day: number;
  week: number;
  month: number;
};

const phiDigitalLocations: VendorInventoryLocation[] = [
  { page: 5, name: "Golden Mile Gateway", road: "Sheikh Zayed Road", type: "Single-sided digital sign", size: "50.4m W × 6.3m H", landmark: "Opposite Museum of the Future", traffic: "18M viewers/month", map: "https://maps.app.goo.gl/RcJt8NLKR9J9kkBh7" },
  { page: 6, name: "SZR Emarat", road: "Sheikh Zayed Road", type: "Double-sided digital sign", size: "32m W × 8m H", landmark: "Emarat Corporate Office", traffic: "15M viewers/month", map: "https://maps.app.goo.gl/vCHnnvCDZHGFz9Qq5" },
  { page: 8, name: "DFC Versace", road: "Al Khail Road", type: "Double-sided digital sign", size: "16m W × 8m H", landmark: "Before Festival City Exit", traffic: "14M viewers/month", map: "https://maps.app.goo.gl/krVYbGVM5CKDcfRu7", aerial: "https://drive.google.com/file/d/1sJ87BqT8s95mOOCCKauzQ4O-nXXe0xC8/view?usp=drive_link" },
  { page: 9, name: "Downtown Skyline", road: "Al Khail Road", type: "Double-sided digital sign", size: "16m W × 8m H", landmark: "Design District Entrance, Jaddaf Area", traffic: "12M viewers/month", map: "https://maps.app.goo.gl/r5aayQg9Cd3st9yT7" },
  { page: 10, name: "Dubai Hills", road: "Al Khail Road", type: "Double-sided digital sign", size: "16m W × 8m H", landmark: "Dubai Hills Area", traffic: "23M viewers/month", map: "https://maps.app.goo.gl/gdD9RSr4RoTc21rBA" },
  { page: 11, name: "Dubai Hills Mall", road: "Al Khail Road", type: "Double-sided digital sign", size: "16m W × 8m H", landmark: "Dubai Hills Entrance", traffic: "13M viewers/month", map: "https://maps.app.goo.gl/zCyB8nmMVw9HxQYE8" },
  { page: 12, name: "Umm Suqeim", road: "Umm Suqeim Road", type: "Double-sided digital sign", size: "14m W × 7m H", landmark: "Facing Marina Homes", traffic: "12M viewers/month", map: "https://maps.app.goo.gl/c3junyXuQZE8dYQn8" },
  { page: 13, name: "Hessa Digital", road: "Hessa Street", type: "Double-sided digital sign", size: "16m W × 8m H", landmark: "Al Barsha Police Station", traffic: "8M viewers/month", map: "https://maps.app.goo.gl/iiWqYukBG8S4yUaq8" },
  { page: 14, name: "Nad El Sheba", road: "Dubai-Al Ain Road", type: "Double-sided digital sign", size: "16m W × 8m H", landmark: "Ras Al Khor Exit", traffic: "9M viewers/month", map: "https://www.google.com/maps/place/25%C2%B009'41.3%22N+55%C2%B019'55.4%22E" },
  { page: 15, name: "Wafi Digital", road: "Oud Metha Road", type: "Double-sided digital sign", size: "16m W × 8m H", landmark: "Al Wasel Club", traffic: "12M viewers/month", map: "https://maps.app.goo.gl/E72ydjm7dhE5gyLN6" },
  { page: 16, name: "Dubai Marina", road: "Skydive / JBR", type: "Double-sided digital sign", size: "6.4m W × 4.5m H", landmark: "Grosvenor House", traffic: "7M viewers/month", map: "https://www.google.com/maps/place/25%C2%B005'10.7%22N+55%C2%B008'33.3%22E" },
  { page: 17, name: "MBZ Jumeirah Golf Estate", road: "MBZ Entrance", type: "Double-sided digital sign", size: "16m W × 8m H", landmark: "Jumeirah Golf Estates", traffic: "16M viewers/month", map: "https://www.google.com/maps/place/25%C2%B001'39.9%22N+55%C2%B010'01.0%22E" },
  { page: 18, name: "SZR Digital", road: "Sheikh Zayed Road", type: "Double-sided digital sign", size: "19m W × 9m H", landmark: "Medcare Hospital", traffic: "16M viewers/month", map: "https://maps.app.goo.gl/F2ALc8J2G7cbgQRU7" },
  { page: 19, name: "Dubai Al Ain Screen", road: "Dubai-Al Ain Road", type: "Double-sided digital sign", size: "12m W × 6m H", landmark: "Skydive", traffic: "7M viewers/month", map: "https://maps.app.goo.gl/sT5QerYwijpvE5QQ7" },
  { page: 22, name: "Dubai Al Ain Road 2", road: "Al Ain Road", type: "Double-sided digital sign", size: "16m W × 8m H", landmark: "Avenue Mall, Nad Al Shiba", traffic: "9M viewers/month", map: "https://maps.app.goo.gl/ZoFku36b3RLywo7v7", upcoming: true },
  { page: 23, name: "Dubai Al Ain Road 3", road: "Al Ain Road", type: "Double-sided digital sign", size: "16m W × 8m H", landmark: "Avenue Mall, Nad Al Shiba", traffic: "9M viewers/month", map: "https://maps.app.goo.gl/6bKCYKjJex35VEWh6", upcoming: true },
  { page: 24, name: "Dubai Al Ain Road 4", road: "Al Ain Road", type: "Double-sided digital sign", size: "16m W × 8m H", landmark: "Avenue Mall, Nad Al Shiba", traffic: "9M viewers/month", map: "https://maps.app.goo.gl/Lk935SzmSg5Ec7Kj6", upcoming: true },
  ...[1, 2, 3, 4, 5, 6].map((number, index) => ({ page: 26 + index, name: `Al Khail Road ${number}`, road: "Al Khail Road", type: "Double-sided digital sign", size: "16m W × 8m H", landmark: "Near Al Barsha Police Station", traffic: "13M viewers/month", map: ["https://maps.app.goo.gl/oeMvFyPhvkh6dn9r8", "https://maps.app.goo.gl/omUpKRZnjPp24YNP8", "https://maps.app.goo.gl/HcTudBWcwfdhoHe68", "https://maps.app.goo.gl/8qrmqKkfmohxTyNu8", "https://maps.app.goo.gl/Qg9adLhf4iFBDkLd6", "https://maps.app.goo.gl/5mHdxTq87fj3JaWx8"][index], upcoming: true })),
];

const ASNADS_API = "https://api.asnads.com";

const adminDemoCompanies: AdminCompany[] = [
  { id: 1, companyName: "ASNads Test Company", businessSector: "Retail", contactPerson: "Joshy Francis", contactNumber: "+971 50 000 0000", whatsappNumber: "+971 50 000 0000", companyEmail: "joshy@emiratesexhibits.com", accountType: "advertiser", accountStatus: "active", emailVerified: true },
  { id: 2, companyName: "Skyline Outdoor", businessSector: "Outdoor media", contactPerson: "Vendor operations", contactNumber: "+971 4 000 0000", whatsappNumber: "+971 50 000 0000", companyEmail: "inventory@skylineoutdoor.ae", accountType: "billboard_owner", accountStatus: "active", emailVerified: true },
  { id: 3, companyName: "Metro Media", businessSector: "Advertising", contactPerson: "Media partnerships", contactNumber: "+971 4 000 0000", whatsappNumber: "+971 50 000 0000", companyEmail: "team@metromedia.ae", accountType: "billboard_owner", accountStatus: "pending", emailVerified: false },
  { id: 4, companyName: "Phi", businessSector: "Outdoor media owner", contactPerson: "Joshy", contactNumber: "+971 54 494 8489", whatsappNumber: "+971 54 494 8489", companyEmail: "inquiry@emiratesexhibits.com", accountType: "billboard_owner", accountStatus: "active", emailVerified: true },
];

function EyeVisibilityIcon({ hidden = false }: { hidden?: boolean }) {
  return hidden ? (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10.7 10.7 0 0 1 12 4c5.2 0 8.8 4.4 9.7 7.1a2.5 2.5 0 0 1 0 1.8 15.5 15.5 0 0 1-2.2 3.7M6.6 6.6C4.5 8.1 3 10.5 2.3 12a2.5 2.5 0 0 0 0 1.8C3.2 16.6 6.8 20 12 20c1.4 0 2.7-.3 3.8-.8" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2.3 12a2.5 2.5 0 0 1 0-1.8C3.2 7.4 6.8 4 12 4s8.8 3.4 9.7 6.2a2.5 2.5 0 0 1 0 1.8C20.8 16.6 17.2 20 12 20S3.2 16.6 2.3 13.8a2.5 2.5 0 0 1 0-1.8Z" /><circle cx="12" cy="12" r="3.2" /></svg>
  );
}

type BillboardIdentity = {
  billboardType: string;
  mallName: string;
  nearbyShop: string;
  emirate: string;
  location: string;
  landmark: string;
  exitNumber: string;
  vendorNumber: string;
  hourlyAudience: string;
  mapsLink: string;
  latitude: string;
  longitude: string;
};

type PricingGroup = {
  id: number;
  name: string;
  billboardIndexes: number[];
  packagePlans: Array<"fifteen_days" | "one_month">;
};

type PriceProfile = {
  hourly: string;
  daily: string;
  weekly: string;
  monthly: string;
};

const emptyBillboardIdentity = (vendorNumber: number): BillboardIdentity => ({ billboardType: "", mallName: "", nearbyShop: "", emirate: "", location: "", landmark: "", exitNumber: "", vendorNumber: String(vendorNumber), hourlyAudience: "", mapsLink: "", latitude: "", longitude: "" });
const emptyPriceProfile = (): PriceProfile => ({ hourly: "", daily: "", weekly: "", monthly: "" });

const audienceTotals = (hourlyInput: string) => {
  const hourly = Number(hourlyInput);
  if (hourlyInput.trim() === "" || !Number.isFinite(hourly) || hourly < 0) {
    return { daily: "", weekly: "", monthly: "" };
  }
  return { daily: hourly * 24, weekly: hourly * 24 * 7, monthly: hourly * 24 * 30 };
};

const formatAudienceTotal = (value: number | "") => value === "" ? "" : value.toLocaleString("en-US");

const getMapPreviewUrl = (latitude: string, longitude: string) => {
  const hasValidCoordinates = latitude.trim() !== "" && longitude.trim() !== "" && Number(latitude) >= -90 && Number(latitude) <= 90 && Number(longitude) >= -180 && Number(longitude) <= 180;
  return hasValidCoordinates ? `https://www.google.com/maps?q=${encodeURIComponent(latitude)},${encodeURIComponent(longitude)}&output=embed` : "";
};

const cleanCode = (value: string, length: number) => value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, length);

const roadCode = (value: string) => {
  const words = value.toUpperCase().match(/[A-Z0-9]+/g) ?? [];
  if (words.length > 1) return words.map((word) => word[0]).join("").slice(0, 3);
  return cleanCode(value, 3);
};

const createBillboardName = (vendorShortName: string, identity: BillboardIdentity) => {
  const vendor = cleanCode(vendorShortName, 5);
  const sequence = String(Math.max(1, Number(identity.vendorNumber) || 1)).padStart(2, "0");
  if (!vendor || !identity.location.trim()) return "";
  if (identity.exitNumber.trim()) return [roadCode(identity.location), cleanCode(identity.exitNumber, 4), vendor, sequence].filter(Boolean).join("-");
  if (!identity.landmark.trim()) return "";
  return [cleanCode(identity.location, 2), cleanCode(identity.landmark, 2), vendor, sequence].filter(Boolean).join("-");
};

const createRegisteredVendorShortName = (companyName: string) => {
  const words = companyName.trim().split(/\s+/).map((word) => cleanCode(word, 5)).filter(Boolean);
  if (words.length === 0) return "VND";
  if (words.length === 1) return words[0].slice(0, 5);
  return words.map((word) => word[0]).join("").slice(0, 5);
};

const isVendorAccount = (user: AuthUser | null) =>
  user?.role === "billboard_owner" ||
  user?.companyName.trim().toLowerCase() === "asnads email test";

export default function MarketplaceClient({ country, startCampaign, resetToken, adminEntry = false }: MarketplaceClientProps) {
  const currency = country.currency;
  const formatMoney = (value: number) => new Intl.NumberFormat(country.locale).format(value);
  const formatMoneyWithFils = (value: number) => new Intl.NumberFormat(country.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  const [query, setQuery] = useState("");
  const [marketEmirates, setMarketEmirates] = useState<string[]>([]);
  const [marketVenueTypes, setMarketVenueTypes] = useState<string[]>([]);
  const [marketLocation, setMarketLocation] = useState("");
  const [marketFormats, setMarketFormats] = useState<string[]>([]);
  const [marketMaxPrice, setMarketMaxPrice] = useState(500000);
  const [marketAvailability, setMarketAvailability] = useState<"any" | "now" | "next">("any");
  const [marketMinAudience, setMarketMinAudience] = useState(0);
  const [modal, setModal] = useState<"vendor" | "campaign" | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authOpen, setAuthOpen] = useState(Boolean(resetToken));
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot" | "reset">(resetToken ? "reset" : "login");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [showRegistrationPasswords, setShowRegistrationPasswords] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showResetPasswords, setShowResetPasswords] = useState(false);
  const passwordRevealTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const beginPasswordReveal = (key: string, setVisible: (visible: boolean) => void) => {
    setVisible(true);
    const existingTimer = passwordRevealTimers.current.get(key);
    if (existingTimer) clearTimeout(existingTimer);
    passwordRevealTimers.current.set(key, setTimeout(() => {
      setVisible(false);
      passwordRevealTimers.current.delete(key);
    }, 2000));
  };
  const endPasswordReveal = (key: string, setVisible: (visible: boolean) => void) => {
    const existingTimer = passwordRevealTimers.current.get(key);
    if (existingTimer) clearTimeout(existingTimer);
    passwordRevealTimers.current.delete(key);
    setVisible(false);
  };
  const [rememberLogin, setRememberLogin] = useState(false);
  const [rememberedEmail, setRememberedEmail] = useState("");
  const [authStartCampaign, setAuthStartCampaign] = useState(startCampaign);
  const [authPurpose, setAuthPurpose] = useState<"advertiser" | "owner" | "admin">("advertiser");
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminCompanies, setAdminCompanies] = useState<AdminCompany[]>(adminDemoCompanies);
  const [adminTab, setAdminTab] = useState<"advertiser" | "billboard_owner" | "staff" | "vendor_billing" | "advertiser_billing">("advertiser");
  const [adminStaff, setAdminStaff] = useState<AdminStaff[]>(adminDemoStaff);
  const [adminStaffAddOpen, setAdminStaffAddOpen] = useState(false);
  const [adminRoleDetails, setAdminRoleDetails] = useState(defaultAdminRoleDetails);
  const [adminRoleEditorOpen, setAdminRoleEditorOpen] = useState(false);
  const [editingAdminRole, setEditingAdminRole] = useState<AdminRole | null>(null);
  const [editingAdminStaff, setEditingAdminStaff] = useState<AdminStaff | null>(null);
  const [adminOtpActivation, setAdminOtpActivation] = useState<{ staffId: number; code: string } | null>(null);
  const [adminOtpError, setAdminOtpError] = useState("");
  const [adminPasswordPerson, setAdminPasswordPerson] = useState<AdminStaff | null>(null);
  const [adminPasswordError, setAdminPasswordError] = useState("");
  const [inventoryCompanyProfile, setInventoryCompanyProfile] = useState<AdminCompany | null>(null);
  const [inventoryCompanyEdit, setInventoryCompanyEdit] = useState(false);
  const [inventoryCompanyLogo, setInventoryCompanyLogo] = useState("");
  const [inventoryCompanyLogoFile, setInventoryCompanyLogoFile] = useState<File | null>(null);
  const [inventoryCompanyLogoPreview, setInventoryCompanyLogoPreview] = useState("");
  const [inventoryCompanyCover, setInventoryCompanyCover] = useState("");
  const [inventoryFinancialProfile, setInventoryFinancialProfile] = useState<AdminCompany | null>(null);
  const [adminCompanyEmailLoading, setAdminCompanyEmailLoading] = useState(false);
  const [adminCompanyEmailError, setAdminCompanyEmailError] = useState("");
  const [adminCompanyEmailMessage, setAdminCompanyEmailMessage] = useState("");
  const [advertiserCompanyPortal, setAdvertiserCompanyPortal] = useState<AdminCompany | null>(null);
  const [advertiserPortalTab, setAdvertiserPortalTab] = useState<"overview" | "campaigns" | "adgroups" | "ads" | "billboards" | "billing">("overview");
  const [, setInventorySyncVersion] = useState(0);
  const [publishedPhiPages, setPublishedPhiPages] = useState<number[]>([]);
  const [vendorInventory, setVendorInventory] = useState<VendorInventoryLocation[]>(phiDigitalLocations);
  const [vendorBillboardEditor, setVendorBillboardEditor] = useState<VendorInventoryLocation | null>(null);
  const [vendorBillboardPrices, setVendorBillboardPrices] = useState<Record<number, VendorBillboardPricing>>({});
  const [lastVendorSubmissionCount, setLastVendorSubmissionCount] = useState(0);
  const [inventoryApprovalsOpen, setInventoryApprovalsOpen] = useState(false);
  const [approvedPhiPages, setApprovedPhiPages] = useState<number[]>([5, 6]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminMessage, setAdminMessage] = useState("Live company management will appear when your secure admin account is used.");
  const [adminAddOpen, setAdminAddOpen] = useState(false);
  const [, setSelected] = useState<Listing | null>(null);
  const [magnifiedListing, setMagnifiedListing] = useState<Listing | null>(null);
  const [toast, setToast] = useState("");
  const [inventoryType, setInventoryType] = useState("");
  const [billingPeriod, setBillingPeriod] = useState<"hourly" | "day" | "week" | "month">("hourly");
  const [baseHourlyPrice, setBaseHourlyPrice] = useState(150);
  const [baseWeeklyPrice, setBaseWeeklyPrice] = useState(18000);
  const [vendorSellingPlans, setVendorSellingPlans] = useState<SellingPlan[]>(["hourly_base", "selected_days", "weekly", "monthly"]);
  const [advertiserPlan, setAdvertiserPlan] = useState<SellingPlan | "">("");
  const [advertiserDays, setAdvertiserDays] = useState<string[]>([]);
  const [advertiserHours, setAdvertiserHours] = useState<number[]>([]);
  const [campaignBookingDays, setCampaignBookingDays] = useState(1);
  const [campaignStartDate, setCampaignStartDate] = useState("");
  const [campaignEndDate, setCampaignEndDate] = useState("");
  const [campaignLocationId, setCampaignLocationId] = useState("");
  const [campaignLocationIds, setCampaignLocationIds] = useState<string[]>([]);
  const [showAreaBillboards, setShowAreaBillboards] = useState(false);
  const [campaignObjective, setCampaignObjective] = useState("Brand awareness");
  const [campaignEmail, setCampaignEmail] = useState("");
  const [campaignEmailConfirm, setCampaignEmailConfirm] = useState("");
  const [campaignTradeLicenseName, setCampaignTradeLicenseName] = useState("");
  const [campaignVatCertificateName, setCampaignVatCertificateName] = useState("");
  const [campaignPermissionLetterName, setCampaignPermissionLetterName] = useState("");
  const [preferredBillboardTypes, setPreferredBillboardTypes] = useState<string[]>([]);
  const [campaignMediaFormat, setCampaignMediaFormat] = useState<"" | "static" | "digital">("");
  const [campaignPlacement, setCampaignPlacement] = useState<"" | "road" | "mall" | "bridge">("");
  const [campaignEmirates, setCampaignEmirates] = useState<string[]>([]);
  const [campaignArea, setCampaignArea] = useState("");
  const [staticCampaignDuration, setStaticCampaignDuration] = useState<"15" | "30">("15");
  const [campaignValidationAttempted, setCampaignValidationAttempted] = useState(false);
  const [isCampaignTestMode, setIsCampaignTestMode] = useState(false);
  const [campaignStage, setCampaignStage] = useState<"setup" | "name" | "adgroups" | "creative">("setup");
  const [campaignsOpen, setCampaignsOpen] = useState(false);
  const [vendorDashboardOpen, setVendorDashboardOpen] = useState(false);
  const [vendorDashboardTab, setVendorDashboardTab] = useState<"overview" | "inventory" | "bookings" | "availability" | "billing" | "profile">("overview");
  const [vendorProfileEditing, setVendorProfileEditing] = useState(false);
  const [vendorProfileError, setVendorProfileError] = useState("");
  const [vendorDocuments, setVendorDocuments] = useState<VendorDocument[]>([]);
  const [vendorDocumentsLoading, setVendorDocumentsLoading] = useState(false);
  const [vendorDocumentError, setVendorDocumentError] = useState("");
  const [campaignsLoaded, setCampaignsLoaded] = useState(false);
  const [campaignFromDashboard, setCampaignFromDashboard] = useState(false);
  const [campaignLayoutChooserOpen, setCampaignLayoutChooserOpen] = useState(false);
  const [campaignTestLayout, setCampaignTestLayout] = useState<"guided" | "compact">("guided");
  const [createdCampaigns, setCreatedCampaigns] = useState<CreatedCampaign[]>([]);
  const [expandedCampaignIds, setExpandedCampaignIds] = useState<string[]>([]);
  const [campaignDetailsId, setCampaignDetailsId] = useState("");
  const [campaignCustomName, setCampaignCustomName] = useState("");
  const [campaignCreativeFile, setCampaignCreativeFile] = useState<File | null>(null);
  const [campaignCreativeUrl, setCampaignCreativeUrl] = useState("");
  const [campaignCreativeMetadata, setCampaignCreativeMetadata] = useState<CampaignCreativeMetadata | null>(null);
  const [campaignCreativeError, setCampaignCreativeError] = useState("");
  const [creativePreviewListingId, setCreativePreviewListingId] = useState("");
  const [peakDayPercent, setPeakDayPercent] = useState(25);
  const [peakHourPercent, setPeakHourPercent] = useState(20);
  const [selectedDays, setSelectedDays] = useState<string[]>(weekDays);
  const [peakDays, setPeakDays] = useState<string[]>(["Fri", "Sat", "Sun"]);
  const [peakHours, setPeakHours] = useState<number[]>([7, 8, 9, 16, 17, 18, 19, 20]);
  const [pictureCount, setPictureCount] = useState(0);
  const [tradeLicenseName, setTradeLicenseName] = useState("");
  const [vatCertificateName, setVatCertificateName] = useState("");
  const [vendorStep, setVendorStep] = useState<1 | 2>(1);
  const [vendorShortName, setVendorShortName] = useState("");
  const [billboardIdentities, setBillboardIdentities] = useState<BillboardIdentity[]>([emptyBillboardIdentity(1)]);
  const [pricingTargetMode, setPricingTargetMode] = useState<"billboard" | "group">("billboard");
  const [pricingGroups, setPricingGroups] = useState<PricingGroup[]>([{ id: 1, name: "Group 1", billboardIndexes: [], packagePlans: ["fifteen_days", "one_month"] }]);
  const [activePricingGroupId, setActivePricingGroupId] = useState(1);
  const [priceProfiles, setPriceProfiles] = useState<Record<string, PriceProfile>>({});
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const currentDate = new Date();
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  });
  const [calendarMode, setCalendarMode] = useState<"block" | "free">("block");
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [today] = useState(() => new Date());

  useEffect(() => () => {
    if (campaignCreativeUrl) URL.revokeObjectURL(campaignCreativeUrl);
  }, [campaignCreativeUrl]);

  useEffect(() => {
    if (!inventoryCompanyProfile) return;
    const input = document.querySelector<HTMLInputElement>(".inventory-upload-grid input[type=file]");
    if (!input) return;
    const handleLogoSelection = () => {
      const file = input.files?.[0] ?? null;
      setInventoryCompanyLogoFile(file);
      setInventoryCompanyLogo(file?.name ?? "");
      if (!file) {
        setInventoryCompanyLogoPreview("");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setInventoryCompanyLogoPreview(typeof reader.result === "string" ? reader.result : "");
      reader.readAsDataURL(file);
    };
    input.addEventListener("change", handleLogoSelection);
    return () => input.removeEventListener("change", handleLogoSelection);
  }, [inventoryCompanyProfile]);

  useEffect(() => {
    const source = inventoryCompanyLogoPreview || inventoryCompanyProfile?.companyLogoUrl || "";
    const logo = document.querySelector<HTMLElement>(".inventory-company-logo");
    if (!logo || !source) return;
    logo.style.backgroundImage = `url("${source}")`;
    logo.style.backgroundSize = "cover";
    logo.style.backgroundPosition = "center";
    logo.style.color = "transparent";
    return () => {
      logo.style.backgroundImage = "";
      logo.style.backgroundSize = "";
      logo.style.backgroundPosition = "";
      logo.style.color = "";
    };
  }, [inventoryCompanyLogoPreview, inventoryCompanyProfile?.companyLogoUrl]);

  useEffect(() => {
    const source = authUser?.companyLogoUrl || "";
    if (!source) return;
    const logos = document.querySelectorAll<HTMLElement>(".vendor-dashboard-brand > span, .vendor-profile-card > div > span");
    logos.forEach((logo) => {
      logo.style.backgroundImage = `url("${source}")`;
      logo.style.backgroundSize = "cover";
      logo.style.backgroundPosition = "center";
      logo.style.color = "transparent";
    });
    return () => logos.forEach((logo) => {
      logo.style.backgroundImage = "";
      logo.style.backgroundSize = "";
      logo.style.backgroundPosition = "";
      logo.style.color = "";
    });
  }, [authUser?.companyLogoUrl, vendorDashboardOpen, vendorDashboardTab]);

  useEffect(() => {
    if (!vendorDashboardOpen || vendorDashboardTab !== "inventory") return;
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".vendor-dashboard-inventory > article"));
    const companyName = authUser?.companyName?.trim().toLowerCase() || "";
    const dashboardInventory = ["phi", "phi advertise", "phi advertising"].includes(companyName)
      ? vendorInventory.filter((location) => !location.submitted || location.ownerCompanyId === authUser?.companyId)
      : vendorInventory.filter((location) => location.submitted && location.ownerCompanyId === authUser?.companyId);
    const locations = dashboardInventory.slice(-8).reverse();
    const cleanups = cards.map((card, index) => {
      const location = locations[index];
      if (!location) return () => undefined;
      const open = () => setVendorBillboardEditor(location);
      const keydown = (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      };
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `Open ${location.name} billboard details`);
      card.addEventListener("click", open);
      card.addEventListener("keydown", keydown);
      return () => {
        card.removeEventListener("click", open);
        card.removeEventListener("keydown", keydown);
      };
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [vendorDashboardOpen, vendorDashboardTab, vendorInventory, authUser?.companyId, authUser?.companyName]);

  useEffect(() => {
    if (vendorDashboardOpen && vendorDashboardTab === "profile" && isVendorAccount(authUser)) void loadVendorDocuments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorDashboardOpen, vendorDashboardTab, authUser?.id]);

  useEffect(() => {
    if (!isVendorAccount(authUser)) return;
    setVendorShortName(createRegisteredVendorShortName(authUser.companyName || authUser.fullName));
    setBillboardIdentities((current) => current.map((identity, index) => ({
      ...identity,
      vendorNumber: String(index + 1),
    })));
  }, [authUser?.role, authUser?.companyName, authUser?.fullName]);

  useEffect(() => {
    const savedEmail = window.localStorage.getItem("asnads_remembered_email") ?? "";
    setRememberedEmail(savedEmail);
    setRememberLogin(Boolean(savedEmail));

    const pageParams = new URLSearchParams(window.location.search);
    if (pageParams.get("verified") === "1") {
      const loginPurpose = pageParams.get("login") === "owner" ? "owner" : "advertiser";
      setAuthMode("login");
      setAuthPurpose(loginPurpose);
      setAuthStartCampaign(false);
      setAuthError("");
      setAuthMessage("Email verified successfully. Sign in to open your dashboard.");
      setAuthOpen(true);
      window.history.replaceState({}, "", window.location.pathname);
    }

    const token = window.localStorage.getItem("asnads_persistent_session") || window.sessionStorage.getItem("asnads_session");
    if (!token) {
      setAuthReady(true);
      return;
    }

    fetch(`${ASNADS_API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Session expired");
        return response.json() as Promise<{ user: AuthUser }>;
      })
      .then(({ user }) => setAuthUser(user))
      .catch(() => {
        window.sessionStorage.removeItem("asnads_session");
        window.localStorage.removeItem("asnads_persistent_session");
      })
      .finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    if (!adminEntry || !authReady) return;
    const isLocalPreview = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    const isPrivatePreview = isLocalPreview || new URLSearchParams(window.location.search).get("test") === "1";
    if (isPrivatePreview) {
      if (authUser?.role !== "admin") setAuthUser({ id: 0, companyId: 0, companyName: "ASNads", fullName: "Admin Preview", email: "preview@asnads.com", role: "admin", accountStatus: "active" });
      setAdminCompanies(adminDemoCompanies);
      setAdminPanelOpen(true);
      return;
    }
    if (authUser?.role === "admin") {
      setAdminPanelOpen(true);
      void loadAdminCompanies();
    } else {
      openAuth("login", false, "admin");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminEntry, authReady, authUser]);

  useEffect(() => {
    const openAdvertiserPortal = (event: MouseEvent) => {
      if (adminTab !== "advertiser") return;
      const companyName = (event.target as HTMLElement).closest(".admin-table td:first-child strong")?.textContent?.trim();
      if (!companyName) return;
      const company = adminCompanies.find((item) => item.accountType === "advertiser" && item.companyName === companyName);
      if (!company) return;
      setAdvertiserCompanyPortal(company);
      setAdvertiserPortalTab("overview");
    };
    document.addEventListener("click", openAdvertiserPortal);
    return () => document.removeEventListener("click", openAdvertiserPortal);
  }, [adminCompanies, adminTab]);

  useEffect(() => {
    const openAdminPassword = (event: MouseEvent) => {
      const cell = (event.target as HTMLElement).closest(".admin-staff-table tbody td:first-child");
      const fullName = cell?.querySelector("strong")?.textContent?.trim();
      if (!fullName) return;
      const staff = adminStaff.find((person) => person.fullName === fullName);
      if (!staff) return;
      setAdminPasswordPerson(staff);
      setAdminPasswordError("");
    };
    document.addEventListener("click", openAdminPassword);
    return () => document.removeEventListener("click", openAdminPassword);
  }, [adminStaff]);

  const submitAdminStaff = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const staff: AdminStaff = {
      id: editingAdminStaff?.id ?? Date.now(),
      fullName: String(form.get("fullName") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      role: String(form.get("role") || "viewer") as AdminRole,
      status: editingAdminStaff?.status ?? "invited",
    };
    setAdminStaff((current) => editingAdminStaff ? current.map((person) => person.id === editingAdminStaff.id ? staff : person) : [...current, staff]);
    setAdminStaffAddOpen(false);
    if (editingAdminStaff) {
      setAdminMessage(`${staff.fullName}'s role was updated to ${adminRoleDetails[staff.role].label}.`);
      setEditingAdminStaff(null);
      formElement.reset();
      return;
    }
    if (staff.role === "super_admin") {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setAdminOtpActivation({ staffId: staff.id, code });
      setAdminOtpError("");
      setAdminMessage(`${staff.fullName} was added as Super Admin. OTP verification is required before portal access is activated.`);
    } else {
      setAdminMessage(`${staff.fullName} was added and assigned as ${adminRoleDetails[staff.role].label}. Test mode only—no invitation was sent.`);
    }
    formElement.reset();
  };

  const submitAdminRole = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const label = String(form.get("label") || "").trim();
    const work = String(form.get("work") || "").trim();
    const key = editingAdminRole ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    if (!key) return;
    setAdminRoleDetails((current) => ({ ...current, [key]: { label, work } }));
    setAdminRoleEditorOpen(false);
    setEditingAdminRole(null);
    setAdminMessage(editingAdminRole ? `${label} role was updated.` : `${label} role was created and is ready to assign.`);
  };

  const verifyAdminOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminOtpActivation) return;
    const form = new FormData(event.currentTarget);
    if (String(form.get("otp") || "").trim() !== adminOtpActivation.code) {
      setAdminOtpError("Incorrect OTP. Please enter the six-digit activation code.");
      return;
    }
    const staff = adminStaff.find((person) => person.id === adminOtpActivation.staffId);
    setAdminStaff((current) => current.map((person) => person.id === adminOtpActivation.staffId ? { ...person, status: "active" } : person));
    setAdminOtpActivation(null);
    setAdminOtpError("");
    setAdminMessage(`${staff?.fullName || "Super Admin"} is verified and the admin portal is now active.`);
  };

  const changeAdminPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminPasswordPerson) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("newPassword") || "");
    const confirmation = String(form.get("confirmPassword") || "");
    if (password.length < 8) {
      setAdminPasswordError("Password must contain at least eight characters.");
      return;
    }
    if (password !== confirmation) {
      setAdminPasswordError("The new password and confirmation do not match.");
      return;
    }
    setAdminMessage(`Password updated for ${adminPasswordPerson.fullName} in private test mode.`);
    setAdminPasswordPerson(null);
    setAdminPasswordError("");
  };

  const saveInventoryCompanyProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inventoryCompanyProfile || !inventoryCompanyLogoFile) {
      setInventoryCompanyEdit(false);
      setAdminMessage("No new company logo was selected.");
      return;
    }
    try {
      const body = new FormData();
      body.append("logo", inventoryCompanyLogoFile);
      const response = await fetch(`${ASNADS_API}/company-logos/${inventoryCompanyProfile.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getSessionToken()}` },
        body,
      });
      const result = await response.json() as { companyLogoUrl?: string; error?: string };
      if (!response.ok || !result.companyLogoUrl) throw new Error(result.error || "Company logo could not be saved.");
      const updatedCompany = { ...inventoryCompanyProfile, companyLogoUrl: result.companyLogoUrl };
      setInventoryCompanyProfile(updatedCompany);
      setAdminCompanies((current) => current.map((company) => company.id === updatedCompany.id ? updatedCompany : company));
      setInventoryCompanyLogoPreview("");
      setInventoryCompanyLogoFile(null);
      setInventoryCompanyEdit(false);
      setAdminMessage(`${updatedCompany.companyName} logo was saved and will appear in the vendor dashboard.`);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Company logo could not be saved.");
    }
  };

  useEffect(() => {
    try {
      const savedCampaigns = window.localStorage.getItem("asnads_created_campaigns");
      if (savedCampaigns) setCreatedCampaigns(JSON.parse(savedCampaigns) as CreatedCampaign[]);
      if (new URLSearchParams(window.location.search).get("test") === "campaigns") {
        setCreatedCampaigns((current) => current.some((campaign) => campaign.id === testCampaignModel.id) ? current : [testCampaignModel, ...current]);
        setExpandedCampaignIds([testCampaignModel.id]);
        setCampaignsOpen(true);
      }
    } catch {
      window.localStorage.removeItem("asnads_created_campaigns");
    }
    setCampaignsLoaded(true);
  }, []);

  useEffect(() => {
    if (!authReady || !authUser || !campaignsLoaded || authUser.role === "admin" || isVendorAccount(authUser)) return;
    if (createdCampaigns.length > 0) {
      setAuthStartCampaign(false);
      setCampaignsOpen(true);
      return;
    }
    if (authStartCampaign) {
      setAuthStartCampaign(false);
      openCampaign();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, authUser, authStartCampaign, campaignsLoaded, createdCampaigns.length]);

  const openAuth = (mode: "login" | "register" = "login", launchCampaign = false, purpose: "advertiser" | "owner" | "admin" = "advertiser") => {
    setAuthMode(mode);
    setAuthError("");
    setAuthMessage("");
    setAuthStartCampaign(launchCampaign);
    setAuthPurpose(purpose);
    setShowLoginPassword(false);
    setAuthOpen(true);
  };

  const getSessionToken = () => window.localStorage.getItem("asnads_persistent_session") || window.sessionStorage.getItem("asnads_session") || "";

  const loadAdminCompanies = async (token = getSessionToken()) => {
    if (!token) return;
    setAdminLoading(true);
    setAdminError("");
    try {
      const response = await fetch(`${ASNADS_API}/admin/companies`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json() as { companies?: AdminCompany[]; error?: string };
      if (!response.ok || !result.companies) throw new Error(result.error || "Could not load company records.");
      setAdminCompanies(result.companies);
      setAdminMessage(`${result.companies.length} company records loaded securely.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load company records.";
      setAdminError(message === "Failed to fetch" ? "Unable to connect to the secure admin service." : message);
    } finally {
      setAdminLoading(false);
    }
  };

  const openAdminDashboard = () => {
    if (!authUser || authUser.role !== "admin") {
      openAuth("login", false, "admin");
      return;
    }
    setAdminPanelOpen(true);
    void loadAdminCompanies();
  };

  const deleteAdminCompany = async (company: AdminCompany) => {
    if (!window.confirm(`Delete ${company.companyName}? This removes its company account and cannot be undone.`)) return;
    const token = getSessionToken();
    try {
      const response = await fetch(`${ASNADS_API}/admin/companies/${company.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not delete this company.");
      setAdminCompanies((current) => current.filter((item) => item.id !== company.id));
      setAdminMessage(`${company.companyName} was deleted.`);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Could not delete this company.");
    }
  };

  const submitAdminCompany = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      companyName: form.get("companyName"), businessSector: form.get("businessSector"), contactPerson: form.get("contactPerson"),
      contactNumber: form.get("contactNumber"), whatsappNumber: form.get("whatsappNumber"), companyEmail: form.get("companyEmail"),
      accountType: form.get("accountType"), password: form.get("password"),
    };
    try {
      const response = await fetch(`${ASNADS_API}/admin/companies`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getSessionToken()}` }, body: JSON.stringify(payload) });
      const result = await response.json() as { company?: AdminCompany; error?: string };
      if (!response.ok || !result.company) throw new Error(result.error || "Could not add this company.");
      setAdminCompanies((current) => [result.company!, ...current]);
      setAdminAddOpen(false);
      setAdminMessage(`${result.company.companyName} was added successfully.`);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Could not add this company.");
    }
  };

  const updateAdminCompanyStatus = async (company: AdminCompany, accountStatus: "active" | "pending") => {
    const action = accountStatus === "active" ? "activate" : "move back to pending review";
    if (!window.confirm(`${action[0].toUpperCase()}${action.slice(1)} ${company.companyName}?`)) return;
    try {
      const response = await fetch(`${ASNADS_API}/admin/companies/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getSessionToken()}` },
        body: JSON.stringify({ accountStatus }),
      });
      const result = await response.json() as { company?: AdminCompany; error?: string; message?: string };
      if (!response.ok || !result.company) throw new Error(result.error || "Could not update this account.");
      setAdminCompanies((current) => current.map((item) => item.id === company.id ? result.company! : item));
      setAdminMessage(result.message || `${company.companyName} was updated.`);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Could not update this account.");
    }
  };

  const updateAdminCompanyEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inventoryCompanyProfile) return;
    const form = new FormData(event.currentTarget);
    const companyEmail = String(form.get("companyEmail") || "").trim().toLowerCase();
    if (!companyEmail) return;

    setAdminCompanyEmailLoading(true);
    setAdminCompanyEmailError("");
    setAdminCompanyEmailMessage("");
    try {
      const response = await fetch(`${ASNADS_API}/admin/companies/${inventoryCompanyProfile.id}/email`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getSessionToken()}` },
        body: JSON.stringify({ companyEmail }),
      });
      const result = await response.json() as { company?: AdminCompany; error?: string; message?: string };
      if (!response.ok || !result.company) throw new Error(result.error || "Could not update this company email.");
      setInventoryCompanyProfile(result.company);
      setAdminCompanies((current) => current.map((company) => company.id === result.company!.id ? result.company! : company));
      setAdminCompanyEmailMessage(result.message || "Email updated. Verification email sent.");
      setAdminMessage(`${result.company.companyName} login email was updated.`);
    } catch (error) {
      setAdminCompanyEmailError(error instanceof Error ? error.message : "Could not update this company email.");
    } finally {
      setAdminCompanyEmailLoading(false);
    }
  };

  const resendAdminCompanyVerification = async () => {
    if (!inventoryCompanyProfile) return;
    setAdminCompanyEmailLoading(true);
    setAdminCompanyEmailError("");
    setAdminCompanyEmailMessage("");
    try {
      const response = await fetch(`${ASNADS_API}/admin/companies/${inventoryCompanyProfile.id}/send-email-verification`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getSessionToken()}` },
      });
      const result = await response.json() as { company?: AdminCompany; error?: string; message?: string };
      if (!response.ok) throw new Error(result.error || "Could not send the verification email.");
      if (result.company) {
        setInventoryCompanyProfile(result.company);
        setAdminCompanies((current) => current.map((company) => company.id === result.company!.id ? result.company! : company));
      }
      setAdminCompanyEmailMessage(result.message || "Verification email sent.");
    } catch (error) {
      setAdminCompanyEmailError(error instanceof Error ? error.message : "Could not send the verification email.");
    } finally {
      setAdminCompanyEmailLoading(false);
    }
  };


  const saveVendorProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setVendorProfileError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${ASNADS_API}/vendor/company-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getSessionToken()}` },
        body: JSON.stringify({
          companyName: form.get("companyName"),
          businessSector: form.get("businessSector"),
          contactPerson: form.get("contactPerson"),
          contactNumber: form.get("contactNumber"),
          whatsappNumber: form.get("whatsappNumber"),
        }),
      });
      const result = await response.json() as { user?: AuthUser; error?: string };
      if (!response.ok || !result.user) throw new Error(result.error || "Profile could not be updated.");
      setAuthUser(result.user);
      setVendorProfileEditing(false);
      notify("Company profile updated successfully.");
    } catch (error) {
      setVendorProfileError(error instanceof Error ? error.message : "Profile could not be updated.");
    }
  };

  const loadVendorDocuments = async () => {
    if (!isVendorAccount(authUser)) return;
    setVendorDocumentsLoading(true);
    setVendorDocumentError("");
    try {
      const response = await fetch(`${ASNADS_API}/vendor/documents`, { headers: { Authorization: `Bearer ${getSessionToken()}` } });
      const result = await response.json() as { documents?: VendorDocument[]; error?: string };
      if (!response.ok || !result.documents) throw new Error(result.error || "Documents could not be loaded.");
      setVendorDocuments(result.documents);
    } catch (error) {
      setVendorDocumentError(error instanceof Error ? error.message : "Documents could not be loaded.");
    } finally {
      setVendorDocumentsLoading(false);
    }
  };

  const uploadVendorDocument = async (documentType: VendorDocument["document_type"], file: File | null) => {
    if (!file) return;
    setVendorDocumentError("");
    try {
      const body = new FormData();
      body.append("document", file);
      const response = await fetch(`${ASNADS_API}/vendor/documents/${documentType}`, { method: "POST", headers: { Authorization: `Bearer ${getSessionToken()}` }, body });
      const result = await response.json() as { document?: VendorDocument; error?: string };
      if (!response.ok || !result.document) throw new Error(result.error || "Document could not be uploaded.");
      setVendorDocuments((current) => [...current.filter((document) => document.document_type !== documentType), result.document!]);
      notify("Document uploaded successfully.");
    } catch (error) {
      setVendorDocumentError(error instanceof Error ? error.message : "Document could not be uploaded.");
    }
  };

  const removeVendorDocument = async (documentType: VendorDocument["document_type"]) => {
    if (!window.confirm("Remove this document? You can upload a replacement at any time.")) return;
    setVendorDocumentError("");
    try {
      const response = await fetch(`${ASNADS_API}/vendor/documents/${documentType}`, { method: "DELETE", headers: { Authorization: `Bearer ${getSessionToken()}` } });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Document could not be removed.");
      setVendorDocuments((current) => current.filter((document) => document.document_type !== documentType));
      notify("Document removed.");
    } catch (error) {
      setVendorDocumentError(error instanceof Error ? error.message : "Document could not be removed.");
    }
  };

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthSubmitting(true);
    setAuthError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${ASNADS_API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const result = await response.json() as { token?: string; user?: AuthUser; error?: string };
      if (!response.ok || !result.token || !result.user) throw new Error(result.error || "Login failed.");
      if (authPurpose === "admin" && result.user.role !== "admin") {
        await fetch(`${ASNADS_API}/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${result.token}` } }).catch(() => undefined);
        throw new Error("This account does not have administrator access.");
      }
      const email = String(form.get("email") ?? "").trim().toLowerCase();
      const shouldRemember = form.get("remember") === "on";
      if (shouldRemember) {
        window.localStorage.setItem("asnads_persistent_session", result.token);
        window.localStorage.setItem("asnads_remembered_email", email);
      } else {
        window.sessionStorage.setItem("asnads_session", result.token);
        window.localStorage.removeItem("asnads_persistent_session");
        window.localStorage.removeItem("asnads_remembered_email");
      }
      setRememberedEmail(shouldRemember ? email : "");
      setAuthUser(result.user);
      setAuthOpen(false);
      if (isVendorAccount(result.user)) {
        setVendorDashboardTab("overview");
        setVendorDashboardOpen(true);
      }
      if (authPurpose === "admin") {
        setAdminPanelOpen(true);
        void loadAdminCompanies(result.token);
      }
      notify(`Welcome back, ${result.user.fullName}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed.";
      setAuthError(message === "Failed to fetch"
        ? "Unable to connect to ASNads securely. Please try again."
        : message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthSubmitting(true);
    setAuthError("");
    setAuthMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");
    if (password.length < 8) {
      setAuthError("Password must contain at least 8 characters.");
      setAuthSubmitting(false);
      return;
    }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setAuthError("Password must contain at least 1 capital letter and 1 number.");
      setAuthSubmitting(false);
      return;
    }
    if (password !== confirmPassword) {
      setAuthError("Passwords do not match.");
      setAuthSubmitting(false);
      return;
    }
    const isPreviewHost =
      window.location.port === "5173" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "terminal.local";
    const isLocalVendorTest = authPurpose === "owner" && isPreviewHost;
    if (isLocalVendorTest) {
      const companyName = String(form.get("companyName") || "New vendor");
      const contactPerson = String(form.get("contactPerson") || "Vendor user");
      const companyEmail = String(form.get("companyEmail") || "vendor@asnads.local");
      setAuthUser({
        id: Date.now(),
        companyId: Date.now(),
        companyName,
        fullName: contactPerson,
        email: companyEmail,
        role: "billboard_owner",
        accountStatus: "pending",
      });
      setAuthOpen(false);
      setVendorDashboardTab("overview");
      setVendorDashboardOpen(true);
      setAuthSubmitting(false);
      formElement.reset();
      notify(`${companyName} registered in testing mode. Continue from the Vendor Dashboard.`);
      return;
    }
    try {
      const response = await fetch(`${ASNADS_API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.get("companyName"),
          businessSector: form.get("businessSector"),
          contactPerson: form.get("contactPerson"),
          contactNumber: form.get("contactNumber"),
          whatsappNumber: form.get("whatsappNumber"),
          companyEmail: form.get("companyEmail"),
          accountType: authPurpose === "owner" ? "billboard_owner" : "advertiser",
          role: authPurpose === "owner" ? "billboard_owner" : "advertiser",
          password,
        }),
      });
      const result = await response.json() as { message?: string; error?: string; fields?: string[] };
      if (!response.ok) throw new Error(result.error || "Registration failed.");
      const registeredEmail = String(form.get("companyEmail") || "").trim();
      formElement.reset();
      setAuthMode("login");
      setAuthMessage(result.message || `Registration received. Verify the email sent to ${registeredEmail}, then log in to open your dashboard.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed.";
      setAuthError(message === "Failed to fetch"
        ? "Unable to connect to ASNads securely. Please try again."
        : message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const submitForgotPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthSubmitting(true);
    setAuthError("");
    setAuthMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${ASNADS_API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email") }),
      });
      const result = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "Password reset request failed.");
      setAuthMessage(result.message || "If this email is registered, a secure reset link has been sent.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Password reset request failed.";
      setAuthError(message === "Failed to fetch"
        ? "Unable to connect to ASNads securely. Please try again."
        : message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const submitResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthSubmitting(true);
    setAuthError("");
    setAuthMessage("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");
    if (password.length < 8) {
      setAuthError("Password must contain at least 8 characters.");
      setAuthSubmitting(false);
      return;
    }
    if (password !== confirmPassword) {
      setAuthError("Passwords do not match.");
      setAuthSubmitting(false);
      return;
    }
    try {
      const response = await fetch(`${ASNADS_API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password }),
      });
      const result = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "Password reset failed.");
      setAuthMessage(result.message || "Your password has been changed. You can now log in securely.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Password reset failed.";
      setAuthError(message === "Failed to fetch"
        ? "Unable to connect to ASNads securely. Please try again."
        : message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const signOut = async () => {
    const token = window.localStorage.getItem("asnads_persistent_session") || window.sessionStorage.getItem("asnads_session");
    if (token) {
      await fetch(`${ASNADS_API}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }
    window.sessionStorage.removeItem("asnads_session");
    window.localStorage.removeItem("asnads_persistent_session");
    setAuthUser(null);
    setModal(null);
    notify("Signed out successfully.");
  };

  const peakDaysOnly = vendorSellingPlans.includes("peak_days");
  const peakHoursOnly = vendorSellingPlans.includes("peak_hours");
  const billboardCount = billboardIdentities.length;
  const activePricingGroup = pricingGroups.find((group) => group.id === activePricingGroupId) ?? pricingGroups[0];
  const pricingTargetKey = `group-${activePricingGroup?.id ?? 1}`;
  const activePriceProfile = priceProfiles[pricingTargetKey] ?? emptyPriceProfile();
  const selectedPricingLabel = pricingTargetMode === "billboard"
    ? "all individual billboard IDs"
    : activePricingGroup?.name || "Group 1";

  const isStaticBillboard = inventoryType === "Static Billboard";
  const periodRules = {
    hourly: { multiplier: 1, adjustment: 0, label: "Hourly", note: "starting rate" },
    day: { multiplier: 24, adjustment: -5, label: "Day", note: "−5% duration discount" },
    week: { multiplier: 24 * 7, adjustment: -10, label: "Week", note: "−10% volume discount" },
    month: { multiplier: 24 * 30, adjustment: -20, label: "Month", note: "−20% volume discount" },
  } as const;
  const staticPeriodRules = {
    week: { multiplier: 1, adjustment: 0, label: "15 Days", note: "minimum static booking" },
    month: { multiplier: 2, adjustment: 0, label: "1 Month", note: "30-day booking" },
  } as const;
  const visiblePeriods: Array<"hourly" | "day" | "week" | "month"> = isStaticBillboard
    ? [vendorSellingPlans.includes("weekly") ? "week" : null, vendorSellingPlans.includes("monthly") ? "month" : null].filter((period): period is "week" | "month" => period !== null)
    : [
        vendorSellingPlans.some((plan) => plan === "hourly_base" || plan === "peak_hours") ? "hourly" : null,
        vendorSellingPlans.some((plan) => plan === "selected_days" || plan === "peak_days") ? "day" : null,
        vendorSellingPlans.includes("weekly") ? "week" : null,
        vendorSellingPlans.includes("monthly") ? "month" : null,
      ].filter((period): period is "hourly" | "day" | "week" | "month" => period !== null);
  const selectedPeriodRule = isStaticBillboard
    ? staticPeriodRules[billingPeriod as "week" | "month"]
    : periodRules[billingPeriod];
  const startingPrice = isStaticBillboard ? baseWeeklyPrice : baseHourlyPrice;
  const periodPrice = startingPrice * selectedPeriodRule.multiplier * (1 + selectedPeriodRule.adjustment / 100);
  const peakAdjustment = isStaticBillboard ? 0 : (peakDaysOnly ? peakDayPercent : 0) + (peakHoursOnly ? peakHourPercent : 0);
  const calculatedPrice = Math.max(0, Math.round(periodPrice * (1 + peakAdjustment / 100)));
  const primaryMapPreviewUrl = getMapPreviewUrl(billboardIdentities[0].latitude, billboardIdentities[0].longitude);
  const publishedPhiListings: Listing[] = vendorInventory
    .filter((location) => publishedPhiPages.includes(location.page))
    .map((location, index) => ({
      id: 5000 + location.page,
      title: location.name,
      location: `${location.road}, Dubai`,
      category: "Digital Billboard",
      format: `Digital · ${location.size}`,
      audience: location.traffic,
      price: baseHourlyPrice,
      vendor: "Phi",
      tone: index % 2 ? "cyan" : "violet",
      tag: location.upcoming ? "Upcoming 2026" : "Admin approved",
      latitude: 25.2048,
      longitude: 55.2708,
      hourlyViews: Math.round(Number(location.traffic.match(/\d+/)?.[0] || 1) * 1_000_000 / 30 / 24),
      dailyViews: Math.round(Number(location.traffic.match(/\d+/)?.[0] || 1) * 1_000_000 / 30),
      traffic: location.traffic,
      facing: location.landmark,
      illumination: "Digital LED",
    }));
  const effectiveCampaignInventory = [...campaignInventory, ...publishedPhiListings];
  const campaignLocations = effectiveCampaignInventory.filter((listing) => campaignLocationIds.includes(String(listing.id)));
  const campaignAdGroups = Array.from(
    campaignLocations.reduce((groups, listing) => {
      const current = groups.get(listing.category) ?? [];
      current.push(listing);
      groups.set(listing.category, current);
      return groups;
    }, new Map<string, Listing[]>()),
    ([category, listings], index) => ({
      id: `ad-group-${index + 1}`,
      category,
      name: `${category.replace(/ Billboard$/i, "")} Ad Group`,
      listings,
    }),
  );
  const selectedCampaignDetails = createdCampaigns.find((campaign) => campaign.id === campaignDetailsId) ?? null;
  const campaignSelectedCategories = campaignLocations.length > 0 ? campaignLocations.map((listing) => listing.category) : preferredBillboardTypes;
  const campaignTypeCode = [...new Set(campaignSelectedCategories.map((category) => campaignBillboardCodes[category] ?? cleanCode(category, 2)))].filter(Boolean).join("") || "XX";
  const campaignEmiratesCode = campaignEmirates.map((emirate) => campaignEmirateCodes[emirate] ?? cleanCode(emirate, 1)).join("") || "X";
  const campaignNamePrefix = `AE-${campaignTypeCode}-${campaignEmiratesCode}`;
  const campaignCustomNameCode = campaignCustomName.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const finalCampaignName = campaignCustomNameCode ? `${campaignNamePrefix}-${campaignCustomNameCode}` : campaignNamePrefix;
  const campaignCreativeRequirements = campaignLocations.map(getCampaignCreativeRequirement);
  const campaignCreativeIsStatic = campaignLocations.length > 0 && campaignLocations.every((listing) => listing.category === "Static Billboard");
  const selectedCreativeRequirement = campaignCreativeRequirements.find((requirement) => String(requirement.listingId) === creativePreviewListingId)
    ?? campaignCreativeRequirements[0];
  const campaignCreativeAccept = campaignCreativeIsStatic
    ? ".jpg,.jpeg,.png,.tif,.tiff,.pdf"
    : ".jpg,.jpeg,.png,.webp,.mp4,.webm,.mov";
  const campaignCreativeExtension = campaignCreativeFile?.name.split(".").pop()?.toLowerCase() ?? "";
  const campaignCreativeKind = ["mp4", "webm", "mov"].includes(campaignCreativeExtension)
    ? "video"
    : ["jpg", "jpeg", "png", "webp"].includes(campaignCreativeExtension)
      ? "image"
      : "document";
  const selectedCreativeRatio = selectedCreativeRequirement ? selectedCreativeRequirement.width / selectedCreativeRequirement.height : 16 / 9;
  const uploadedCreativeRatio = campaignCreativeMetadata ? campaignCreativeMetadata.width / campaignCreativeMetadata.height : null;
  const campaignCreativeRatioMatches = uploadedCreativeRatio ? Math.abs(uploadedCreativeRatio - selectedCreativeRatio) / selectedCreativeRatio <= 0.05 : null;
  const campaignCreativeResolutionReady = campaignCreativeMetadata && selectedCreativeRequirement
    ? campaignCreativeMetadata.width >= selectedCreativeRequirement.width && campaignCreativeMetadata.height >= selectedCreativeRequirement.height
    : null;
  const allCampaignEmiratesSelected = campaignEmirates.length === emirates.length;
  const campaignAreaOptions = campaignEmirates.flatMap((emirate) => emirateAreas[emirate] ?? []);
  const campaignMarketLabel = campaignEmirates.length === 1
    ? campaignEmirates[0]
    : `${campaignEmirates.length} selected Emirates`;
  const locationFilteredBillboards = effectiveCampaignInventory.filter((listing) =>
    (campaignEmirates.length === 0 || campaignEmirates.some((emirate) => listing.location.includes(emirate))) &&
    (!campaignArea || listing.location.includes(campaignArea))
  );
  const campaignTypeIsStatic = campaignMediaFormat === "static";
  const campaignTypeUsesFlexiblePlans = campaignMediaFormat === "digital";
  const campaignEmailVerificationStarted = campaignEmail.trim() !== "" || campaignEmailConfirm.trim() !== "";
  const campaignEmailMatches = campaignEmail.trim() !== "" && campaignEmailConfirm.trim() !== "" && campaignEmail.trim().toLowerCase() === campaignEmailConfirm.trim().toLowerCase();
  const campaignMissingDocuments = !isCampaignTestMode && campaignValidationAttempted && (!campaignTradeLicenseName || !campaignVatCertificateName);
  const campaignNeedsHours = !campaignTypeIsStatic && (advertiserPlan === "hourly_base" || advertiserPlan === "peak_hours");
  const campaignNeedsDays = !campaignTypeIsStatic && (advertiserPlan === "selected_days" || advertiserPlan === "peak_days");
  const parsedCampaignStartDate = parseDmyDate(campaignStartDate);
  const parsedCampaignEndDate = parseDmyDate(campaignEndDate);
  const campaignDateRangeInvalid = campaignNeedsDays && Boolean(parsedCampaignStartDate && parsedCampaignEndDate && parsedCampaignEndDate < parsedCampaignStartDate);
  const campaignDatesInvalid = !parsedCampaignStartDate || (campaignNeedsDays && (!parsedCampaignEndDate || campaignDateRangeInvalid));
  const calculatedDailyBookingDays = campaignNeedsDays ? countBookingDaysInRange(campaignStartDate, campaignEndDate, advertiserDays) : null;
  const effectiveCampaignBookingDays = calculatedDailyBookingDays ?? campaignBookingDays;
  const campaignDayRangeHasNoBookingDays = campaignNeedsDays && calculatedDailyBookingDays === 0;
  const campaignMissingEmirates = campaignValidationAttempted && campaignEmirates.length === 0;
  const campaignMissingVenueType = campaignValidationAttempted && preferredBillboardTypes.length === 0;
  const campaignMissingPlan = campaignValidationAttempted && !campaignTypeIsStatic && !advertiserPlan;
  const campaignMissingInventory = campaignValidationAttempted && campaignLocations.length === 0;
  const campaignMissingDates = campaignValidationAttempted && campaignDatesInvalid;
  const campaignMissingOwnerSchedule = campaignValidationAttempted && ((campaignNeedsHours && advertiserHours.length === 0) || (campaignNeedsDays && (advertiserDays.length === 0 || campaignDayRangeHasNoBookingDays)));
  const advertiserPlanOptions = campaignTypeUsesFlexiblePlans
    ? sellingPlanOptions.filter((plan) => ["hourly_base", "selected_days", "peak_hours", "peak_days", "monthly"].includes(plan.id))
    : sellingPlanOptions;
  const typedLocationBillboards = preferredBillboardTypes.length === 0
    ? []
    : locationFilteredBillboards.filter((listing) =>
      preferredBillboardTypes.includes(listing.category) &&
      (!campaignMediaFormat || listing.format.toLowerCase().startsWith(campaignMediaFormat))
    );
  const areaBillboards = campaignTypeIsStatic
    ? typedLocationBillboards
    : advertiserPlan
      ? typedLocationBillboards.filter((listing) => getOwnerInventorySchedule(listing).plans.includes(advertiserPlan))
      : [];
  const inventoryPlanCounts = advertiserPlanOptions.reduce<Record<string, number>>((counts, plan) => ({
    ...counts,
    [plan.id]: typedLocationBillboards.filter((listing) => getOwnerInventorySchedule(listing).plans.includes(plan.id)).length,
  }), {});
  const campaignLocationSchedules = campaignLocations.map(getOwnerInventorySchedule);
  const ownerApprovedHours = campaignLocationSchedules.length > 0 && advertiserPlan
    ? (advertiserPlan === "peak_hours" ? campaignLocationSchedules[0].peakHours : campaignLocationSchedules[0].availableHours)
      .filter((hour) => campaignLocationSchedules.every((schedule) => (advertiserPlan === "peak_hours" ? schedule.peakHours : schedule.availableHours).includes(hour)))
    : [];
  const ownerApprovedDays = campaignLocationSchedules.length > 0 && advertiserPlan
    ? (advertiserPlan === "peak_days" ? campaignLocationSchedules[0].peakDays : campaignLocationSchedules[0].availableDays)
      .filter((day) => campaignLocationSchedules.every((schedule) => (advertiserPlan === "peak_days" ? schedule.peakDays : schedule.availableDays).includes(day)))
    : [];
  const campaignSelectionUnit = campaignTypeIsStatic ? `${staticCampaignDuration} days` : advertiserPlan ? getPlanUnit(advertiserPlan) : "booking";
  const getCampaignSelectionPrice = (listing: Listing) => {
    if (campaignTypeIsStatic) {
      const prices = getListingPrices(listing);
      return staticCampaignDuration === "30" ? prices.month : Math.round(prices.week * 15 / 7);
    }
    return advertiserPlan ? getListingPlanPrice(listing, advertiserPlan, getOwnerInventorySchedule(listing)) : 0;
  };
  const campaignBaseRateTotal = campaignLocations.reduce((total, listing) => total + getCampaignSelectionPrice(listing), 0);
  const campaignHoursPerDay = advertiserHours.length;
  const campaignTotalBookedHours = campaignHoursPerDay * effectiveCampaignBookingDays;
  const campaignSelectionMultiplier = campaignNeedsHours && campaignHoursPerDay > 0
    ? campaignTotalBookedHours
    : campaignNeedsDays && advertiserDays.length > 0 && effectiveCampaignBookingDays > 0
      ? effectiveCampaignBookingDays
      : 1;
  const campaignSelectionTotal = campaignBaseRateTotal * campaignSelectionMultiplier;
  const campaignVatAmount = campaignSelectionTotal * 0.05;
  const campaignPayableTotal = campaignSelectionTotal + campaignVatAmount;
  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();
  const calendarFirstOffset = (new Date(calendarYear, calendarMonthIndex, 1).getDay() + 6) % 7;
  const calendarDayCount = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();
  const calendarCells: Array<number | null> = [...Array(calendarFirstOffset).fill(null), ...Array.from({ length: calendarDayCount }, (_, index) => index + 1)];
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const calendarLabel = calendarMonth.toLocaleDateString("en-AE", { month: "long", year: "numeric" });

  const handleInventoryTypeChange = (value: string) => {
    setInventoryType(value);
    updateBillboardType(0, value);
    if (value === "Static Billboard") {
      setBillingPeriod("week");
      setVendorSellingPlans(["weekly"]);
    } else if (inventoryType === "Static Billboard") {
      setPricingTargetMode("billboard");
      setBillingPeriod("hourly");
      setVendorSellingPlans(["hourly_base", "selected_days", "weekly", "monthly"]);
    }
  };

  const toggleVendorSellingPlan = (plan: SellingPlan) => {
    setVendorSellingPlans((current) => {
      if (isStaticBillboard) {
        setBillingPeriod(plan === "monthly" ? "month" : "week");
        return [plan];
      }
      const next = current.includes(plan) ? current.filter((item) => item !== plan) : [...current, plan];
      const allowedPeriods: Array<"hourly" | "day" | "week" | "month"> = [
        next.some((item) => item === "hourly_base" || item === "peak_hours") ? "hourly" : null,
        next.some((item) => item === "selected_days" || item === "peak_days") ? "day" : null,
        next.includes("weekly") ? "week" : null,
        next.includes("monthly") ? "month" : null,
      ].filter((period): period is "hourly" | "day" | "week" | "month" => period !== null);
      if (!allowedPeriods.includes(billingPeriod) && allowedPeriods.length > 0) setBillingPeriod(allowedPeriods[0]);
      return next;
    });
  };

  const toggleAdvertiserDay = (day: string) => {
    setAdvertiserDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day]);
  };

  const toggleAdvertiserHour = (hour: number) => {
    setAdvertiserHours((current) => current.includes(hour) ? current.filter((item) => item !== hour) : [...current, hour]);
  };

  const chooseAdvertiserPlan = (plan: SellingPlan) => {
    setAdvertiserPlan(plan);
    setAdvertiserDays([]);
    setAdvertiserHours([]);
    setCampaignBookingDays(1);
    setCampaignStartDate("");
    setCampaignEndDate("");
    setCampaignLocationId("");
    setCampaignLocationIds([]);
    setSelected(null);
    setShowAreaBillboards(campaignEmirates.length > 0 && preferredBillboardTypes.length > 0);
  };

  const togglePreferredBillboardType = (type: string) => {
    const option = campaignBillboardTypes.find((item) => item.label === type);
    setPreferredBillboardTypes(option?.matches ?? []);
    setCampaignLocationId("");
    setCampaignLocationIds([]);
    setSelected(null);
    setShowAreaBillboards(false);
    setAdvertiserPlan(type === "Static Billboards" ? "weekly" : "");
    setAdvertiserDays([]);
    setAdvertiserHours([]);
    setCampaignBookingDays(1);
    setCampaignStartDate("");
    setCampaignEndDate("");
    setStaticCampaignDuration("15");
    resetCampaignCreative();
  };

  const chooseCampaignPlacement = (placement: "road" | "mall" | "bridge", format = campaignMediaFormat) => {
    if (!format) return;
    const option = campaignPlacementOptions.find((item) => item.id === placement);
    setCampaignPlacement(placement);
    setPreferredBillboardTypes(option ? [...(format === "static" ? option.staticMatches : option.digitalMatches)] : []);
    setCampaignLocationId("");
    setCampaignLocationIds([]);
    setSelected(null);
    setShowAreaBillboards(false);
    setAdvertiserPlan(format === "static" ? "weekly" : "");
    setAdvertiserDays([]);
    setAdvertiserHours([]);
    setCampaignBookingDays(1);
    setCampaignStartDate("");
    setCampaignEndDate("");
    setStaticCampaignDuration("15");
    resetCampaignCreative();
  };

  const chooseCampaignMediaFormat = (format: "static" | "digital") => {
    setCampaignMediaFormat(format);
    chooseCampaignPlacement(campaignPlacement || "road", format);
  };

  const updateBillboardIdentity = (index: number, field: keyof BillboardIdentity, value: string) => {
    setBillboardIdentities((current) => current.map((identity, identityIndex) => identityIndex === index ? { ...identity, [field]: value } : identity));
  };

  const updateBillboardType = (index: number, billboardType: string) => {
    setBillboardIdentities((current) => current.map((identity, identityIndex) => {
      if (identityIndex !== index) return identity;
      if (billboardType === "Digital Kiosk" || identity.billboardType === "Digital Kiosk") return { ...identity, billboardType, mallName: "", location: "" };
      return { ...identity, billboardType };
    }));
  };

  const updateDigitalKioskMall = (index: number, mallName: string) => {
    setBillboardIdentities((current) => current.map((identity, identityIndex) => identityIndex === index ? { ...identity, mallName, location: mallName } : identity));
  };

  const addBillboard = () => {
    const newIndex = billboardCount;
    setBillboardIdentities((current) => [...current, emptyBillboardIdentity(current.length + 1)]);
    setPriceProfiles((current) => ({ ...current, [`billboard-${newIndex}`]: current[`billboard-${newIndex}`] ?? emptyPriceProfile() }));
  };

  const removeLastBillboard = () => {
    const removedIndex = billboardCount - 1;
    setBillboardIdentities((current) => current.slice(0, -1));
    setPriceProfiles((current) => {
      const next = { ...current };
      delete next[`billboard-${removedIndex}`];
      return next;
    });
  };

  const updateHourlyPrice = (targetKey: string, value: string) => {
    const hourly = Number(value);
    const calculated = value === "" || !Number.isFinite(hourly)
      ? { daily: "", weekly: "", monthly: "" }
      : {
          daily: String(Math.round(hourly * 24 * 0.95)),
          weekly: String(Math.round(hourly * 24 * 7 * 0.9)),
          monthly: String(Math.round(hourly * 24 * 30 * 0.8)),
        };
    setPriceProfiles((current) => ({ ...current, [targetKey]: { ...(current[targetKey] ?? emptyPriceProfile()), hourly: value, ...calculated } }));
  };

  const updateWeeklyPrice = (targetKey: string, value: string) => {
    const fifteenDayPrice = Number(value);
    const monthly = value === "" || !Number.isFinite(fifteenDayPrice) ? "" : String(Math.round(fifteenDayPrice * 2));
    setPriceProfiles((current) => ({ ...current, [targetKey]: { ...(current[targetKey] ?? emptyPriceProfile()), weekly: value, monthly } }));
  };

  const updatePricingGroup = (groupId: number, changes: Partial<PricingGroup>) => {
    setPricingGroups((current) => current.map((group) => group.id === groupId ? { ...group, ...changes } : group));
  };

  const toggleGroupBillboard = (groupId: number, billboardIndex: number) => {
    const group = pricingGroups.find((item) => item.id === groupId);
    if (!group) return;
    const assignedGroup = pricingGroups.find((item) => item.id !== groupId && item.billboardIndexes.includes(billboardIndex));
    if (!group.billboardIndexes.includes(billboardIndex) && assignedGroup) {
      notify(`Billboard ${billboardIndex + 1} is already assigned to ${assignedGroup.name}. Remove it there before adding it to another group.`);
      return;
    }
    const billboardIndexes = group.billboardIndexes.includes(billboardIndex) ? group.billboardIndexes.filter((item) => item !== billboardIndex) : [...group.billboardIndexes, billboardIndex];
    updatePricingGroup(groupId, { billboardIndexes });
  };

  const toggleGroupPackagePlan = (groupId: number, plan: "fifteen_days" | "one_month") => {
    const group = pricingGroups.find((item) => item.id === groupId);
    if (!group) return;
    const currentPlans = group.packagePlans ?? ["fifteen_days", "one_month"];
    const packagePlans = currentPlans.includes(plan)
      ? currentPlans.length === 1 ? currentPlans : currentPlans.filter((item) => item !== plan)
      : [...currentPlans, plan];
    updatePricingGroup(groupId, { packagePlans });
  };

  const addBillboardToGroup = (groupId: number) => {
    const newIndex = billboardIdentities.length;
    setBillboardIdentities((current) => [...current, emptyBillboardIdentity(current.length + 1)]);
    setPricingGroups((current) => current.map((group) => group.id === groupId
      ? { ...group, billboardIndexes: [...group.billboardIndexes, newIndex] }
      : group));
    setPriceProfiles((current) => ({ ...current, [`billboard-${newIndex}`]: current[`billboard-${newIndex}`] ?? emptyPriceProfile() }));
    setActivePricingGroupId(groupId);
    openVendorMenuSection(1, "inventory-add-more");
    notify(`Billboard ${newIndex + 1} was added to this group. Complete its inventory details before returning to pricing.`);
  };

  const updateGroupPackagePrice = (targetKey: string, field: "weekly" | "monthly", value: string) => {
    setPriceProfiles((current) => ({
      ...current,
      [targetKey]: { ...(current[targetKey] ?? emptyPriceProfile()), [field]: value },
    }));
  };

  const openVendorForm = () => {
    setVendorStep(1);
    setInventoryType("");
    setVendorShortName("");
    setTradeLicenseName("");
    setVatCertificateName("");
    setBillboardIdentities([emptyBillboardIdentity(1)]);
    setPricingTargetMode("billboard");
    setPricingGroups([{ id: 1, name: "Group 1", billboardIndexes: [], packagePlans: ["fifteen_days", "one_month"] }]);
    setActivePricingGroupId(1);
    setPriceProfiles({});
    setModal("vendor");
  };

  const openVendor = () => {
    if (!authUser) {
      const isLocalPreview = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
      if (isLocalPreview) {
        setAuthUser({ id: 0, companyId: 0, companyName: "Local Preview Vendor", fullName: "Vendor Preview", email: "vendor-preview@asnads.local", role: "billboard_owner", accountStatus: "active" });
        openVendorForm();
        return;
      }
      openAuth("register", false, "owner");
      return;
    }
    if (isVendorAccount(authUser)) {
      setVendorDashboardTab("overview");
      setVendorDashboardOpen(true);
      return;
    }
    openVendorForm();
  };

  const resetCampaignCreative = () => {
    setCampaignCreativeFile(null);
    setCampaignCreativeUrl("");
    setCampaignCreativeMetadata(null);
    setCampaignCreativeError("");
    setCreativePreviewListingId("");
  };

  const openCampaign = (listing: Listing | null = null) => {
    setCampaignFromDashboard(false);
    const listingEmirate = listing ? emirates.find((emirate) => listing.location.includes(emirate)) : undefined;
    const listingIsStatic = Boolean(listing?.format.startsWith("Static"));
    setSelected(listingIsStatic ? listing : null);
    setCampaignLocationId(listingIsStatic && listing ? String(listing.id) : "");
    setCampaignLocationIds(listingIsStatic && listing ? [String(listing.id)] : []);
    setShowAreaBillboards(listingIsStatic);
    setCampaignObjective("Brand awareness");
    setCampaignEmail("");
    setCampaignEmailConfirm("");
    setCampaignEmirates(listingEmirate ? [listingEmirate] : []);
    setCampaignArea(listing ? listing.location.split(",")[0] : "");
    setPreferredBillboardTypes(listing ? [listing.category] : []);
    setCampaignMediaFormat(listing ? (listingIsStatic ? "static" : "digital") : "");
    setCampaignPlacement(listing ? (listing.category === "Mall Billboard" || listing.category === "Digital Kiosk" ? "mall" : listing.category === "Bridge" ? "bridge" : "road") : "");
    setAdvertiserPlan(listingIsStatic ? "weekly" : "");
    setAdvertiserDays([]);
    setAdvertiserHours([]);
    setCampaignBookingDays(1);
    setCampaignStartDate("");
    setCampaignEndDate("");
    setCampaignValidationAttempted(false);
    setIsCampaignTestMode(false);
    setCampaignStage("setup");
    setCampaignCustomName("");
    setCampaignTradeLicenseName("");
    setCampaignVatCertificateName("");
    setCampaignPermissionLetterName("");
    resetCampaignCreative();
    setModal("campaign");
  };

  const launchCampaignTestMode = (layout: "guided" | "compact") => {
    const sampleListing = effectiveCampaignInventory.find((listing) =>
      listing.category === "Digital Billboard" &&
      listing.location.includes("Dubai") &&
      getOwnerInventorySchedule(listing).plans.includes("hourly_base")
    );
    setCampaignTestLayout(layout);
    setCampaignLayoutChooserOpen(false);
    openCampaign();
    setIsCampaignTestMode(true);
    setCampaignEmail("demo@advista.ae");
    setCampaignEmailConfirm("demo@advista.ae");
    setCampaignTradeLicenseName("TEST-trade-license.pdf");
    setCampaignVatCertificateName("TEST-vat-certificate.pdf");
    setCampaignPermissionLetterName("TEST-permission-letter.pdf");
    setCampaignEmirates(["Dubai"]);
    setPreferredBillboardTypes(["Digital Billboard"]);
    setCampaignMediaFormat("digital");
    setCampaignPlacement("road");
    setAdvertiserPlan("hourly_base");
    setCampaignStartDate("15/08/2026");
    setCampaignBookingDays(3);
    if (sampleListing) {
      const availableHours = getOwnerInventorySchedule(sampleListing).availableHours.slice(0, 2);
      setCampaignLocationId(String(sampleListing.id));
      setCampaignLocationIds([String(sampleListing.id)]);
      setSelected(sampleListing);
      setShowAreaBillboards(true);
      setAdvertiserHours(availableHours);
    }
  };

  const openCampaignTestMode = () => launchCampaignTestMode("guided");

  const openAdvertiserEntry = () => {
    const isLocalPreview = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    if (isLocalPreview) launchCampaignTestMode("guided");
    else openAuth("login", true);
  };

  const openCampaignFromDashboard = () => {
    setCampaignsOpen(false);
    if (authUser) openCampaign();
    else launchCampaignTestMode("guided");
    setCampaignFromDashboard(true);
  };

  const openCampaignForEmirate = (emirate: string) => {
    setSelected(null);
    setCampaignLocationId("");
    setCampaignLocationIds([]);
    setShowAreaBillboards(false);
    setCampaignObjective("Brand awareness");
    setCampaignEmail("");
    setCampaignEmailConfirm("");
    setCampaignEmirates([emirate]);
    setCampaignArea("");
    setPreferredBillboardTypes([]);
    setCampaignMediaFormat("");
    setCampaignPlacement("");
    setAdvertiserPlan("");
    setAdvertiserDays([]);
    setAdvertiserHours([]);
    setCampaignBookingDays(1);
    setCampaignStartDate("");
    setCampaignEndDate("");
    setCampaignValidationAttempted(false);
    setIsCampaignTestMode(false);
    setCampaignStage("setup");
    setCampaignCustomName("");
    setCampaignTradeLicenseName("");
    setCampaignVatCertificateName("");
    setCampaignPermissionLetterName("");
    resetCampaignCreative();
    setModal("campaign");
  };

  const resetCampaignMarketSelection = () => {
    setCampaignArea("");
    setPreferredBillboardTypes([]);
    setCampaignMediaFormat("");
    setCampaignPlacement("");
    setCampaignLocationId("");
    setCampaignLocationIds([]);
    setSelected(null);
    setShowAreaBillboards(false);
    setAdvertiserPlan("");
    setAdvertiserDays([]);
    setAdvertiserHours([]);
    setCampaignBookingDays(1);
    setCampaignStartDate("");
    setCampaignEndDate("");
    resetCampaignCreative();
  };

  const toggleCampaignEmirate = (emirate: string) => {
    setCampaignEmirates((current) => current.includes(emirate)
      ? current.filter((item) => item !== emirate)
      : emirates.filter((item) => current.includes(item) || item === emirate));
    resetCampaignMarketSelection();
  };

  const toggleAllCampaignEmirates = () => {
    setCampaignEmirates((current) => current.length === emirates.length ? [] : [...emirates]);
    resetCampaignMarketSelection();
  };

  const chooseCampaignLocation = (listing: Listing) => {
    const listingId = String(listing.id);
    const isAlreadySelected = campaignLocationIds.includes(listingId);
    const nextLocationIds = isAlreadySelected
      ? campaignLocationIds.filter((id) => id !== listingId)
      : [...campaignLocationIds, listingId];
    const nextFocusedId = isAlreadySelected && campaignLocationId === listingId
      ? nextLocationIds[0] ?? ""
      : isAlreadySelected
        ? campaignLocationId
        : listingId;
    setCampaignLocationIds(nextLocationIds);
    setCampaignLocationId(nextFocusedId);
    setSelected(effectiveCampaignInventory.find((item) => String(item.id) === nextFocusedId) ?? null);
    if (listing.format.startsWith("Static")) setAdvertiserPlan("weekly");
    setAdvertiserDays([]);
    setAdvertiserHours([]);
    resetCampaignCreative();
  };

  const calendarDateKey = (day: number) => `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const applyCalendarAvailability = (day: number) => {
    const date = new Date(calendarYear, calendarMonthIndex, day);
    if (date < todayStart) return;
    const key = calendarDateKey(day);
    setBlockedDates((current) => calendarMode === "block" ? (current.includes(key) ? current : [...current, key]) : current.filter((item) => item !== key));
  };

  const moveCalendarMonth = (offset: number) => setCalendarMonth(new Date(calendarYear, calendarMonthIndex + offset, 1));

  const toggleOperatingDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((item) => item !== day));
      setPeakDays(peakDays.filter((item) => item !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const togglePeakDay = (day: string) => {
    if (!selectedDays.includes(day)) return;
    setPeakDays(peakDays.includes(day) ? peakDays.filter((item) => item !== day) : [...peakDays, day]);
  };

  const togglePeakHour = (hour: number) => {
    setPeakHours(peakHours.includes(hour) ? peakHours.filter((item) => item !== hour) : [...peakHours, hour]);
  };

  const formatHour = formatHourLabel;

  const marketplaceLocationOptions = useMemo(() => {
    const sourceEmirates = marketEmirates.length > 0 ? marketEmirates : emirates;
    return Array.from(new Set(sourceEmirates.flatMap((emirate) => emirateAreas[emirate] ?? [])));
  }, [marketEmirates]);

  const visibleListings = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return effectiveCampaignInventory.filter((item) => {
      const emirateMatch = marketEmirates.length === 0 || marketEmirates.some((emirate) => item.location.includes(emirate));
      const venueMatch = marketVenueTypes.length === 0 || marketVenueTypes.some((venue) => marketplaceVenueFilters.find((filter) => filter.label === venue)?.categories.includes(item.category));
      const locationMatch = !marketLocation || item.location.includes(marketLocation);
      const formatMatch = marketFormats.length === 0 || marketFormats.some((format) => {
        if (format === "Digital") return item.format.startsWith("Digital") || ["Digital Billboard", "Mall Billboard", "Digital Kiosk", "Road Billboard"].includes(item.category);
        if (format === "Static") return item.format.startsWith("Static");
        if (format === "Bridge") return item.category === "Bridge";
        if (format === "Megacom") return item.title.toLowerCase().includes("mega") || item.format.includes("24 ×");
        if (format === "Building") return item.category === "Building";
        return item.title.toLowerCase().includes("lift");
      });
      const priceMatch = item.price * 4 <= marketMaxPrice;
      const availableNow = item.tag === "Available now" || item.id % 4 !== 0;
      const availabilityMatch = marketAvailability === "any" || (marketAvailability === "now" ? availableNow : !availableNow);
      const audienceMatch = item.dailyViews >= marketMinAudience;
      const searchMatch = !normalized || `${item.title} ${item.location} ${item.vendor} ${item.category}`.toLowerCase().includes(normalized);
      return emirateMatch && venueMatch && locationMatch && formatMatch && priceMatch && availabilityMatch && audienceMatch && searchMatch;
    });
  }, [marketAvailability, marketEmirates, marketFormats, marketLocation, marketMaxPrice, marketMinAudience, marketVenueTypes, query]);

  const resetMarketplaceFilters = () => {
    setMarketEmirates([]);
    setMarketVenueTypes([]);
    setMarketLocation("");
    setMarketFormats([]);
    setMarketMaxPrice(500000);
    setMarketAvailability("any");
    setMarketMinAudience(0);
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  };

  const openCampaignMenuSection = (stage: "setup" | "name" | "adgroups" | "creative", sectionId?: string) => {
    setCampaignStage(stage);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const modalElement = document.querySelector<HTMLElement>(".campaign-modal");
        if (!modalElement) return;
        if (sectionId) {
          modalElement.querySelector<HTMLElement>(`#${sectionId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          modalElement.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    });
  };

  const openVendorMenuSection = (step: 1 | 2, sectionId?: string) => {
    setVendorStep(step);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const modalElement = document.querySelector<HTMLElement>(".vendor-modal");
        if (!modalElement) return;
        if (sectionId) {
          modalElement.querySelector<HTMLElement>(`#${sectionId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          modalElement.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    });
  };

  const submitVendor = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submittedLocations = billboardIdentities
      .filter((identity) => identity.location || identity.mallName)
      .map((identity, index) => {
        const monthlyAudience = audienceTotals(identity.hourlyAudience).monthly;
        return {
          page: 5,
          name: createBillboardName(vendorShortName || "PHI", identity) || `Billboard ${vendorInventory.length + index + 1}`,
          road: identity.location || identity.mallName || identity.emirate,
          type: identity.billboardType || "Digital billboard",
          size: identity.billboardType === "Digital Kiosk" ? "Kiosk size entered in vendor form" : "Billboard dimensions entered in vendor form",
          landmark: identity.nearbyShop || identity.landmark || (identity.exitNumber ? `Exit ${identity.exitNumber}` : "Location details submitted"),
          traffic: monthlyAudience === "" ? "Audience pending verification" : `${formatAudienceTotal(monthlyAudience)} viewers/month`,
          map: identity.mapsLink || (identity.latitude && identity.longitude ? `https://www.google.com/maps?q=${identity.latitude},${identity.longitude}` : "#"),
          submitted: true,
          ownerCompanyId: authUser?.companyId,
          ownerCompanyName: authUser?.companyName,
        };
      });
    if (submittedLocations.length) {
      const submissionSeed = Date.now();
      setVendorInventory((current) => [
        ...current,
        ...submittedLocations.map((location, index) => ({ ...location, page: submissionSeed + index })),
      ]);
      setLastVendorSubmissionCount(submittedLocations.length);
      setInventorySyncVersion((current) => current + 1);
    }
    setModal(null);
    setVendorDashboardTab("inventory");
    setVendorDashboardOpen(true);
    notify(submittedLocations.length
      ? `${submittedLocations.length} billboard record${submittedLocations.length === 1 ? "" : "s"} automatically added to the company portal for admin review.`
      : "Vendor application received — our team will review it shortly.");
  };

  const saveVendorBillboardDetails = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!vendorBillboardEditor) return;
    const form = new FormData(event.currentTarget);
    const page = vendorBillboardEditor.page;
    const updatedLocation: VendorInventoryLocation = {
      ...vendorBillboardEditor,
      name: String(form.get("name") || vendorBillboardEditor.name).trim(),
      road: String(form.get("road") || vendorBillboardEditor.road).trim(),
      type: String(form.get("type") || vendorBillboardEditor.type).trim(),
      size: String(form.get("size") || vendorBillboardEditor.size).trim(),
      landmark: String(form.get("landmark") || vendorBillboardEditor.landmark).trim(),
      traffic: String(form.get("traffic") || vendorBillboardEditor.traffic).trim(),
      map: String(form.get("map") || vendorBillboardEditor.map).trim(),
    };
    const price = (name: string) => Math.max(0, Number(form.get(name) || 0));
    setVendorInventory((current) => current.map((location) => location.page === page ? updatedLocation : location));
    setVendorBillboardPrices((current) => ({
      ...current,
      [page]: { hourly: price("hourly"), day: price("day"), week: price("week"), month: price("month") },
    }));
    setVendorBillboardEditor(updatedLocation);
    notify(`${updatedLocation.name} details and pricing were saved in the vendor portal.`);
  };

  const addAnotherBillboardForCompany = () => {
    addBillboard();
    setVendorStep(1);
    notify("Company details saved — add the next billboard location.");
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(".vendor-modal")?.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const submitCampaign = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const hasInvalidStandardFields = !isCampaignTestMode && !form.checkValidity();
    const hasInvalidEmailConfirmation = campaignEmailVerificationStarted && !campaignEmailMatches;
    const hasMissingCampaignSelection =
      campaignEmirates.length === 0 ||
      preferredBillboardTypes.length === 0 ||
      (!campaignTypeIsStatic && !advertiserPlan) ||
      campaignLocationIds.length === 0 ||
      campaignDatesInvalid ||
      (campaignNeedsHours && advertiserHours.length === 0) ||
      (campaignNeedsDays && (advertiserDays.length === 0 || campaignDayRangeHasNoBookingDays));

    if (hasInvalidStandardFields || hasInvalidEmailConfirmation || hasMissingCampaignSelection) {
      setCampaignValidationAttempted(true);
      notify("Please complete the fields marked in red before creating the campaign.");
      window.requestAnimationFrame(() => {
        const firstError = form.querySelector<HTMLElement>(".campaign-validation-message, input:invalid, select:invalid, textarea:invalid, [aria-invalid='true']");
        firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
        if (firstError instanceof HTMLInputElement || firstError instanceof HTMLSelectElement || firstError instanceof HTMLTextAreaElement) firstError.focus({ preventScroll: true });
      });
      return;
    }
    setCampaignValidationAttempted(false);
    setCampaignCustomName("");
    setCampaignStage("name");
    window.requestAnimationFrame(() => document.querySelector<HTMLElement>(".campaign-modal")?.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const continueToCreative = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!campaignCustomNameCode) return;
    setCreativePreviewListingId((current) => current || String(campaignLocations[0]?.id ?? ""));
    setCampaignStage("adgroups");
    window.requestAnimationFrame(() => document.querySelector<HTMLElement>(".campaign-modal")?.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const continueToCampaignAds = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCampaignStage("creative");
    window.requestAnimationFrame(() => document.querySelector<HTMLElement>(".campaign-modal")?.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const handleCampaignCreativeFile = (file: File | null) => {
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const staticExtensions = ["jpg", "jpeg", "png", "tif", "tiff", "pdf"];
    const digitalExtensions = ["jpg", "jpeg", "png", "webp", "mp4", "webm", "mov"];
    const supportedExtensions = campaignCreativeIsStatic ? staticExtensions : digitalExtensions;
    const maxBytes = campaignCreativeIsStatic ? 50 * 1024 * 1024 : 100 * 1024 * 1024;

    if (!supportedExtensions.includes(extension)) {
      setCampaignCreativeError(`Please upload ${campaignCreativeIsStatic ? "JPG, PNG, TIFF or PDF artwork" : "JPG, PNG, WebP, MP4, WebM or MOV creative"}.`);
      return;
    }
    if (file.size > maxBytes) {
      setCampaignCreativeError(`This file is larger than the ${campaignCreativeIsStatic ? "50 MB" : "100 MB"} upload limit.`);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCampaignCreativeFile(file);
    setCampaignCreativeUrl(objectUrl);
    setCampaignCreativeMetadata(null);
    setCampaignCreativeError("");

    if (["jpg", "jpeg", "png", "webp"].includes(extension)) {
      const image = new window.Image();
      image.onload = () => setCampaignCreativeMetadata({ width: image.naturalWidth, height: image.naturalHeight });
      image.src = objectUrl;
    } else if (["mp4", "webm", "mov"].includes(extension)) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => setCampaignCreativeMetadata({ width: video.videoWidth, height: video.videoHeight, duration: video.duration });
      video.src = objectUrl;
    }
  };

  const finalizeCampaign = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isCampaignTestMode && !campaignCreativeFile) {
      setCampaignCreativeError("Please upload the campaign artwork or video before creating the campaign.");
      notify("Please upload the campaign creative before continuing.");
      return;
    }
    if (isCampaignTestMode) {
      setCreatedCampaigns((current) => current.some((campaign) => campaign.id === testCampaignModel.id)
        ? current
        : [testCampaignModel, ...current]);
      setExpandedCampaignIds([testCampaignModel.id]);
    } else {
      const createdCampaign: CreatedCampaign = {
        id: `campaign-${Date.now()}`,
        name: finalCampaignName,
        objective: campaignObjective,
        status: "Owner review",
        campaignType: campaignMediaFormat === "static" ? "Static" : campaignMediaFormat === "digital" ? "Digital" : "Mixed",
        budget: campaignSelectionTotal,
        startDate: campaignStartDate || "To be confirmed",
        endDate: campaignEndDate || campaignStartDate || "To be confirmed",
        createdAt: new Date().toISOString(),
        emirates: campaignEmirates,
        adGroups: campaignAdGroups.map((group) => ({
          id: group.id,
          name: group.name,
          category: group.category,
          budget: group.listings.reduce((total, listing) => total + getCampaignSelectionPrice(listing), 0),
          billboardNames: group.listings.map((listing) => listing.title),
        })),
      };
      setCreatedCampaigns((current) => {
        const updated = [createdCampaign, ...current];
        window.localStorage.setItem("asnads_created_campaigns", JSON.stringify(updated));
        return updated;
      });
      setExpandedCampaignIds((current) => [createdCampaign.id, ...current]);
    }
    setModal(null);
    setSelected(null);
    setCampaignStage("setup");
    resetCampaignCreative();
    setCampaignsOpen(true);
    notify(isCampaignTestMode
      ? `${finalCampaignName} test completed — no campaign was submitted.`
      : `${finalCampaignName} created successfully — the creative is ready for billboard owner review.`);
  };

  const adminBillingRows = adminTab === "vendor_billing" ? vendorBillingDemo : advertiserBillingDemo;
  const adminBillingTotal = adminBillingRows.reduce((total, row) => total + row.amount, 0);
  const adminBillingOutstanding = adminBillingRows.filter((row) => row.status !== "paid").reduce((total, row) => total + row.amount, 0);
  const vendorDashboardInventory = ["phi", "phi advertise", "phi advertising"].includes(authUser?.companyName?.trim().toLowerCase() || "")
    ? vendorInventory.filter((location) => !location.submitted || location.ownerCompanyId === authUser.companyId)
    : vendorInventory.filter((location) =>
        location.submitted &&
        location.ownerCompanyId === authUser?.companyId
      );
  const vendorDashboardBillingRows = authUser?.companyName?.trim().toLowerCase() === "phi"
    ? vendorBillingDemo
    : [];
  const vendorDashboardBillingTotal = vendorDashboardBillingRows.reduce((total, row) => total + row.amount, 0);
  const vendorDashboardBillingPaid = vendorDashboardBillingRows
    .filter((row) => row.status === "paid")
    .reduce((total, row) => total + row.amount, 0);
  const vendorDashboardBillingOutstanding = vendorDashboardBillingTotal - vendorDashboardBillingPaid;
  const vendorDashboardVatGenerated = vendorDashboardBillingRows
    .reduce((total, row) => total + (row.amount - row.amount / 1.05), 0);
  const vendorDocumentSlots: Array<{ type: VendorDocument["document_type"]; title: string; help: string }> = [
    { type: "trade_license", title: "Trade License", help: "PDF, JPG or PNG" },
    { type: "vat_certificate", title: "VAT Certificate", help: "PDF, JPG or PNG" },
    { type: "bank_letter", title: "Bank Letter", help: "PDF, JPG or PNG" },
  ];

  return (
    <main className={authUser ? "portal-mode" : "landing-mode"}>
      {!authReady ? <div className="auth-loading">Securing your ASNads session…</div> : !authUser ? (
        <section className="landing-gateway" aria-label="ASNads billboard marketplace">
          <img src="/asnads-hero.png" alt={`ASNads — ${country.name} billboard marketplace`} />
          <div className="landing-shade" />
          <div className="landing-copy">
            <div className="landing-wordmark"><span>A</span><strong>ASNads</strong></div>
            <nav className="country-switcher" aria-label="Choose country website">
              {countryLinks.map((item) => <a key={item.code} className={item.code === country.code ? "active" : ""} href={`https://${item.domain}`}>{item.shortName}<small>{item.currency}</small></a>)}
            </nav>
            <div className="landing-kicker">{country.kicker}</div>
            <h1>Own Every Eyeline <em>{country.headline}</em></h1>
            <p>{country.description}</p>
            <div className="landing-reach" aria-label="ASNads marketplace coverage">
              <div><strong>380+</strong><span>Premium<br />Billboards</span></div>
              <div><strong>800+</strong><span>Digital<br />Kiosks</span></div>
              <div><strong>{country.code === "ae" ? "7" : country.code === "in" ? "30+" : country.code === "uk" ? "4" : "50"}</strong><span>{country.coverageTitle}</span></div>
            </div>
          </div>
          <div className="landing-actions">
            <button className="landing-button landing-button-primary" onClick={openVendor}>Add Your Inventory</button>
            <button className="landing-button landing-button-test" onClick={openCampaignTestMode}>Test Campaign</button>
            <button className="landing-button landing-button-secondary" onClick={openAdvertiserEntry}>Login / Start Campaign</button>
            <button className="landing-button landing-button-test" onClick={() => { window.location.href = "/admin"; }}>Admin Portal</button>
          </div>
        </section>
      ) : adminPanelOpen && authUser.role === "admin" ? (
        <section className="admin-workspace" aria-label="ASNads administration">
          <header className="admin-topbar">
            <div className="auth-brand"><span>A</span><div><strong>ASNads</strong><small>ADMINISTRATOR CONSOLE</small></div></div>
            <div><button className="admin-back" type="button" onClick={() => setAdminPanelOpen(false)}>← Marketplace</button><button className="admin-signout" type="button" onClick={signOut}>Log out</button></div>
          </header>
          <div className="admin-shell">
            <aside className="admin-sidebar"><span>CONTROL CENTRE</span><strong>Administration</strong><button className={adminTab === "advertiser" ? "active" : ""} type="button" onClick={() => setAdminTab("advertiser")}>Advertiser companies <b>{adminCompanies.filter((item) => item.accountType === "advertiser").length}</b></button><button className={adminTab === "billboard_owner" ? "active" : ""} type="button" onClick={() => setAdminTab("billboard_owner")}>Inventory companies <b>{adminCompanies.filter((item) => item.accountType === "billboard_owner").length}</b></button><button className={inventoryApprovalsOpen ? "active" : ""} type="button" onClick={() => setInventoryApprovalsOpen(true)}>Inventory approvals <b>{vendorInventory.length - publishedPhiPages.length}</b></button><button className={adminTab === "staff" ? "active" : ""} type="button" onClick={() => setAdminTab("staff")}>Admin people &amp; roles <b>{adminStaff.length}</b></button><span className="admin-sidebar-section">BILLING</span><button className={adminTab === "vendor_billing" ? "active" : ""} type="button" onClick={() => setAdminTab("vendor_billing")}>Vendor billing <b>{vendorBillingDemo.length}</b></button><button className={adminTab === "advertiser_billing" ? "active" : ""} type="button" onClick={() => setAdminTab("advertiser_billing")}>Advertiser billing <b>{advertiserBillingDemo.length}</b></button></aside>
            <section className="admin-content">
              <div className="admin-heading"><div><span>ADMINISTRATOR ACCESS</span><h1>{adminTab === "advertiser" ? "Advertising companies" : adminTab === "billboard_owner" ? "Inventory companies" : adminTab === "staff" ? "Admin people & roles" : adminTab === "vendor_billing" ? "Vendor billing" : "Advertiser billing"}</h1><p>{adminTab === "staff" ? "Create and edit roles, then assign each person only the work they are responsible for." : adminTab === "vendor_billing" ? "Track amounts payable to billboard vendors, payout dates and payment status." : adminTab === "advertiser_billing" ? "Track advertiser invoices, collections, due dates and outstanding balances." : "Review verified company details, add a new company account or remove an account when required."}</p></div>{(adminTab === "advertiser" || adminTab === "billboard_owner" || adminTab === "staff") && <div className="admin-actions">{adminTab !== "staff" && <button type="button" className="admin-refresh" onClick={() => void loadAdminCompanies()} disabled={adminLoading}>{adminLoading ? "Loading…" : "Refresh"}</button>}{adminTab === "staff" && <button type="button" className="admin-refresh" onClick={() => { setEditingAdminRole(null); setAdminRoleEditorOpen(true); }}>+ Add role</button>}<button type="button" className="admin-add" onClick={() => { if (adminTab === "staff") { setEditingAdminStaff(null); setAdminStaffAddOpen(true); } else setAdminAddOpen(true); setAdminError(""); }}>{adminTab === "staff" ? "+ Add admin person" : "+ Add company"}</button></div>}</div>
              {adminError && <div className="admin-alert error" role="alert">{adminError}</div>}
              {adminMessage && <div className="admin-alert success" role="status">{adminMessage}</div>}
              {(adminTab === "advertiser" || adminTab === "billboard_owner") && adminCompanies.some((company) => company.accountType === adminTab && company.accountStatus !== "active") && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Accounts waiting for activation</th><th>Email verification</th><th>Status</th><th aria-label="Activation action" /></tr></thead><tbody>{adminCompanies.filter((company) => company.accountType === adminTab && company.accountStatus !== "active").map((company) => <tr key={`activation-${company.id}`}><td><strong>{company.companyName}</strong><small>{company.contactPerson} · {company.accountType === "advertiser" ? "Advertiser" : "Inventory company"}</small></td><td>{company.emailVerified ? "Email verified" : "Email verification pending"}</td><td><span className="admin-status pending">Pending admin approval</span></td><td><button className="admin-add" type="button" onClick={() => void updateAdminCompanyStatus(company, "active")}>Activate account</button></td></tr>)}</tbody></table></div>}
              {adminTab === "staff" ? <><div className="admin-role-grid">{(Object.entries(adminRoleDetails) as [AdminRole, { label: string; work: string }][]).map(([role, details]) => <article key={role}><span>{adminStaff.filter((person) => person.role === role).length}</span><strong>{details.label}</strong><p>{details.work}</p></article>)}</div><div className="admin-table-wrap"><table className="admin-table admin-staff-table"><thead><tr><th>Admin person</th><th>Assigned role</th><th>Assigned work</th><th>Status</th><th aria-label="Actions" /></tr></thead><tbody>{adminStaff.map((person) => <tr key={person.id}><td><strong>{person.fullName}</strong><small>{person.email} · {person.phone}</small></td><td><strong>{adminRoleDetails[person.role].label}</strong></td><td>{adminRoleDetails[person.role].work}</td><td><span className={`admin-status ${person.status === "active" ? "active" : "pending"}`}>{person.status}</span></td><td><button className="admin-delete" type="button" onClick={() => setAdminStaff((current) => current.filter((item) => item.id !== person.id))}>Remove</button></td></tr>)}</tbody></table></div></> : (adminTab === "vendor_billing" || adminTab === "advertiser_billing") ? <><div className="admin-billing-summary"><article><span>Total value</span><strong>AED {adminBillingTotal.toLocaleString()}</strong><small>{adminBillingRows.length} billing records</small></article><article><span>Outstanding</span><strong>AED {adminBillingOutstanding.toLocaleString()}</strong><small>Due, overdue or processing</small></article><article><span>Paid records</span><strong>{adminBillingRows.filter((row) => row.status === "paid").length}</strong><small>Completed payments</small></article></div><div className="admin-table-wrap"><table className="admin-table admin-billing-table"><thead><tr><th>{adminTab === "vendor_billing" ? "Vendor" : "Advertiser"}</th><th>Invoice / payout</th><th>Campaign / billboard</th><th>Due date</th><th>Amount</th><th>Status</th></tr></thead><tbody>{adminBillingRows.map((row) => <tr key={row.id}><td><strong>{row.company}</strong><small>{row.description}</small></td><td><strong>{row.id}</strong></td><td>{row.reference}</td><td>{row.dueDate}</td><td><strong>AED {row.amount.toLocaleString()}</strong></td><td><span className={`admin-status ${row.status}`}>{row.status}</span></td></tr>)}</tbody></table></div></> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Company</th><th>Contact</th><th>Email</th><th>Sector</th><th>Status</th><th aria-label="Actions" /></tr></thead><tbody>{adminCompanies.filter((item) => item.accountType === adminTab).map((company) => <tr key={company.id}><td><strong>{company.companyName}</strong><small>{company.accountType === "advertiser" ? "Advertiser" : "Billboard inventory owner"}</small></td><td>{company.contactPerson}<small>{company.contactNumber}</small></td><td>{company.companyEmail}<small>{company.emailVerified ? "✓ Email verified" : "Email verification pending"}</small></td><td>{company.businessSector}</td><td><span className={`admin-status ${company.accountStatus === "active" ? "active" : "pending"}`}>{company.accountStatus}</span></td><td><div className="admin-row-actions">{company.accountType === "billboard_owner" && <button className="admin-view" type="button" onClick={() => { setInventoryCompanyProfile(company); setInventoryCompanyEdit(false); }}>View details</button>}<button className="admin-delete" type="button" onClick={() => void deleteAdminCompany(company)}>Delete</button></div></td></tr>)}</tbody></table>{adminCompanies.filter((item) => item.accountType === adminTab).length === 0 && <div className="admin-empty">No {adminTab === "advertiser" ? "advertising" : "inventory"} companies found.</div>}</div>}
            </section>
          </div>
          {adminAddOpen && <div className="admin-add-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAdminAddOpen(false); }}><section className="admin-add-modal" role="dialog" aria-modal="true" aria-labelledby="admin-add-title"><button className="auth-close" type="button" aria-label="Close" onClick={() => setAdminAddOpen(false)}>×</button><span>NEW COMPANY ACCOUNT</span><h2 id="admin-add-title">Add company details</h2><p>Create an advertiser or inventory-company account. The contact receives the login email details securely.</p><form onSubmit={submitAdminCompany}><div className="admin-add-grid"><label>Company name<input name="companyName" required /></label><label>Account type<select name="accountType" defaultValue={adminTab}><option value="advertiser">Advertising company</option><option value="billboard_owner">Inventory company</option></select></label><label>Contact person<input name="contactPerson" required /></label><label>Business sector<input name="businessSector" required /></label><label>Contact number<input name="contactNumber" type="tel" required /></label><label>WhatsApp number<input name="whatsappNumber" type="tel" /></label><label className="wide">Company email<input name="companyEmail" type="email" required /></label><label className="wide">Temporary password<input name="password" type="password" minLength={8} required /></label></div><small className="admin-password-note">Use at least 8 characters, including upper/lowercase letters, a number and a symbol.</small><button className="admin-add-submit">Create company account →</button></form></section></div>}
          {adminStaffAddOpen && <div className="admin-add-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAdminStaffAddOpen(false); }}><section className="admin-add-modal" role="dialog" aria-modal="true" aria-labelledby="admin-staff-title"><button className="auth-close" type="button" aria-label="Close" onClick={() => { setAdminStaffAddOpen(false); setEditingAdminStaff(null); }}>×</button><span>{editingAdminStaff ? "EDIT ADMIN PERSON" : "ADMIN PEOPLE"}</span><h2 id="admin-staff-title">{editingAdminStaff ? "Edit person and assigned role" : "Add person and assign work"}</h2><p>Select one role for this person. Their portal will show only the work permitted for that role.</p>{!editingAdminStaff && adminStaff.length > 0 && <div className="admin-editor-list">{adminStaff.map((person) => <button type="button" key={person.id} onClick={() => setEditingAdminStaff(person)}><span><strong>{person.fullName}</strong><small>{adminRoleDetails[person.role]?.label}</small></span><b>Edit person</b></button>)}</div>}<form key={editingAdminStaff?.id ?? "new"} onSubmit={submitAdminStaff}><div className="admin-add-grid"><label>Full name<input name="fullName" defaultValue={editingAdminStaff?.fullName} required /></label><label>Phone number<input name="phone" type="tel" defaultValue={editingAdminStaff?.phone} required /></label><label className="wide">Work email<input name="email" type="email" defaultValue={editingAdminStaff?.email} required /></label><label className="wide">Admin role<select name="role" defaultValue={editingAdminStaff?.role ?? "accountant"}>{(Object.entries(adminRoleDetails) as [AdminRole, { label: string; work: string }][]).map(([role, details]) => <option key={role} value={role}>{details.label} — {details.work}</option>)}</select></label></div><small className="admin-password-note">You can create or edit available roles from the Roles editor.</small><button className="admin-add-submit">{editingAdminStaff ? "Save person and role →" : "Add admin person →"}</button></form></section></div>}
          {adminRoleEditorOpen && <div className="admin-add-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAdminRoleEditorOpen(false); }}><section className="admin-add-modal" role="dialog" aria-modal="true" aria-labelledby="admin-role-title"><button className="auth-close" type="button" aria-label="Close" onClick={() => { setAdminRoleEditorOpen(false); setEditingAdminRole(null); }}>×</button><span>ROLES &amp; PERMISSIONS</span><h2 id="admin-role-title">{editingAdminRole ? "Edit existing role" : "Add or edit a role"}</h2><p>Create a new role or select an existing role below to change its name and assigned work.</p>{!editingAdminRole && <div className="admin-editor-list">{(Object.entries(adminRoleDetails) as [AdminRole, { label: string; work: string }][]).map(([role, details]) => <button type="button" key={role} onClick={() => setEditingAdminRole(role)}><span><strong>{details.label}</strong><small>{details.work}</small></span><b>Edit role</b></button>)}</div>}<form key={editingAdminRole ?? "new-role"} onSubmit={submitAdminRole}><div className="admin-add-grid"><label className="wide">Role name<input name="label" defaultValue={editingAdminRole ? adminRoleDetails[editingAdminRole].label : ""} required /></label><label className="wide">Assigned work and permissions<input name="work" defaultValue={editingAdminRole ? adminRoleDetails[editingAdminRole].work : ""} required /></label></div><small className="admin-password-note">Changes appear immediately in the person-assignment role list.</small><button className="admin-add-submit">{editingAdminRole ? "Save role changes →" : "Create new role →"}</button></form></section></div>}
          {adminOtpActivation && <div className="admin-add-backdrop" role="presentation"><section className="admin-add-modal admin-otp-modal" role="dialog" aria-modal="true" aria-labelledby="admin-otp-title"><button className="auth-close" type="button" aria-label="Close OTP activation" onClick={() => setAdminOtpActivation(null)}>×</button><span>SUPER ADMIN SECURITY</span><h2 id="admin-otp-title">Activate portal with OTP</h2><p>Enter the six-digit code sent to the Super Admin&apos;s registered phone and email.</p><div className="admin-test-otp"><small>PRIVATE TEST OTP</small><strong>{adminOtpActivation.code}</strong><span>In production, this code will be sent securely and will not be displayed here.</span></div><form onSubmit={verifyAdminOtp}><label className="admin-otp-input">One-time password<input name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} placeholder="Enter 6-digit OTP" autoFocus required /></label>{adminOtpError && <div className="admin-alert error" role="alert">{adminOtpError}</div>}<button className="admin-add-submit">Verify OTP and activate portal →</button></form></section></div>}
          {adminPasswordPerson && <div className="admin-add-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAdminPasswordPerson(null); }}><section className="admin-add-modal admin-password-modal" role="dialog" aria-modal="true" aria-labelledby="admin-password-title"><button className="auth-close" type="button" aria-label="Close password form" onClick={() => setAdminPasswordPerson(null)}>×</button><span>ADMIN ACCOUNT SECURITY</span><h2 id="admin-password-title">Change password</h2><p>Set a new portal password for <strong>{adminPasswordPerson.fullName}</strong> · {adminPasswordPerson.email}</p><form onSubmit={changeAdminPassword}><div className="admin-add-grid"><label className="wide">New password<input name="newPassword" type="password" minLength={8} autoComplete="new-password" placeholder="Minimum 8 characters" required autoFocus /></label><label className="wide">Confirm new password<input name="confirmPassword" type="password" minLength={8} autoComplete="new-password" placeholder="Enter the password again" required /></label></div>{adminPasswordError && <div className="admin-alert error" role="alert">{adminPasswordError}</div>}<small className="admin-password-note">Use uppercase and lowercase letters, a number and a symbol. Production changes will be stored securely.</small><button className="admin-add-submit">Update password →</button></form></section></div>}
          {inventoryCompanyProfile && <div className="admin-add-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setInventoryCompanyProfile(null); }}><section className="inventory-company-profile" role="dialog" aria-modal="true" aria-labelledby="inventory-company-title"><button className="auth-close" type="button" aria-label="Close" onClick={() => setInventoryCompanyProfile(null)}>×</button><div className="inventory-company-cover"><img src="/asnads-hero.png" alt="" /><div className="inventory-company-logo">{inventoryCompanyLogo ? "✓" : inventoryCompanyProfile.companyName.slice(0, 2).toUpperCase()}</div></div><header><div><span>VERIFIED INVENTORY COMPANY</span><h2 id="inventory-company-title">{inventoryCompanyProfile.companyName}</h2><p>Vendor code: SLO · Account #{inventoryCompanyProfile.id}</p></div><button className="admin-add" type="button" onClick={() => setInventoryCompanyEdit((current) => !current)}>{inventoryCompanyEdit ? "Cancel editing" : "Edit company profile"}</button></header><form onSubmit={saveInventoryCompanyProfile}><div className="inventory-profile-section"><h3>Company images</h3><div className="inventory-upload-grid"><label>Company logo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setInventoryCompanyLogo(event.target.files?.[0]?.name || "")} /><span>{inventoryCompanyLogo || "Upload square logo"}</span></label><label>Company cover image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setInventoryCompanyCover(event.target.files?.[0]?.name || "")} /><span>{inventoryCompanyCover || "Upload landscape cover"}</span></label></div></div><div className="inventory-profile-section"><h3>Company and contact details</h3><div className="admin-add-grid"><label>Company name<input defaultValue={inventoryCompanyProfile.companyName} readOnly={!inventoryCompanyEdit} /></label><label>Business sector<input defaultValue={inventoryCompanyProfile.businessSector} readOnly={!inventoryCompanyEdit} /></label><label>Contact person<input defaultValue={inventoryCompanyProfile.contactPerson} readOnly={!inventoryCompanyEdit} /></label><label>Position<input defaultValue="Inventory Operations Manager" readOnly={!inventoryCompanyEdit} /></label><label>Phone<input defaultValue={inventoryCompanyProfile.contactNumber} readOnly={!inventoryCompanyEdit} /></label><label>WhatsApp<input defaultValue={inventoryCompanyProfile.whatsappNumber} readOnly={!inventoryCompanyEdit} /></label><label className="wide">Email<input defaultValue={inventoryCompanyProfile.companyEmail} readOnly={!inventoryCompanyEdit} /></label><label className="wide">Office address<input defaultValue="Business Bay, Dubai, United Arab Emirates" readOnly={!inventoryCompanyEdit} /></label><label className="wide">Google Maps link<input defaultValue="https://maps.google.com/?q=Business+Bay+Dubai" readOnly={!inventoryCompanyEdit} /></label></div></div><div className="inventory-profile-section"><h3>Coverage and inventory</h3><div className="inventory-company-stats"><article><strong>24</strong><span>Total billboards</span></article><article><strong>5</strong><span>Digital</span></article><article><strong>14</strong><span>Static</span></article><article><strong>5</strong><span>Digital kiosks</span></article></div><div className="admin-add-grid"><label className="wide">Emirates served<input defaultValue="Dubai, Abu Dhabi, Sharjah" readOnly={!inventoryCompanyEdit} /></label><label className="wide">Billboard categories<input defaultValue="Road, Malls, Bridges, Buildings, Digital Kiosks" readOnly={!inventoryCompanyEdit} /></label></div></div><div className="inventory-profile-section"><h3>Documents and verification</h3><div className="inventory-document-grid"><label>Trade licence<input type="file" accept=".pdf,image/*" /><span>Trade_Licence_2026.pdf</span><b>Verified</b></label><label>VAT certificate<input type="file" accept=".pdf,image/*" /><span>VAT_Certificate.pdf</span><b>Verified</b></label><label>Bank details<input type="file" accept=".pdf,image/*" /><span>Bank_Confirmation.pdf</span><b>Restricted</b></label></div></div><div className="inventory-profile-actions"><label>Account status<select defaultValue={inventoryCompanyProfile.accountStatus} disabled={!inventoryCompanyEdit}><option value="active">Approved and active</option><option value="pending">Pending verification</option><option value="suspended">Suspended</option></select></label>{inventoryCompanyEdit && <button className="admin-add-submit">Save company details</button>}</div><small className="admin-password-note">Private test mode: selected files are not uploaded permanently. Secure cloud image/document storage will be connected before production use.</small></form></section></div>}
          {inventoryCompanyProfile && <aside className="inventory-financial-drawer" aria-label="Vendor VAT and bank details"><div className="inventory-financial-heading"><div><span>ACCOUNTANT ACCESS</span><h3>VAT &amp; bank details</h3><p>{inventoryCompanyProfile.companyName}</p></div><button type="button" onClick={() => setInventoryFinancialProfile(inventoryFinancialProfile ? null : inventoryCompanyProfile)}>{inventoryFinancialProfile ? "Hide" : "Open"}</button></div>{inventoryFinancialProfile && <form onSubmit={(event) => { event.preventDefault(); setAdminMessage("VAT and bank details were updated in private test mode."); setInventoryFinancialProfile(null); }}><label>VAT / TRN number<input name="vatNumber" inputMode="numeric" defaultValue="100123456700003" placeholder="15-digit UAE TRN" minLength={15} maxLength={15} required /></label><label className="inventory-financial-upload">Upload VAT certificate<input name="vatCertificate" type="file" accept=".pdf,image/*" required /><span>PDF, JPG or PNG</span></label><label>Bank name<input name="bankName" defaultValue="Emirates NBD" required /></label><label>Account holder name<input name="accountHolder" defaultValue={inventoryCompanyProfile.companyName} required /></label><label>IBAN<input name="iban" defaultValue="AE070331234567890123456" required /></label><label>SWIFT / BIC<input name="swift" defaultValue="EBILAEAD" required /></label><label>Bank account number<input name="accountNumber" defaultValue="001234567890" required /></label><label className="inventory-financial-upload">Upload bank letter<input name="bankLetter" type="file" accept=".pdf,image/*" required /><span>Official bank confirmation letter</span></label><button className="admin-add-submit">Save VAT and bank details</button><small>Private test mode: files are selected locally and are not uploaded permanently.</small></form>}</aside>}
          {advertiserCompanyPortal && <div className="advertiser-portal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAdvertiserCompanyPortal(null); }}><section className="advertiser-company-portal" role="dialog" aria-modal="true" aria-labelledby="advertiser-portal-title"><header><div className="advertiser-portal-brand">{advertiserCompanyPortal.companyName.slice(0, 2).toUpperCase()}</div><div><span>ADVERTISER PORTAL · ADMIN VIEW</span><h2 id="advertiser-portal-title">{advertiserCompanyPortal.companyName}</h2><p>Account #{advertiserCompanyPortal.id} · {advertiserCompanyPortal.accountStatus}</p></div><button className="auth-close" type="button" aria-label="Close advertiser portal" onClick={() => setAdvertiserCompanyPortal(null)}>×</button></header><nav aria-label="Advertiser portal sections">{(["overview", "campaigns", "adgroups", "ads", "billboards", "billing"] as const).map((tab) => <button key={tab} className={advertiserPortalTab === tab ? "active" : ""} type="button" onClick={() => setAdvertiserPortalTab(tab)}>{tab === "adgroups" ? "Ad groups" : tab[0].toUpperCase() + tab.slice(1)}</button>)}</nav><div className="advertiser-portal-body">{advertiserPortalTab === "overview" && <><div className="advertiser-portal-stats"><article><span>Active campaigns</span><strong>2</strong><small>Digital and static</small></article><article><span>Total budget</span><strong>AED 50,000</strong><small>Current campaigns</small></article><article><span>Selected billboards</span><strong>3</strong><small>Across Dubai</small></article><article><span>Amount due</span><strong>AED 18,500</strong><small>Due 08/08/2026</small></article></div><div className="advertiser-overview-grid"><section><h3>Company details</h3><dl><div><dt>Business sector</dt><dd>{advertiserCompanyPortal.businessSector}</dd></div><div><dt>Company email</dt><dd>{advertiserCompanyPortal.companyEmail}</dd></div><div><dt>Account status</dt><dd>{advertiserCompanyPortal.accountStatus}</dd></div><div><dt>Email verification</dt><dd>{advertiserCompanyPortal.emailVerified ? "Verified" : "Pending"}</dd></div></dl></section><section><h3>Contact person</h3><dl><div><dt>Name</dt><dd>{advertiserCompanyPortal.contactPerson}</dd></div><div><dt>Position</dt><dd>Marketing Manager</dd></div><div><dt>Phone</dt><dd>{advertiserCompanyPortal.contactNumber}</dd></div><div><dt>WhatsApp</dt><dd>{advertiserCompanyPortal.whatsappNumber}</dd></div></dl></section></div></>}{advertiserPortalTab === "campaigns" && <div className="advertiser-portal-list"><article><div><span>CAMPAIGN</span><strong>Phi UAE Brand Launch</strong><small>Digital billboard · Dubai · 15/08/2026</small></div><b className="admin-status active">Eligible</b><strong>AED 30,000</strong></article><article><div><span>CAMPAIGN</span><strong>Phi Static Road Campaign</strong><small>Static billboard · Sheikh Zayed Road · 01/09/2026</small></div><b className="admin-status pending">Draft</b><strong>AED 20,000</strong></article></div>}{advertiserPortalTab === "adgroups" && <div className="advertiser-portal-list"><article><div><span>AD GROUP</span><strong>Digital Ad Group</strong><small>2 selected digital billboards</small></div><b className="admin-status active">Active</b><strong>AED 30,000</strong></article><article><div><span>AD GROUP</span><strong>Static Ad Group</strong><small>1 selected static billboard</small></div><b className="admin-status pending">Draft</b><strong>AED 20,000</strong></article></div>}{advertiserPortalTab === "ads" && <div className="advertiser-portal-list"><article><div><span>DIGITAL AD</span><strong>Phi Launch Motion Creative</strong><small>1920 × 1080 · MP4 · Approved</small></div><b className="admin-status active">Approved</b><strong>Digital</strong></article><article><div><span>STATIC AD</span><strong>Phi Road Artwork</strong><small>12 × 4 m · PDF · Creative review</small></div><b className="admin-status processing">Review</b><strong>Static</strong></article></div>}{advertiserPortalTab === "billboards" && <div className="advertiser-billboard-grid"><article><img src="/asnads-hero.png" alt="Sheikh Zayed Road billboard" /><strong>SH-47-SKY-01</strong><span>Sheikh Zayed Road, Exit 47</span><small>Digital · AED 172/hour</small></article><article><img src="/asnads-hero.png" alt="Dubai Mall kiosk" /><strong>TH-AB-ROOFL-01</strong><span>The Dubai Mall</span><small>Digital Kiosk · AED 199/hour</small></article><article><img src="/asnads-hero.png" alt="Al Khail Road billboard" /><strong>AK-12-RVM-02</strong><span>Al Khail Road</span><small>Static · AED 32,000/month</small></article></div>}{advertiserPortalTab === "billing" && <div className="advertiser-portal-list"><article><div><span>INVOICE INV-2026-104</span><strong>Digital and static campaign</strong><small>Due 08/08/2026</small></div><b className="admin-status due">Due</b><strong>AED 18,500</strong></article><article><div><span>PAYMENT PAY-2026-088</span><strong>Campaign deposit</strong><small>Paid 20/07/2026</small></div><b className="admin-status paid">Paid</b><strong>AED 31,500</strong></article></div>}</div></section></div>}
          {advertiserCompanyPortal && advertiserPortalTab === "billboards" && <section className="phi-location-library" aria-label="Phi digital billboard locations"><header><div><span>PHI DIGITAL BILLBOARD NETWORK · PDF IMPORT</span><h2>Dubai digital locations</h2><p>{vendorInventory.length} locations · Prices excluded</p></div><button type="button" onClick={() => setAdvertiserPortalTab("overview")}>← Back to Phi portal</button></header><div className="phi-location-grid">{vendorInventory.map((location, index) => <article key={`${location.page}-${location.name}`}><img src={`/phi-locations/page-${String(Math.min(location.page, 22)).padStart(2, "0")}.jpg`} alt={`${location.name} digital billboard location`} /><div><div className="phi-location-title"><span>PHI-DIG-{String(index + 1).padStart(2, "0")}</span>{location.upcoming && <b>Upcoming 2026</b>}</div><h3>{location.name}</h3><p>{location.road}</p><dl><div><dt>Type</dt><dd>{location.type}</dd></div><div><dt>Screen size</dt><dd>{location.size}</dd></div><div><dt>Landmark</dt><dd>{location.landmark}</dd></div><div><dt>Traffic data</dt><dd>{location.traffic}</dd></div></dl><div className="phi-location-links"><a href={location.map} target="_blank" rel="noreferrer">Open Google Maps ↗</a>{"aerial" in location && location.aerial && <a href={location.aerial} target="_blank" rel="noreferrer">Aerial footage ↗</a>}</div></div></article>)}</div></section>}
          {advertiserCompanyPortal && advertiserPortalTab === "billboards" && <aside className="phi-publish-drawer" aria-label="Publish Phi billboards for advertisers"><header><span>ADMIN APPROVAL</span><h3>Advertiser visibility</h3><p>{publishedPhiPages.length} of {vendorInventory.length} Phi locations published</p><div><button type="button" onClick={() => setPublishedPhiPages(vendorInventory.map((location) => location.page))}>Publish all</button><button type="button" onClick={() => setPublishedPhiPages([])}>Unpublish all</button></div></header><div>{vendorInventory.map((location) => { const isPublished = publishedPhiPages.includes(location.page); return <article key={`publish-${location.page}`}><div><strong>{location.name}</strong><small>{location.road} · {location.type}</small></div><span className={`admin-status ${isPublished ? "active" : "pending"}`}>{isPublished ? "Published" : "Admin review"}</span><button type="button" className={isPublished ? "unpublish" : "publish"} onClick={() => setPublishedPhiPages((current) => isPublished ? current.filter((page) => page !== location.page) : [...current, location.page])}>{isPublished ? "Unpublish" : "Publish"}</button></article>})}</div><footer><strong>Automatic connection</strong><span>Published locations appear in the advertiser campaign builder under Dubai → Digital → Road.</span></footer></aside>}
          {inventoryApprovalsOpen && <div className="inventory-approval-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setInventoryApprovalsOpen(false); }}><section className="inventory-approval-workspace" role="dialog" aria-modal="true" aria-labelledby="inventory-approval-title"><header><div><span>ADMIN · INVENTORY CONTROL</span><h2 id="inventory-approval-title">Phi billboard approvals</h2><p>Review vendor-submitted inventory before making it available to advertisers.</p></div><button type="button" onClick={() => setInventoryApprovalsOpen(false)}>×</button></header><div className="inventory-approval-summary"><article><strong>{phiDigitalLocations.filter((location) => location.upcoming).length}</strong><span>Draft</span></article><article><strong>{phiDigitalLocations.filter((location) => !location.upcoming && !approvedPhiPages.includes(location.page) && !publishedPhiPages.includes(location.page)).length}</strong><span>Pending review</span></article><article><strong>{approvedPhiPages.filter((page) => !publishedPhiPages.includes(page)).length}</strong><span>Approved</span></article><article><strong>{publishedPhiPages.length}</strong><span>Published</span></article></div><div className="inventory-approval-list">{phiDigitalLocations.map((location, index) => { const isPublished = publishedPhiPages.includes(location.page); const isApproved = approvedPhiPages.includes(location.page); const status = isPublished ? "Published" : isApproved ? "Approved" : location.upcoming ? "Draft" : "Pending review"; return <article key={`approval-${location.page}`}><img src={`/phi-locations/page-${String(location.page).padStart(2, "0")}.jpg`} alt={`${location.name} billboard`} /><div className="inventory-approval-details"><span>PHI-DIG-{String(index + 1).padStart(2, "0")}</span><h3>{location.name}</h3><p>{location.road} · {location.landmark}</p><dl><div><dt>Dimensions</dt><dd>{location.size}</dd></div><div><dt>Traffic</dt><dd>{location.traffic}</dd></div><div><dt>Pricing and booking plans</dt><dd>Not added</dd></div></dl><a href={location.map} target="_blank" rel="noreferrer">Check Google Maps ↗</a></div><div className="inventory-approval-actions"><span className={`approval-status ${status.toLowerCase().replace(" ", "-")}`}>{status}</span>{!isApproved && <button type="button" className="approve" onClick={() => setApprovedPhiPages((current) => [...current, location.page])}>Approve</button>}{isApproved && !isPublished && <button type="button" className="publish" onClick={() => setPublishedPhiPages((current) => [...current, location.page])}>Publish for advertisers</button>}{isPublished && <button type="button" className="unpublish" onClick={() => setPublishedPhiPages((current) => current.filter((page) => page !== location.page))}>Unpublish</button>}</div></article>})}</div></section></div>}
        </section>
      ) : <>
      <header className="topbar">
        <a className="brand" href="#inventory-map" aria-label="ASNads home">
          <span className="brand-mark">A</span>
          <span className="brand-copy">ASNads<small>OUTDOOR MEDIA</small></span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#inventory-map">Map</a>
          <a href="#marketplace">Marketplace</a>
          <a href="#how-it-works">How it works</a>
          <a href="#vendor-registration" onClick={(event) => { event.preventDefault(); openVendor(); }}>For vendors</a>
        </nav>
        <div className="nav-actions">
          {authUser.role === "admin" && <button className="text-button" onClick={openAdminDashboard}>Admin</button>}
          {isVendorAccount(authUser) && <button className="text-button vendor-dashboard-nav-button" onClick={() => setVendorDashboardOpen(true)}>Vendor Dashboard</button>}
          {!isVendorAccount(authUser) && <button className="text-button campaigns-nav-button" onClick={() => setCampaignsOpen(true)}>Campaigns <span>{createdCampaigns.length}</span></button>}
          <button className="text-button" onClick={signOut}>Log out</button>
          {isVendorAccount(authUser) ? <button className="button button-dark" onClick={openVendorForm}>+ Add inventory</button> : <button className="button button-dark" onClick={() => openCampaign()}>Create campaign</button>}
        </div>
      </header>

      {vendorDashboardOpen && (
        <div className="vendor-dashboard-backdrop">
          <section className="vendor-dashboard-workspace" aria-label="Vendor dashboard">
            <header>
              <div className="vendor-dashboard-brand"><span>{(authUser.companyName || "VN").slice(0, 2).toUpperCase()}</span><div><small>INVENTORY OWNER WORKSPACE</small><strong>{authUser.companyName || "Vendor company"}</strong><em>{authUser.accountStatus === "active" ? "Verified vendor account" : "Account review in progress"}</em></div></div>
              <div><button type="button" className="vendor-dashboard-add" onClick={openVendorForm}>+ Add billboard inventory</button><button type="button" className="vendor-dashboard-close" aria-label="Close vendor dashboard" onClick={() => setVendorDashboardOpen(false)}>×</button></div>
            </header>
            <div className="vendor-dashboard-layout">
              <aside>
                <span>VENDOR MENU</span>
                {(["overview", "inventory", "bookings", "availability", "billing", "profile"] as const).map((tab) => <button type="button" key={tab} className={vendorDashboardTab === tab ? "active" : ""} onClick={() => setVendorDashboardTab(tab)}><i>{tab === "overview" ? "01" : tab === "inventory" ? "02" : tab === "bookings" ? "03" : tab === "availability" ? "04" : tab === "billing" ? "05" : "06"}</i><span>{tab === "overview" ? "Dashboard overview" : tab === "inventory" ? "My billboard inventory" : tab === "bookings" ? "Booking requests" : tab === "availability" ? "Availability calendar" : tab === "billing" ? "Billing & payouts" : "Company profile"}</span>{tab === "bookings" && <b>3</b>}</button>)}
                <div><small>ACCOUNT STATUS</small><strong>{authUser.accountStatus === "active" ? "Active and verified" : "Pending verification"}</strong><span>Vendor ID #{authUser.companyId || authUser.id}</span></div>
              </aside>
              <main>
                {vendorDashboardTab === "overview" && <><div className="vendor-dashboard-heading"><div><span>GOOD DAY, {authUser.fullName.split(" ")[0].toUpperCase()}</span><h1>Vendor dashboard</h1><p>Manage inventory, bookings, availability and payments from one workspace.</p></div><button type="button" onClick={openVendorForm}>List new billboard</button></div><div className="vendor-dashboard-stats"><article><span>Total inventory</span><strong>{vendorDashboardInventory.length}</strong><small>Billboard locations</small></article><article><span>Published</span><strong>{vendorDashboardInventory.filter((location) => publishedPhiPages.includes(location.page)).length}</strong><small>Visible to advertisers</small></article><article><span>Booking requests</span><strong>0</strong><small>New vendor workspace</small></article><article><span>Vendor VAT generated</span><strong>AED {formatMoneyWithFils(vendorDashboardVatGenerated)}</strong><small>VAT 5% from this vendor only</small></article></div><div className="vendor-dashboard-overview-grid"><section><div className="vendor-panel-title"><div><span>GET STARTED</span><strong>Add your billboard inventory</strong></div><button type="button" onClick={openVendorForm}>Add inventory</button></div><div className="vendor-request-list compact"><article><i>01</i><div><strong>List billboard details and pricing</strong><small>Your submission will appear under My billboard inventory.</small></div></article></div></section><section><div className="vendor-panel-title"><div><span>INVENTORY STATUS</span><strong>Approval progress</strong></div><button type="button" onClick={() => setVendorDashboardTab("inventory")}>Manage</button></div><div className="vendor-status-chart"><div><span style={{ width: `${vendorDashboardInventory.length ? Math.max(12, Math.min(100, (vendorDashboardInventory.filter((location) => publishedPhiPages.includes(location.page)).length / vendorDashboardInventory.length) * 100)) : 0}%` }} /></div><p><strong>{vendorDashboardInventory.filter((location) => publishedPhiPages.includes(location.page)).length}</strong> published · <strong>{vendorDashboardInventory.filter((location) => approvedPhiPages.includes(location.page) && !publishedPhiPages.includes(location.page)).length}</strong> approved · <strong>{vendorDashboardInventory.filter((location) => !approvedPhiPages.includes(location.page) && !publishedPhiPages.includes(location.page)).length}</strong> under review</p></div></section></div></>}
                {vendorDashboardTab === "inventory" && <><div className="vendor-dashboard-heading"><div><span>MY INVENTORY</span><h1>Billboard locations</h1><p>Track approval and advertiser visibility for every submitted location.</p></div><button type="button" onClick={openVendorForm}>+ Add inventory</button></div>{lastVendorSubmissionCount > 0 && <div className="vendor-submission-confirmation"><span>✓</span><div><strong>Vendor application submitted successfully</strong><p>{lastVendorSubmissionCount} new billboard{lastVendorSubmissionCount === 1 ? "" : "s"} added below with Pending Review status.</p></div></div>}<div className="vendor-dashboard-inventory">{vendorDashboardInventory.length === 0 && <div className="vendor-dashboard-empty"><strong>No billboards added yet</strong><p>Use “Add inventory” to submit your first billboard.</p><button type="button" onClick={openVendorForm}>Add your first billboard</button></div>}{vendorDashboardInventory.slice(-8).reverse().map((location, index) => { const published = publishedPhiPages.includes(location.page); const approved = approvedPhiPages.includes(location.page); return <article key={`${location.page}-${index}`}><img src={`/phi-locations/page-${String(Math.min(location.page, 22)).padStart(2, "0")}.jpg`} alt="" /><div><span>{published ? "PUBLISHED" : approved ? "APPROVED" : "PENDING REVIEW"}</span><strong>{location.name}</strong><small>{location.road} · {location.type}</small><p>{location.size} · {location.traffic}</p></div><b className={published ? "published" : approved ? "approved" : "pending"}>{published ? "Live" : approved ? "Ready" : "Review"}</b></article>})}</div></>}
                {vendorDashboardTab === "bookings" && <><div className="vendor-dashboard-heading"><div><span>CAMPAIGN REQUESTS</span><h1>Booking requests</h1><p>Review advertiser dates, selected inventory and media value.</p></div></div><div className="vendor-dashboard-empty"><strong>No booking requests yet</strong><p>New requests will appear here only when an advertiser books one of this vendor’s published billboards.</p></div></>}
                {vendorDashboardTab === "availability" && <><div className="vendor-dashboard-heading"><div><span>INVENTORY SCHEDULE</span><h1>Availability calendar</h1><p>Block unavailable dates or reopen dates for advertiser bookings.</p></div><button type="button" onClick={() => { openVendorForm(); setVendorStep(2); }}>Manage calendar</button></div><div className="vendor-dashboard-calendar-card"><span>CALENDAR CONTROL</span><strong>{calendarMonth.toLocaleString("en-AE", { month: "long", year: "numeric" })}</strong><p>{blockedDates.length} blocked dates · Available dates remain visible to advertisers.</p><button type="button" onClick={() => { openVendorForm(); setVendorStep(2); }}>Open full availability calendar →</button></div></>}
                {vendorDashboardTab === "billing" && <><div className="vendor-dashboard-heading"><div><span>FINANCE</span><h1>Billing & payouts</h1><p>Track vendor invoices, VAT, payment status and expected payout dates.</p></div></div><div className="vendor-dashboard-stats billing"><article><span>Total earnings</span><strong>AED {formatMoneyWithFils(vendorDashboardBillingTotal)}</strong><small>Current financial year</small></article><article><span>Outstanding</span><strong>AED {formatMoneyWithFils(vendorDashboardBillingOutstanding)}</strong><small>Approved campaigns</small></article><article><span>Paid</span><strong>AED {formatMoneyWithFils(vendorDashboardBillingPaid)}</strong><small>Settled payouts</small></article></div>{vendorDashboardBillingRows.length === 0 ? <div className="vendor-dashboard-empty"><strong>No billing activity yet</strong><p>Invoices, VAT and payouts will appear here after this company receives a confirmed billboard booking.</p></div> : <div className="vendor-booking-table billing"><div className="vendor-booking-head"><span>Payout</span><span>Campaign</span><span>Media value</span><span>VAT 5%</span><span>Total</span><span>Status</span></div>{vendorDashboardBillingRows.map((row) => <article key={row.id}><strong>{row.id}</strong><span>{row.reference}</span><span>AED {formatMoneyWithFils(row.amount / 1.05)}</span><span>AED {formatMoneyWithFils(row.amount - row.amount / 1.05)}</span><b>AED {formatMoneyWithFils(row.amount)}</b><em className={row.status}>{row.status}</em></article>)}</div>}</>}
                {vendorDashboardTab === "profile" && <><div className="vendor-dashboard-heading"><div><span>COMPANY ACCOUNT</span><h1>Company profile</h1><p>Review and update the company and contact details used by ASNads.</p></div></div><div className="vendor-profile-card"><div><span>{(authUser.companyName || "VN").slice(0, 2).toUpperCase()}</span><section><small>INVENTORY COMPANY</small><strong>{authUser.companyName}</strong><p>{authUser.email}</p></section><b>{authUser.accountStatus}</b></div>{vendorProfileEditing ? <form className="vendor-profile-edit" onSubmit={saveVendorProfile}><label>Company name<input name="companyName" defaultValue={authUser.companyName} required /></label><label>Business sector<input name="businessSector" defaultValue={authUser.businessSector} required /></label><label>Contact person<input name="contactPerson" defaultValue={authUser.fullName} required /></label><label>Contact number<input name="contactNumber" type="tel" defaultValue={authUser.contactNumber} required /></label><label>WhatsApp number<input name="whatsappNumber" type="tel" defaultValue={authUser.whatsappNumber} /></label>{vendorProfileError && <p className="vendor-profile-error">{vendorProfileError}</p>}<div><button type="button" onClick={() => { setVendorProfileEditing(false); setVendorProfileError(""); }}>Cancel</button><button type="submit">Save profile</button></div></form> : <><dl><div><dt>Contact person</dt><dd>{authUser.fullName}</dd></div><div><dt>Contact number</dt><dd>{authUser.contactNumber || "Not added"}</dd></div><div><dt>WhatsApp</dt><dd>{authUser.whatsappNumber || "Not added"}</dd></div><div><dt>Account type</dt><dd>Billboard inventory owner</dd></div><div><dt>Company ID</dt><dd>#{authUser.companyId || authUser.id}</dd></div><div><dt>Verification</dt><dd>{authUser.accountStatus === "active" ? "Approved" : "Pending"}</dd></div></dl><button type="button" onClick={() => setVendorProfileEditing(true)}>Edit profile</button></>}</div></>}
                {vendorDashboardTab === "profile" && <section className="vendor-document-section"><div><span>DOCUMENTATION</span><h2>Company documents</h2><p>Upload, replace or remove your verification documents.</p></div>{vendorDocumentError && <p className="vendor-profile-error">{vendorDocumentError}</p>}{vendorDocumentsLoading ? <p className="vendor-document-loading">Loading documents…</p> : <div className="vendor-document-list">{vendorDocumentSlots.map((slot) => { const document = vendorDocuments.find((item) => item.document_type === slot.type); return <article key={slot.type}><div><strong>{slot.title}</strong><small>{document ? document.file_name : slot.help}</small></div><label className="vendor-document-upload">{document ? "Replace" : "Upload"}<input type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => void uploadVendorDocument(slot.type, event.target.files?.[0] ?? null)} /></label>{document && <button type="button" onClick={() => void removeVendorDocument(slot.type)}>Remove</button>}</article>; })}</div>}</section>}
              </main>
            </div>
          </section>
        </div>
      )}

      {vendorBillboardEditor && <div className="vendor-billboard-editor-backdrop" role="presentation"><section className="vendor-billboard-editor" role="dialog" aria-modal="true" aria-labelledby="vendor-billboard-editor-title"><header><div><span>BILLBOARD MANAGEMENT</span><h2 id="vendor-billboard-editor-title">{vendorBillboardEditor.name}</h2><p>Add the billboard details, location data and selling prices that advertisers will see after approval.</p></div><button type="button" aria-label="Close billboard editor" onClick={() => setVendorBillboardEditor(null)}>×</button></header><form key={vendorBillboardEditor.page} onSubmit={saveVendorBillboardDetails}><section><h3>Billboard details</h3><div className="vendor-billboard-editor-grid"><label>Billboard name<input name="name" defaultValue={vendorBillboardEditor.name} required /></label><label>Billboard type<input name="type" defaultValue={vendorBillboardEditor.type} required /></label><label>Road / location<input name="road" defaultValue={vendorBillboardEditor.road} required /></label><label>Size<input name="size" defaultValue={vendorBillboardEditor.size} required /></label><label>Landmark / facing details<input name="landmark" defaultValue={vendorBillboardEditor.landmark} required /></label><label>Audience / traffic<input name="traffic" defaultValue={vendorBillboardEditor.traffic} required /></label><label className="wide">Google Maps link<input name="map" type="url" defaultValue={vendorBillboardEditor.map} required /></label></div></section><section><div className="vendor-billboard-price-heading"><div><span>SELLING PRICES</span><h3>Advertiser booking price</h3><p>Enter the price for each booking option. Prices remain pending admin review until published.</p></div><strong>VAT shown separately at booking</strong></div><div className="vendor-billboard-price-grid">{(["hourly", "day", "week", "month"] as const).map((period) => <label key={period}>{period === "day" ? "Day price (AED)" : `${period[0].toUpperCase() + period.slice(1)} price (AED)`}<input name={period} type="number" min="0" step="1" defaultValue={vendorBillboardPrices[vendorBillboardEditor.page]?.[period] || ""} placeholder="Enter price" /></label>)}</div></section><footer><button type="button" className="vendor-editor-secondary" onClick={() => setVendorBillboardEditor(null)}>Back to billboards</button><button type="submit" className="vendor-dashboard-add">Save billboard details & prices</button></footer></form></section></div>}

      <section className="inventory-map-header" id="inventory-map" aria-label="UAE billboard inventory map">
        <UaeInventoryMap onSelectEmirate={openCampaignForEmirate} onExploreAll={() => openCampaign()} />
      </section>

      <section className="stats-strip">
        <div><strong>640+</strong><span>billboard locations</span></div>
        <div><strong>48</strong><span>verified media vendors</span></div>
        <div><strong>7</strong><span>outdoor media formats</span></div>
        <div><strong>24h</strong><span>average proposal time</span></div>
      </section>

      <section className="marketplace section" id="marketplace">
        <div className="section-heading">
          <div>
            <span className="section-kicker">EXPLORE INVENTORY</span>
            <h2>Make the city<br />remember you.</h2>
          </div>
          <p>Compare prime locations, audience reach and pricing from verified outdoor media owners.</p>
        </div>

        <div className="marketplace-browser">
          <aside className="inventory-filter-panel" aria-label="Filter billboard inventory">
            <div className="filter-panel-heading"><div><span>SMART FILTERS</span><strong>Find your audience</strong></div><button type="button" onClick={resetMarketplaceFilters}>Reset</button></div>

            <fieldset className="filter-group">
              <legend>Emirate <span>— select several</span></legend>
              <div className="filter-pills">
                <button type="button" className={marketEmirates.length === 0 ? "active" : ""} onClick={() => { setMarketEmirates([]); setMarketLocation(""); }}>All</button>
                {emirates.map((emirate) => <button type="button" key={emirate} className={marketEmirates.includes(emirate) ? "active" : ""} onClick={() => { setMarketEmirates((current) => current.includes(emirate) ? current.filter((item) => item !== emirate) : [...current, emirate]); setMarketLocation(""); }}>{emirate === "Ras Al Khaimah" ? "RAK" : emirate === "Umm Al Quwain" ? "UAQ" : emirate}</button>)}
              </div>
            </fieldset>

            <fieldset className="filter-group">
              <legend>Venue type <span>— select several</span></legend>
              <div className="filter-pills">
                <button type="button" className={marketVenueTypes.length === 0 ? "active" : ""} onClick={() => setMarketVenueTypes([])}>All</button>
                {marketplaceVenueFilters.map((venue) => <button type="button" key={venue.label} className={marketVenueTypes.includes(venue.label) ? "active" : ""} onClick={() => setMarketVenueTypes((current) => current.includes(venue.label) ? current.filter((item) => item !== venue.label) : [...current, venue.label])}><span>{venue.icon}</span>{venue.label}</button>)}
              </div>
            </fieldset>

            <label className="filter-select">Location<select value={marketLocation} onChange={(event) => setMarketLocation(event.target.value)}><option value="">All locations</option>{marketplaceLocationOptions.map((location) => <option key={location} value={location}>{location}</option>)}</select></label>

            <fieldset className="filter-group">
              <legend>Format</legend>
              <div className="filter-pills">
                <button type="button" className={marketFormats.length === 0 ? "active" : ""} onClick={() => setMarketFormats([])}>All</button>
                {marketplaceFormats.map((format) => <button type="button" key={format} className={marketFormats.includes(format) ? "active" : ""} onClick={() => setMarketFormats((current) => current.includes(format) ? current.filter((item) => item !== format) : [...current, format])}>{format}</button>)}
              </div>
            </fieldset>

            <label className="filter-range">Max price / 4 weeks ({currency})<input aria-label="Maximum price for four weeks" type="range" min="10000" max="500000" step="10000" value={marketMaxPrice} onChange={(event) => setMarketMaxPrice(Number(event.target.value))} /><span>Up to {currency} {formatMoney(marketMaxPrice)}</span></label>

            <fieldset className="filter-group">
              <legend>Availability</legend>
              <div className="filter-pills">
                <button type="button" className={marketAvailability === "any" ? "active" : ""} onClick={() => setMarketAvailability("any")}>Any</button>
                <button type="button" className={marketAvailability === "now" ? "active" : ""} onClick={() => setMarketAvailability("now")}>Available now</button>
                <button type="button" className={marketAvailability === "next" ? "active" : ""} onClick={() => setMarketAvailability("next")}>From next month</button>
              </div>
            </fieldset>

            <label className="filter-select">Min daily audience<select value={marketMinAudience} onChange={(event) => setMarketMinAudience(Number(event.target.value))}><option value="0">Any</option><option value="50000">50k+ viewers/day</option><option value="100000">100k+ viewers/day</option><option value="200000">200k+ viewers/day</option></select></label>
          </aside>

          <div className="inventory-results">
            <div className="results-meta">
              <div className="results-count">
                <strong>{visibleListings.length}</strong>
                <span><b>Matching locations</b><small>Verified {country.marketLabel} outdoor media inventory</small></span>
              </div>
              <label className="results-sort"><span>Sort by</span><select aria-label="Sort billboard locations"><option>Recommended</option><option>Price: low to high</option><option>Highest reach</option></select></label>
            </div>

            <div className="listing-grid">
              {visibleListings.map((item) => (
                <article className="listing-card" key={item.id}>
                  <div className={`listing-art ${item.tone}`}>
                    <img className="listing-photo" src={getMarketplaceListingImage(item)} alt={`${item.location} outdoor advertising location`} />
                    <div className="listing-photo-shade" />
                    <span className="listing-tag">{item.tag}</span>
                    <button className="heart" aria-label={`Save ${item.title}`} onClick={() => notify(`${item.title} saved to your shortlist.`)}>♡</button>
                    <span className="listing-reach">{item.audience}</span>
                  </div>
                  <div className="listing-body">
                    <div className="listing-card-topline"><div className="listing-category">{item.category}</div><span>Verified inventory</span></div>
                    <h3>{item.title}</h3>
                    <p className="location">● {item.location}</p>
                    <div className="listing-details"><span>{item.format}</span><span>{item.audience}</span></div>
                    <div className="vendor-line"><span>{item.vendor.charAt(0)}</span>{item.vendor}<b>✓</b></div>
                    <div className="listing-footer">
                      <div><small>From</small><strong>{currency} {formatMoney(item.price)}</strong><small>/ week</small></div>
                      <button className="button button-outline" onClick={() => openCampaign(item)}>View & book</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {visibleListings.length === 0 && <div className="empty-state"><strong>No exact matches yet.</strong><span>Adjust the filters or reset them to see more {country.marketLabel} inventory.</span><button type="button" className="button button-dark" onClick={resetMarketplaceFilters}>Reset filters</button></div>}
          </div>
        </div>
      </section>

      <section className="steps section" id="how-it-works">
        <div className="section-heading compact">
          <div><span className="section-kicker">A SMARTER WAY TO BOOK OOH</span><h2>Launch in three simple steps</h2></div>
        </div>
        <div className="step-grid">
          <article><span>01</span><b>Search & compare</b><p>Filter billboard locations by format, area, audience and weekly price.</p></article>
          <article><span>02</span><b>Build your campaign</b><p>Select dates, upload your creative brief and request the best inventory.</p></article>
          <article><span>03</span><b>Go live & measure</b><p>Track approvals, campaign status and proof-of-play from your dashboard.</p></article>
        </div>
      </section>

      <footer>
        <a className="brand footer-brand" href="#inventory-map"><span className="brand-mark">A</span><span>ASNads</span></a>
        <p>The {country.marketLabel} marketplace for impactful outdoor advertising.</p>
        <div><a href="#marketplace">Marketplace</a><a href="#vendor-registration" onClick={(event) => { event.preventDefault(); openVendor(); }}>Vendors</a><a href="#how-it-works">How it works</a></div>
        <small>© 2026 ASNads. Built for advertisers and media owners.</small>
      </footer>
      </>}

      {campaignLayoutChooserOpen && (
        <div className="campaign-layout-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCampaignLayoutChooserOpen(false); }}>
          <section className="campaign-layout-chooser" role="dialog" aria-modal="true" aria-labelledby="campaign-layout-title">
            <button type="button" aria-label="Close layout options" onClick={() => setCampaignLayoutChooserOpen(false)}>×</button>
            <span>TEST MODE · PRIVATE PREVIEW</span>
            <h2 id="campaign-layout-title">Choose the easiest campaign arrangement</h2>
            <p>Both options contain the same company, location, billboard, schedule, price, ad group and creative sections. Only the working arrangement changes.</p>
            <div className="campaign-layout-options">
              <article>
                <header><i>01</i><div><strong>Guided Journey</strong><small>Recommended for most advertisers</small></div><b>BEST FOR NEW USERS</b></header>
                <div className="layout-guided-preview"><aside><span className="active">1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span></aside><section><em>Step 1 of 6</em><strong>Company and campaign details</strong><div /><div /><div /></section></div>
                <ul><li>One clear task at a time</li><li>Progress menu always visible</li><li>Lower chance of missing information</li></ul>
                <button type="button" onClick={() => launchCampaignTestMode("guided")}>Test Guided Journey →</button>
              </article>
              <article>
                <header><i>02</i><div><strong>Compact Workspace</strong><small>Faster for experienced advertisers</small></div><b>FAST ENTRY</b></header>
                <div className="layout-compact-preview"><header><span>Campaign</span><span>Locations</span><span>Schedule</span><span>Ads</span></header><section><div /><div /><div /><div /></section><footer><i /><strong>Live campaign summary</strong></footer></div>
                <ul><li>Sections arranged as dashboard tabs</li><li>More information visible together</li><li>Quick access to campaign summary</li></ul>
                <button type="button" onClick={() => launchCampaignTestMode("compact")}>Test Compact Workspace →</button>
              </article>
            </div>
            <small className="campaign-layout-note">TEST MODE ONLY · Nothing entered here will be submitted or published.</small>
          </section>
        </div>
      )}

      {campaignsOpen && (
        <div className="campaign-dashboard-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCampaignsOpen(false); }}>
          <section className="campaign-dashboard" role="dialog" aria-modal="true" aria-labelledby="campaign-dashboard-title">
            <header>
              <div><span>ADVERTISER WORKSPACE</span><h2 id="campaign-dashboard-title">Campaigns</h2><p>Review every campaign, its ad groups, billboard selections and budget.</p></div>
              <div><button type="button" className="campaign-dashboard-create" onClick={openCampaignFromDashboard}>+ Create campaign</button><button type="button" className="campaign-dashboard-close" aria-label="Close campaigns" onClick={() => setCampaignsOpen(false)}>×</button></div>
            </header>
            <div className="campaign-dashboard-tools"><button type="button">⌕ <span>Add filter</span></button><strong>{createdCampaigns.length} campaign{createdCampaigns.length === 1 ? "" : "s"}</strong></div>
            {createdCampaigns.length > 0 ? (
              <div className="campaign-management-table" role="table" aria-label="Created campaigns">
                <div className="campaign-management-head" role="row"><span /><strong>Campaign</strong><strong>Budget</strong><strong>Status</strong><strong>Campaign type</strong><strong>Start date</strong><span /></div>
                {createdCampaigns.map((campaign) => {
                  const expanded = expandedCampaignIds.includes(campaign.id);
                  return <div className="campaign-management-group" key={campaign.id}>
                    <div className="campaign-management-parent" role="row">
                      <button type="button" aria-label={`${expanded ? "Collapse" : "Expand"} ${campaign.name}`} onClick={() => setExpandedCampaignIds((current) => current.includes(campaign.id) ? current.filter((id) => id !== campaign.id) : [...current, campaign.id])}>{expanded ? "⌄" : "›"}</button>
                      <button type="button" className="campaign-name-cell" onClick={() => setCampaignDetailsId(campaign.id)}><i /><span><strong>{campaign.name}</strong><small>{campaign.adGroups.length} ad group{campaign.adGroups.length === 1 ? "" : "s"} · {campaign.objective}</small></span></button>
                      <span>AED {formatMoney(campaign.budget)}</span>
                      <span><b className={`campaign-status-dot ${campaign.status === "Eligible" ? "eligible" : ""}`} />{campaign.status}</span>
                      <span>{campaign.campaignType}</span>
                      <span>{campaign.startDate}</span>
                      <button type="button" className="campaign-view-details" onClick={() => setCampaignDetailsId(campaign.id)}>View details</button>
                    </div>
                    {expanded && <div className="campaign-adgroup-rows">{campaign.adGroups.map((group) => <button type="button" key={group.id} onClick={() => setCampaignDetailsId(campaign.id)}><span /><strong><i>⌕</i>{group.name}<small>{group.billboardNames.length} selected billboard{group.billboardNames.length === 1 ? "" : "s"}</small></strong><span>AED {formatMoney(group.budget)}</span><span><b className="campaign-status-dot eligible" />Eligible</span><span>{group.category}</span><span>{campaign.startDate}</span><em>Open</em></button>)}</div>}
                  </div>;
                })}
                <div className="campaign-management-total"><span /><strong>Total: all enabled campaigns</strong><span>AED {formatMoney(createdCampaigns.reduce((total, campaign) => total + campaign.budget, 0))}</span><span /><span /><span /><span /></div>
              </div>
            ) : (
              <div className="campaign-dashboard-empty"><span>＋</span><strong>No campaigns created yet</strong><p>Create your first campaign. When it is submitted, its Digital, Static, Kiosk, Mall, Road, Bridge and Building ad groups will appear here.</p><button type="button" onClick={openCampaignFromDashboard}>Create your first campaign</button></div>
            )}
          </section>
        </div>
      )}

      {selectedCampaignDetails && (
        <div className="campaign-details-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCampaignDetailsId(""); }}>
          <section className="campaign-details-panel" role="dialog" aria-modal="true" aria-labelledby="campaign-details-title">
            <button type="button" aria-label="Close campaign details" onClick={() => setCampaignDetailsId("")}>×</button>
            <span>CAMPAIGN DETAILS</span><h2 id="campaign-details-title">{selectedCampaignDetails.name}</h2>
            <div className="campaign-details-summary"><article><small>Status</small><strong>{selectedCampaignDetails.status}</strong></article><article><small>Total budget</small><strong>AED {formatMoney(selectedCampaignDetails.budget)}</strong></article><article><small>Campaign type</small><strong>{selectedCampaignDetails.campaignType}</strong></article><article><small>Objective</small><strong>{selectedCampaignDetails.objective}</strong></article></div>
            <div className="campaign-details-dates"><div><small>Start date</small><strong>{selectedCampaignDetails.startDate}</strong></div><div><small>End date</small><strong>{selectedCampaignDetails.endDate}</strong></div><div><small>Emirates</small><strong>{selectedCampaignDetails.emirates.join(", ") || "Not selected"}</strong></div></div>
            <h3>Ad groups and selected billboards</h3>
            <div className="campaign-details-groups">{selectedCampaignDetails.adGroups.map((group, index) => <article key={group.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{group.name}</strong><small>{group.category}</small>{group.billboardNames.map((name) => <p key={name}>✓ {name}</p>)}</div><b>AED {formatMoney(group.budget)}</b></article>)}</div>
          </section>
        </div>
      )}

      {authOpen && (
        <div className="modal-backdrop auth-backdrop" role="presentation">
          <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <button className="auth-close" aria-label="Close" onClick={() => setAuthOpen(false)}>×</button>
            <div className="auth-brand"><span>A</span><div><strong>ASNads</strong><small>{authPurpose === "admin" ? "SECURE ADMINISTRATOR ACCESS" : authPurpose === "owner" ? "SECURE BILLBOARD OWNER ACCESS" : "SECURE ADVERTISER ACCESS"}</small></div></div>
            {authPurpose === "advertiser" && authStartCampaign && authMode === "login" && <button type="button" className="auth-register-entry" onClick={() => { setAuthStartCampaign(false); setAuthMode("register"); setAuthError(""); setAuthMessage(""); }}>Register as Advertiser</button>}
            {authPurpose !== "admin" && !authStartCampaign && (authMode === "login" || authMode === "register") && <div className="auth-tabs" role="tablist">
              <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => { setAuthMode("login"); setAuthError(""); setAuthMessage(""); }}>Login</button>
              <button type="button" className={authMode === "register" ? "active" : ""} onClick={() => { setAuthMode("register"); setAuthError(""); setAuthMessage(""); }}>Create account</button>
            </div>}
            {authMode === "login" ? (
              <form className="auth-form" onSubmit={submitLogin}>
                <span className="auth-kicker">{authPurpose === "admin" ? "ADMINISTRATOR LOGIN" : authPurpose === "owner" ? "BILLBOARD OWNER LOGIN" : "WELCOME BACK"}</span>
                <h2 id="auth-title">{authPurpose === "admin" ? "Control company access" : authPurpose === "owner" ? "Access your inventory" : "Access your campaigns"}</h2>
                <p>{authPurpose === "admin" ? "Use your authorised ASNads administrator account to manage advertising and inventory companies." : authPurpose === "owner" ? "Sign in with your verified media company email to add and manage billboards." : "Sign in with your verified company email."}</p>
                <label>Company email<input name="email" type="email" autoComplete="username" required value={rememberedEmail} onChange={(event) => setRememberedEmail(event.target.value)} placeholder="name@company.com" /></label>
                <label>Password<span className="password-input-wrap"><input name="password" type={showLoginPassword ? "text" : "password"} autoComplete="current-password" required placeholder="Enter your password" /><button type="button" className="password-visibility-toggle" aria-label="Hold to show password" aria-pressed={showLoginPassword} onPointerDown={() => beginPasswordReveal("login", setShowLoginPassword)} onPointerUp={() => endPasswordReveal("login", setShowLoginPassword)} onPointerLeave={() => endPasswordReveal("login", setShowLoginPassword)} onPointerCancel={() => endPasswordReveal("login", setShowLoginPassword)} onContextMenu={(event) => event.preventDefault()}><EyeVisibilityIcon hidden={showLoginPassword} /></button></span></label>
                <label className="remember-login"><input name="remember" type="checkbox" checked={rememberLogin} onChange={(event) => setRememberLogin(event.target.checked)} /> <span>Remember my email and keep me signed in on this device</span></label>
                <div className="auth-security-note">Your password is never stored by ASNads. Your browser may securely offer to save it in its password manager.</div>
                <button type="button" className="auth-forgot-link" onClick={() => { setAuthMode("forgot"); setAuthError(""); setAuthMessage(""); }}>Forgot password?</button>
                {authError && <div className="auth-alert error" role="alert">{authError}</div>}
                {authMessage && <div className="auth-alert success" role="status">{authMessage}</div>}
                <button className="auth-submit" disabled={authSubmitting}>{authSubmitting ? "Signing in…" : "Login securely →"}</button>
                <small>{authPurpose === "admin" ? "Only accounts assigned the administrator role can access this area." : authPurpose === "owner" ? "Only verified billboard owner accounts can add inventory." : "Only verified advertiser accounts can sign in."}</small>
              </form>
            ) : authMode === "forgot" ? (
              <form className="auth-form" onSubmit={submitForgotPassword}>
                <span className="auth-kicker">ACCOUNT RECOVERY</span>
                <h2 id="auth-title">Reset your password</h2>
                <p>Enter your verified company email. We will send you a secure password-reset link.</p>
                <label>Company email<input name="email" type="email" autoComplete="email" required placeholder="name@company.com" /></label>
                {authError && <div className="auth-alert error" role="alert">{authError}</div>}
                {authMessage && <div className="auth-alert success" role="status">{authMessage}</div>}
                <button className="auth-submit" disabled={authSubmitting || Boolean(authMessage)}>{authSubmitting ? "Sending secure link…" : authMessage ? "Reset link sent" : "Send reset link →"}</button>
                <button type="button" className="auth-back-link" onClick={() => { setAuthMode("login"); setAuthError(""); setAuthMessage(""); }}>← Back to login</button>
              </form>
            ) : authMode === "reset" ? (
              <form className="auth-form" onSubmit={submitResetPassword}>
                <span className="auth-kicker">CREATE NEW PASSWORD</span>
                <h2 id="auth-title">Choose a secure password</h2>
                <p>Your new password must contain at least 8 characters.</p>
                <label>New password<span className="password-input-wrap"><input name="password" required type={showResetPasswords ? "text" : "password"} autoComplete="new-password" minLength={8} placeholder="Minimum 8 characters" /><button type="button" className="password-visibility-toggle" aria-label="Hold to show passwords" aria-pressed={showResetPasswords} onPointerDown={() => beginPasswordReveal("reset", setShowResetPasswords)} onPointerUp={() => endPasswordReveal("reset", setShowResetPasswords)} onPointerLeave={() => endPasswordReveal("reset", setShowResetPasswords)} onPointerCancel={() => endPasswordReveal("reset", setShowResetPasswords)} onContextMenu={(event) => event.preventDefault()}><EyeVisibilityIcon hidden={showResetPasswords} /></button></span></label>
                <label>Confirm new password<span className="password-input-wrap"><input name="confirmPassword" required type={showResetPasswords ? "text" : "password"} autoComplete="new-password" minLength={8} placeholder="Enter password again" /><button type="button" className="password-visibility-toggle" aria-label="Hold to show passwords" aria-pressed={showResetPasswords} onPointerDown={() => beginPasswordReveal("reset", setShowResetPasswords)} onPointerUp={() => endPasswordReveal("reset", setShowResetPasswords)} onPointerLeave={() => endPasswordReveal("reset", setShowResetPasswords)} onPointerCancel={() => endPasswordReveal("reset", setShowResetPasswords)} onContextMenu={(event) => event.preventDefault()}><EyeVisibilityIcon hidden={showResetPasswords} /></button></span></label>
                <div className="auth-password-note">Use uppercase, lowercase, a number and a symbol.</div>
                {authError && <div className="auth-alert error" role="alert">{authError}</div>}
                {authMessage && <div className="auth-alert success" role="status">{authMessage}</div>}
                <button className="auth-submit" disabled={authSubmitting || Boolean(authMessage)}>{authSubmitting ? "Updating password…" : authMessage ? "Password updated" : "Update password securely →"}</button>
                {authMessage && <button type="button" className="auth-back-link" onClick={() => { window.history.replaceState({}, "", window.location.pathname); setAuthMode("login"); setAuthError(""); setAuthMessage(""); }}>Continue to login →</button>}
              </form>
            ) : (
              <form className="auth-form" onSubmit={submitRegistration}>
                <span className="auth-kicker">{authPurpose === "owner" ? "NEW BILLBOARD OWNER" : "NEW ADVERTISER"}</span>
                <h2 id="auth-title">{authPurpose === "owner" ? "Register your inventory company" : "Create your ASNads account"}</h2>
                <p>{authPurpose === "owner" ? "Enter the billboard company details first. After email verification, log in to add inventory." : "Register your company, then verify your email to activate access."}</p>
                <div className="auth-grid">
                  <label>Company name<input name="companyName" required placeholder="Legal company name" /></label>
                  <label>Business sector<input name="businessSector" required placeholder="e.g. Retail, Automotive" /></label>
                  <label>Contact person<input name="contactPerson" required placeholder="Full name" /></label>
                  <label>Contact number<input name="contactNumber" required type="tel" placeholder="+971 50 000 0000" /></label>
                  <label>WhatsApp number<input name="whatsappNumber" type="tel" placeholder="+971 50 000 0000" /></label>
                  <label>Company email<input name="companyEmail" required type="email" autoComplete="email" placeholder="name@company.com" /></label>
                  <label>Password<span className="password-input-wrap"><input name="password" required type={showRegistrationPasswords ? "text" : "password"} autoComplete="new-password" minLength={8} pattern="(?=.*[A-Z])(?=.*[0-9]).{8,}" title="Use at least 8 characters, including 1 capital letter and 1 number" placeholder="Minimum 8 characters" /><button type="button" className="password-visibility-toggle" aria-label="Hold to show passwords" aria-pressed={showRegistrationPasswords} onPointerDown={() => beginPasswordReveal("registration", setShowRegistrationPasswords)} onPointerUp={() => endPasswordReveal("registration", setShowRegistrationPasswords)} onPointerLeave={() => endPasswordReveal("registration", setShowRegistrationPasswords)} onPointerCancel={() => endPasswordReveal("registration", setShowRegistrationPasswords)} onContextMenu={(event) => event.preventDefault()}><EyeVisibilityIcon hidden={showRegistrationPasswords} /></button></span></label>
                  <label>Confirm password<span className="password-input-wrap"><input name="confirmPassword" required type={showRegistrationPasswords ? "text" : "password"} autoComplete="new-password" minLength={8} pattern="(?=.*[A-Z])(?=.*[0-9]).{8,}" title="Use at least 8 characters, including 1 capital letter and 1 number" placeholder="Enter password again" /><button type="button" className="password-visibility-toggle" aria-label="Hold to show passwords" aria-pressed={showRegistrationPasswords} onPointerDown={() => beginPasswordReveal("registration", setShowRegistrationPasswords)} onPointerUp={() => endPasswordReveal("registration", setShowRegistrationPasswords)} onPointerLeave={() => endPasswordReveal("registration", setShowRegistrationPasswords)} onPointerCancel={() => endPasswordReveal("registration", setShowRegistrationPasswords)} onContextMenu={(event) => event.preventDefault()}><EyeVisibilityIcon hidden={showRegistrationPasswords} /></button></span></label>
                </div>
                <div className="auth-password-note">Minimum 8 characters, including at least 1 capital letter and 1 number.</div>
                {authError && <div className="auth-alert error" role="alert">{authError}</div>}
                {authMessage && <div className="auth-alert success" role="status">{authMessage}</div>}
                <button className="auth-submit" disabled={authSubmitting || Boolean(authMessage)}>{authSubmitting ? "Creating account…" : authMessage ? "Verification email sent" : authPurpose === "owner" ? "Create billboard owner account →" : "Create advertiser account →"}</button>
              </form>
            )}
          </section>
        </div>
      )}

      {modal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <section className={modal === "vendor" ? "modal campaign-modal vendor-modal" : `modal campaign-modal campaign-test-layout-${campaignTestLayout}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button className="modal-close" aria-label="Close" onClick={() => { setModal(null); setSelected(null); setMagnifiedListing(null); }}>×</button>
            {modal === "campaign" && (
              <aside className="campaign-side-menu" aria-label="Campaign setup menu">
                <div className="campaign-side-menu-head">
                  <span>CAMPAIGN MENU</span>
                  <strong>Your campaign journey</strong>
                  <small>Use this menu to review each section.</small>
                </div>
                <nav>
                  <div className="campaign-entity-tree" aria-label="Campaign structure">
                    <div className="campaign-entity-tree-title"><span>▾</span><strong>Campaigns</strong></div>
                    <button type="button" className={campaignStage === "setup" || campaignStage === "name" ? "active" : ""} onClick={() => openCampaignMenuSection("setup", "campaign-company")}><span>01</span><strong>Campaigns</strong><small>Campaign details and name</small></button>
                    <button type="button" className={campaignStage === "adgroups" ? "active" : ""} disabled={!campaignCustomNameCode} onClick={() => openCampaignMenuSection("adgroups")}><span>02</span><strong>Ad groups</strong><small>Separate groups by billboard type</small></button>
                    <button type="button" className={campaignStage === "creative" ? "active" : ""} disabled={!campaignCustomNameCode} onClick={() => openCampaignMenuSection("creative")}><span>03</span><strong>Ads</strong><small>Different creative for every group</small></button>
                  </div>
                  <div className="campaign-setup-label">CAMPAIGN SETUP</div>
                  <div className={`campaign-menu-group ${campaignStage === "setup" ? "active" : "complete"}`}>
                    <button type="button" onClick={() => openCampaignMenuSection("setup", "campaign-company")}>
                      <span>01</span><strong>{campaignFromDashboard ? "Campaign objective" : "Company and advertiser details"}</strong>
                    </button>
                    <div className="campaign-menu-subitems">
                      <button type="button" onClick={() => openCampaignMenuSection("setup", "campaign-emirates")}><i>{campaignEmirates.length > 0 ? "✓" : "a"}</i>Select Emirates</button>
                      <button type="button" onClick={() => openCampaignMenuSection("setup", "campaign-emirates")}><i>{preferredBillboardTypes.length > 0 ? "✓" : "b"}</i>Choose Static or Digital</button>
                      <button type="button" onClick={() => openCampaignMenuSection("setup", "campaign-options")}><i>{advertiserPlan || campaignTypeIsStatic ? "✓" : "c"}</i>Choose your advertising option</button>
                      <button type="button" onClick={() => openCampaignMenuSection("setup", "campaign-inventory")}><i>{campaignLocations.length > 0 ? "✓" : "d"}</i>Select matching owner inventory</button>
                    </div>
                  </div>
                  <button type="button" className={`campaign-menu-step ${campaignStage === "name" ? "active" : campaignStage === "adgroups" || campaignStage === "creative" ? "complete" : ""}`} disabled={campaignLocations.length === 0} onClick={() => openCampaignMenuSection("name")}>
                    <span>02</span><strong>Create your campaign name</strong>
                  </button>
                  <button type="button" className={`campaign-menu-step ${campaignStage === "adgroups" ? "active" : campaignStage === "creative" ? "complete" : ""}`} disabled={!campaignCustomNameCode} onClick={() => openCampaignMenuSection("adgroups")}>
                    <span>03</span><strong>Create format ad groups</strong>
                  </button>
                  <button type="button" className={`campaign-menu-step ${campaignStage === "creative" ? "active" : ""}`} disabled={!campaignCustomNameCode} onClick={() => openCampaignMenuSection("creative")}>
                    <span>04</span><strong>Upload ads for each group</strong>
                  </button>
                  <button type="button" className="campaign-menu-step future" disabled><span>05</span><strong>Billing</strong><small>Next step</small></button>
                  <button type="button" className="campaign-menu-step future" disabled><span>06</span><strong>Setup</strong><small>Final review</small></button>
                </nav>
                <div className="campaign-side-menu-status">
                  <span>{campaignStage === "setup" ? "STEP 1 OF 6" : campaignStage === "name" ? "STEP 2 OF 6" : campaignStage === "adgroups" ? "STEP 3 OF 6" : "STEP 4 OF 6"}</span>
                  <strong>{campaignStage === "setup" ? "Campaign details" : campaignStage === "name" ? "Campaign identity" : campaignStage === "adgroups" ? "Ad groups" : "Ads and creative"}</strong>
                </div>
              </aside>
            )}
            {modal === "vendor" && (
              <aside className="campaign-side-menu inventory-side-menu" aria-label="Inventory company setup menu">
                <div className="campaign-side-menu-head">
                  <span>INVENTORY MENU</span>
                  <strong>Your inventory journey</strong>
                  <small>Use this menu to review each section.</small>
                </div>
                <nav>
                  <div className={`campaign-menu-group ${vendorStep === 1 ? "active" : "complete"}`}>
                    <button type="button" onClick={() => openVendorMenuSection(1, "inventory-location")}><span>01</span><strong>Billboard inventory details</strong></button>
                    <div className="campaign-menu-subitems">
                      <button type="button" onClick={() => openVendorMenuSection(1, "inventory-location")}><i>a</i>Billboard location</button>
                      <button type="button" onClick={() => openVendorMenuSection(1, "inventory-audience")}><i>b</i>Audience and viewers</button>
                      <button type="button" onClick={() => openVendorMenuSection(1, "inventory-facing")}><i>c</i>Billboard facing details</button>
                      <button type="button" onClick={() => openVendorMenuSection(1, "inventory-add-more")}><i>d</i>Add more billboards</button>
                    </div>
                  </div>
                  <div className={`campaign-menu-group ${vendorStep === 2 ? "active" : ""}`}>
                    <button type="button" onClick={() => openVendorMenuSection(2, "inventory-company-account")}><span>02</span><strong>Inventory company & pricing</strong></button>
                    <div className="campaign-menu-subitems">
                      <button type="button" onClick={() => openVendorMenuSection(2, "inventory-company-account")}><i>a</i>Company account</button>
                      <button type="button" onClick={() => openVendorMenuSection(2, "inventory-pricing")}><i>b</i>Billboard price chart</button>
                      <button type="button" onClick={() => openVendorMenuSection(2, "inventory-calendar")}><i>c</i>Availability calendar</button>
                      <button type="button" onClick={() => openVendorMenuSection(2, "inventory-documents")}><i>d</i>Compliance documents</button>
                    </div>
                  </div>
                </nav>
                <div className="campaign-side-menu-status"><span>STEP {vendorStep} OF 2</span><strong>{vendorStep === 1 ? "Inventory details" : "Company and pricing"}</strong></div>
              </aside>
            )}
            {modal === "vendor" ? (
              <form className="vendor-form-content" onSubmit={submitVendor} noValidate>
                <span className="section-kicker">VENDOR ONBOARDING</span>
                <h2 id="modal-title">List your billboard inventory</h2>
                <div className="test-mode-banner"><strong>Testing mode</strong><span>All fields are optional, so you can open and test every page.</span></div>
                <p>Add every billboard location first, then complete your company, pricing and verification details.</p>
                {vendorStep === 2 && <>
                <div className="vendor-account-summary" id="inventory-company-account">
                  <div><span>LOGGED-IN INVENTORY COMPANY</span><strong>{authUser?.companyName || "Verified media company"}</strong><small>{authUser?.email}</small></div>
                  <div><span>ACCOUNT CONTACT</span><strong>{authUser?.fullName}</strong><small>Verified owner account</small></div>
                  <div><span>INVENTORY IN THIS APPLICATION</span><strong>{billboardCount}</strong><small>{billboardCount === 1 ? "billboard" : "billboards"}</small></div>
                </div>
                </>}
                {vendorStep === 1 && <>
                <div className="detail-section" id="inventory-location">
                  <div className="detail-heading"><span>01</span><div><strong>Billboard location</strong><small>Add precise map and site information</small></div></div>
                  <div className="billboard-name-guide"><div><strong>Billboard name is created automatically</strong><span>With exit: road code + exit + vendor short name + number. Without exit: 2 location letters + 2 landmark letters + vendor short name + number.</span></div><code>{createBillboardName(vendorShortName, billboardIdentities[0]) || "SZR-47-SKY-01"}</code></div>
                  <div className="form-grid">
                    <label>1. Emirate<select required value={billboardIdentities[0].emirate} onChange={(e) => updateBillboardIdentity(0, "emirate", e.target.value)}><option value="" disabled>Select Emirate</option><option>Dubai</option><option>Abu Dhabi</option><option>Sharjah</option><option>Ajman</option><option>Ras Al Khaimah</option><option>Fujairah</option><option>Umm Al Quwain</option></select></label>
                    <label>2. Billboard type<select required value={billboardIdentities[0].billboardType} onChange={(e) => handleInventoryTypeChange(e.target.value)}><option value="" disabled>Select billboard type</option>{categories.slice(1).map((c) => <option key={c}>{c}</option>)}</select></label>
                    {!isVendorAccount(authUser) && <label>3. Vendor short name<input required minLength={2} maxLength={5} pattern="[A-Za-z0-9]+" value={vendorShortName} onChange={(e) => setVendorShortName(e.target.value.toUpperCase())} placeholder="e.g. SKY" /><small className="field-hint">2–5 letters used in every billboard ID</small></label>}
                    {!isVendorAccount(authUser) && <label>Vendor billboard number<input required type="number" min="1" value={billboardIdentities[0].vendorNumber} onChange={(e) => updateBillboardIdentity(0, "vendorNumber", e.target.value)} /><small className="field-hint">Your sequence number for this billboard</small></label>}
                    <label className="full generated-name-field">Automatic billboard name / unique ID<input readOnly value={createBillboardName(vendorShortName, billboardIdentities[0])} placeholder="Complete the fields below to generate the name" /></label>
                    {billboardIdentities[0].billboardType === "Digital Kiosk" ? (
                      <label>4. Major Mall<select required value={billboardIdentities[0].mallName} onChange={(e) => updateDigitalKioskMall(0, e.target.value)}><option value="" disabled>Select major mall</option>{digitalKioskMalls.map((mall) => <option key={mall}>{mall}</option>)}</select><small className="field-hint">The mall name will be used as the billboard location.</small></label>
                    ) : (
                      <label>4. Location / road name<input required value={billboardIdentities[0].location} onChange={(e) => updateBillboardIdentity(0, "location", e.target.value)} placeholder="e.g. Sheikh Zayed Road" /></label>
                    )}
                    {billboardIdentities[0].billboardType === "Digital Kiosk" ? <>
                      <label>Location<input required value={billboardIdentities[0].landmark} onChange={(e) => updateBillboardIdentity(0, "landmark", e.target.value)} placeholder="e.g. Ground Floor, Fashion Avenue" /></label>
                      <label className="full">Nearby major shop<input value={billboardIdentities[0].nearbyShop} onChange={(e) => updateBillboardIdentity(0, "nearbyShop", e.target.value)} placeholder="e.g. Near Apple Store" /></label>
                      <label className="full">Full address<input required placeholder="Mall, floor, zone and entrance" /></label>
                      <label className="full">5. Kiosk size<input required placeholder="e.g. 55-inch portrait screen or 1.2 × 2 m" /></label>
                    </> : <>
                      <label>Nearest landmark<input required={!billboardIdentities[0].exitNumber.trim()} value={billboardIdentities[0].landmark} onChange={(e) => updateBillboardIdentity(0, "landmark", e.target.value)} placeholder="e.g. Dubai Mall" /><small className="field-hint">Required when there is no exit number</small></label>
                      <label className="full">Exit number (if available)<input value={billboardIdentities[0].exitNumber} onChange={(e) => updateBillboardIdentity(0, "exitNumber", e.target.value)} placeholder="e.g. 47" /></label>
                      <label className="full">Full address<input required placeholder="Road, area, nearest landmark" /></label>
                      <label>5. Billboard width (metres)<input required type="number" min="0.1" step="0.1" placeholder="24" /></label>
                      <label>Billboard height (metres)<input required type="number" min="0.1" step="0.1" placeholder="8" /></label>
                    </>}
                    <label>6. Facing towards<input required placeholder="e.g. Dubai-bound traffic" /></label>
                    <label>Traffic volume<select required defaultValue=""><option value="" disabled>Select traffic level</option><option>Very high</option><option>High</option><option>Medium</option><option>Low</option><option>Pedestrian traffic</option></select></label>
                    <label className="full">7. Traffic details<textarea required placeholder="Number of lanes, inbound or outbound flow, peak traffic times and nearby junctions." /></label>
                    <label className="full">8. Google Maps link<input required type="url" value={billboardIdentities[0].mapsLink} onChange={(e) => updateBillboardIdentity(0, "mapsLink", e.target.value)} placeholder="https://maps.google.com/..." /></label>
                    <label>9. Latitude<input required type="number" min="-90" max="90" step="any" value={billboardIdentities[0].latitude} onChange={(e) => updateBillboardIdentity(0, "latitude", e.target.value)} placeholder="25.204849" /></label>
                    <label>10. Longitude<input required type="number" min="-180" max="180" step="any" value={billboardIdentities[0].longitude} onChange={(e) => updateBillboardIdentity(0, "longitude", e.target.value)} placeholder="55.270783" /></label>
                  </div>
                  <div className="map-preview">
                    {primaryMapPreviewUrl ? <iframe title="Billboard 1 location on Google Maps" src={primaryMapPreviewUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /> : <div><span>⌖</span><strong>Google Maps preview</strong><small>Enter latitude and longitude to preview the exact location.</small></div>}
                  </div>
                  <label className="photo-upload">11. Billboard pictures
                    <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(e) => setPictureCount(e.target.files?.length ?? 0)} />
                    <span><b>＋ Add billboard photos</b><small>Upload front view, road view and surroundings · JPG, PNG or WebP</small></span>
                    {pictureCount > 0 && <em>{pictureCount} picture{pictureCount === 1 ? "" : "s"} selected</em>}
                  </label>
                </div>
                <div className="detail-section" id="inventory-audience">
                  <div className="detail-heading"><span>02</span><div><strong>Audience and viewers</strong><small>Enter the latest verified traffic estimates</small></div></div>
                  <div className="metrics-grid">
                    <label>Average hourly viewers<input required type="number" min="0" value={billboardIdentities[0].hourlyAudience} onChange={(e) => updateBillboardIdentity(0, "hourlyAudience", e.target.value)} placeholder="e.g. 5,500" /></label>
                    <label>Average daily viewers<input className="calculated-audience-input" readOnly value={formatAudienceTotal(audienceTotals(billboardIdentities[0].hourlyAudience).daily)} placeholder="Calculated from hourly traffic" /></label>
                    <label>Average weekly viewers<input className="calculated-audience-input" readOnly value={formatAudienceTotal(audienceTotals(billboardIdentities[0].hourlyAudience).weekly)} placeholder="Calculated from hourly traffic" /></label>
                    <label>Average monthly viewers<input className="calculated-audience-input" readOnly value={formatAudienceTotal(audienceTotals(billboardIdentities[0].hourlyAudience).monthly)} placeholder="Calculated from hourly traffic" /></label>
                  </div>
                  <p className="audience-calculation-note">Daily, weekly and monthly totals are calculated automatically: hourly viewers × 24, × 7 days and × 30 days.</p>
                  <div className="form-grid audience-source">
                    <label>Viewer data source<select required defaultValue=""><option value="" disabled>Select source</option><option>Road traffic authority</option><option>Footfall counter</option><option>Mobile audience data</option><option>Vendor estimate</option><option>Third-party audit</option></select></label>
                    <label>Last measured<input required type="month" /></label>
                  </div>
                </div>
                <div className="detail-section" id="inventory-facing">
                  <div className="detail-heading"><span>03</span><div><strong>Billboard facing details</strong><small>Describe visibility from the road or pedestrian route</small></div></div>
                  <div className="form-grid">
                    <label>Billboard faces<select required defaultValue=""><option value="" disabled>Select faces</option><option>Single-sided</option><option>Double-sided</option><option>Three-sided</option><option>Four-sided</option></select></label>
                    <label>Compass facing<select required defaultValue=""><option value="" disabled>Select direction</option><option>North</option><option>North-east</option><option>East</option><option>South-east</option><option>South</option><option>South-west</option><option>West</option><option>North-west</option></select></label>
                    <label>Traffic direction<select required defaultValue=""><option value="" disabled>Select traffic flow</option><option>Inbound</option><option>Outbound</option><option>Both directions</option><option>Pedestrian facing</option></select></label>
                    <label>Illumination<select required defaultValue=""><option value="" disabled>Select lighting</option><option>Digital screen</option><option>Front-lit</option><option>Back-lit</option><option>Non-illuminated</option></select></label>
                    <label>Visibility distance (metres)<input required type="number" min="1" placeholder="300" /></label>
                    <label>Height from ground (metres)<input required type="number" min="0" step="0.1" placeholder="8.5" /></label>
                    <label className="full">Facing notes<textarea placeholder="Example: Clear view for northbound traffic across four lanes; no trees or structures blocking visibility." /></label>
                  </div>
                </div>
                {Array.from({ length: billboardCount - 1 }, (_, index) => (
                  <div className="detail-section additional-billboard" key={`additional-billboard-${index}`}>
                    <div className="detail-heading"><span>{index + 2}</span><div><strong>Billboard {index + 2}</strong><small>Complete location, audience and facing details</small></div></div>
                    <div className="form-grid">
                      <label>Emirate<select required value={billboardIdentities[index + 1].emirate} onChange={(e) => updateBillboardIdentity(index + 1, "emirate", e.target.value)}><option value="" disabled>Select Emirate</option><option>Dubai</option><option>Abu Dhabi</option><option>Sharjah</option><option>Ajman</option><option>Ras Al Khaimah</option><option>Fujairah</option><option>Umm Al Quwain</option></select></label>
                      <label>Billboard type<select required value={billboardIdentities[index + 1].billboardType} onChange={(e) => updateBillboardType(index + 1, e.target.value)}><option value="" disabled>Select billboard type</option>{categories.slice(1).map((c) => <option key={c}>{c}</option>)}</select></label>
                      {!isVendorAccount(authUser) && <label>Vendor billboard number<input required type="number" min="1" value={billboardIdentities[index + 1].vendorNumber} onChange={(e) => updateBillboardIdentity(index + 1, "vendorNumber", e.target.value)} /><small className="field-hint">Vendor sequence number</small></label>}
                      <label className="generated-name-field">Automatic billboard name / unique ID<input readOnly value={createBillboardName(vendorShortName, billboardIdentities[index + 1])} placeholder="Generated automatically" /></label>
                      {billboardIdentities[index + 1].billboardType === "Digital Kiosk" ? (
                        <label>Major Mall<select required value={billboardIdentities[index + 1].mallName} onChange={(e) => updateDigitalKioskMall(index + 1, e.target.value)}><option value="" disabled>Select major mall</option>{digitalKioskMalls.map((mall) => <option key={mall}>{mall}</option>)}</select><small className="field-hint">The mall name will be used as the billboard location.</small></label>
                      ) : (
                        <label>Location / road name<input required value={billboardIdentities[index + 1].location} onChange={(e) => updateBillboardIdentity(index + 1, "location", e.target.value)} placeholder="e.g. Al Khail Road" /></label>
                      )}
                      {billboardIdentities[index + 1].billboardType === "Digital Kiosk" ? <>
                        <label>Location<input required value={billboardIdentities[index + 1].landmark} onChange={(e) => updateBillboardIdentity(index + 1, "landmark", e.target.value)} placeholder="e.g. Ground Floor, Fashion Avenue" /></label>
                        <label className="full">Nearby major shop<input value={billboardIdentities[index + 1].nearbyShop} onChange={(e) => updateBillboardIdentity(index + 1, "nearbyShop", e.target.value)} placeholder="e.g. Near Apple Store" /></label>
                        <label className="full">Kiosk size<input required placeholder="e.g. 55-inch portrait screen or 1.2 × 2 m" /></label>
                      </> : <>
                        <label>Nearest landmark<input required={!billboardIdentities[index + 1].exitNumber.trim()} value={billboardIdentities[index + 1].landmark} onChange={(e) => updateBillboardIdentity(index + 1, "landmark", e.target.value)} placeholder="e.g. Business Bay" /><small className="field-hint">Required when there is no exit number</small></label>
                        <label className="full">Exit number (if available)<input value={billboardIdentities[index + 1].exitNumber} onChange={(e) => updateBillboardIdentity(index + 1, "exitNumber", e.target.value)} placeholder="e.g. 47" /></label>
                        <label>Width (metres)<input required type="number" min="0.1" step="0.1" placeholder="24" /></label>
                        <label>Height (metres)<input required type="number" min="0.1" step="0.1" placeholder="8" /></label>
                      </>}
                      <label>Facing towards<input required placeholder="e.g. Abu Dhabi-bound traffic" /></label>
                      <label>Traffic volume<select required defaultValue=""><option value="" disabled>Select traffic level</option><option>Very high</option><option>High</option><option>Medium</option><option>Low</option><option>Pedestrian traffic</option></select></label>
                      <label className="full">Traffic details<textarea required placeholder="Traffic direction, lanes, peak times and nearby junctions" /></label>
                      <label className="full">Google Maps link<input required type="url" value={billboardIdentities[index + 1].mapsLink} onChange={(e) => updateBillboardIdentity(index + 1, "mapsLink", e.target.value)} placeholder="https://maps.google.com/..." /></label>
                      <label>Latitude<input required type="number" min="-90" max="90" step="any" value={billboardIdentities[index + 1].latitude} onChange={(e) => updateBillboardIdentity(index + 1, "latitude", e.target.value)} placeholder="25.204849" /></label>
                      <label>Longitude<input required type="number" min="-180" max="180" step="any" value={billboardIdentities[index + 1].longitude} onChange={(e) => updateBillboardIdentity(index + 1, "longitude", e.target.value)} placeholder="55.270783" /></label>
                      <label className="full additional-photo-upload">Billboard pictures<input required type="file" accept="image/png,image/jpeg,image/webp" multiple /></label>
                    </div>
                    <div className="map-preview additional-map-preview">
                      {getMapPreviewUrl(billboardIdentities[index + 1].latitude, billboardIdentities[index + 1].longitude) ? <iframe title={`Billboard ${index + 2} location on Google Maps`} src={getMapPreviewUrl(billboardIdentities[index + 1].latitude, billboardIdentities[index + 1].longitude)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /> : <div><span>⌖</span><strong>Google Maps preview for billboard {index + 2}</strong><small>Enter this billboard’s latitude and longitude to preview its exact location.</small></div>}
                    </div>
                    <div className="metrics-grid additional-metrics">
                      <label>Hourly viewers<input required type="number" min="0" value={billboardIdentities[index + 1].hourlyAudience} onChange={(e) => updateBillboardIdentity(index + 1, "hourlyAudience", e.target.value)} placeholder="e.g. 5,500" /></label>
                      <label>Daily viewers<input className="calculated-audience-input" readOnly value={formatAudienceTotal(audienceTotals(billboardIdentities[index + 1].hourlyAudience).daily)} placeholder="Calculated from hourly traffic" /></label>
                      <label>Weekly viewers<input className="calculated-audience-input" readOnly value={formatAudienceTotal(audienceTotals(billboardIdentities[index + 1].hourlyAudience).weekly)} placeholder="Calculated from hourly traffic" /></label>
                      <label>Monthly viewers<input className="calculated-audience-input" readOnly value={formatAudienceTotal(audienceTotals(billboardIdentities[index + 1].hourlyAudience).monthly)} placeholder="Calculated from hourly traffic" /></label>
                    </div>
                    <p className="audience-calculation-note">Totals are calculated automatically from this billboard’s hourly viewers.</p>
                    <div className="form-grid additional-facing-grid">
                      <label>Billboard faces<select required defaultValue=""><option value="" disabled>Select faces</option><option>Single-sided</option><option>Double-sided</option><option>Three-sided</option><option>Four-sided</option></select></label>
                      <label>Compass facing<select required defaultValue=""><option value="" disabled>Select direction</option><option>North</option><option>North-east</option><option>East</option><option>South-east</option><option>South</option><option>South-west</option><option>West</option><option>North-west</option></select></label>
                      <label>Traffic direction<select required defaultValue=""><option value="" disabled>Select traffic flow</option><option>Inbound</option><option>Outbound</option><option>Both directions</option><option>Pedestrian facing</option></select></label>
                      <label>Illumination<select required defaultValue=""><option value="" disabled>Select lighting</option><option>Digital screen</option><option>Front-lit</option><option>Back-lit</option><option>Non-illuminated</option></select></label>
                      <label>Visibility distance (metres)<input required type="number" min="1" placeholder="300" /></label>
                      <label>Height from ground (metres)<input required type="number" min="0" step="0.1" placeholder="8.5" /></label>
                      <label className="full">Facing notes<textarea required placeholder="Describe visibility, obstructions and viewing angle." /></label>
                    </div>
                  </div>
                ))}
                <div className="add-billboard-panel" id="inventory-add-more">
                  <div><strong>{billboardCount} billboard{billboardCount === 1 ? "" : "s"} in this application</strong><small>Add each location separately with its own audience and facing details.</small></div>
                  <div>
                    {billboardCount > 1 && <button type="button" className="remove-billboard-button" onClick={removeLastBillboard}>Remove last</button>}
                    <button type="button" className="add-billboard-button" onClick={addBillboard}>+ Add Another Billboard</button>
                  </div>
                </div>
                <button type="button" className="button button-accent vendor-next-button" onClick={() => openVendorMenuSection(2, "inventory-company-account")}>Continue to company & pricing →</button>
                </>}
                {vendorStep === 2 && <>
                <div className="detail-section pricing-target-section" id="inventory-pricing">
                  <div className="detail-heading"><span>01</span><div><strong>Choose billboard number or group</strong><small>Set a separate price and availability chart for each billboard or group</small></div></div>
                  {isStaticBillboard && <div className="pricing-target-modes" role="group" aria-label="Choose pricing target type">
                    <button type="button" className={pricingTargetMode === "billboard" ? "active" : ""} onClick={() => setPricingTargetMode("billboard")}><strong>Individual billboard</strong><small>Price one billboard number</small></button>
                    <button type="button" className={pricingTargetMode === "group" ? "active" : ""} onClick={() => setPricingTargetMode("group")}><strong>Billboard group</strong><small>One price for several billboards</small></button>
                  </div>}
                  {pricingTargetMode === "billboard" || !isStaticBillboard ? (
                    <div className="individual-price-charts">
                      <div className="pricing-source-note pricing-row-status"><span>Every billboard added on page one appears below as its own row with its ID and separate prices.</span><strong>{billboardCount} price {billboardCount === 1 ? "row" : "rows"}</strong></div>
                      <div className="individual-price-table" role="table" aria-label="Individual billboard price chart">
                        <div className="individual-price-header" role="row">
                          <span>Billboard ID</span><span>Location</span><span>Prices shown according to billboard type</span>
                        </div>
                        {billboardIdentities.map((identity, index) => {
                          const targetKey = `billboard-${index}`;
                          const profile = priceProfiles[targetKey] ?? emptyPriceProfile();
                          const billboardLabel = createBillboardName(vendorShortName, identity) || `Billboard ${index + 1}`;
                          const rowIsStatic = identity.billboardType === "Static Billboard";
                          const rowPriceEntries = rowIsStatic
                            ? [{ label: "15 Days", amount: Number(profile.weekly) || 0 }, { label: "1 Month", amount: Number(profile.monthly) || 0 }]
                            : [{ label: "Hourly", amount: Number(profile.hourly) || 0 }, { label: "Day", amount: Number(profile.daily) || 0 }, { label: "Week", amount: Number(profile.weekly) || 0 }, { label: "Month", amount: Number(profile.monthly) || 0 }];
                          return (
                            <article className={rowIsStatic ? "individual-price-row static-price-row" : "individual-price-row"} key={targetKey} role="row">
                              <div className="billboard-id-cell" role="cell"><small>Billboard ID</small><strong>{billboardLabel}</strong><span>Vendor No. {identity.vendorNumber || index + 1}</span></div>
                              <div className="billboard-location-cell" role="cell"><small>Location</small><strong>{identity.location || identity.emirate || "Location pending"}</strong><span>{identity.billboardType || "Type pending"}</span></div>
                              {!rowIsStatic && <label role="cell"><span>Hourly</span><input aria-label={`${billboardLabel} hourly price`} type="number" min="0" value={profile.hourly} onChange={(event) => updateHourlyPrice(targetKey, event.target.value)} placeholder="150" /></label>}
                              {!rowIsStatic && <label role="cell"><span>Day</span><input aria-label={`${billboardLabel} day price`} readOnly value={profile.daily} placeholder="Auto" /></label>}
                              <label role="cell"><span>{rowIsStatic ? "15 Days Price (AED)" : "Week"}</span><input aria-label={`${billboardLabel} ${rowIsStatic ? "15-day" : "weekly"} price`} readOnly={!rowIsStatic} type={rowIsStatic ? "number" : "text"} min={rowIsStatic ? 0 : undefined} value={profile.weekly} onChange={rowIsStatic ? (event) => updateWeeklyPrice(targetKey, event.target.value) : undefined} placeholder={rowIsStatic ? "25000" : "Auto"} /></label>
                              <label role="cell"><span>{rowIsStatic ? "1 Month Price (AED)" : "Month"}</span><input aria-label={`${billboardLabel} monthly price`} readOnly value={profile.monthly} placeholder="Auto" /></label>
                              <div className="vendor-vat-breakdown" role="cell" aria-label={`${billboardLabel} VAT totals`}>
                                {rowPriceEntries.map((price) => <article key={price.label}><strong>{price.label}</strong><span>Media <b>AED {formatMoneyWithFils(price.amount)}</b></span><span>VAT 5% <b>AED {formatMoneyWithFils(price.amount * 0.05)}</b></span><span>Total <b>AED {formatMoneyWithFils(price.amount * 1.05)}</b></span></article>)}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="pricing-groups-shell">
                      <div className="group-uniqueness-note"><strong>One billboard, one group</strong><span>Every uploaded billboard can belong to only one package. Remove it from its current group before assigning it to another.</span></div>
                      {pricingGroups.map((group) => (
                        <article key={group.id} className={activePricingGroupId === group.id ? "pricing-group-card active" : "pricing-group-card"}>
                          <div className="pricing-group-head">
                            <button type="button" onClick={() => setActivePricingGroupId(group.id)}>{activePricingGroupId === group.id ? "✓ Pricing this group" : "Use this group"}</button>
                            <input aria-label={`Group ${group.id} name`} value={group.name} onChange={(event) => updatePricingGroup(group.id, { name: event.target.value })} placeholder="e.g. Sheikh Zayed Road Group" />
                            {pricingGroups.length > 1 && <button type="button" className="remove-group" onClick={() => { const remaining = pricingGroups.filter((item) => item.id !== group.id); setPricingGroups(remaining); if (activePricingGroupId === group.id) setActivePricingGroupId(remaining[0].id); }}>Remove</button>}
                          </div>
                          <div className="group-billboard-list">
                            {billboardIdentities.map((identity, index) => {
                              const assignedGroup = pricingGroups.find((item) => item.id !== group.id && item.billboardIndexes.includes(index));
                              return (
                                <label key={index} className={assignedGroup ? "assigned-other-group" : ""} title={assignedGroup ? `Already assigned to ${assignedGroup.name}` : ""}><input type="checkbox" disabled={Boolean(assignedGroup)} checked={group.billboardIndexes.includes(index)} onChange={() => toggleGroupBillboard(group.id, index)} /><span><strong>{createBillboardName(vendorShortName, identity) || `Billboard ${index + 1}`}</strong><small>{identity.location || identity.emirate || "Location pending"} · No. {identity.vendorNumber || index + 1}{assignedGroup ? ` · Assigned to ${assignedGroup.name}` : ""}</small></span></label>
                              );
                            })}
                          </div>
                          <button type="button" className="add-billboard-to-group" onClick={() => addBillboardToGroup(group.id)}>+ Add new billboard to {group.name || `Group ${group.id}`}</button>
                          <div className="group-selection-summary"><strong>{group.billboardIndexes.length} billboard{group.billboardIndexes.length === 1 ? "" : "s"} in this package</strong><span>{(group.packagePlans ?? ["fifteen_days", "one_month"]).includes("fifteen_days") ? "15 Days" : ""}{(group.packagePlans ?? ["fifteen_days", "one_month"]).length === 2 ? " + " : ""}{(group.packagePlans ?? ["fifteen_days", "one_month"]).includes("one_month") ? "1 Month" : ""}</span></div>
                        </article>
                      ))}
                      <button type="button" className="add-pricing-group" onClick={() => { const id = Math.max(0, ...pricingGroups.map((group) => group.id)) + 1; setPricingGroups((current) => [...current, { id, name: `Group ${id}`, billboardIndexes: [], packagePlans: ["fifteen_days", "one_month"] }]); setActivePricingGroupId(id); }}>+ Add Another Group Package</button>
                      <div className="price-chart-shell">
                        <div className="price-chart-head"><div><span>GROUP PACKAGE PRICE</span><strong>{selectedPricingLabel}</strong></div><small>{activePricingGroup?.billboardIndexes.length || 0} selected billboards</small></div>
                        <div className="group-package-options" role="group" aria-label="Choose package duration">
                          <button type="button" className={(activePricingGroup?.packagePlans ?? ["fifteen_days", "one_month"]).includes("fifteen_days") ? "selected" : ""} onClick={() => activePricingGroup && toggleGroupPackagePlan(activePricingGroup.id, "fifteen_days")}><span>{(activePricingGroup?.packagePlans ?? ["fifteen_days", "one_month"]).includes("fifteen_days") ? "✓" : "+"}</span><strong>15 Days Package</strong><small>One combined price for all selected billboards</small></button>
                          <button type="button" className={(activePricingGroup?.packagePlans ?? ["fifteen_days", "one_month"]).includes("one_month") ? "selected" : ""} onClick={() => activePricingGroup && toggleGroupPackagePlan(activePricingGroup.id, "one_month")}><span>{(activePricingGroup?.packagePlans ?? ["fifteen_days", "one_month"]).includes("one_month") ? "✓" : "+"}</span><strong>1 Month Package</strong><small>One combined monthly price for this group</small></button>
                        </div>
                        <div className="direct-price-grid static-group-price-grid">
                          {(activePricingGroup?.packagePlans ?? ["fifteen_days", "one_month"]).includes("fifteen_days") && <label>15 Days Package Price (AED)<input type="number" min="0" value={activePriceProfile.weekly} onChange={(event) => updateGroupPackagePrice(pricingTargetKey, "weekly", event.target.value)} placeholder="e.g. 25000" /><small>Total price for every billboard selected in this group</small></label>}
                          {(activePricingGroup?.packagePlans ?? ["fifteen_days", "one_month"]).includes("one_month") && <label>1 Month Package Price (AED)<input type="number" min="0" value={activePriceProfile.monthly} onChange={(event) => updateGroupPackagePrice(pricingTargetKey, "monthly", event.target.value)} placeholder="e.g. 50000" /><small>Total monthly price for every billboard selected in this group</small></label>}
                        </div>
                        <div className="vendor-vat-breakdown group-vat-breakdown" aria-label="Group package VAT totals">
                          {(activePricingGroup?.packagePlans ?? ["fifteen_days", "one_month"]).includes("fifteen_days") && <article><strong>15 Days Package</strong><span>Media <b>AED {formatMoneyWithFils(Number(activePriceProfile.weekly) || 0)}</b></span><span>VAT 5% <b>AED {formatMoneyWithFils((Number(activePriceProfile.weekly) || 0) * 0.05)}</b></span><span>Total <b>AED {formatMoneyWithFils((Number(activePriceProfile.weekly) || 0) * 1.05)}</b></span></article>}
                          {(activePricingGroup?.packagePlans ?? ["fifteen_days", "one_month"]).includes("one_month") && <article><strong>1 Month Package</strong><span>Media <b>AED {formatMoneyWithFils(Number(activePriceProfile.monthly) || 0)}</b></span><span>VAT 5% <b>AED {formatMoneyWithFils((Number(activePriceProfile.monthly) || 0) * 0.05)}</b></span><span>Total <b>AED {formatMoneyWithFils((Number(activePriceProfile.monthly) || 0) * 1.05)}</b></span></article>}
                        </div>
                        <p className="auto-price-note">Select uploaded billboards, name the package, choose 15 days and/or 1 month, then enter an independent total package price.</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="pricing-section">
                  <div className="pricing-title">
                    <div><span>SELLING RULES</span><strong>Choose booking options</strong></div>
                    <small>Applies to {selectedPricingLabel}</small>
                  </div>
                  <div className="selling-plan-section">
                    <div className="schedule-heading"><strong>Ads selling plans</strong><small>{vendorSellingPlans.length} selected</small></div>
                    <div className="selling-plan-grid">
                      {sellingPlanOptions.filter((plan) => !isStaticBillboard || plan.id === "weekly" || plan.id === "monthly").map((plan) => (
                        <button type="button" key={plan.id} className={vendorSellingPlans.includes(plan.id) ? "selected" : ""} onClick={() => toggleVendorSellingPlan(plan.id)}>
                          <span>{vendorSellingPlans.includes(plan.id) ? "✓" : "+"}</span><strong>{isStaticBillboard && plan.id === "weekly" ? "15 Days" : isStaticBillboard && plan.id === "monthly" ? "1 Month" : plan.title}</strong><small>{isStaticBillboard && plan.id === "weekly" ? "Minimum fifteen-day static booking" : isStaticBillboard && plan.id === "monthly" ? "Full one-month static booking" : plan.description}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="base-price-label">{isStaticBillboard ? "Starting 15-day price (AED)" : "Starting hourly price (AED)"}
                    <input required type="number" min="1" value={isStaticBillboard ? baseWeeklyPrice : baseHourlyPrice} onChange={(e) => isStaticBillboard ? setBaseWeeklyPrice(Number(e.target.value)) : setBaseHourlyPrice(Number(e.target.value))} />
                    <small>{isStaticBillboard ? "The one-month price is calculated from this 15-day rate." : "All longer booking prices are calculated from this hourly rate."}</small>
                  </label>
                  <fieldset className="period-fieldset">
                    <legend>Booking period</legend>
                    <div className="period-options">
                      {visiblePeriods.map((period) => {
                        const rule = isStaticBillboard ? staticPeriodRules[period as "week" | "month"] : periodRules[period];
                        return (
                        <label key={period} className={billingPeriod === period ? "selected" : ""}>
                          <input type="radio" name="billing-period" value={period} checked={billingPeriod === period} onChange={() => setBillingPeriod(period)} />
                          <strong>{rule.label}</strong>
                          <small>{rule.note}</small>
                        </label>
                      );})}
                    </div>
                  </fieldset>
                  {isStaticBillboard && <div className="static-pricing-note"><strong>Static billboard pricing</strong><span>Static inventory has only two booking options: minimum 15 days or 1 month. Weekly, peak-day and peak-hour options do not apply.</span></div>}
                  {!isStaticBillboard && <>
                  <div className="schedule-picker">
                    <div className="schedule-heading"><strong>Operating days</strong><small>{selectedDays.length} of 7 days selected</small></div>
                    <div className="day-selector" aria-label="Select operating days">
                      {weekDays.map((day) => <button type="button" key={day} className={selectedDays.includes(day) ? "selected" : ""} onClick={() => toggleOperatingDay(day)}>{day}</button>)}
                    </div>
                  </div>
                  <div className="peak-options">
                    <div className={peakDaysOnly ? "peak-option selected" : "peak-option"}>
                      <div className="peak-option-head">
                        <label>
                          <input type="checkbox" checked={peakDaysOnly} onChange={() => toggleVendorSellingPlan("peak_days")} />
                          <span><strong>Peak days</strong><small>Charge a premium on selected high-demand days</small></span>
                        </label>
                        <label className="percentage-field">Surcharge
                          <span><input type="number" min="0" max="100" value={peakDayPercent} onChange={(e) => setPeakDayPercent(Number(e.target.value))} disabled={!peakDaysOnly} /><b>%</b></span>
                        </label>
                      </div>
                      {peakDaysOnly && <div className="peak-selection-panel">
                        <div className="schedule-heading"><strong>Select peak days</strong><small>{peakDays.length} selected</small></div>
                        <div className="day-selector peak" aria-label="Select peak days">
                          {weekDays.map((day) => <button type="button" key={day} disabled={!selectedDays.includes(day)} className={peakDays.includes(day) ? "selected" : ""} onClick={() => togglePeakDay(day)}>{day}</button>)}
                        </div>
                      </div>}
                    </div>
                    <div className={peakHoursOnly ? "peak-option selected" : "peak-option"}>
                      <div className="peak-option-head">
                        <label>
                          <input type="checkbox" checked={peakHoursOnly} onChange={() => toggleVendorSellingPlan("peak_hours")} />
                          <span><strong>Peak hours</strong><small>Charge a premium during selected hours</small></span>
                        </label>
                        <label className="percentage-field">Surcharge
                          <span><input type="number" min="0" max="100" value={peakHourPercent} onChange={(e) => setPeakHourPercent(Number(e.target.value))} disabled={!peakHoursOnly} /><b>%</b></span>
                        </label>
                      </div>
                      {peakHoursOnly && <div className="peak-selection-panel">
                        <div className="schedule-heading"><strong>Select peak hours</strong><small>{peakHours.length} selected</small></div>
                        <div className="hour-selector" aria-label="Select peak hours">
                          {dayHours.map((hour) => <button type="button" key={hour} className={peakHours.includes(hour) ? "selected" : ""} onClick={() => togglePeakHour(hour)}>{formatHour(hour)}</button>)}
                        </div>
                      </div>}
                    </div>
                  </div>
                  </>}
                  <div className="price-preview">
                    <div><span>Advertiser price</span><small>{selectedPeriodRule.label} rate {peakAdjustment > 0 ? `+ ${peakAdjustment}% peak surcharge` : "· standard schedule"}</small></div>
                    <strong>{currency} {formatMoney(calculatedPrice)}<small> / {billingPeriod}</small></strong>
                  </div>
                  <p className="pricing-advice"><b>How it works:</b> {isStaticBillboard ? "static pricing starts from the minimum 15-day rate. One month is calculated as two 15-day periods, with no weekly, peak-day or peak-hour charges." : "pricing starts from the hourly rate. A full day receives 5% off, a week receives 10% off and a month receives 20% off. Peak surcharges are added afterward for transparent pricing."}</p>
                </div>
                <div className="detail-section availability-section" id="inventory-calendar">
                  <div className="detail-heading"><span>04</span><div><strong>Availability calendar</strong><small>Block unavailable dates or reopen dates for advertisers</small></div></div>
                  <div className="calendar-toolbar">
                    <div className="availability-modes" role="group" aria-label="Calendar editing mode">
                      <button type="button" className={calendarMode === "block" ? "active block" : ""} onClick={() => setCalendarMode("block")}><span>×</span> Block dates</button>
                      <button type="button" className={calendarMode === "free" ? "active free" : ""} onClick={() => setCalendarMode("free")}><span>✓</span> Mark available</button>
                    </div>
                    <div className="calendar-legend"><span className="free" /> Available <span className="blocked" /> Blocked</div>
                  </div>
                  <div className="calendar-shell">
                    <div className="calendar-header">
                      <button type="button" aria-label="Previous month" onClick={() => moveCalendarMonth(-1)}>‹</button>
                      <strong>{calendarLabel}</strong>
                      <button type="button" aria-label="Next month" onClick={() => moveCalendarMonth(1)}>›</button>
                    </div>
                    <div className="calendar-weekdays">{weekDays.map((day) => <span key={day}>{day}</span>)}</div>
                    <div className="calendar-grid">
                      {calendarCells.map((day, index) => {
                        if (day === null) return <span className="calendar-empty" key={`empty-${index}`} />;
                        const date = new Date(calendarYear, calendarMonthIndex, day);
                        const isPast = date < todayStart;
                        const isBlocked = blockedDates.includes(calendarDateKey(day));
                        const isToday = date.getTime() === todayStart.getTime();
                        return <button type="button" key={day} disabled={isPast} className={`${isBlocked ? "blocked" : "available"}${isToday ? " today" : ""}`} onClick={() => applyCalendarAvailability(day)}><span>{day}</span><small>{isPast ? "Past" : isBlocked ? "Blocked" : "Free"}</small></button>;
                      })}
                    </div>
                  </div>
                  <div className="calendar-summary"><div><span className="summary-free">✓</span><strong>{calendarCells.filter((day) => day && new Date(calendarYear, calendarMonthIndex, day) >= todayStart && !blockedDates.includes(calendarDateKey(day))).length}</strong><small>available dates</small></div><div><span className="summary-blocked">×</span><strong>{blockedDates.filter((date) => date.startsWith(`${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, "0")}`)).length}</strong><small>blocked dates</small></div><p>Current mode: <b>{calendarMode === "block" ? "Click dates to block them" : "Click blocked dates to make them available"}</b></p></div>
                </div>
                <div className="detail-section compliance-section" id="inventory-documents">
                  <div className="detail-heading"><span>05</span><div><strong>Compliance documents</strong><small>Upload valid company documents for vendor verification</small></div></div>
                  <div className="document-upload-grid">
                    <label className="document-upload">Trade License <b>Required</b>
                      <input required type="file" accept="application/pdf,image/jpeg,image/png" onChange={(e) => setTradeLicenseName(e.target.files?.[0]?.name ?? "")} />
                      <span><strong>{tradeLicenseName || "Choose trade license"}</strong><small>PDF, JPG or PNG</small></span>
                    </label>
                    <label className="document-upload">VAT Certificate <b>Required</b>
                      <input required type="file" accept="application/pdf,image/jpeg,image/png" onChange={(e) => setVatCertificateName(e.target.files?.[0]?.name ?? "")} />
                      <span><strong>{vatCertificateName || "Choose VAT certificate"}</strong><small>PDF, JPG or PNG</small></span>
                    </label>
                  </div>
                  <p className="document-security-note">Documents are used only to verify your vendor account and company registration details.</p>
                </div>
                <button type="button" className="vendor-back-button" onClick={() => openVendorMenuSection(1, "inventory-location")}>← Back to billboard details</button>
                <div className="vendor-final-actions">
                  <button type="button" className="vendor-add-another-button" onClick={addAnotherBillboardForCompany}>
                    <span>＋</span><strong>Add another billboard</strong><small>Keep this company and its documents</small>
                  </button>
                  <button className="button button-accent submit-button">Submit vendor application →</button>
                </div>
                </>}
              </form>
            ) : campaignStage === "setup" ? (
              <form className={`campaign-form ${campaignValidationAttempted ? "validation-attempted" : ""}`} onSubmit={submitCampaign} noValidate>
                <span className="section-kicker">CAMPAIGN BUILDER</span>
                <h2 id="modal-title">Set up your advertising campaign</h2>
                <div className="test-mode-banner">
                  <strong>{isCampaignTestMode ? "Test mode" : "Required details"}</strong>
                  <span>{isCampaignTestMode ? "Sample details are loaded. Explore every campaign step safely—nothing will be submitted." : "If anything is missing, the form will stay open and show the required field in red."}</span>
                </div>
                <p>Tell us about your campaign first. We will then recommend matching billboard inventory already added by verified billboard owners.</p>
                <div className="campaign-step" id="campaign-company">
                  <div className="detail-heading"><span>01</span><div><strong>{campaignFromDashboard ? "Choose your campaign objective" : "Company and advertiser details"}</strong><small>{campaignFromDashboard ? "Your registered company profile and verification documents will be used automatically" : "Provide your contact details, then tell billboard owners what you want to advertise"}</small></div></div>
                  {campaignFromDashboard && <div className="registered-company-reuse"><span>✓</span><div><strong>Registered company details applied</strong><small>No need to enter company, contact, email, Trade License or VAT details again.</small></div></div>}
                  {!campaignFromDashboard && <>
                  <div className="form-grid">
                    <label>Company name<input required={!isCampaignTestMode} defaultValue={isCampaignTestMode ? "AdVista Demo Company" : undefined} placeholder="Legal company name" /></label>
                    <label>Contact person<input required={!isCampaignTestMode} defaultValue={isCampaignTestMode ? "Demo Advertiser" : undefined} placeholder="Full name" /></label>
                    <label>Contact number<input required={!isCampaignTestMode} defaultValue={isCampaignTestMode ? "+971 50 000 0000" : undefined} type="tel" placeholder="+971 50 000 0000" /></label>
                    <label>WhatsApp number<input required={!isCampaignTestMode} defaultValue={isCampaignTestMode ? "+971 50 000 0000" : undefined} type="tel" placeholder="+971 50 000 0000" /></label>
                    <label>Company email
                      <input required type="email" placeholder="name@company.com" value={campaignEmail} onChange={(event) => setCampaignEmail(event.target.value)} />
                    </label>
                    <label>Confirm company email
                      <input required type="email" aria-invalid={campaignValidationAttempted && campaignEmailVerificationStarted && !campaignEmailMatches} placeholder="Enter company email again" value={campaignEmailConfirm} onChange={(event) => setCampaignEmailConfirm(event.target.value)} />
                      <small className={`email-verification-status ${campaignEmailMatches ? "verified" : campaignEmailConfirm ? "mismatch" : ""}`} aria-live="polite">
                        {campaignEmailMatches ? "✓ Email address confirmed" : campaignEmailConfirm ? "Email addresses do not match" : "Enter the same email again to verify"}
                      </small>
                    </label>
                    <label className="full">Business sector<select required={!isCampaignTestMode} defaultValue={isCampaignTestMode ? "Retail" : ""}><option value="" disabled>Select sector</option><option>Retail</option><option>Real estate</option><option>Automotive</option><option>Hospitality</option><option>Food and beverage</option><option>Technology</option><option>Finance</option><option>Entertainment</option><option>Government</option><option>Other</option></select></label>
                    <label className="full">Brief about product or service being advertised<textarea required={!isCampaignTestMode} defaultValue={isCampaignTestMode ? "Demo campaign for a new UAE retail product launch." : undefined} placeholder="Describe the product, service, special offer or event you want to promote" /></label>
                  </div>
                  <div className={`campaign-document-section ${campaignMissingDocuments ? "campaign-section-error" : ""}`} aria-invalid={campaignMissingDocuments}>
                    <div className="campaign-document-heading">
                      <div><span>COMPANY DOCUMENTS</span><strong>Upload advertiser verification documents</strong></div>
                      <small>PDF, JPG or PNG</small>
                    </div>
                    <div className="document-upload-grid campaign-document-upload-grid">
                      <label className="document-upload">Trade License <b>Required</b>
                        <input required={!isCampaignTestMode} aria-label="Upload trade license" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => setCampaignTradeLicenseName(event.target.files?.[0]?.name ?? "")} />
                        <span><strong>{campaignTradeLicenseName || "Choose trade license"}</strong><small>{campaignTradeLicenseName ? "✓ Document selected" : "Valid company trade license"}</small></span>
                      </label>
                      <label className="document-upload">VAT Certificate <b>Required</b>
                        <input required={!isCampaignTestMode} aria-label="Upload VAT certificate" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => setCampaignVatCertificateName(event.target.files?.[0]?.name ?? "")} />
                        <span><strong>{campaignVatCertificateName || "Choose VAT certificate"}</strong><small>{campaignVatCertificateName ? "✓ Document selected" : "Company VAT registration certificate"}</small></span>
                      </label>
                      <label className="document-upload">Local Authority Permission Letter <b className="optional">If available</b>
                        <input aria-label="Upload local authority advertising permission letter" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => setCampaignPermissionLetterName(event.target.files?.[0]?.name ?? "")} />
                        <span><strong>{campaignPermissionLetterName || "Choose permission letter"}</strong><small>{campaignPermissionLetterName ? "✓ Document selected" : "Local authority approval, if already issued"}</small></span>
                      </label>
                    </div>
                    {campaignMissingDocuments && <p className="campaign-validation-message" role="alert">Please upload the Trade License and VAT Certificate. The local authority permission letter is optional.</p>}
                    <p className="document-security-note">These documents are shared only with AdVista compliance and the selected billboard owner for campaign verification.</p>
                  </div>
                  </>}
                  <fieldset className="campaign-choice-fieldset">
                    <legend>Main campaign objective</legend>
                    <div className="campaign-choice-grid objectives">
                      {campaignObjectives.map((objective) => <button type="button" key={objective} className={campaignObjective === objective ? "selected" : ""} onClick={() => setCampaignObjective(objective)}><span>{campaignObjective === objective ? "✓" : ""}</span>{objective}</button>)}
                    </div>
                  </fieldset>
                </div>
                <div className={`campaign-step ${campaignMissingEmirates || campaignMissingVenueType ? "campaign-section-error" : ""}`} id="campaign-emirates" aria-invalid={campaignMissingEmirates || campaignMissingVenueType}>
                  <div className="detail-heading campaign-emirates-heading">
                    <div className="campaign-format-picker" role="group" aria-label="Choose advertising format">
                      <button type="button" className={campaignMediaFormat === "static" ? "selected" : ""} onClick={() => chooseCampaignMediaFormat("static")}><i>{campaignMediaFormat === "static" ? "✓" : "S"}</i><span><strong>Static</strong><small>Printed billboard advertising</small></span></button>
                      <button type="button" className={campaignMediaFormat === "digital" ? "selected" : ""} onClick={() => chooseCampaignMediaFormat("digital")}><i>{campaignMediaFormat === "digital" ? "✓" : "D"}</i><span><strong>Digital</strong><small>Screen and LED advertising</small></span></button>
                    </div>
                  </div>
                  {campaignMediaFormat && <div className="campaign-placement-picker">
                    <label className="campaign-category-dropdown">
                      <span>{campaignMediaFormat === "static" ? "Static" : "Digital"} billboard category</span>
                      <select aria-label={`Choose ${campaignMediaFormat} billboard category`} value={campaignPlacement} onChange={(event) => chooseCampaignPlacement(event.target.value as "road" | "mall" | "bridge")}>
                        <option value="" disabled>Select category</option>
                        {campaignPlacementOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                      </select>
                      <small>{campaignPlacementOptions.find((option) => option.id === campaignPlacement)?.description ?? "Choose Road, Malls or Bridges"}</small>
                    </label>
                    {campaignTypeIsStatic && <div className="static-duration-panel">
                      <strong>Static billboard advertising period</strong>
                      <small>Static billboards are available only for these two campaign durations.</small>
                      <div className="static-duration-options">
                        <button type="button" className={staticCampaignDuration === "15" ? "selected" : ""} onClick={() => setStaticCampaignDuration("15")}><span>{staticCampaignDuration === "15" ? "✓" : ""}</span><b>15 days</b><small>Half-month advertisement</small></button>
                        <button type="button" className={staticCampaignDuration === "30" ? "selected" : ""} onClick={() => setStaticCampaignDuration("30")}><span>{staticCampaignDuration === "30" ? "✓" : ""}</span><b>30 days</b><small>Full-month advertisement</small></button>
                      </div>
                    </div>}
                  </div>}
                  <button type="button" role="checkbox" aria-checked={allCampaignEmiratesSelected} className={`select-all-emirates ${allCampaignEmiratesSelected ? "selected" : ""}`} onClick={toggleAllCampaignEmirates}>
                    <span>{allCampaignEmiratesSelected ? "✓" : ""}</span>
                    <div><strong>Select all Emirates</strong><small>Run the campaign across all seven UAE markets</small></div>
                  </button>
                  <div className="campaign-choice-grid emirates">
                    {emirates.map((emirate) => (
                      <button type="button" role="checkbox" aria-checked={campaignEmirates.includes(emirate)} key={emirate} className={campaignEmirates.includes(emirate) ? "selected" : ""} onClick={() => toggleCampaignEmirate(emirate)}>
                        <img src={emirateCardImages[emirate]} alt={`${emirate} iconic landmark`} />
                        <span>{campaignEmirates.includes(emirate) ? "✓" : ""}</span>
                        <div><strong>{emirate}</strong><small>{emirateAreas[emirate].length} popular advertising areas</small></div>
                      </button>
                    ))}
                  </div>
                  {campaignEmirates.length > 0 && <div className="selected-emirates-summary"><strong>{campaignEmirates.length} {campaignEmirates.length === 1 ? "Emirate" : "Emirates"} selected</strong><span>{campaignEmirates.join(" · ")}</span></div>}
                  {campaignMissingEmirates && <p className="campaign-validation-message" role="alert">Please select at least one Emirate.</p>}
                  {campaignMissingVenueType && <p className="campaign-validation-message" role="alert">Please choose Static or Digital, then select Road, Malls or Bridges.</p>}
                </div>
                {!campaignTypeIsStatic && <div className={`advertiser-plan-section ${campaignMissingPlan ? "campaign-section-error" : ""}`} id="campaign-options" aria-invalid={campaignMissingPlan}>
                  <div className="detail-heading"><span>04</span><div><strong>Choose your advertising option</strong><small>{preferredBillboardTypes.length > 0 ? "Choose the booking type first; only owners offering that option will appear" : "Select a venue type first"}</small></div></div>
                  <div className="selling-plan-grid advertiser">
                    {advertiserPlanOptions.map((plan) => {
                      const matchingCount = inventoryPlanCounts[plan.id] ?? 0;
                      return (
                        <button type="button" aria-pressed={advertiserPlan === plan.id} key={plan.id} disabled={preferredBillboardTypes.length === 0 || matchingCount === 0} className={advertiserPlan === plan.id ? "selected" : ""} onClick={() => chooseAdvertiserPlan(plan.id)}>
                          <span>{advertiserPlan === plan.id ? "✓" : ""}</span><strong>{campaignPlanTitles[plan.id]}</strong><small>{plan.description}</small><em>{matchingCount} matching owner {matchingCount === 1 ? "location" : "locations"}</em>
                        </button>
                      );
                    })}
                  </div>
                  {advertiserPlan && <div className="plan-match-notice"><span>✓</span><div><strong>{campaignPlanTitles[advertiserPlan]} selected</strong><small>{advertiserPlan === "peak_hours" ? "Each matching billboard below shows the exact peak hours published by its owner." : advertiserPlan === "peak_days" ? "Each matching billboard below shows the exact peak days published by its owner." : "The inventory below is filtered to billboard owners who activated this booking type."}</small></div></div>}
                  {campaignMissingPlan && <p className="campaign-validation-message" role="alert">Please choose Hourly, Peak Hours, Days, Peak Days or Monthly.</p>}
                </div>}
                <div className={`campaign-step ${campaignMissingInventory || campaignMissingOwnerSchedule || campaignMissingDates ? "campaign-section-error" : ""}`} id="campaign-inventory" aria-invalid={campaignMissingInventory || campaignMissingOwnerSchedule || campaignMissingDates}>
                  <div className="detail-heading"><span>{campaignTypeIsStatic ? "04" : "05"}</span><div><strong>Select matching owner inventory</strong><small>{campaignTypeIsStatic ? "Choose an area, compare static inventory and review open campaign dates" : advertiserPlan ? `Showing only ${campaignPlanTitles[advertiserPlan]} inventory configured by owners` : "Choose an advertising option above before viewing inventory"}</small></div></div>
                  <div className="area-search-row">
                    <label>Area / location<select value={campaignArea} disabled={campaignEmirates.length === 0 || preferredBillboardTypes.length === 0 || (!campaignTypeIsStatic && !advertiserPlan)} onChange={(event) => { setCampaignArea(event.target.value); setCampaignLocationId(""); setCampaignLocationIds([]); setSelected(null); setAdvertiserDays([]); setAdvertiserHours([]); setShowAreaBillboards(true); resetCampaignCreative(); }}><option value="">All areas in {campaignEmirates.length ? campaignMarketLabel : "selected Emirates"}</option>{campaignAreaOptions.map((area) => <option key={area} value={area}>{area}</option>)}</select></label>
                    <button type="button" disabled={campaignEmirates.length === 0 || preferredBillboardTypes.length === 0 || (!campaignTypeIsStatic && !advertiserPlan)} className="button button-dark" onClick={() => setShowAreaBillboards(true)}>Show owner-matched inventory <span>{areaBillboards.length}</span></button>
                  </div>
                  {showAreaBillboards && <>
                    <div className="location-results-head"><strong>{campaignArea || campaignMarketLabel} owner-matched inventory</strong><small><i /> {campaignTypeIsStatic ? "Static availability" : `${advertiserPlan ? campaignPlanTitles[advertiserPlan] : ""} enabled`} · {areaBillboards.length} locations · {campaignLocations.length} selected</small></div>
                    {areaBillboards.length > 0 ? <div className="campaign-location-grid">
                      {areaBillboards.map((listing) => {
                        const ownerSchedule = getOwnerInventorySchedule(listing);
                        const listingPlan = campaignTypeIsStatic ? "weekly" : advertiserPlan as SellingPlan;
                        const planPrice = getCampaignSelectionPrice(listing);
                        const isSelected = campaignLocationIds.includes(String(listing.id));
                        return (
                          <button type="button" role="checkbox" aria-checked={isSelected} key={listing.id} className={isSelected ? "selected" : ""} onClick={() => chooseCampaignLocation(listing)}>
                            <span>{isSelected ? "✓" : listing.vendor.charAt(0)}</span>
                            <figure className="campaign-inventory-photo" role="button" tabIndex={0} aria-label={`Magnify ${listing.title} picture`} onClick={(event) => { event.stopPropagation(); setMagnifiedListing(listing); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); setMagnifiedListing(listing); } }}>
                              <img src={getCampaignImage(listing.category)} alt={`${listing.title} advertising location`} /><i aria-hidden="true">⌕</i>
                            </figure>
                            <div>
                              <strong>{listing.title}</strong><small>{listing.location}</small><em>{listing.category} · {listing.vendor}</em><i><b /> Owner offers {campaignTypeIsStatic ? "static booking" : campaignPlanTitles[listingPlan]}</i>
                              {!campaignTypeIsStatic && (listingPlan === "peak_hours" || listingPlan === "peak_days") && <div className="owner-slot-preview"><span>{listingPlan === "peak_hours" ? "Available peak hours" : "Available peak days"}</span><b>{listingPlan === "peak_hours" ? ownerSchedule.peakHours.map(formatHour).join(" · ") : ownerSchedule.peakDays.join(" · ")}</b></div>}
                            </div>
                            <b>{currency} {formatMoney(planPrice)}<small>/{campaignTypeIsStatic ? staticCampaignDuration === "15" ? "15 days" : "30 days" : getPlanUnit(listingPlan)}</small></b>
                          </button>
                        );
                      })}
                    </div> : <div className="empty-owner-inventory"><strong>No matching owner inventory</strong><span>Try another area or advertising option. Only inventory enabled by billboard owners is shown here.</span></div>}
                  </>}
                  {campaignLocations.length > 0 && <div className="campaign-price-summary campaign-price-summary-with-schedule" aria-live="polite">
                    <div className="campaign-price-summary-head">
                      <div><span>SELECTED BILLBOARDS</span><strong>{campaignLocations.length} {campaignLocations.length === 1 ? "billboard" : "billboards"}</strong><small>Click any selected billboard again to remove it.</small></div>
                      <div><span>{campaignNeedsHours && campaignHoursPerDay === 0 ? "COMBINED HOURLY RATE" : campaignNeedsDays && (advertiserDays.length === 0 || effectiveCampaignBookingDays === 0) ? "COMBINED DAILY RATE" : "ESTIMATED CAMPAIGN TOTAL"}</span><strong>{currency} {formatMoney(campaignSelectionTotal)}</strong><small>{campaignNeedsHours ? campaignHoursPerDay > 0 ? `${campaignHoursPerDay} ${campaignHoursPerDay === 1 ? "hour" : "hours"} per day × ${campaignBookingDays} ${campaignBookingDays === 1 ? "day" : "days"}` : "Select the booking hours below" : campaignNeedsDays ? advertiserDays.length > 0 && effectiveCampaignBookingDays > 0 ? `${effectiveCampaignBookingDays} booking ${effectiveCampaignBookingDays === 1 ? "day" : "days"} · ${advertiserDays.join(" · ")}` : "Select valid dates and available days below" : `for ${campaignSelectionUnit}`}</small></div>
                    </div>
                    <div className="campaign-price-lines">
                      {campaignLocations.map((listing, index) => <div key={listing.id}><span>{index + 1}</span><div><strong>{listing.title}</strong><small>{listing.location} · {listing.vendor}</small></div><b>{currency} {formatMoney(getCampaignSelectionPrice(listing))}</b><button type="button" aria-label={`Remove ${listing.title}`} onClick={() => chooseCampaignLocation(listing)}>×</button></div>)}
                    </div>
                    {campaignNeedsHours && <div className="hourly-booking-calculator">
                      <div className="hourly-booking-heading">
                        <div><span>HOURLY BOOKING CALCULATOR</span><strong>Select the exact hours required each day</strong><small>Only hours available across all selected billboards are shown.</small></div>
                        <label>Number of booking days<input required type="number" min="1" max="365" value={campaignBookingDays} onChange={(event) => setCampaignBookingDays(Math.min(365, Math.max(1, Number(event.target.value) || 1)))} /></label>
                      </div>
                      <div className="hour-selector hourly-price-hours" aria-label="Select booking hours per day">
                        {ownerApprovedHours.map((hour) => <button type="button" aria-pressed={advertiserHours.includes(hour)} key={hour} className={advertiserHours.includes(hour) ? "selected" : ""} onClick={() => toggleAdvertiserHour(hour)}>{formatHour(hour)}</button>)}
                      </div>
                      <div className="hourly-calculation-grid">
                        <div><span>Combined hourly rate</span><strong>{currency} {formatMoney(campaignBaseRateTotal)}</strong></div>
                        <div><span>Hours per day</span><strong>{campaignHoursPerDay}</strong></div>
                        <div><span>Booking days</span><strong>{campaignBookingDays}</strong></div>
                        <div><span>Total booked hours</span><strong>{campaignTotalBookedHours}</strong></div>
                      </div>
                      <div className="hourly-formula"><span>Price calculation</span><strong>{currency} {formatMoney(campaignBaseRateTotal)} × {campaignHoursPerDay} {campaignHoursPerDay === 1 ? "hour" : "hours"} × {campaignBookingDays} {campaignBookingDays === 1 ? "day" : "days"} = {currency} {formatMoney(campaignHoursPerDay > 0 ? campaignSelectionTotal : 0)}</strong></div>
                    </div>}
                    {campaignNeedsDays && <div className="hourly-booking-calculator daily-booking-calculator">
                      <div className="hourly-booking-heading daily-booking-heading">
                        <div><span>DAILY BOOKING CALCULATOR</span><strong>Select the available days and booking quantity</strong><small>Only days available across all selected billboards are shown.</small></div>
                        <div className="daily-booking-dates">
                          <label>Starting date<input required type="text" inputMode="numeric" maxLength={10} pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}" placeholder="DD/MM/YYYY" title="Enter the date as day/month/year" value={campaignStartDate} aria-invalid={campaignValidationAttempted && !isValidDmyDate(campaignStartDate)} onChange={(event) => setCampaignStartDate(formatDmyDateInput(event.target.value))} /><small className="date-format-hint">Day / Month / Year · You can change this date</small></label>
                          <label>Ending date<input required type="text" inputMode="numeric" maxLength={10} pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}" placeholder="DD/MM/YYYY" title="Enter the date as day/month/year" value={campaignEndDate} aria-invalid={campaignValidationAttempted && (!isValidDmyDate(campaignEndDate) || campaignDateRangeInvalid)} onChange={(event) => setCampaignEndDate(formatDmyDateInput(event.target.value))} /><small className="date-format-hint">Day / Month / Year</small></label>
                        </div>
                        <label>{calculatedDailyBookingDays !== null ? "Calculated booking days" : "Number of booking days"}<input required type="number" min="1" max="365" readOnly={calculatedDailyBookingDays !== null} value={effectiveCampaignBookingDays} onChange={(event) => setCampaignBookingDays(Math.min(365, Math.max(1, Number(event.target.value) || 1)))} /></label>
                      </div>
                      <div className={advertiserPlan === "peak_days" ? "day-selector peak daily-price-days" : "day-selector daily-price-days"} aria-label="Select available booking days">
                        {ownerApprovedDays.map((day) => <button type="button" aria-pressed={advertiserDays.includes(day)} key={day} className={advertiserDays.includes(day) ? "selected" : ""} onClick={() => toggleAdvertiserDay(day)}>{day}</button>)}
                      </div>
                      <div className="hourly-calculation-grid daily-calculation-grid">
                        <div><span>Combined daily rate</span><strong>{currency} {formatMoney(campaignBaseRateTotal)}</strong></div>
                        <div><span>Available days selected</span><strong>{advertiserDays.length}</strong></div>
                        <div><span>Booking days in date range</span><strong>{effectiveCampaignBookingDays}</strong></div>
                        <div><span>Billboards selected</span><strong>{campaignLocations.length}</strong></div>
                      </div>
                      <div className="hourly-formula"><span>Price calculation</span><strong>{currency} {formatMoney(campaignBaseRateTotal)} daily rate × {effectiveCampaignBookingDays} booking {effectiveCampaignBookingDays === 1 ? "day" : "days"} = {currency} {formatMoney(advertiserDays.length > 0 && effectiveCampaignBookingDays > 0 ? campaignSelectionTotal : 0)}</strong></div>
                    </div>}
                    <div className="campaign-payment-summary">
                      <div className="campaign-price-total"><span>{campaignNeedsHours ? campaignHoursPerDay > 0 ? "Estimated total media price" : "Select at least one hour to calculate the total" : campaignNeedsDays ? advertiserDays.length > 0 && effectiveCampaignBookingDays > 0 ? "Estimated total media price" : "Select valid dates and at least one available day" : "Combined estimated media price"}</span><strong>{(campaignNeedsHours && campaignHoursPerDay === 0) || (campaignNeedsDays && (advertiserDays.length === 0 || effectiveCampaignBookingDays === 0)) ? `${currency} —` : `${currency} ${formatMoney(campaignSelectionTotal)}`} {!campaignNeedsHours && !campaignNeedsDays && <small>/ {campaignSelectionUnit}</small>}</strong></div>
                      <div className="campaign-price-total campaign-vat-total"><span>{country.vatLabel}</span><strong>{(campaignNeedsHours && campaignHoursPerDay === 0) || (campaignNeedsDays && (advertiserDays.length === 0 || effectiveCampaignBookingDays === 0)) ? `${currency} —` : `${currency} ${formatMoneyWithFils(campaignVatAmount)}`}</strong></div>
                      <div className="campaign-price-total campaign-payable-total"><span>Total payable amount</span><strong>{(campaignNeedsHours && campaignHoursPerDay === 0) || (campaignNeedsDays && (advertiserDays.length === 0 || effectiveCampaignBookingDays === 0)) ? `${currency} —` : `${currency} ${formatMoneyWithFils(campaignPayableTotal)}`}</strong></div>
                    </div>
                  </div>}
                  {campaignMissingInventory && <p className="campaign-validation-message" role="alert">Please show the matching inventory and select at least one billboard location.</p>}
                  {campaignNeedsDays && campaignMissingDates && <p className="campaign-validation-message" role="alert">{campaignDateRangeInvalid ? "The ending date must be after the starting date." : "Please enter valid starting and ending dates in DD/MM/YYYY format."}</p>}
                  <div className={`campaign-schedule-inline ${campaignLocations.length > 0 ? "attached" : ""} ${campaignMissingOwnerSchedule || (!campaignNeedsDays && campaignMissingDates) ? "campaign-schedule-inline-error" : ""}`} aria-invalid={campaignMissingOwnerSchedule || (!campaignNeedsDays && campaignMissingDates)}>
                  <div className="detail-heading"><span>{campaignTypeIsStatic ? "05" : "06"}</span><div><strong>Campaign schedule</strong><small>{campaignTypeIsStatic ? "Confirm the campaign start date and advertising duration" : campaignLocations.length ? "Choose only schedule slots available across all selected billboards" : "Select matching owner inventory before choosing hours or days"}</small></div></div>
                  {!campaignNeedsDays && <div className="form-grid">
                    <label>Start date<input required type="text" inputMode="numeric" maxLength={10} pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}" placeholder="DD/MM/YYYY" title="Enter the date as day/month/year" value={campaignStartDate} aria-invalid={campaignValidationAttempted && !isValidDmyDate(campaignStartDate)} onChange={(event) => setCampaignStartDate(formatDmyDateInput(event.target.value))} /><small className="date-format-hint">Day / Month / Year · You can change this date</small></label>
                    {campaignTypeIsStatic && <label>Advertising duration<input readOnly value={`${staticCampaignDuration} days`} /></label>}
                    {!campaignTypeIsStatic && advertiserPlan === "monthly" && <label>Number of months<select required defaultValue="1"><option value="1">1 month</option><option value="2">2 months</option><option value="3">3 months</option><option value="6">6 months</option><option value="12">12 months</option></select></label>}
                  </div>}
                  {!campaignTypeIsStatic && (!advertiserPlan || campaignLocations.length === 0) && <div className="owner-schedule-lock"><span>🔒</span><div><strong>Owner schedule unlocks after inventory selection</strong><small>Choose a booking type and at least one matching billboard above. Generic hours and days are no longer displayed.</small></div></div>}
                  {!campaignTypeIsStatic && campaignLocations.length > 0 && (advertiserPlan === "hourly_base" || advertiserPlan === "peak_hours") && <div className="campaign-owner-schedule hourly-booking-recap">
                    <div><span>HOURLY BOOKING SUMMARY</span><strong>{campaignHoursPerDay} {campaignHoursPerDay === 1 ? "hour" : "hours"} per day for {campaignBookingDays} {campaignBookingDays === 1 ? "day" : "days"}</strong><small>{advertiserHours.length > 0 ? [...advertiserHours].sort((a, b) => a - b).map(formatHour).join(" · ") : "Select the required hours in the price calculator above."}</small></div>
                    <b>{advertiserHours.length > 0 ? `${currency} ${formatMoney(campaignSelectionTotal)}` : "Not calculated"}</b>
                  </div>}
                  {!campaignTypeIsStatic && campaignLocations.length > 0 && (advertiserPlan === "selected_days" || advertiserPlan === "peak_days") && <div className="campaign-owner-schedule hourly-booking-recap daily-booking-recap">
                    <div><span>DAILY BOOKING SUMMARY</span><strong>{effectiveCampaignBookingDays} booking {effectiveCampaignBookingDays === 1 ? "day" : "days"} across {campaignLocations.length} {campaignLocations.length === 1 ? "billboard" : "billboards"}</strong><small>{campaignStartDate && campaignEndDate ? `${campaignStartDate} to ${campaignEndDate} · ${advertiserDays.join(" · ") || "select available days"}` : "Select the starting date, ending date and available days in the calculator above."}</small></div>
                    <b>{advertiserDays.length > 0 && effectiveCampaignBookingDays > 0 ? `${currency} ${formatMoney(campaignSelectionTotal)}` : "Not calculated"}</b>
                  </div>}
                  {campaignMissingOwnerSchedule && <p className="campaign-validation-message" role="alert">{campaignNeedsHours ? "Please select at least one owner-approved hour." : campaignDayRangeHasNoBookingDays ? "The selected date range does not contain any of the chosen available days." : "Please select at least one owner-approved day."}</p>}
                  {!campaignNeedsDays && campaignMissingDates && <p className="campaign-validation-message" role="alert">Please enter a valid start date in DD/MM/YYYY format.</p>}
                  </div>
                </div>
                <div className="campaign-plan-summary"><span>Selected plan</span><strong>{campaignTypeIsStatic ? `${staticCampaignDuration}-day static billboard advertisement` : advertiserPlan ? campaignPlanTitles[advertiserPlan] : "Choose a booking type"}</strong><small>{campaignLocations.length > 0 ? campaignNeedsHours ? advertiserHours.length > 0 ? `${campaignLocations.length} ${campaignLocations.length === 1 ? "billboard" : "billboards"} · ${campaignHoursPerDay} hours/day × ${campaignBookingDays} days · estimated total AED ${formatMoney(campaignSelectionTotal)}` : "Select the required hours per day to calculate the campaign price." : campaignNeedsDays ? advertiserDays.length > 0 && effectiveCampaignBookingDays > 0 ? `${campaignStartDate} to ${campaignEndDate} · ${effectiveCampaignBookingDays} matching booking days · estimated total AED ${formatMoney(campaignSelectionTotal)}` : "Select the starting date, ending date and available days to calculate the campaign price." : `${campaignLocations.length} ${campaignLocations.length === 1 ? "billboard" : "billboards"} selected · combined estimated price AED ${formatMoney(campaignSelectionTotal)} / ${campaignSelectionUnit}` : campaignTypeIsStatic ? "Select one or more static billboards to calculate the combined price." : !advertiserPlan ? "Select Hourly, Peak Hours, Days, Peak Days or Monthly before choosing inventory." : `Only owner inventory offering ${campaignPlanTitles[advertiserPlan]} will be shown.`}</small></div>
                <button className="button button-accent submit-button">{isCampaignTestMode ? "Continue test to campaign name →" : "Continue to campaign name →"}</button>
              </form>
            ) : campaignStage === "name" ? (
              <form className="campaign-name-page" onSubmit={continueToCreative}>
                <span className="section-kicker">CAMPAIGN STEP 2 OF 3</span>
                <h2 id="modal-title">Create your campaign name</h2>
                <p>Your campaign reference automatically identifies the country, billboard type and selected Emirates. Add a short client-friendly campaign name to complete it.</p>

                <div className="campaign-code-breakdown" aria-label="Campaign reference code breakdown">
                  <article><span>Country</span><strong>AE</strong><small>United Arab Emirates</small></article>
                  <article><span>Billboard type</span><strong>{campaignTypeCode}</strong><small>{[...new Set(campaignSelectedCategories)].join(" · ")}</small></article>
                  <article><span>Emirates</span><strong>{campaignEmiratesCode}</strong><small>{campaignEmirates.join(" · ")}</small></article>
                  <article><span>Inventory</span><strong>{campaignLocations.length}</strong><small>Selected billboard{campaignLocations.length === 1 ? "" : "s"}</small></article>
                </div>

                <section className="campaign-name-inventory">
                  <div className="campaign-name-inventory-head">
                    <div><span>SELECTED BILLBOARDS</span><strong>Included in this campaign</strong></div>
                    <b>{currency} {formatMoney(campaignSelectionTotal)}</b>
                  </div>
                  <div className="campaign-name-inventory-list">
                    {campaignLocations.map((listing, index) => (
                      <div key={listing.id}>
                        <span>{index + 1}</span>
                        <div><strong>{listing.title}</strong><small>{listing.location} · {listing.category}</small></div>
                        <b>{currency} {formatMoney(getCampaignSelectionPrice(listing))}</b>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="campaign-name-builder">
                  <label>
                    <span>Client campaign name</span>
                    <div className="campaign-name-input">
                      <strong>{campaignNamePrefix}-</strong>
                      <input required autoFocus maxLength={50} pattern=".*[A-Za-z0-9].*" placeholder="e.g. Summer Launch" value={campaignCustomName} onChange={(event) => setCampaignCustomName(event.target.value)} />
                    </div>
                    <small>Use a short name that your client and team will recognize.</small>
                  </label>
                  <div className="campaign-name-preview" aria-live="polite">
                    <span>FINAL CAMPAIGN REFERENCE</span>
                    <strong>{finalCampaignName}{campaignCustomNameCode ? "" : "-YOUR-CAMPAIGN-NAME"}</strong>
                    <small>AE · {campaignTypeCode} · {campaignEmiratesCode} · client campaign name</small>
                  </div>
                </section>

                <div className="campaign-name-actions">
                  <button type="button" className="button button-outline" onClick={() => setCampaignStage("setup")}>← Back to campaign setup</button>
                  <button className="button button-accent">Continue to ad groups →</button>
                </div>
              </form>
            ) : campaignStage === "adgroups" ? (
              <form className="campaign-adgroups-page" onSubmit={continueToCampaignAds}>
                <span className="section-kicker">CAMPAIGN STEP 3 OF 6</span>
                <h2 id="modal-title">Create separate ad groups</h2>
                <p>Each billboard format gets its own ad group inside <strong>{finalCampaignName}</strong>. This keeps Digital, Static, Kiosk, Mall, Bridge and Building advertising separate while they remain under one campaign.</p>
                <div className="campaign-hierarchy-summary" aria-label="Campaign hierarchy">
                  <div><span>CAMPAIGN</span><strong>{finalCampaignName}</strong><small>One campaign</small></div>
                  <b>→</b>
                  <div><span>AD GROUPS</span><strong>{campaignAdGroups.length}</strong><small>Separated by billboard format</small></div>
                  <b>→</b>
                  <div><span>ADS</span><strong>{campaignAdGroups.length}</strong><small>At least one different ad per group</small></div>
                </div>
                <section className="campaign-adgroup-list">
                  <div className="campaign-adgroup-list-head"><div><span>AD GROUPS</span><strong>Format-specific campaign structure</strong></div><small>{campaignLocations.length} selected billboard{campaignLocations.length === 1 ? "" : "s"}</small></div>
                  {campaignAdGroups.map((group, index) => (
                    <article key={group.id}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div><strong>{group.name}</strong><small>{group.category} · {group.listings.length} selected location{group.listings.length === 1 ? "" : "s"}</small><em>{group.listings.map((listing) => listing.title).join(" · ")}</em></div>
                      <b>{group.category.replace(/ Billboard$/i, "")}</b>
                    </article>
                  ))}
                </section>
                <div className="campaign-adgroup-note"><span>✓</span><div><strong>Different creative for every format</strong><small>Digital ads can use video or images, Static ads use print artwork, and Kiosk or Mall groups can use their own portrait creative.</small></div></div>
                <div className="campaign-name-actions">
                  <button type="button" className="button button-outline" onClick={() => setCampaignStage("name")}>← Back to campaign name</button>
                  <button className="button button-accent">Continue to ads →</button>
                </div>
              </form>
            ) : (
              <form className="campaign-creative-page" onSubmit={finalizeCampaign}>
                <span className="section-kicker">CAMPAIGN STEP 4 OF 6 · ADS</span>
                <h2 id="modal-title">Create ads for each ad group</h2>
                <p>Select an ad group and upload its own high-quality artwork or video. Digital, Static, Kiosk, Mall and other formats remain separate under <strong>{finalCampaignName}</strong>.</p>

                <div className="campaign-ad-tabs" aria-label="Campaign ad groups">
                  {campaignAdGroups.map((group, index) => <button type="button" key={group.id} className={group.listings.some((listing) => String(listing.id) === creativePreviewListingId) ? "active" : ""} onClick={() => setCreativePreviewListingId(String(group.listings[0]?.id ?? ""))}><span>{index + 1}</span><strong>{group.name}</strong><small>{group.listings.length} billboard{group.listings.length === 1 ? "" : "s"}</small></button>)}
                </div>

                <section className="creative-requirements">
                  <div className="creative-section-heading">
                    <div><span>REQUIRED OUTPUTS</span><strong>{campaignCreativeIsStatic ? "Static billboard artwork specifications" : "Digital image and video specifications"}</strong></div>
                    <b>{campaignCreativeRequirements.length} billboard size{campaignCreativeRequirements.length === 1 ? "" : "s"}</b>
                  </div>
                  <div className="creative-format-guide">
                    <article>
                      <span>{campaignCreativeIsStatic ? "ACCEPTED ARTWORK" : "IMAGE FORMAT"}</span>
                      <strong>{campaignCreativeIsStatic ? "PDF/X-4 · TIFF · JPG · PNG" : "JPG · PNG · WebP"}</strong>
                      <small>{campaignCreativeIsStatic ? "CMYK · 300 DPI at 1:10 scale · 5 mm bleed" : "RGB · 72–150 PPI · exact screen aspect ratio"}</small>
                    </article>
                    <article>
                      <span>{campaignCreativeIsStatic ? "MAXIMUM FILE SIZE" : "VIDEO FORMAT"}</span>
                      <strong>{campaignCreativeIsStatic ? "50 MB" : "MP4 H.264 · WebM · MOV"}</strong>
                      <small>{campaignCreativeIsStatic ? "Keep text and logos in vector format where possible" : "5–15 seconds recommended · no audio · maximum 100 MB"}</small>
                    </article>
                    <article>
                      <span>PRODUCTION NOTE</span>
                      <strong>Owner approval required</strong>
                      <small>Final LED pixel map, print profile and safe area are confirmed by each billboard owner.</small>
                    </article>
                  </div>
                  <div className="creative-size-list">
                    {campaignCreativeRequirements.map((requirement) => (
                      <button type="button" key={requirement.listingId} className={String(requirement.listingId) === String(selectedCreativeRequirement?.listingId) ? "selected" : ""} onClick={() => setCreativePreviewListingId(String(requirement.listingId))}>
                        <span>{String(requirement.listingId) === String(selectedCreativeRequirement?.listingId) ? "✓" : "◻"}</span>
                        <div><strong>{requirement.title}</strong><small>{requirement.physicalSize} · {requirement.format}</small></div>
                        <b>{campaignCreativeIsStatic ? requirement.staticArtworkSize : `${requirement.width} × ${requirement.height} px`}<small>{campaignCreativeIsStatic ? "Print artwork" : "Recommended master canvas"}</small></b>
                      </button>
                    ))}
                  </div>
                </section>

                <div className="creative-workspace">
                  <section className="creative-upload-panel">
                    <div className="creative-panel-heading"><span>01</span><div><strong>Upload master creative</strong><small>{campaignCreativeIsStatic ? "Static artwork only" : "Image or video creative"}</small></div></div>
                    <label className={`creative-dropzone ${campaignCreativeError ? "error" : ""}`} htmlFor="campaign-creative-file">
                      <input id="campaign-creative-file" className="creative-upload-input" type="file" accept={campaignCreativeAccept} onChange={(event) => handleCampaignCreativeFile(event.target.files?.[0] ?? null)} />
                      <span>{campaignCreativeFile ? "✓" : "↑"}</span>
                      <strong>{campaignCreativeFile ? campaignCreativeFile.name : "Choose artwork or drop a file here"}</strong>
                      <small>{campaignCreativeFile ? `${formatCreativeFileSize(campaignCreativeFile.size)} · Click to replace` : campaignCreativeIsStatic ? "JPG, PNG, TIFF or PDF · up to 50 MB" : "JPG, PNG, WebP, MP4, WebM or MOV · up to 100 MB"}</small>
                    </label>
                    {campaignCreativeError && <p className="creative-file-error" role="alert">{campaignCreativeError}</p>}

                    {campaignCreativeFile && <div className={`creative-quality-status ${!campaignCreativeIsStatic && campaignCreativeMetadata && (!campaignCreativeRatioMatches || !campaignCreativeResolutionReady) ? "warning" : "ready"}`}>
                      <span>{!campaignCreativeIsStatic && campaignCreativeMetadata && (!campaignCreativeRatioMatches || !campaignCreativeResolutionReady) ? "!" : "✓"}</span>
                      <div>
                        <strong>{campaignCreativeIsStatic
                          ? campaignCreativeKind === "document" ? "Print-ready file attached" : "Artwork received for production review"
                          : !campaignCreativeMetadata ? "Creative attached" : campaignCreativeRatioMatches && campaignCreativeResolutionReady ? "Resolution and aspect ratio ready" : "Creative may need resizing or cropping"}</strong>
                        <small>{campaignCreativeMetadata
                          ? `${campaignCreativeMetadata.width} × ${campaignCreativeMetadata.height} px${campaignCreativeMetadata.duration ? ` · ${campaignCreativeMetadata.duration.toFixed(1)} sec` : ""}${!campaignCreativeIsStatic && selectedCreativeRequirement ? ` · target ${selectedCreativeRequirement.width} × ${selectedCreativeRequirement.height} px` : ""}`
                          : "PDF and TIFF production files will receive a final preflight check from the billboard owner."}</small>
                      </div>
                    </div>}

                    <div className="creative-ai-tools">
                      <div><span>NEED HELP CREATING THE AD?</span><strong>Recommended AI creative tools</strong></div>
                      <a href="https://www.adobe.com/products/firefly.html" target="_blank" rel="noreferrer"><b>Adobe Firefly</b><small>Generate and edit images or video</small><span>↗</span></a>
                      <a href="https://www.canva.com/canva-ai/" target="_blank" rel="noreferrer"><b>Canva AI</b><small>Create layouts and resize artwork</small><span>↗</span></a>
                      {!campaignCreativeIsStatic && <a href="https://runwayml.com/product/ai-video-generator" target="_blank" rel="noreferrer"><b>Runway</b><small>Generate and edit advertising video</small><span>↗</span></a>}
                      <p>Always check logos, spelling, product claims and image rights before submission.</p>
                    </div>
                  </section>

                  <section className="creative-preview-panel">
                    <div className="creative-panel-heading"><span>02</span><div><strong>Billboard preview</strong><small>See how the uploaded creative fits the selected display</small></div></div>
                    {campaignCreativeRequirements.length > 1 && <label className="creative-preview-select">Preview on<select value={String(selectedCreativeRequirement?.listingId ?? "")} onChange={(event) => setCreativePreviewListingId(event.target.value)}>{campaignCreativeRequirements.map((requirement) => <option key={requirement.listingId} value={requirement.listingId}>{requirement.title}</option>)}</select></label>}
                    <div className="creative-preview-stage">
                      <div className="creative-preview-screen" style={{ aspectRatio: `${selectedCreativeRequirement?.width ?? 16} / ${selectedCreativeRequirement?.height ?? 9}`, width: selectedCreativeRatio < 1 ? "220px" : "100%" }}>
                        {campaignCreativeUrl && campaignCreativeKind === "image" && <img src={campaignCreativeUrl} alt={`Uploaded advertising preview on ${selectedCreativeRequirement?.title ?? "selected billboard"}`} />}
                        {campaignCreativeUrl && campaignCreativeKind === "video" && <video src={campaignCreativeUrl} controls muted loop playsInline />}
                        {campaignCreativeFile && campaignCreativeKind === "document" && <div className="creative-document-preview"><span>PDF</span><strong>{campaignCreativeFile.name}</strong><small>Print-ready file attached · visual preview is available for JPG or PNG artwork</small></div>}
                        {!campaignCreativeFile && <div className="creative-empty-preview"><span>YOUR AD</span><strong>{selectedCreativeRequirement ? `${selectedCreativeRequirement.width} × ${selectedCreativeRequirement.height}` : "Upload creative"}</strong><small>The uploaded image or video will appear here.</small></div>}
                      </div>
                    </div>
                    <div className="creative-preview-caption">
                      <div><span>PREVIEWING</span><strong>{selectedCreativeRequirement?.title}</strong><small>{selectedCreativeRequirement?.physicalSize} · {campaignCreativeIsStatic ? selectedCreativeRequirement?.staticArtworkSize : `${selectedCreativeRequirement?.width} × ${selectedCreativeRequirement?.height} px`}</small></div>
                      <b>{campaignCreativeIsStatic ? "STATIC" : "DIGITAL"}</b>
                    </div>
                  </section>
                </div>

                <div className="campaign-name-actions">
                  <button type="button" className="button button-outline" onClick={() => setCampaignStage("adgroups")}>← Back to ad groups</button>
                  <button className="button button-accent">{isCampaignTestMode ? "Complete test campaign →" : "Create campaign →"}</button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {magnifiedListing && <div className="inventory-picture-backdrop" role="presentation" onMouseDown={(event) => { event.stopPropagation(); if (event.target === event.currentTarget) setMagnifiedListing(null); }}>
        <section className="inventory-picture-preview" role="dialog" aria-modal="true" aria-label={`${magnifiedListing.title} picture preview`}>
          <button type="button" className="inventory-picture-close" aria-label="Close billboard picture" onClick={() => setMagnifiedListing(null)}>×</button>
          <div className="inventory-picture-stage"><img src={getCampaignImage(magnifiedListing.category)} alt={`${magnifiedListing.title} enlarged advertising location`} /><span>MAGNIFIED VIEW</span></div>
          <div className="inventory-picture-details"><span>{magnifiedListing.category}</span><h3>{magnifiedListing.title}</h3><p>{magnifiedListing.location}</p><div><strong>{magnifiedListing.vendor}</strong><small>{magnifiedListing.format} · {magnifiedListing.traffic} traffic</small></div><button type="button" onClick={() => { chooseCampaignLocation(magnifiedListing); setMagnifiedListing(null); }}>{campaignLocationIds.includes(String(magnifiedListing.id)) ? "Remove from campaign" : "Select this billboard"}</button></div>
        </section>
      </div>}

      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </main>
  );
}
