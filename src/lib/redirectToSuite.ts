export function redirectToSuite(
  productKey: string,
  returnPath: string = "/"
) {
  const url = `https://amineva.com?product=${productKey}&return=${encodeURIComponent(
    returnPath
  )}`;

  window.location.href = url;
}
