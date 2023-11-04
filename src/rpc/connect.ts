import { BitcoinNetwork, ConnectedOrigin, Snap } from "../interface";
import { getPersistedData, updatePersistedData } from "../utils/manageState";
import { heading, panel, text } from "@metamask/snaps-ui";

export async function connect(
  origin: string,
  snap: Snap,
  address: string,
  target?: BitcoinNetwork
): Promise<boolean> {
  const connectedOrigins = await getPersistedData<ConnectedOrigin>(
    snap,
    "origins",
    {}
  );
  if (isConnected(origin, snap, address, target)) {
    return true;
  }

  const result = await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: panel([
        heading("Connect wallet"),
        text(
          `Do you want to allow ${origin} to connect account ${address} - Bitcoin network (${target})?`
        ),
      ]),
    },
  });
  if (result) {
    connectedOrigins[origin][target].push(address);
    await updatePersistedData(snap, "origins", connectedOrigins);
    return true;
  } else {
    return false;
  }
}

export async function disconnect(
  origin: string,
  snap: Snap,
  address: string,
  target?: BitcoinNetwork
): Promise<boolean> {
  const connectedOrigins = await getPersistedData<ConnectedOrigin>(
    snap,
    "origins",
    {}
  );
  if (!isConnected(origin, snap, address, target)) {
    return true;
  }

  const result = await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: panel([
        heading("Disconnect wallet"),
        text(
          `Do you want to disconnect account ${address} from ${origin} - Bitcoin network (${target})?`
        ),
      ]),
    },
  });
  if (result) {
    connectedOrigins[origin][target] = connectedOrigins[origin][target].filter(
      (connectedOrigin) => connectedOrigin === origin
    );
    await updatePersistedData(snap, "origins", connectedOrigins);
    return true;
  } else {
    return false;
  }
}

export async function isConnected(
  origin: string,
  snap: Snap,
  address: string,
  network: BitcoinNetwork
): Promise<boolean> {
  const connectedOrigins = await getPersistedData<ConnectedOrigin>(
    snap,
    "origins",
    {}
  );
  return connectedOrigins[origin][network].includes(address);
}
