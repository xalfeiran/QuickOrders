import { BadRequestException } from '@nestjs/common';
import { MenuOptionGroup } from './menu-item.model';

// Turns a name into a url-safe id: lowercase, accent-stripped, dashed.
export function slugify(input: string): string {
  const base = (input ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || 'item';
}

// Ensures a candidate id is unique within a set, appending -2, -3, … if needed.
function uniqueId(candidate: string, taken: Set<string>): string {
  let id = candidate;
  let n = 2;
  while (taken.has(id)) id = `${candidate}-${n++}`;
  taken.add(id);
  return id;
}

// Validates admin-entered option groups and fills in any missing ids (derived
// from names). Enforces the same invariants the customer flow relies on:
// unique ids, 1+ options, 0 ≤ min ≤ max ≤ option count.
export function normalizeOptionGroups(input: unknown): MenuOptionGroup[] {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) {
    throw new BadRequestException('optionGroups debe ser una lista');
  }

  const groupIds = new Set<string>();
  return input.map((raw) => {
    const g = raw as Record<string, unknown>;
    const name = typeof g.name === 'string' ? g.name.trim() : '';
    if (!name) throw new BadRequestException('Cada grupo necesita un nombre');

    const id = uniqueId(
      typeof g.id === 'string' && g.id ? g.id : slugify(name),
      groupIds,
    );
    const min = Math.trunc(Number(g.min) || 0);
    const max = Math.trunc(Number(g.max) || 0);
    const required = Boolean(g.required);

    const rawOptions = Array.isArray(g.options) ? g.options : [];
    if (rawOptions.length === 0) {
      throw new BadRequestException(`El grupo "${name}" necesita opciones`);
    }

    const optionIds = new Set<string>();
    const options = rawOptions.map((rawO) => {
      const o = rawO as Record<string, unknown>;
      const optName = typeof o.name === 'string' ? o.name.trim() : '';
      if (!optName) {
        throw new BadRequestException(`Una opción de "${name}" no tiene nombre`);
      }
      return {
        id: uniqueId(
          typeof o.id === 'string' && o.id ? o.id : slugify(optName),
          optionIds,
        ),
        name: optName,
        priceDeltaCents: Math.round(Number(o.priceDeltaCents) || 0),
      };
    });

    if (min < 0 || max < 1 || min > max) {
      throw new BadRequestException(`Rango min/max inválido en "${name}"`);
    }
    if (max > options.length) {
      throw new BadRequestException(
        `El máximo de "${name}" excede el número de opciones`,
      );
    }

    return { id, name, required, min, max, options };
  });
}
