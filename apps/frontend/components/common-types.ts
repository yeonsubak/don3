import type { FieldValue, FieldValues, UseFormReturn } from 'react-hook-form';

export type TailwindClass = string;

export type DateRange = { from: Date; to: Date };

export type ZForm = UseFormReturn<FieldValue<FieldValues>>;
