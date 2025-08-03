# Supabase Backend Migration Specification
## Robostreaks Inventory Manager

This document outlines the technical specifications required to migrate the Robostreaks Inventory Manager application from a `localStorage`-based frontend to a centralized Supabase backend.

---

### 1. Database Schema

The following tables should be created in the `public` schema of your Supabase project.

#### 1.1. `profiles` Table

This table extends the built-in `auth.users` table to store application-specific user data.

**SQL Schema:**
```sql
-- Custom type for user roles for data integrity
CREATE TYPE public.user_role AS ENUM (
    'Super Admin',
    'Admin',
    'General Member',
    'New User'
);

-- Profiles table linked to auth.users
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    role user_role NOT NULL DEFAULT 'New User',
    avatar_url text,
    phone text,
    regd_num text,
    last_login timestamptz
);

-- Indexes
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Helper function to get a user's role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role::text FROM public.profiles WHERE id = user_id;
$$;
```

#### 1.2. `categories` Table

Stores the list of available inventory categories.

**SQL Schema:**
```sql
CREATE TABLE public.categories (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_categories_name ON public.categories(name);
```

#### 1.3. `inventory` Table

Stores all individual inventory items.

**SQL Schema:**
```sql
-- Custom type for item status
CREATE TYPE public.item_status AS ENUM (
    'In Stock',
    'Low Stock',
    'Out of Stock'
);

CREATE TABLE public.inventory (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    category_id uuid NOT NULL REFERENCES public.categories(id),
    status item_status NOT NULL DEFAULT 'In Stock',
    stock integer NOT NULL DEFAULT 0,
    description text,
    image_url text,
    last_updated timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_inventory_name ON public.inventory(name);
CREATE INDEX idx_inventory_category_id ON public.inventory(category_id);
CREATE INDEX idx_inventory_status ON public.inventory(status);
```

#### 1.4. `transactions` Table

Tracks all borrow and return events for inventory items.

**SQL Schema:**
```sql
-- Custom type for transaction type
CREATE TYPE public.transaction_type AS ENUM (
    'borrow',
    'return'
);

CREATE TABLE public.transactions (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id uuid NOT NULL REFERENCES public.inventory(id),
    type transaction_type NOT NULL,
    quantity integer NOT NULL,
    borrower_name text,
    borrower_regd_num text,
    borrower_phone text,
    return_date timestamptz,
    notes text,
    admin_id uuid NOT NULL REFERENCES auth.users(id),
    admin_name text NOT NULL,
    is_settled boolean DEFAULT false,
    quantity_returned integer DEFAULT 0,
    related_borrow_id uuid REFERENCES public.transactions(id),
    item_name text, -- Denormalized for easy display
    timestamp timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_transactions_item_id ON public.transactions(item_id);
CREATE INDEX idx_transactions_timestamp ON public.transactions(timestamp DESC);
CREATE INDEX idx_transactions_type_is_settled ON public.transactions(type, is_settled);
```

#### 1.5. `logs` Table

Stores a general audit trail of administrative actions.

**SQL Schema:**
```sql
CREATE TABLE public.logs (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_name text NOT NULL,
    action text NOT NULL,
    details text NOT NULL,
    timestamp timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_logs_timestamp ON public.logs(timestamp DESC);
```

---

### 2. Authentication

*   Leverage Supabase's built-in Authentication (`auth`).
*   When a new user signs up via `supabase.auth.signUp()`, a trigger should automatically create a corresponding entry in the `public.profiles` table.

**SQL Trigger for New Users:**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'name', 'New User', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

---

### 3. Storage

*   Create a single public bucket in Supabase Storage.
*   **Bucket Name**: `item-images`
*   **Permissions**:
    *   **SELECT**: Public access for viewing images.
    *   **INSERT / UPDATE / DELETE**: Restricted to authenticated users with the role of `Admin` or `Super Admin`. This is enforced via Storage policies.

