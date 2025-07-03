import React from "react";
import { useAuth } from "react-oidc-context";

export default function App() {
  const auth = useAuth();

  if (auth.isLoading) return <div>Loading...</div>;

  if (auth.error) return <div>Auth error: {auth.error.message}</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1>UpNest App</h1>
      {auth.isAuthenticated ? (
        <div>
          <h2>¡Usuario autenticado!</h2>
          <button onClick={() => auth.removeUser()}>Logout</button>
          <pre style={{ background: "#eee", padding: 12 }}>
            {JSON.stringify({
              id_token: auth.user?.id_token?.slice(0, 20) + "...",
              access_token: auth.user?.access_token?.slice(0, 20) + "...",
              profile: auth.user?.profile,
            }, null, 2)}
          </pre>
        </div>
      ) : (
        <div>
          <h2>Usuario NO autenticado</h2>
          <button onClick={() => auth.signinRedirect()}>Login</button>
        </div>
      )}
    </div>
  );
}
