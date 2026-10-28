import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
  ShouldRevalidateFunction,
} from "react-router";
import { useFetcher, useLoaderData, useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";

import { authenticate } from "../shopify.server";
import { requireShop } from "../lib/shop.server";
import {
  deleteZone,
  listZones,
  saveZone,
} from "../lib/zones/zone-store.server";
import { parseZoneInput } from "../lib/zones/validate-zone";
import { normCountry } from "../lib/zones/codes";
import {
  addCountry,
  removeCountry,
  replaceCountryStates,
  toggleCountryState,
} from "../lib/zones/edit-regions";
import { takenIndex } from "../lib/zones/taken";
import type { Region, ZoneActionResult, ZoneDraft } from "../lib/zones/types";
import {
  CountriesModal,
  DELETE_ZONE_MODAL_ID,
  DeleteZoneModal,
  StatesModal,
  ZoneDetailsSection,
  ZoneErrorsBanner,
  ZoneRegionsSection,
  ZoneSaveBar,
} from "../components/zones";

/** `/app/zones/new` creates a zone; `/app/zones/<id>` edits one. */
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await requireShop(session.shop);
  const zones = await listZones(shop.id);

  const isNew = params.id === "new";
  const zone = isNew ? null : (zones.find((z) => z.id === params.id) ?? null);
  if (!isNew && !zone) throw new Response("Zone not found", { status: 404 });

  // The other zones, so the page can show which countries and states are already used.
  const others = zones
    .filter((z) => z.id !== zone?.id)
    .map(({ name, restOfWorld, regions }) => ({ name, restOfWorld, regions }));

  return { zone, others };
};

export const action = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<ZoneActionResult> => {
  const { session } = await authenticate.admin(request);
  const shop = await requireShop(session.shop);
  const id = params.id && params.id !== "new" ? params.id : null;
  const form = await request.formData();

  if (form.get("intent") === "delete") {
    if (!id) return { ok: false, invalid: true };
    await deleteZone(shop.id, id);
    return { ok: true, intent: "delete" };
  }

  const input = parseZoneInput(form.get("zone"));
  if (!input) return { ok: false, invalid: true };

  const result = await saveZone(shop.id, id, input);
  if (result.ok) return { ok: true, intent: "save" };
  if ("notFound" in result)
    throw new Response("Zone not found", { status: 404 });
  return { ok: false, errors: result.errors };
};

// After a delete, don't re-run the loader: the zone is gone, so it would show
// "Zone not found" before the page can show the toast and go back to the list.
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formData,
  defaultShouldRevalidate,
}) => (formData?.get("intent") === "delete" ? false : defaultShouldRevalidate);

export default function ZoneEditPage() {
  const { zone, others } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const fetcher = useFetcher<typeof action>();

  const initial = useMemo<ZoneDraft>(
    () =>
      zone
        ? {
            name: zone.name,
            restOfWorld: zone.restOfWorld,
            regions: zone.regions,
          }
        : { name: "", restOfWorld: false, regions: [] },
    [zone],
  );
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [editingCountry, setEditingCountry] = useState<string | null>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const busy = fetcher.state !== "idle";
  const taken = useMemo(() => takenIndex(others), [others]);
  const restOfWorldZone = others.find((z) => z.restOfWorld)?.name;

  // After a successful save or delete: close the save bar, show a toast, go back to the list.
  const handled = useRef<unknown>(null);
  useEffect(() => {
    const data = fetcher.data;
    console.log(data);
    if (fetcher.state !== "idle" || !data?.ok || handled.current === data)
      return;
    handled.current = data;
    setSaved(draft);
    shopify.toast.show(
      t(data.intent === "delete" ? "zones.deleted" : "zones.saved"),
    );
    navigate("/app/zones");
  }, [fetcher.state, fetcher.data, draft, shopify, t, navigate]);

  const result = fetcher.data;
  const errors =
    result && !result.ok && "errors" in result ? result.errors : [];
  const invalid = Boolean(result && !result.ok && "invalid" in result);

  const save = () =>
    fetcher.submit(
      { intent: "save", zone: JSON.stringify(draft) },
      { method: "post" },
    );
  const remove = () => fetcher.submit({ intent: "delete" }, { method: "post" });

  // --- Changing the draft ---------------------------------------------------------------

  const changeRegions = (update: (regions: Region[]) => Region[]) =>
    setDraft((d) => ({ ...d, regions: update(d.regions) }));

  const toggleCountry = (country: string, on: boolean) =>
    changeRegions((regions) =>
      on
        ? addCountry(regions, country, taken)
        : removeCountry(regions, country),
    );

  const editingRegion = draft.regions.find(
    (r) => normCountry(r.country) === editingCountry,
  );

  return (
    <s-page heading={zone ? zone.name : t("zones.newTitle")}>
      <s-link slot="breadcrumb-actions" href="/app/zones">
        {t("zones.title")}
      </s-link>
      {zone && (
        <s-button
          slot="secondary-actions"
          tone="critical"
          commandFor={DELETE_ZONE_MODAL_ID}
          command="--show"
        >
          {t("zones.deleteZone")}
        </s-button>
      )}

      <ZoneSaveBar
        open={dirty}
        busy={busy}
        onSave={save}
        onDiscard={() => setDraft(saved)}
      />

      <ZoneErrorsBanner
        errors={errors.filter((e) => e.field === "regions")}
        invalid={invalid}
      />

      <ZoneDetailsSection
        name={draft.name}
        nameError={errors.find((e) => e.field === "name")}
        restOfWorld={draft.restOfWorld}
        restOfWorldZone={restOfWorldZone}
        onNameChange={(name) => setDraft((d) => ({ ...d, name }))}
        onRestOfWorldChange={(restOfWorld) =>
          setDraft((d) => ({ ...d, restOfWorld }))
        }
      />

      {!draft.restOfWorld && (
        <ZoneRegionsSection
          regions={draft.regions}
          taken={taken}
          onRemove={(country) => toggleCountry(country, false)}
          onWholeChange={(country, whole) =>
            changeRegions((regions) =>
              replaceCountryStates(regions, country, whole ? null : []),
            )
          }
          onChooseStates={setEditingCountry}
        />
      )}

      <CountriesModal
        selected={new Set(draft.regions.map((r) => normCountry(r.country)))}
        taken={taken}
        onToggle={toggleCountry}
      />

      <StatesModal
        country={editingCountry}
        selected={editingRegion?.provinces ?? []}
        taken={taken}
        onToggle={(state, on) =>
          editingCountry &&
          changeRegions((regions) =>
            toggleCountryState(regions, editingCountry, state, on),
          )
        }
        onSetAll={(states) =>
          editingCountry &&
          changeRegions((regions) =>
            replaceCountryStates(regions, editingCountry, states),
          )
        }
      />

      {zone && (
        <DeleteZoneModal
          name={zone.name}
          rateCount={zone.rateCount}
          busy={busy}
          onDelete={remove}
        />
      )}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
