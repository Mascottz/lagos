-- Update the active catalog without changing existing checkout quotes or orders.
update public.packages set label = '25B', price_ngn = 500 where label = '20B';
update public.packages set label = '55B', price_ngn = 1000 where label = '50B';
update public.packages set price_ngn = 100 where label = '1B';
update public.packages set price_ngn = 2000 where label = '120B';
update public.packages set price_ngn = 2500 where label = '200B';
update public.packages set price_ngn = 4000 where label = '500B';
insert into public.packages (label, price_ngn, description, sort_order, popular)
values ('1.0T', 7000, 'The biggest move', 7, false);
