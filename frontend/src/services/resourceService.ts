import { http } from "./http";
import type { Resource } from "@/types";

const PATH = "/resources";

export const resourceService = {
  list: () => http.get<Resource[]>(`${PATH}/`).then((r) => r.data),
  getById: (id: string) => http.get<Resource>(`${PATH}/${id}`).then((r) => r.data),
  getByPlanId: (planId: string) => http.get<Resource>(`${PATH}/plan/${planId}`).then((r) => r.data),
};
