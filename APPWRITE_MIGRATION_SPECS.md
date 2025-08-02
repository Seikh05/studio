
# Appwrite Backend Migration Specification
## Robostreaks Inventory Manager

This document outlines the technical specifications required to migrate the Robostreaks Inventory Manager application from a `localStorage`-based frontend to a centralized Appwrite backend.

---

### 1. Database Schema (`appwrite-db`)

A single database named `appwrite-db` will be created. It will contain the following collections:

#### 1.1. `inventory` Collection

Stores all individual inventory items.

- **Collection ID**: `inventory`
- **Name**: Inventory

**Attributes:**

| Attribute ID  | Type           | Size | Required | Default | Notes                                               |
|---------------|----------------|------|----------|---------|---------------------------------------------------|
| `name`        | String         | 255  | Yes      |         | Name of the item.                                 |
| `category`    | String         | 255  | Yes      |         | e.g., "Gadgets", "Robotics".                      |
| `status`      | String         | 50   | Yes      |         | "In Stock", "Low Stock", or "Out of Stock".       |
| `stock`       | Integer        |      | Yes      | 0       | Current available quantity.                       |
| `description` | String         | 5000 | No       |         | Detailed description of the item.                 |
| `imageUrl`    | String         | 2048 | No       |         | URL of the item's image.                          |
| `lastUpdated` | Datetime       |      | Yes      |         | ISO 8601 string. Updates on any change.           |

**Indexes:**

| Index ID      | Type  | Attributes | Orders    |
|---------------|-------|------------|-----------|
| `idx_name`    | key   | `name`     | `ASC`     |
| `idx_category`| key   | `category` | `ASC`     |
| `idx_status`  | key   | `status`   | `ASC`     |

**Sample Document:**
```json
{
    "$id": "ITEM-8782",
    "name": "Quantum Flux-o-Matic",
    "category": "Gadgets",
    "status": "In Stock",
    "stock": 120,
    "description": "A state-of-the-art device that manipulates quantum fields. Perfect for time-travel enthusiasts and hobbyists.",
    "imageUrl": "https://placehold.co/80x80.png",
    "lastUpdated": "2024-07-28T00:00:00.000Z",
    "$createdAt": "...",
    "$updatedAt": "...",
    "$permissions": [...]
}
```

---

#### 1.2. `users` Collection

This will supplement Appwrite's built-in `auth` service to store application-specific user metadata like `role`.

- **Collection ID**: `users`
- **Name**: Users

**Attributes:**

| Attribute ID  | Type     | Size | Required | Default    | Notes                                                  |
|---------------|----------|------|----------|------------|--------------------------------------------------------|
| `name`        | String   | 255  | Yes      |            | User's full name.                                      |
| `role`        | String   | 50   | Yes      | "New User" | "Super Admin", "Admin", "General Member", "New User".  |
| `avatarUrl`   | String   | 2048 | No       |            | URL to the user's profile picture.                     |
| `phone`       | String   | 50   | No       |            | User's phone number.                                   |
| `regdNum`     | String   | 50   | No       |            | User's registration number.                            |
| `lastLogin`   | Datetime |      | Yes      |            | ISO 8601 string, updated on login.                     |

**Note:** The document `$id` for this collection should match the Appwrite Auth User ID for easy relation.

**Indexes:**

| Index ID   | Type | Attributes | Orders |
|------------|------|------------|--------|
| `idx_role` | key  | `role`     | `ASC`  |

**Sample Document:**
```json
{
    "$id": "USR-001", // Appwrite Auth User ID
    "name": "Alice Johnson",
    "role": "Super Admin",
    "avatarUrl": "https://placehold.co/40x40.png",
    "phone": "9876543210",
    "regdNum": "21050001",
    "lastLogin": "2024-07-28T10:00:00.000Z",
    "$createdAt": "...",
    "$updatedAt": "...",
    "$permissions": [...]
}
```
---

#### 1.3. `transactions` Collection

Tracks all borrow and return events for inventory items.

- **Collection ID**: `transactions`
- **Name**: Transactions

**Attributes:**

