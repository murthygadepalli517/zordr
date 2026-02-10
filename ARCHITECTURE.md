# Zordr Project Architecture & Flow

## User Flow Diagram

This diagram illustrates the core user journey, including the newly implemented **Closed Outlet Handling** and **QR Scanner** features.

```mermaid
graph TD
    User([User]) --> Home[Home Screen]
    Home --> SelectOutlet{Select Outlet}

    SelectOutlet -- "Outlet Closed" --> AlertClosed[Show Alert: Outlet Closed]
    AlertClosed --> Home

    SelectOutlet -- "Outlet Open" --> ViewMenu[View Menu]
    ViewMenu --> AddToCart[Add Items to Cart]
    AddToCart --> Checkout[Checkout Screen]

    Checkout --> CheckStatus{Is Outlet Open?}
    CheckStatus -- "No (Closed Recently)" --> AlertClosedCheckout[Show Alert & Redirect]
    AlertClosedCheckout --> Home

    CheckStatus -- "Yes" --> Payment[Payment Processing]
    Payment --> OrderPlaced[Order Confirmation Screen]

    subgraph OrderLifecycle ["Order Lifecycle"]
        OrderPlaced -- "Status: Pending" --> StatusPending(Waiting for Acceptance)
        StatusPending -- "Status: Preparing" --> StatusPreparing(Kitchen Preparing)
        StatusPreparing -- "Status: Ready" --> StatusReady(Ready for Pickup)
    end

    StatusReady --> ShowQRButton[Show 'Scan Order QR' Button]
    ShowQRButton --> UserClickQR[User Taps Button]
    UserClickQR --> QRScanner[QR Scanner Screen]

    QRScanner --> Camera{Camera Permission?}
    Camera -- "Denied" --> ShowPermError[Show Permission Error]
    Camera -- "Granted" --> ScanCode[Scan QR Code]

    ScanCode -- "Valid Scan" --> APIValidate[Validate with Backend]
    APIValidate --> PickupSuccess[Pickup Success Screen]
```

## High-Level Architecture

The Zordr ecosystem consists of the Mobile App, Partner App (implied), and the Backend.

```mermaid
graph TB
    subgraph MobileApp ["Mobile App (React Native / Expo)"]
        UI[UI Components]
        Nav[Expo Router]
        Store[StoreContext (Zustand)]

        UI --> Nav
        UI --> Store
        Nav --> Screens

        subgraph Screens
            HomeSc[Home Screen]
            CheckoutSc[Checkout Screen]
            OrderConfSc[Order Confirmation]
            QRSc[QR Scanner]
        end
    end

    subgraph BackendSystem ["Backend (Node.js / Express)"]
        API[API Routes]
        Auth[Middleware (Auth)]
        DB_Adapter[Database Adapter]

        API --> Auth
        Auth --> DB_Adapter
    end

    subgraph DatabaseSystem ["Database (PostgreSQL)"]
        Users
        Orders
        Outlets
        Products
    end

    Store -- "REST API (Axios)" --> API
    DB_Adapter -- "SQL Queries" --> DatabaseSystem
```

## Key Feature Implementation Details

### 1. Closed Outlet Handling

- **Home Screen**: Prevents selection of closed outlets immediately.
- **Checkout Screen**: Re-validates outlet status before fetching time slots to handle cases where an outlet closes while the user is browsing.
- **Backend**: Returns empty slots if the outlet is closed, adding a final layer of validation.

### 2. QR Scanner Flow

- **Entry Point**: `OrderConfirmationScreen` (only visible when Order Status is 'Ready').
- **Technology**: `expo-camera` for camera access and barcode scanning.
- **UX**:
  - Dark overlay with transparent scanning frame.
  - Corner brackets for visual guidance.
  - Haptic feedback on successful scan.

```

```
