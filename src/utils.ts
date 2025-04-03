export const wait = async (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const toPChainWei = (value: number): bigint => {
  return BigInt(value * 1e9);
};

export const fromPChainWei = (value: bigint): string => {
  // WARNING: potentially insecure conversion!
  // returns a string so it's only used for logs but not for any calculations
  return (Number.parseInt(value.toString()) / 1e9).toString();
};
