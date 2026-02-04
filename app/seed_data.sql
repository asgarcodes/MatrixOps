-- Insert mock events for testing
-- Ensure you run the schema first!

insert into events (id, title, description, lat, lng, start_time, end_time)
values
(gen_random_uuid(), 'Central Park Meetup', 'Join us for a casual meetup in the park.', 40.785091, -73.968285, now() + interval '1 day', now() + interval '1 day 2 hours'),
(gen_random_uuid(), 'Tech Talk NYC', 'Discussion about the latest in AI and Web Dev.', 40.758896, -73.985130, now() + interval '2 hours', now() + interval '4 hours'),
(gen_random_uuid(), 'Brooklyn Bridge Walk', 'Sunset walk across the bridge.', 40.706086, -73.996864, now() + interval '5 hours', now() + interval '7 hours');
