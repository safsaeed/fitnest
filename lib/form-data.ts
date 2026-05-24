export function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export function getFormString(formData: FormData, key: string) {
  return getFormValue(formData, key).trim();
}

export function getOptionalFormString(formData: FormData, key: string) {
  const value = getFormString(formData, key);

  return value || undefined;
}

export function getFormBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export function getFormNumber(formData: FormData, key: string) {
  const value = getFormString(formData, key);

  if (!value) {
    return null;
  }

  const number = Number(value);

  return Number.isNaN(number) ? null : number;
}

export function getFormDateOnly(formData: FormData, key: string) {
  const value = getFormString(formData, key);

  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}
