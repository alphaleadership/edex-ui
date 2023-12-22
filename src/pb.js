var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/pretty-bytes/index.js
var pretty_bytes_exports = {};
__export(pretty_bytes_exports, {
  default: () => prettyBytes
});
module.exports = __toCommonJS(pretty_bytes_exports);
var BYTE_UNITS = [
  "B",
  "kB",
  "MB",
  "GB",
  "TB",
  "PB",
  "EB",
  "ZB",
  "YB"
];
var BIBYTE_UNITS = [
  "B",
  "KiB",
  "MiB",
  "GiB",
  "TiB",
  "PiB",
  "EiB",
  "ZiB",
  "YiB"
];
var BIT_UNITS = [
  "b",
  "kbit",
  "Mbit",
  "Gbit",
  "Tbit",
  "Pbit",
  "Ebit",
  "Zbit",
  "Ybit"
];
var BIBIT_UNITS = [
  "b",
  "kibit",
  "Mibit",
  "Gibit",
  "Tibit",
  "Pibit",
  "Eibit",
  "Zibit",
  "Yibit"
];
var toLocaleString = (number, locale, options) => {
  let result = number;
  if (typeof locale === "string" || Array.isArray(locale)) {
    result = number.toLocaleString(locale, options);
  } else if (locale === true || options !== void 0) {
    result = number.toLocaleString(void 0, options);
  }
  return result;
};
function prettyBytes(number, options) {
  if (!Number.isFinite(number)) {
    throw new TypeError(`Expected a finite number, got ${typeof number}: ${number}`);
  }
  options = {
    bits: false,
    binary: false,
    space: true,
    ...options
  };
  const UNITS = options.bits ? options.binary ? BIBIT_UNITS : BIT_UNITS : options.binary ? BIBYTE_UNITS : BYTE_UNITS;
  const separator = options.space ? " " : "";
  if (options.signed && number === 0) {
    return ` 0${separator}${UNITS[0]}`;
  }
  const isNegative = number < 0;
  const prefix = isNegative ? "-" : options.signed ? "+" : "";
  if (isNegative) {
    number = -number;
  }
  let localeOptions;
  if (options.minimumFractionDigits !== void 0) {
    localeOptions = { minimumFractionDigits: options.minimumFractionDigits };
  }
  if (options.maximumFractionDigits !== void 0) {
    localeOptions = { maximumFractionDigits: options.maximumFractionDigits, ...localeOptions };
  }
  if (number < 1) {
    const numberString2 = toLocaleString(number, options.locale, localeOptions);
    return prefix + numberString2 + separator + UNITS[0];
  }
  const exponent = Math.min(Math.floor(options.binary ? Math.log(number) / Math.log(1024) : Math.log10(number) / 3), UNITS.length - 1);
  number /= (options.binary ? 1024 : 1e3) ** exponent;
  if (!localeOptions) {
    number = number.toPrecision(3);
  }
  const numberString = toLocaleString(Number(number), options.locale, localeOptions);
  const unit = UNITS[exponent];
  return prefix + numberString + separator + unit;
}
