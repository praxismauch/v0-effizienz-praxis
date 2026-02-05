# Context Provider Guidelines

## Golden Rules

### 1. Never Conditionally Render Providers

❌ **WRONG:**
```tsx
function Providers({ children }) {
  if (!user) {
    return <BasicProviders>{children}</BasicProviders>
  }
  
  return (
    <FullProviders>
      {children}
    </FullProviders>
  )
}
```

✅ **CORRECT:**
```tsx
function Providers({ children }) {
  return (
    <FullProviders>
      {children}
    </FullProviders>
  )
}
```

**Why:** If a component uses `useContext(SomeContext)`, the provider MUST be in the tree. Conditional rendering creates race conditions.

### 2. Providers Must Always Be Present

If any component in your app uses a context hook, the corresponding provider must ALWAYS be in the component tree, regardless of route, auth state, or any other condition.

**The Rule:**
- Component uses `useOnboarding()` → `OnboardingProvider` must be in tree
- Component uses `useUser()` → `UserProvider` must be in tree
- Component uses `usePractice()` → `PracticeProvider` must be in tree

### 3. Conditional Logic Goes INSIDE Providers

❌ **WRONG:**
```tsx
// Conditional provider
{isAuthenticated && (
  <UserProvider>
    <Dashboard />
  </UserProvider>
)}
```

✅ **CORRECT:**
```tsx
// Always provide, conditional logic inside
<UserProvider>
  {isAuthenticated ? <Dashboard /> : <Login />}
</UserProvider>
```

### 4. Use Lazy Loading for Heavy Components, Not Providers

❌ **WRONG:**
```tsx
const ConditionalProvider = lazy(() => import('./HeavyProvider'))
```

✅ **CORRECT:**
```tsx
// Provider always loaded
<HeavyProvider>
  {/* Lazy load components instead */}
  <Suspense fallback={<Loading />}>
    <LazyHeavyComponent />
  </Suspense>
</HeavyProvider>
```

## When to Use Context

✅ **Good Use Cases:**
- User authentication state
- Theme/locale (rarely changes)
- Feature flags
- Global UI state (sidebar open/closed)

❌ **Bad Use Cases:**
- API data that could be props
- Form state
- Local component state
- Route-specific data
- Data that changes frequently

## Better Alternatives to Context

### 1. Server Components + Props
```tsx
// app/dashboard/page.tsx (Server Component)
async function DashboardPage() {
  const user = await getUser()
  const practice = await getPractice(user.practiceId)
  
  return <DashboardClient user={user} practice={practice} />
}
```

### 2. Component Composition
```tsx
// Instead of context
<Dashboard>
  <Sidebar user={user} />
  <Content practice={practice} />
</Dashboard>
```

### 3. URL State
```tsx
// Use search params instead of context
const searchParams = useSearchParams()
const view = searchParams.get('view') || 'grid'
```

### 4. Zustand for Client State
```tsx
// Better than context for frequently changing state
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}))
```

## Context Performance Tips

### 1. Split Large Contexts
❌ **WRONG:**
```tsx
const AppContext = {
  user,
  practice,
  team,
  todos,
  calendar,
  workflows,
  analytics
}
```

✅ **CORRECT:**
```tsx
// Separate contexts = better performance
<UserContext>
  <PracticeContext>
    <TeamContext>
```

### 2. Memoize Context Values
```tsx
const value = useMemo(
  () => ({ user, updateUser }),
  [user] // Only re-create when user changes
)

return <UserContext.Provider value={value}>
```

### 3. Separate State and Actions
```tsx
// State context (changes often)
const UserStateContext = createContext(user)

// Actions context (never changes)
const UserActionsContext = createContext({ updateUser, logout })
```

## Error Handling

### Always Provide Default Values
```tsx
const UserContext = createContext<User | null>(null)

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within UserProvider')
  }
  return context
}
```

### Wrap Providers in Error Boundaries
```tsx
<ErrorBoundary fallback={<FallbackUI />}>
  <UserProvider>
    {children}
  </UserProvider>
</ErrorBoundary>
```

### Handle Loading States
```tsx
function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  )
}
```

## Testing Contexts

### Provide Test Utilities
```tsx
// test-utils.tsx
export function renderWithProviders(ui: ReactElement) {
  return render(
    <UserProvider>
      <PracticeProvider>
        {ui}
      </PracticeProvider>
    </UserProvider>
  )
}
```

### Mock Contexts for Tests
```tsx
const mockUser = { id: '1', name: 'Test User' }

jest.mock('@/contexts/user-context', () => ({
  useUser: () => mockUser
}))
```

## Migration Guide: From Context to Better Patterns

### Step 1: Identify Context Usage
```bash
# Find all context usage
grep -r "useContext\|createContext" .
```

### Step 2: Categorize
- **Keep:** Auth, theme, locale (truly global)
- **Server Props:** API data, user info, practice data
- **Local State:** Forms, modals, toggles
- **Zustand:** Frequently changing client state

### Step 3: Refactor Gradually
1. Start with one context
2. Move server data to Server Components
3. Move local state to component state
4. Test thoroughly
5. Repeat for next context

## Common Mistakes

### 1. Context for Everything
"When you have a hammer, everything looks like a nail"

Context is overused. Most state should be:
- Props (server components)
- Local component state
- URL state
- Dedicated state library

### 2. Putting Too Much in Context
```tsx
// TOO BIG
const AppContext = {
  user,
  practice,
  team,
  settings,
  todos,
  calendar,
  notifications,
  ...100 more fields
}
```

### 3. Not Memoizing Context Values
```tsx
// Re-creates object on every render = all consumers re-render
<Context.Provider value={{ user, updateUser }}>
```

### 4. Fetching in Contexts
```tsx
// DON'T DO THIS
function UserProvider() {
  useEffect(() => {
    fetch('/api/user').then(setUser)
  }, [])
}
```

Fetch in Server Components instead.

## Checklist Before Adding a New Context

- [ ] Is this truly global state?
- [ ] Will this be used by 3+ distant components?
- [ ] Can this be props instead?
- [ ] Can this be Server Component data?
- [ ] Can this be URL state?
- [ ] Have I considered Zustand?
- [ ] Is this worth the bundle size?
- [ ] Will this cause performance issues?
- [ ] Do I have error boundaries?
- [ ] Have I memoized the value?

## References

- [React Context Docs](https://react.dev/reference/react/useContext)
- [When to Use Context](https://react.dev/learn/passing-data-deeply-with-context)
- [Performance Optimization](https://react.dev/reference/react/memo)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

## Need Help?

If you're unsure whether to use context:
1. Default to NOT using it
2. Try props first
3. Try Server Components
4. Try local state
5. Only then consider context

Remember: **The best context is no context.**
