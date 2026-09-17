begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

select has_column('public','routes','route_code','routes.route_code exists');
select has_column('public','route_versions','route_kind','route_versions.route_kind exists');
select has_column('public','route_versions','elevation_loss_m','route_versions.elevation_loss_m exists');
select has_column('public','route_versions','editorial_sections','route_versions.editorial_sections exists');
select has_table('public','route_access_points','route_access_points exists');
select has_table('public','route_sources','route_sources exists');
select has_table('public','route_track_sources','route_track_sources exists');
select has_table('public','route_validation_status','route_validation_status exists');
select col_is_pk('public','route_validation_status','route_id','route_validation_status keyed by route');
select has_index('public','route_access_points','route_access_points_position_gix','access points have spatial index');
select has_index('public','route_sources','route_sources_route_idx','route sources indexed by route');
select has_index('public','route_track_sources','route_track_sources_route_idx','track sources indexed by route');

select * from finish();
rollback;
