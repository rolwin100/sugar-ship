import { useTranslation } from "react-i18next";
import type { ZoneError } from "../../lib/zones/validate-zone";
import { fieldChecked, fieldValue } from "../field-events";
import { zoneErrorMessage } from "./zoneErrorMessage";

type Props = {
  name: string;
  nameError?: ZoneError;
  restOfWorld: boolean;
  /** Name of another zone that is already Rest of world, if any. */
  restOfWorldZone?: string;
  onNameChange: (name: string) => void;
  onRestOfWorldChange: (restOfWorld: boolean) => void;
};

export function ZoneDetailsSection({
  name,
  nameError,
  restOfWorld,
  restOfWorldZone,
  onNameChange,
  onRestOfWorldChange,
}: Props) {
  const { t, i18n } = useTranslation();
  const restOfWorldTaken = Boolean(restOfWorldZone) && !restOfWorld;

  return (
    <s-section>
      <s-stack gap="base">
        <s-text-field
          label={t("zones.nameLabel")}
          value={name}
          error={nameError ? zoneErrorMessage(nameError, t, i18n.language) : undefined}
          onInput={(e) => onNameChange(fieldValue(e))}
        />
        <s-checkbox
          label={t("zones.restOfWorldLabel")}
          details={
            restOfWorldTaken
              ? t("zones.restOfWorldTaken", { zone: restOfWorldZone })
              : t("zones.restOfWorldHelp")
          }
          checked={restOfWorld}
          disabled={restOfWorldTaken}
          onChange={(e) => onRestOfWorldChange(fieldChecked(e))}
        />
      </s-stack>
    </s-section>
  );
}
