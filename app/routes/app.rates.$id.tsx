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
import { deleteRule, getRule, saveRule } from "../lib/rules/rule-store.server";
import {
  draftToInput,
  emptyRuleDraft,
  parseRuleDraft,
  ruleToDraft,
} from "../lib/rules/draft";
import type { RuleActionResult, RuleDraft } from "../lib/rules/types";
import { listZones } from "../lib/zones/zone-store.server";
import { FormSaveBar } from "../components/FormSaveBar";
import {
  CheckoutDisplaySection,
  ConditionsSection,
  DELETE_RULE_MODAL_ID,
  DeleteRuleModal,
  RuleDetailsSection,
  RuleErrorsBanner,
  ZonePricesSection,
} from "../components/rates";
import { RULE_STATUS } from "../lib/engine";

/** `/app/rates/new` creates a rate; `/app/rates/<id>` edits one. */
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await requireShop(session.shop);
  const currency = shop.currency ?? "USD";

  const isNew = params.id === "new";
  const [rule, zones] = await Promise.all([
    isNew || !params.id ? null : getRule(shop.id, params.id),
    listZones(shop.id),
  ]);
  if (!isNew && !rule) throw new Response("Rate not found", { status: 404 });

  return {
    rule,
    draft: rule ? ruleToDraft(rule, currency) : emptyRuleDraft(),
    zones: zones.map(({ id, name, restOfWorld, regions }) => ({
      id,
      name,
      restOfWorld,
      regions,
    })),
    currency,
  };
};

export const action = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<RuleActionResult> => {
  const { session } = await authenticate.admin(request);
  const shop = await requireShop(session.shop);
  const id = params.id && params.id !== "new" ? params.id : null;
  const form = await request.formData();

  if (form.get("intent") === "delete") {
    if (!id) return { ok: false, invalid: true };
    await deleteRule(shop.id, id);
    return { ok: true, intent: "delete" };
  }

  const draft = parseRuleDraft(form.get("rule"));
  if (!draft) return { ok: false, invalid: true };

  const result = await saveRule(
    shop.id,
    id,
    draftToInput(draft, shop.currency ?? "USD"),
  );
  if (result.ok) return { ok: true, intent: "save" };
  if ("notFound" in result)
    throw new Response("Rate not found", { status: 404 });
  return { ok: false, errors: result.errors };
};

// After a delete, don't re-run the loader: the rate is gone, so it would show
// "Rate not found" before the page can show the toast and go back to the list.
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formData,
  defaultShouldRevalidate,
}) => (formData?.get("intent") === "delete" ? false : defaultShouldRevalidate);

export default function RateEditPage() {
  const {
    rule,
    draft: initial,
    zones,
    currency,
  } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const fetcher = useFetcher<typeof action>();

  const [saved, setSaved] = useState<RuleDraft>(initial);
  const [draft, setDraft] = useState<RuleDraft>(initial);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const busy = fetcher.state !== "idle";
  const zoneNames = useMemo(
    () => Object.fromEntries(zones.map((z) => [z.id, z.name])),
    [zones],
  );

  // After a successful save or delete: close the save bar, show a toast, go back to the list.
  const handled = useRef<unknown>(null);
  useEffect(() => {
    const data = fetcher.data;
    if (fetcher.state !== "idle" || !data?.ok || handled.current === data)
      return;
    handled.current = data;
    setSaved(draft);
    shopify.toast.show(
      t(data.intent === "delete" ? "rates.deleted" : "rates.saved"),
    );
    navigate("/app/rates");
  }, [fetcher.state, fetcher.data, draft, shopify, t, navigate]);

  const result = fetcher.data;
  const errors =
    result && !result.ok && "errors" in result ? result.errors : [];
  const invalid = Boolean(result && !result.ok && "invalid" in result);

  const save = () =>
    fetcher.submit(
      { intent: "save", rule: JSON.stringify(draft) },
      { method: "post" },
    );
  const remove = () => fetcher.submit({ intent: "delete" }, { method: "post" });
  const change = (fields: Partial<RuleDraft>) =>
    setDraft((d) => ({ ...d, ...fields }));

  return (
    <s-page heading={rule ? rule.name : t("rates.newTitle")}>
      <s-link slot="breadcrumb-actions" href="/app/rates">
        {t("rates.title")}
      </s-link>
      {rule && (
        <s-button
          slot="secondary-actions"
          tone="critical"
          commandFor={DELETE_RULE_MODAL_ID}
          command="--show"
        >
          {t("rates.deleteRate")}
        </s-button>
      )}

      <FormSaveBar
        id="rate-save-bar"
        open={dirty}
        busy={busy}
        onSave={save}
        onDiscard={() => setDraft(saved)}
      />

      <RuleErrorsBanner
        errors={errors}
        invalid={invalid}
        zoneNames={zoneNames}
      />

      <RuleDetailsSection
        name={draft.name}
        nameError={errors.find((e) => e.field === "name")}
        active={draft.status === RULE_STATUS.ACTIVE}
        onNameChange={(name) => change({ name })}
        onActiveChange={(active) =>
          change({ status: active ? RULE_STATUS.ACTIVE : RULE_STATUS.INACTIVE })
        }
      />

      <ConditionsSection
        match={draft.match}
        conditions={draft.conditions}
        currency={currency}
        errors={errors.filter((e) => e.field === "conditions")}
        onMatchChange={(match) => change({ match })}
        onConditionsChange={(update) =>
          setDraft((d) => ({ ...d, conditions: update(d.conditions) }))
        }
      />

      <CheckoutDisplaySection
        preset={draft.preset}
        customName={draft.customName}
        description={draft.description}
        minDeliveryDays={draft.minDeliveryDays}
        maxDeliveryDays={draft.maxDeliveryDays}
        customNameError={errors.find((e) => e.field === "customName")}
        descriptionError={errors.find((e) => e.field === "description")}
        daysError={errors.find((e) => e.field === "days")}
        onChange={change}
      />

      <ZonePricesSection
        zones={zones}
        prices={draft.prices}
        currency={currency}
        errors={errors.filter((e) => e.field === "prices" && e.zoneId)}
        onPricesChange={(update) =>
          setDraft((d) => ({ ...d, prices: update(d.prices) }))
        }
      />

      {rule && (
        <DeleteRuleModal name={rule.name} busy={busy} onDelete={remove} />
      )}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
