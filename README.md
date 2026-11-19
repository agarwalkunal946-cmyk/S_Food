# S_Food — Food Website Studio

A responsive, food-first ecommerce template built with Next.js (JavaScript/JSX), MongoDB, and an admin studio. Start with a restaurant, takeaway, café, bakery, grocery shop, or meal-prep kitchen template, then edit the storefront, menu, ingredients, dietary labels, prices, photos, and delivery settings from the admin panel.

## Clone this project

```sh
git clone https://github.com/agarwalkunal946-cmyk/S_Food.git
cd S_Food
```

## Run locally

Requirements: Node.js 20.9 or newer, npm, and Docker Desktop (or a reachable MongoDB Atlas database).

1. Install packages and create your local environment file:

   ```sh
   npm install
   cp .env.example .env
   ```

   In Windows PowerShell, use `Copy-Item .env.example .env`.

2. Open `.env`. The sample file points to a separate local database named `food_store`. Change the sample `SESSION_SECRET` to a random string of at least 32 characters, and set the admin email/password you want to use before seeding. To use Atlas, replace `MONGODB_URI` with your own Atlas connection string and database name.

3. Start MongoDB and add the food demo catalog:

   ```sh
   npm run db:up
   npm run seed
   ```

   Seeding is repeatable: it adds missing products and creates the admin account if it does not already exist. It does not overwrite products you have edited or an existing admin password.

4. Start the website:

   ```sh
   npm run dev
   ```

   - Storefront: [http://localhost:3000](http://localhost:3000)
   - Admin panel: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

   The sample local admin login is `admin@food.local` / `ChangeThisForLocalSetup123!`; change it in `.env` before running `npm run seed` for the first time. Stop the local database with `npm run db:down`.

## Food business templates

In **Admin → Storefront**, choose a starting design for:

- Restaurant and takeaway menus
- Café and coffee shops
- Bakeries and dessert shops
- Grocery and pantry stores
- Meal prep and catering kitchens

Every content field can be edited. Add menu items with serving size, ingredients, allergens, dietary labels, nutrition, origin, stock, and price. Upload food photos from your computer or paste image URLs. Uploaded files are stored in MongoDB GridFS. The seed creates a varied food catalog so the storefront has useful example dishes, baked goods, drinks, and grocery staples.

The storefront includes search and category, brand, price, stock, and rating filters, a shopping cart, order management, and Razorpay checkout. Add Razorpay **test mode** keys to `.env` to try checkout; leave both key fields blank to keep payments disabled. Checkout is currently INR-only.

## Configuration

`.env.example` lists the environment variables:

- `MONGODB_URI`: local `food_store` database or your cloud MongoDB URI.
- `SESSION_SECRET`: private random string used to sign admin sessions.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: initial admin account created by the seed command.
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`: optional server-only Razorpay keys.

Do not commit `.env` or production secrets. `.env` is ignored by Git.

## Deploy

Vercel runs the Next.js routes as serverless functions; MongoDB Atlas stores the menu, settings, orders, and uploaded images. To deploy, link this folder with `npx vercel`, add the variables above in the Vercel project settings, allow Vercel to connect in Atlas network access, seed the intended Atlas database once, then run `npx vercel --prod`.

An AWS Lambda deployment path is also included using SST and OpenNext. Configure AWS credentials, a cloud-reachable MongoDB URI, and SST secrets before running `npm run aws:deploy -- --stage production`. Serverless hosting is pay-per-use but does not guarantee zero hosting or database cost.
