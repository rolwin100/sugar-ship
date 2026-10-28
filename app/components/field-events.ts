// Polaris web components put the new value on the element itself; these read it from an event.

export const fieldValue = (event: Event) =>
  (event.currentTarget as unknown as { value: string }).value;

export const fieldChecked = (event: Event) =>
  (event.currentTarget as unknown as { checked: boolean }).checked;

export const fieldValues = (event: Event) =>
  (event.currentTarget as unknown as { values: string[] }).values;