**Storage Policies:**
```sql
-- Policy: Allow public read access to all files
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'item-images' );

-- Policy: Allow Admins to upload files
CREATE POLICY "Allow Admin Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'item-images' AND
  (SELECT public.get_user_role(auth.uid())) IN ('Admin', 'Super Admin')
);

-- Policy: Allow Admins to update their own files
CREATE POLICY "Allow Admin Update"
ON storage.objects FOR UPDATE
USING (
  (SELECT public.get_user_role(auth.uid())) IN ('Admin', 'Super Admin')
)  WITH CHECK (
  bucket_id = 'item-images'
);

-- Policy: Allow Admins to delete files
CREATE POLICY "Allow Admin Delete"
ON storage.objects FOR DELETE
USING (
  (SELECT public.get_user_role(auth.uid())) IN ('Admin', 'Super Admin')
);

```

---

### 4. Row Level Security (RLS)

Enable RLS on all tables and create policies to enforce the application's access control rules.

#### `profiles` Table
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow admins to view all profiles" ON public.profiles
FOR SELECT USING ((SELECT public.get_user_role(auth.uid())) IN ('Admin', 'Super Admin'));

CREATE POLICY "Allow users to update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow Super Admins to update any profile" ON public.profiles
FOR UPDATE USING ((SELECT public.get_user_role(auth.uid())) = 'Super Admin');
```

#### `inventory` Table
```sql
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all authenticated users" ON public.inventory
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to insert inventory" ON public.inventory
FOR INSERT WITH CHECK ((SELECT public.get_user_role(auth.uid())) IN ('Admin', 'Super Admin'));

CREATE POLICY "Allow admins to update inventory" ON public.inventory
FOR UPDATE USING ((SELECT public.get_user_role(auth.uid())) IN ('Admin', 'Super Admin'));

CREATE POLICY "Allow admins to delete inventory" ON public.inventory
FOR DELETE USING ((SELECT public.get_user_role(auth.uid())) IN ('Admin', 'Super Admin'));
```

#### `transactions` Table
```sql
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins to view all transactions" ON public.transactions
FOR SELECT USING ((SELECT public.get_user_role(auth.uid())) IN ('Admin', 'Super Admin'));

CREATE POLICY "Allow admins to create transactions" ON public.transactions
FOR INSERT WITH CHECK ((SELECT public.get_user_role(auth.uid())) IN ('Admin', 'Super Admin'));

CREATE POLICY "Allow admins to update transactions" ON public.transactions
FOR UPDATE USING ((SELECT public.get_user_role(auth.uid())) IN ('Admin', 'Super Admin'));

CREATE POLICY "Allow Super Admins to delete transactions" ON public.transactions
FOR DELETE USING ((SELECT public.get_user_role(auth.uid())) = 'Super Admin');
```

#### `logs` Table
```sql
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins to view logs" ON public.logs
FOR SELECT USING ((SELECT public.get_user_role(auth.uid())) IN ('Admin', 'Super Admin'));

-- No insert/update/delete policies on logs. These should be handled by database functions or backend logic for security.
```

#### `categories` Table
```sql
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all authenticated users" ON public.categories
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to create categories" ON public.categories
FOR INSERT WITH CHECK ((SELECT public.get_user_role(auth.uid())) IN ('Admin', 'Super Admin'));

CREATE POLICY "Allow admins to update categories" ON public.categories
FOR UPDATE USING ((SELECT public.get_user_role(auth.uid())) IN ('Admin', 'Super Admin'));

CREATE POLICY "Allow admins to delete categories" ON public.categories
FOR DELETE USING ((SELECT public.get_user_role(auth.uid())) IN ('Admin', 'Super Admin'));
```

---

### 5. Frontend Integration

*   Install the `@supabase/supabase-js` library.
*   Create a Supabase client instance in your Next.js application.
*   Replace all `localStorage.getItem/setItem` calls with the corresponding Supabase client methods (`supabase.from('table_name').select()`, `.insert()`, `.update()`, etc.).
*   Refactor components to handle asynchronous data fetching, including loading and error states.
*   Implement Supabase Realtime for live data updates on the dashboard and transaction pages.
