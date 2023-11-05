import { BitcoinAccount, BitcoinNetwork, Snap } from "../interface";
import { getPersistedData, updatePersistedData } from "../utils/manageState";
import { RequestErrors, SnapError } from "../errors";
import { heading, panel, text } from "@metamask/snaps-ui";
import { getAccounts, getCurrentAccount, switchAccount } from "./account";

export async function getCurrentNetwork(snap: Snap) {
  const snapNetwork: BitcoinNetwork = await getPersistedData<BitcoinNetwork>(
    snap,
    "network",
    BitcoinNetwork.Main
  );
  if (!snapNetwork) {
    await updatePersistedData(snap, "network", BitcoinNetwork.Main);
  }
  return snapNetwork;
}

export async function manageNetwork(
  origin: string,
  snap: Snap,
  action: "get" | "set",
  target?: BitcoinNetwork
): Promise<string | void> {
  switch (action) {
    case "get":
      return getCurrentNetwork(snap);
    case "set":
      const account = await getCurrentAccount(snap);
      let accountSwitchTo: BitcoinAccount | undefined;
      if (account.network !== target) {
        const accounts = await getAccounts(snap, target);
        accountSwitchTo = accounts[0];
      }
      const result = await snap.request({
        method: "snap_dialog",
        params: {
          type: "confirmation",
          content: panel([
            heading("Switch your network"),
            text(
              `Do you want to allow ${origin} to switch Bitcoin network to ${target}?`
            ),
          ]),
        },
      });
      if (result) {
        await updatePersistedData(snap, "network", target);
        if (accountSwitchTo) {
          await switchAccount(
            snap,
            accountSwitchTo.address,
            accountSwitchTo.mfp
          );
        }
        return target;
      } else {
        return "";
      }
    default:
      throw SnapError.of(RequestErrors.ActionNotSupport);
  }
}
