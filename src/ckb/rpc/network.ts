import { getPersistedData, updatePersistedData } from "../../utils/manageState";
import { Snap } from "../../interface";
import { RequestErrors, SnapError } from "../../errors";
import { heading, panel, text } from "@metamask/snaps-ui";
import { CkbNetwork } from "../core/interface";

export async function getCurrentNetwork(snap: Snap): Promise<CkbNetwork> {
  const snapNetwork: CkbNetwork = await getPersistedData<CkbNetwork>(
    snap,
    "ckbNetwork",
    CkbNetwork.Main
  );
  if (!snapNetwork) {
    await updatePersistedData(snap, "ckbNetwork", CkbNetwork.Main);
  }
  return snapNetwork;
}

export async function manageNetwork(
  origin: string,
  snap: Snap,
  action: "get" | "set",
  target?: CkbNetwork
): Promise<string | void> {
  switch (action) {
    case "get":
      return getCurrentNetwork(snap);
    case "set":
      const result = await snap.request({
        method: "snap_dialog",
        params: {
          type: "confirmation",
          content: panel({
            children: [
              heading("Switch your network"),
              text(
                `Do you want to allow ${origin} to switch network to ${target}?`
              ),
            ],
          }),
        },
      });
      if (result) {
        await updatePersistedData(snap, "ckbNetwork", target);
        return target;
      } else {
        return "";
      }
    default:
      throw SnapError.of(RequestErrors.ActionNotSupport);
  }
}
