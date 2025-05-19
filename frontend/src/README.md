# JustClothing Frontend

## Project Structure

```
src/
├── assets/              # Static assets like images, fonts
├── components/          # Shared/common UI components
│   ├── ui/              # Basic UI components (buttons, inputs, etc.)
│   └── layout/          # Layout components (Header, Footer, etc.)
├── context/             # Global React Context providers
├── data/                # Mock data (to be replaced by API calls)
├── features/            # Feature-based modules
│   ├── auth/            # Authentication feature
│   │   ├── components/  # Auth-specific components
│   │   ├── hooks/       # Auth-specific custom hooks
│   │   └── services/    # Auth-specific API services
│   ├── cart/            # Cart feature
│   ├── checkout/        # Checkout feature
│   ├── product/         # Product feature
│   ├── store/           # Store/seller feature
│   └── order/           # Order feature
├── pages/               # Page components organized by user role
│   ├── customer/        # Customer-facing pages
│   ├── seller/          # Seller-facing pages
│   └── shared/          # Pages used by both customer and seller
├── services/            # Global API services
└── store/               # Global state management (Zustand)
```

## Guidelines

1. **Feature-based Organization**: 
   - Group code by feature rather than type when possible
   - Keep feature-specific components within their feature directory

2. **Component Structure**:
   - Use index.js files to export components from directories
   - Keep components focused on a single responsibility

3. **Page Structure**:
   - Organize pages by user role (customer, seller)
   - Pages import components but don't contain complex logic

4. **State Management**:
   - Use Zustand for global state
   - Use React Context for theme, auth, etc.
   - Use local state for component-specific needs

5. **Importing Convention**:
   - Import from index files when available
   - Use relative paths for imports within the same feature
   - Use absolute paths for imports across features 