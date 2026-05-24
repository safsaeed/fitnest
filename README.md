This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Getting Started

## Basic overview:
Next.js app
-> Prisma -> Supabase Postgres

## For Prisma setup

1. ```npx prisma init```

2. ```npx prisma migrate dev --name init``` Migrate models to sql

3. ```npx prisma generate```

4. ```npm run prisma-seed```
    1. Inital test data 
    2. **MAKE SURE DEV IT WILL CLEAR EXISTING DB**

5. ```npx prisma studio ```
    1. Open DB view

## To reset with empty DB with tables 
(THIS WILL CLEAR DATABASE)

```bash
npx prisma db push --force-reset
```

## To create/ update an Admin User
Edit the details in ```create-admin.ts```

```bash
npx tsx prisma/create-admin.ts
```

## Random secret string for auth:

For the env var: **AUTH_SECRET** - run command:

```bash 
openssl rand -base64 32 
```

## Run the app

```bash
npm install
rm -rf .next
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Stripe webhook credential

### In terminal 

```bash
brew install stripe/stripe-cli/stripe
stripe login
```

After login complete, forward the events

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

In .env paste the ```whsec-…``` to **STRIPE_WEBHOOK_SECRET**=```"whsec_...”```

*Restart the app*


