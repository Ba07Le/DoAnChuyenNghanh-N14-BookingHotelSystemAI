# Project completion map

This package continues the existing project rather than replacing its visual direction.

## Data layer

- `users`
- `hotel_types`
- `destinations`
- `amenities`
- `hotels`
- `room_types`
- `rooms`
- `inventories`
- `coupons`
- `bookings`
- `payments`
- `reviews`
- `wishlists`
- `notifications`
- `audit_logs`
- `ai_conversations`
- `ai_recommendations`
- `ai_insights`

The relations use MongoDB ObjectId references and Mongoose `populate()` for hotel type, destination, amenities, owner, rooms, bookings and reviews. Indexes cover unique business identifiers, room availability, geospatial hotel search and common status/query patterns.

## User flow

1. Register customer account.
2. Login and persist JWT in the browser.
3. Browse homepage data from MongoDB.
4. Search hotels with destination, rating, star, price and room-capacity filters.
5. Open hotel detail and select a room type.
6. Create a booking after inventory availability is checked for every night.
7. Use demo payment to mark a booking paid.
8. Cancel a booking and restore inventory.
9. View bookings, profile, wishlist and notifications.
10. HOTEL_OWNER / ADMIN can access the dashboard and hotel management API.
11. AI foundation provides rule-based recommendations and a local travel assistant API without requiring an external AI key.

## Development seed

`npm run db:reset` is destructive for the configured development database: it clears the project collections and recreates the demo dataset. Run it intentionally.

`npm run db:test` verifies that the expected 18 collections exist.

## Demo accounts

All seeded demo accounts use password `123456`:

- admin@123.com — ADMIN
- owner@123.com — HOTEL_OWNER
- customer@123.com — CUSTOMER

## Important production work still intentionally external/config-dependent

- Real Stripe payment flow requires a Stripe account/key and webhook handling.
- Cloudinary image upload requires Cloudinary credentials.
- Nodemailer email verification/reset requires SMTP credentials.
- A hosted LLM provider/API key can replace the included rule-based AI layer.
- Admin/owner UI can be expanded from the already implemented protected CRUD API.