| Attribute ID        | Type     | Size | Required | Default | Notes                                                   |
|---------------------|----------|------|----------|---------|-------------------------------------------------------|
| `itemId`            | String   | 255  | Yes      |         | ID of the related inventory item.                       |
| `type`              | String   | 50   | Yes      |         | "borrow" or "return".                                 |
| `quantity`          | Integer  |      | Yes      |         | Quantity of items in the transaction.                 |
| `borrowerName`      | String   | 255  | No       |         | Name of the person borrowing.                         |
| `borrowerRegdNum`   | String   | 50   | No       |         | Registration number of the borrower.                  |
| `borrowerPhone`     | String   | 50   | No       |         | Phone number of the borrower.                         |
| `returnDate`        | Datetime |      | No       |         | Expected return date for a borrow.                      |
| `notes`             | String   | 5000 | No       |         | Optional notes about the transaction.                 |
| `adminId`           | String   | 255  | Yes      |         | Appwrite User ID of the admin who logged this.        |
| `adminName`         | String   | 255  | Yes      |         | Name of the admin for easy display.                   |
| `isSettled`         | Boolean  |      | No       | `false` | For borrows, `true` if all items are returned.        |
| `quantityReturned`  | Integer  |      | No       | `0`     | For borrows, tracks how many have been returned.      |
| `relatedBorrowId`   | String   | 255  | No       |         | For returns, links back to the original borrow txn.   |
| `itemName`          | String   | 255  | No       |         | Denormalized for easy display in logs.                |
| `timestamp`         | Datetime |      | Yes      |         | ISO 8601 string of when the transaction occurred.     |

**Indexes:**

| Index ID                | Type | Attributes        | Orders    |
|-------------------------|------|-------------------|-----------|
| `idx_itemId`            | key  | `itemId`          | `ASC`     |
| `idx_timestamp`         | key  | `timestamp`       | `DESC`    |
| `idx_type_isSettled`    | key  | `type`, `isSettled` | `ASC`,`ASC` |

**Sample Document:**
```json
{
    "$id": "TXN-1672531200000",
    "itemId": "ITEM-8782",
    "type": "borrow",
    "quantity": 5,
    "borrowerName": "Bob Williams",
    "returnDate": "2024-08-15T00:00:00.000Z",
    "adminId": "USR-001",
    "adminName": "Alice Johnson",
    "isSettled": false,
    "quantityReturned": 0,
    "timestamp": "2024-07-30T10:00:00.000Z",
    "$createdAt": "...",
    "$updatedAt": "...",
    "$permissions": [...]
}
```

---

#### 1.4. `logs` Collection

Stores a general audit trail of administrative actions.

- **Collection ID**: `logs`
- **Name**: Logs

**Attributes:**

| Attribute ID  | Type     | Size | Required | Default | Notes                                        |
|---------------|----------|------|----------|---------|----------------------------------------------|
| `adminName`   | String   | 255  | Yes      |         | Name of admin performing the action.         |
| `action`      | String   | 255  | Yes      |         | e.g., "Item Added", "User Deleted".          |
| `details`     | String   | 5000 | Yes      |         | Description of the action.                   |
| `timestamp`   | Datetime |      | Yes      |         | ISO 8601 string.                             |

**Indexes:**

| Index ID        | Type | Attributes  | Orders |
|-----------------|------|-------------|--------|
| `idx_timestamp` | key  | `timestamp` | `DESC` |

---

#### 1.5. `categories` Collection

Stores the list of available inventory categories.

- **Collection ID**: `categories`
- **Name**: Categories

**Attributes:**

| Attribute ID | Type   | Size | Required | Default | Notes              |
|--------------|--------|------|----------|---------|--------------------|
| `name`       | String | 255  | Yes      |         | e.g., "Gadgets".   |

**Indexes:**

| Index ID   | Type | Attributes | Orders |
|------------|------|------------|--------|
| `idx_name` | key  | `name`     | `ASC`  |

---

### 2. Authentication

Appwrite's built-in Authentication service will be used.

**User Roles & Permissions:**
User permissions are managed via the `role` attribute in the custom `users` collection.
- **Super Admin**: Full CRUD access on all collections. Can manage other users, including promoting/demoting Admins.
- **Admin**: CRUD access on `inventory`, `transactions`, `logs`, and `categories`. Can view `users`. Cannot manage other 'Admin' or 'Super Admin' users. Can approve 'New User' roles to 'General Member'.
- **General Member**: Read-only access to `inventory`. Cannot access dashboard pages.
- **New User**: A temporary role for newly registered users. They have no read/write permissions until approved by an Admin/Super Admin.

**Required User Fields (in Auth):**
- `email` (primary identifier)
- `password`
- `name`

---

### 3. File Storage

A single storage bucket is required.

- **Bucket ID**: `item-images`
- **Name**: Item Images
- **File Size Limit**: 5MB
- **Allowed Extensions**: `png`, `jpg`, `jpeg`, `webp`
- **Permissions**: Publicly readable, but write access is restricted to Admins and Super Admins.

**Current Handling:**
- **User Avatars (`profile/page.tsx`)**: Images are read from the user's local machine, converted to a Base64 data URI, and stored in `localStorage`.
- **Item Images (`inventory/item-form.tsx`)**: Handled identically to user avatars, including an option for camera capture which also produces a data URI.

**Migration Plan:**
- When an image is uploaded or captured, it will first be uploaded to the `item-images` bucket.
- The public URL returned by Appwrite will then be stored in the `imageUrl` field of the corresponding `inventory` or `users` document.

---

