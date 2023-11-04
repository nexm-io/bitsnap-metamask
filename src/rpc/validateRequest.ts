import { RpcRequest } from "../index";
import { RequestErrors, SnapError } from "../errors";

const DOMAIN_WHITELIST = [/\.justsnap\.io$/];

const validateDomain = async (domain: string) => {
  const isDomainValid = DOMAIN_WHITELIST.some((pattern) =>
    pattern.test(domain)
  );
  if (!isDomainValid) {
    throw SnapError.of(RequestErrors.DomainNotAllowed);
  }
};

export const validateRequest = async (
  origin: string,
  request: RpcRequest["request"]
) => {
  switch (request.method) {
    case "btc_getLNDataFromSnap":
    case "btc_saveLNDataToSnap":
    case "btc_signLNInvoice":
      await validateDomain(origin);
  }
};
