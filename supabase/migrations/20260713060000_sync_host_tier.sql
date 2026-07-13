-- Sync host_tier with host_type value for existing profiles
UPDATE public.profiles
SET host_tier = CASE 
  WHEN host_type = 'certified_guide' THEN 'certified_guide'::text
  WHEN host_type = 'local_host' THEN 'local_host'::text
  ELSE host_tier
END
WHERE host_tier IS NULL AND host_type IS NOT NULL;