### 4. `localStorage` to API Endpoint Mapping

| Local Storage Key                     | Data Operation             | Target Collection | Appwrite API Call          | Real-time? | Notes                                                        |
|---------------------------------------|----------------------------|-------------------|----------------------------|------------|--------------------------------------------------------------|
| `inventory-data`                      | `getItem`, `setItem`       | `inventory`       | `listDocuments`, `createDocument`, `updateDocument`, `deleteDocument` | Yes        | Used in the main inventory table and item detail page.       |
| `transactions-` (prefixed)            | `getItem`, `setItem`       | `transactions`    | `listDocuments`, `createDocument` | Yes        | One-to-many relationship with `inventory`.                 |
| `user-data`                           | `getItem`, `setItem`       | `users` (custom)  | `listDocuments`, `createDocument`, `updateDocument`, `deleteDocument` | No         | Also requires calls to `account` and `teams` APIs.         |
| `logged-in-user`                      | `getItem`, `setItem`, `removeItem` | Auth Service      | `createEmailPasswordSession`, `getAccount`, `deleteSession` | N/A        | Manages the current user session.                          |
| `logs-data`                           | `getItem`, `setItem`       | `logs`            | `listDocuments`, `createDocument` | Yes        | Needs to be updated whenever CRUD ops happen.              |
| `inventory-categories`                | `getItem`, `setItem`       | `categories`      | `listDocuments`, `createDocument`, `updateDocument`, `deleteDocument` | No         |                                                              |
| `notifications-data`                  | `getItem`, `setItem`       | (To be deprecated) | N/A                        | N/A        | Appwrite's real-time can be used to generate notifications.  |

---

### 5. Security & Permission Rules

Permissions should be configured at the **collection level**.

- **`inventory` Collection:**
  - **Read**: `role:Admin`, `role:Super Admin`, `role:General Member`
  - **Create**: `role:Admin`, `role:Super Admin`
  - **Update**: `role:Admin`, `role:Super Admin`
  - **Delete**: `role:Admin`, `role:Super Admin`

- **`users` (custom) Collection:**
  - **Read**: `role:Admin`, `role:Super Admin`
  - **Create**: `role:Super Admin` (Only Super Admins can add new users directly)
  - **Update**: `role:Super Admin`, `user:$id` (A user can update their own document, e.g., for profile changes).
  - **Delete**: `role:Super Admin`

- **`transactions` Collection:**
  - **Read**: `role:Admin`, `role:Super Admin`
  - **Create**: `role:Admin`, `role:Super Admin`
  - **Update**: `role:Admin`, `role:Super Admin` (For settling borrows)
  - **Delete**: `role:Super Admin` (Deletion should be rare)

- **`logs` Collection:**
  - **Read**: `role:Admin`, `role:Super Admin`
  - **Create**: `role:Admin`, `role:Super Admin`
  - **Update**: `role:Super Admin` (For hiding/unhiding)
  - **Delete**: `role:Super Admin`

- **`categories` Collection:**
  - **Read**: `role:Admin`, `role:Super Admin`, `role:General Member`
  - **Create**: `role:Admin`, `role:Super Admin`
  - **Update**: `role:Admin`, `role:Super Admin`
  - **Delete**: `role:Admin`, `role_Super Admin`

- **`item-images` (Storage Bucket):**
  - **Read**: `any` (Public)
  - **Create**: `role:Admin`, `role:Super Admin`
  - **Update**: `role:Admin`, `role:Super Admin`
  - **Delete**: `role:Admin`, `role:Super Admin`

---

### 6. Current Code Structure Overview

- **Data Types**: Defined in `src/lib/types.ts`.
- **State Management**: Primarily `React.useState` and `React.useEffect` hooks within components. Data is fetched from `localStorage` on component mount and saved back on updates.
- **Data Persistence Logic**:
  - `src/app/(dashboard)/inventory/page.tsx`: Reads initial inventory data.
  - `src/components/inventory/inventory-data-table.tsx`: Main component for inventory CRUD. Contains `handleSaveItem` and `handleDelete` which call `localStorage.setItem`.
  - `src/app/(dashboard)/inventory/[id]/page.tsx`: Manages transactions for a single item. `handleAddTransaction` and `handleReturnTransaction` save to `localStorage`.
  - `src/components/users/users-data-table.tsx`: Manages user CRUD. `handleSaveUser` and `handleDelete` save to `localStorage`.
  - `src/app/(dashboard)/dashboard/page.tsx`: Aggregates data from multiple `localStorage` keys to display stats.
  - `src/app/(dashboard)/due-items/page.tsx`: Fetches and processes data from `inventory-data` and `transactions-` keys.

**Migration will require refactoring these components to replace `localStorage.getItem/setItem` calls with the Appwrite SDK equivalents.** State management should be updated to handle asynchronous data fetching, loading states, and errors from the API.
