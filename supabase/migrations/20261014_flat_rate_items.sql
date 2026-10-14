BEGIN;
-- The PDF's non-discount section includes gift boxes, matches and paper bombs.
UPDATE public.categories SET discountable = false
WHERE name IN ('Gift Box', 'Colour Matches', 'Roll Cap and Paper Bomb Items');
UPDATE public.products p SET discount_percent = 0
FROM public.categories c
WHERE p.category_id = c.id AND c.name IN
  ('Gift Box', 'Colour Matches', 'Roll Cap and Paper Bomb Items');
COMMIT;
