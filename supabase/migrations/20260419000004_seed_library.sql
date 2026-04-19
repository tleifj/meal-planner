-- ============================================================================
-- Seed: grocery categories + ~150 common items
-- ============================================================================

insert into public.grocery_categories (id, slug, name, sort_order, icon) values
  (1, 'produce',      'Produce',      10, 'apple'),
  (2, 'bakery',       'Bakery',       20, 'croissant'),
  (3, 'meat',         'Meat & Seafood', 30, 'beef'),
  (4, 'refrigerated', 'Refrigerated', 40, 'milk'),
  (5, 'frozen',       'Frozen',       50, 'snowflake'),
  (6, 'dry_goods',    'Dry Goods',    60, 'wheat'),
  (7, 'beverages',    'Beverages',    70, 'cup-soda'),
  (8, 'household',    'Household',    80, 'spray-can'),
  (9, 'other',        'Other',        99, 'package')
on conflict (id) do update set
  slug = excluded.slug, name = excluded.name,
  sort_order = excluded.sort_order, icon = excluded.icon;

-- Helper: insert-if-not-exists in global library by lowercased name.
create or replace function public._seed_item(p_name text, p_category int, p_unit text default 'ea')
returns void language plpgsql as $$
begin
  insert into public.grocery_library_items (name, category_id, default_unit, is_global)
  values (p_name, p_category, p_unit, true)
  on conflict do nothing;
end;
$$;

-- Produce (35)
select public._seed_item('Apple', 1), public._seed_item('Banana', 1),
       public._seed_item('Orange', 1), public._seed_item('Lemon', 1),
       public._seed_item('Lime', 1), public._seed_item('Strawberries', 1, 'lb'),
       public._seed_item('Blueberries', 1, 'pt'), public._seed_item('Grapes', 1, 'lb'),
       public._seed_item('Avocado', 1), public._seed_item('Tomato', 1),
       public._seed_item('Roma Tomato', 1), public._seed_item('Cherry Tomato', 1, 'pt'),
       public._seed_item('Yellow Onion', 1), public._seed_item('Red Onion', 1),
       public._seed_item('Garlic', 1, 'head'), public._seed_item('Ginger', 1),
       public._seed_item('Potato', 1, 'lb'), public._seed_item('Sweet Potato', 1, 'lb'),
       public._seed_item('Carrot', 1, 'lb'), public._seed_item('Celery', 1),
       public._seed_item('Broccoli', 1), public._seed_item('Cauliflower', 1),
       public._seed_item('Spinach', 1, 'bag'), public._seed_item('Romaine', 1),
       public._seed_item('Kale', 1, 'bunch'), public._seed_item('Arugula', 1, 'bag'),
       public._seed_item('Cucumber', 1), public._seed_item('Bell Pepper', 1),
       public._seed_item('Jalapeño', 1), public._seed_item('Zucchini', 1),
       public._seed_item('Mushroom', 1, 'pkg'), public._seed_item('Corn', 1),
       public._seed_item('Asparagus', 1, 'bunch'), public._seed_item('Green Beans', 1, 'lb'),
       public._seed_item('Cilantro', 1, 'bunch'), public._seed_item('Parsley', 1, 'bunch'),
       public._seed_item('Basil', 1, 'bunch');

-- Bakery (8)
select public._seed_item('Bread', 2, 'loaf'), public._seed_item('Bagel', 2),
       public._seed_item('English Muffin', 2), public._seed_item('Flour Tortilla', 2, 'pkg'),
       public._seed_item('Corn Tortilla', 2, 'pkg'), public._seed_item('Hamburger Bun', 2, 'pkg'),
       public._seed_item('Hot Dog Bun', 2, 'pkg'), public._seed_item('Pita', 2, 'pkg');

-- Meat & Seafood (14)
select public._seed_item('Chicken Breast', 3, 'lb'), public._seed_item('Chicken Thigh', 3, 'lb'),
       public._seed_item('Ground Beef', 3, 'lb'), public._seed_item('Ground Turkey', 3, 'lb'),
       public._seed_item('Steak', 3, 'lb'), public._seed_item('Pork Chop', 3, 'lb'),
       public._seed_item('Bacon', 3, 'pkg'), public._seed_item('Sausage', 3, 'pkg'),
       public._seed_item('Deli Turkey', 3, 'lb'), public._seed_item('Deli Ham', 3, 'lb'),
       public._seed_item('Salmon', 3, 'lb'), public._seed_item('Shrimp', 3, 'lb'),
       public._seed_item('Tuna', 3, 'can'), public._seed_item('Tofu', 3, 'pkg');

