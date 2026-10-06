-- Allow unknown records and a fighter competing in multiple weight classes.
create or replace function public.valid_ranking_document(doc jsonb)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare d jsonb; f jsonb; chosen jsonb; ids text[]; division_ids text[];
begin
  if doc->>'status' not in ('preview','verified') or doc->>'status' is null
    or jsonb_typeof(doc->'divisions') is distinct from 'array'
    or jsonb_typeof(doc->'fighters') is distinct from 'array' then return false; end if;
  select array_agg(x->>'id') into ids from jsonb_array_elements(doc->'fighters') x;
  select array_agg(x->>'id') into division_ids from jsonb_array_elements(doc->'divisions') x;
  if coalesce(cardinality(division_ids),0)=0
    or cardinality(division_ids)<>(select count(distinct v) from unnest(division_ids) v)
    or cardinality(ids)<>(select count(distinct v) from unnest(ids) v) then return false; end if;
  for f in select value from jsonb_array_elements(doc->'fighters') loop
    if coalesce(f->>'id','') !~ '^[a-z0-9-]+$' or length(trim(coalesce(f->>'name','')))=0
      or not coalesce(f->>'division'=any(division_ids),false)
      or jsonb_typeof(f->'record') is distinct from 'array'
      or jsonb_array_length(f->'record')<>3
      or exists(select 1 from jsonb_array_elements(f->'record') n where n <> 'null'::jsonb and (jsonb_typeof(n)<>'number' or n::text !~ '^[0-9]+$'))
      or jsonb_typeof(f->'fights') is distinct from 'array' then return false; end if;
    if f ? 'divisions' then
      if jsonb_typeof(f->'divisions') is distinct from 'array' or not (f->'divisions' ? (f->>'division'))
        or exists(select 1 from jsonb_array_elements_text(f->'divisions') v where not coalesce(v=any(division_ids),false))
        or jsonb_array_length(f->'divisions')<>(select count(distinct v) from jsonb_array_elements_text(f->'divisions') v) then return false; end if;
    end if;
  end loop;
  for d in select value from jsonb_array_elements(doc->'divisions') loop
    if jsonb_typeof(d->'ranking') is distinct from 'array' or jsonb_array_length(d->'ranking')>10 then return false; end if;
    chosen=coalesce(d->'ranking','[]') || jsonb_build_array(d->'champion');
    if (select count(*) from jsonb_array_elements_text(chosen) v where v is not null)
      <> (select count(distinct v) from jsonb_array_elements_text(chosen) v where v is not null) then return false; end if;
    if exists(select 1 from jsonb_array_elements_text(chosen) v where v is not null and not exists
      (select 1 from jsonb_array_elements(doc->'fighters') x where x->>'id'=v and coalesce(x->'divisions',jsonb_build_array(x->>'division')) ? (d->>'id'))) then return false; end if;
  end loop;
  return true;
exception when others then return false;
end;
$$;
