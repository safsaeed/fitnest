"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type CityFilterProps = {
  cities: string[];
  selectedCity?: string;
};

export function CityFilter({ cities, selectedCity = "" }: CityFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set("city", value);
    } else {
      params.delete("city");
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  if (cities.length === 0) {
    return null;
  }

  return (
    <select
      value={selectedCity}
      onChange={(event) => handleChange(event.target.value)}
      className="rounded-lg border border-(--color-brand-border) text-(--color-text-secondary) cursor-pointer bg-white px-3 py-1 text-sm focus:outline-none"
    >
      <option value="">All cities</option>

      {cities.map((city) => (
        <option key={city} value={city}>
          {city}
        </option>
      ))}
    </select>
  );
}
