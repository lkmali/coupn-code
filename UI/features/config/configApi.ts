/**
 * Organization configuration API calls (admin).
 */

import { api } from "@/lib/api";
import type { OrganizationConfiguration } from "@/lib/types";

/** GET /organization-configuration/me — current org configuration. */
export async function fetchOrganizationConfig(): Promise<OrganizationConfiguration> {
  const { data } = await api.get<OrganizationConfiguration>(
    "/organization-configuration/me"
  );
  return data;
}

/** POST /organization-configuration — create/update org configuration. */
export async function saveOrganizationConfig(
  payload: OrganizationConfiguration
): Promise<OrganizationConfiguration> {
  const { data } = await api.post<{ data: OrganizationConfiguration }>(
    "/organization-configuration",
    payload
  );
  return data.data;
}
