# Sign-Up Fix Instructions

## Problem

The profile update API call is double-stringifying the JSON body, causing the backend to reject it.

## Solution

Make these 3 changes to `app/(auth)/sign-up.tsx`:

### 1. Add import (around line 13)

```typescript
import { apiFetch } from '../../utils/api';
```

### 2. Add authToken to useStore (line 31)

Change:

```typescript
const { login, setSelectedCampus } = useStore();
```

To:

```typescript
const { login, setSelectedCampus, authToken } = useStore();
```

### 3. Update finishSetup function (lines 56-68)

Replace the entire `finishSetup` function with:

```typescript
const finishSetup = async () => {
  try {
    await apiFetch(
      'user/profile',
      {
        method: 'PUT',
        body: {
          name: formData.name,
          email: formData.email,
          dietary: formData.dietary,
        },
      },
      authToken || ''
    );

    login({
      user: {
        id: '',
        name: formData.name,
        email: formData.email,
        phone: '',
        dietaryPreference: formData.dietary,
        allergies: formData.allergies,
        campus: formData.campus,
        zCoins: 0,
      },
      token: authToken || '',
    });
    setSelectedCampus(formData.campus);
    setShowSuccess(true);
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 2500);
  } catch (error) {
    console.error('Failed to update profile:', error);
  }
};
```

**Key point:** Pass `body` as an object, NOT as `JSON.stringify(...)`. The `apiFetch` function handles stringification automatically.
