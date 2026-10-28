import "i18next";
import type en from "./locales/en.json";

// Makes t("...") keys type-checked against en.json, so a typo is a TypeScript error.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: typeof en };
  }
}
