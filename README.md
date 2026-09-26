RentEasy

A property rental web application I built for my final Full-Stack web development project.

There are two types of users: tenants, who look for a place to rent and send rental requests, and owners, who publish their properties and answer the requests.


Technologies

- Frontend: React (Vite), React Router
- Backend: Node.js, Express
- Database: MongoDB, Mongoose
- Styling: CSS (variables in :root, BEM naming)
- Other: bcryptjs, JWT, Multer, Leaflet


Installation

You need Node.js (version 20 or higher) and MongoDB installed on your computer.

1. Install the dependencies: npm run install:all
2. Create the .env file: copy server\\.env.example server\\.env
3. Add the test data: npm run seed
4. Start the project: npm run dev
5. Open localhost:5173 in your browser

To run the API tests: npm test

Note: the API runs on port 5050.


Viewing the data

The data is stored in the MongoDB database renteasy (collections users, properties, rentalrequests, messages, reviews).

- With MongoDB Compass: connect to mongodb://localhost:27017, open the renteasy database, then the properties collection.
- Without any tool: open localhost:5050/api/properties in the browser.

Uploaded images are stored in the server\\uploads folder.

The images of the test data are not stored in the project. They are links to free photos from Unsplash, written in server\seed.js, so an internet connection is needed to see them.

Test accounts

Password for all accounts: Password123

- Owner: owner@renteasy.dz, owner2@renteasy.dz
- Tenant: tenant@renteasy.dz, tenant2@renteasy.dz
- Admin: admin@renteasy.dz


Features

- Sign up and log in (tenant or owner)
- Property list with search and filters (type, max price, bedrooms)
- Property details page
- Add, edit and delete a property (owner)
- Favorites (tenant)
- Rental requests: send, accept, reject
- Owner dashboard

Bonus: JWT, pagination, image upload with Multer, map with Leaflet, messaging, reviews, statistics, admin role.


API routes

- POST /api/auth/register: sign up
- POST /api/auth/login: log in
- GET /api/properties: list of properties (search and filters)
- GET /api/properties/:id: property details
- POST /api/properties: add a property
- PUT /api/properties/:id: edit a property
- DELETE /api/properties/:id: delete a property
- POST /api/requests: send a request
- GET /api/requests/my: my requests (tenant)
- GET /api/requests/owner: received requests (owner)
- PUT /api/requests/:id: accept or reject a request
- GET /api/users/favorites: my favorites
- POST /api/users/favorites/:propertyId: add or remove a favorite

Private routes need the header Authorization: Bearer followed by the token.


Business rules

- An owner can only edit or delete their own listings.
- A tenant cannot create a listing.
- A request can only be sent for an available property.
- A tenant cannot have two active requests for the same property.
- No duplicates in favorites.
- When a request is accepted, the property can be set to unavailable and the other pending requests are rejected.
- All checks are done on the backend.


Challenges

- The app worked in Firefox but not in Brave (error "destroy is not a function"). The problem came from a useEffect written without curly braces around window.scrollTo, which returns a promise in recent Chromium browsers. Fixed by adding curly braces.
