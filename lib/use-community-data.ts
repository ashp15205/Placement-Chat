import { useEffect, useState, useMemo } from "react";
import { createClient } from "./supabase/client";

type CommunityData = {
  companies: string[];
  colleges: string[];
  roles: string[];
  cities: string[];
};

type ExperienceCommunityRow = {
  company_name: string | null;
  college: string | null;
  role_name: string | null;
  company_location: string | null;
};

let cachedCommunityData: CommunityData | null = null;
let communityDataFetchedAt = 0;
let communityDataInFlight: Promise<CommunityData> | null = null;
const COMMUNITY_CACHE_TTL_MS = 5 * 60 * 1000;

export function useCommunityData() {
  const [data, setData] = useState<CommunityData>({ companies: [], colleges: [], roles: [], cities: [] });
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      if (cachedCommunityData && Date.now() - communityDataFetchedAt < COMMUNITY_CACHE_TTL_MS) {
        if (active) setData(cachedCommunityData);
        return;
      }

      if (!communityDataInFlight) {
        communityDataInFlight = (async () => {
          const { data: experiences } = await supabase
            .from("experiences")
            .select("company_name, college, role_name, company_location")
            .order("created_at", { ascending: false })
            .limit(300);
          const rows = (experiences ?? []) as ExperienceCommunityRow[];

          const getUniques = (values: Array<string | null>) => {
            const vals = values.filter((v): v is string => typeof v === "string" && v.length > 0);
            return Array.from(new Set(vals));
          };

          const nextData: CommunityData = {
            companies: getUniques(rows.map((exp) => exp.company_name)),
            colleges: getUniques(rows.map((exp) => exp.college)),
            roles: getUniques(rows.map((exp) => exp.role_name)),
            cities: getUniques(rows.map((exp) => exp.company_location)),
          };

          cachedCommunityData = nextData;
          communityDataFetchedAt = Date.now();
          return nextData;
        })().finally(() => {
          communityDataInFlight = null;
        });
      }

      const resolved = await communityDataInFlight;
      if (active) setData(resolved);
    };

    void fetchData();
    return () => {
      active = false;
    };
  }, [supabase]);

  return data;
}
