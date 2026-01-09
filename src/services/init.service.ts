import { getVersion } from "@/repositories/init.repository";
/* -------------------------------------------- */
/*                     초기 설정                    */
/* -------------------------------------------- */
export const initService = async (): Promise<string> => {
  return await getVersion();
};