-- Refrigerated (20)
select public._seed_item('Whole Milk', 4, 'gal'), public._seed_item('2% Milk', 4, 'gal'),
       public._seed_item('Skim Milk', 4, 'gal'), public._seed_item('Oat Milk', 4),
       public._seed_item('Almond Milk', 4), public._seed_item('Heavy Cream', 4),
       public._seed_item('Butter', 4, 'lb'), public._seed_item('Eggs', 4, 'dz'),
       public._seed_item('Greek Yogurt', 4), public._seed_item('Yogurt', 4),
       public._seed_item('Cheddar', 4), public._seed_item('Mozzarella', 4),
       public._seed_item('Parmesan', 4), public._seed_item('Cream Cheese', 4),
       public._seed_item('Sour Cream', 4), public._seed_item('Cottage Cheese', 4),
       public._seed_item('Hummus', 4), public._seed_item('Salsa', 4),
       public._seed_item('Orange Juice', 4), public._seed_item('Lemonade', 4);

-- Frozen (10)
select public._seed_item('Frozen Pizza', 5), public._seed_item('Frozen Berries', 5, 'bag'),
       public._seed_item('Frozen Peas', 5, 'bag'), public._seed_item('Frozen Corn', 5, 'bag'),
       public._seed_item('Frozen Broccoli', 5, 'bag'), public._seed_item('Ice Cream', 5),
       public._seed_item('Frozen Waffles', 5), public._seed_item('Frozen Chicken Nuggets', 5),
       public._seed_item('Frozen Fries', 5, 'bag'), public._seed_item('Frozen Fish Fillet', 5);

-- Dry Goods (42)
select public._seed_item('White Rice', 6, 'lb'), public._seed_item('Brown Rice', 6, 'lb'),
       public._seed_item('Spaghetti', 6, 'box'), public._seed_item('Penne', 6, 'box'),
       public._seed_item('Macaroni', 6, 'box'), public._seed_item('Flour', 6, 'lb'),
       public._seed_item('Sugar', 6, 'lb'), public._seed_item('Brown Sugar', 6),
       public._seed_item('Baking Powder', 6), public._seed_item('Baking Soda', 6),
       public._seed_item('Yeast', 6), public._seed_item('Oats', 6),
       public._seed_item('Cereal', 6, 'box'), public._seed_item('Granola', 6),
       public._seed_item('Peanut Butter', 6), public._seed_item('Jelly', 6),
       public._seed_item('Honey', 6), public._seed_item('Maple Syrup', 6),
       public._seed_item('Olive Oil', 6), public._seed_item('Vegetable Oil', 6),
       public._seed_item('Soy Sauce', 6), public._seed_item('Vinegar', 6),
       public._seed_item('Ketchup', 6), public._seed_item('Mustard', 6),
       public._seed_item('Mayo', 6), public._seed_item('Ranch', 6),
       public._seed_item('Hot Sauce', 6), public._seed_item('Salt', 6),
       public._seed_item('Black Pepper', 6), public._seed_item('Cinnamon', 6),
       public._seed_item('Paprika', 6), public._seed_item('Chili Powder', 6),
       public._seed_item('Cumin', 6), public._seed_item('Oregano', 6),
       public._seed_item('Chicken Broth', 6, 'can'), public._seed_item('Beef Broth', 6, 'can'),
       public._seed_item('Canned Tomato', 6, 'can'), public._seed_item('Tomato Sauce', 6, 'can'),
       public._seed_item('Black Beans', 6, 'can'), public._seed_item('Chickpeas', 6, 'can'),
       public._seed_item('Chips', 6, 'bag'), public._seed_item('Crackers', 6, 'box');

-- Beverages (10)
select public._seed_item('Coffee', 7), public._seed_item('Tea', 7, 'box'),
       public._seed_item('Bottled Water', 7, 'pack'), public._seed_item('Sparkling Water', 7, 'pack'),
       public._seed_item('Soda', 7, 'pack'), public._seed_item('Beer', 7, 'pack'),
       public._seed_item('Wine', 7, 'btl'), public._seed_item('Sports Drink', 7, 'pack'),
       public._seed_item('Juice', 7), public._seed_item('Kombucha', 7);

-- Household (12)
select public._seed_item('Paper Towels', 8, 'pack'), public._seed_item('Toilet Paper', 8, 'pack'),
       public._seed_item('Tissues', 8, 'box'), public._seed_item('Dish Soap', 8),
       public._seed_item('Laundry Detergent', 8), public._seed_item('Sponges', 8, 'pack'),
       public._seed_item('Trash Bags', 8, 'box'), public._seed_item('Foil', 8),
       public._seed_item('Plastic Wrap', 8), public._seed_item('Parchment', 8),
       public._seed_item('Ziploc Bags', 8, 'box'), public._seed_item('Cleaning Spray', 8);

drop function public._seed_item(text, int, text);
