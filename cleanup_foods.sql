-- Remove duplicate foods, keeping the latest one (from vast list)
DELETE FROM public.foods a USING public.foods b
WHERE a.id < b.id AND a.name = b.name;
