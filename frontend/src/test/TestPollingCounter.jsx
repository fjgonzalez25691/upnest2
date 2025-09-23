import React, { useCallback, useRef } from "react";
import { usePolling } from "../hooks/usePolling";

export default function TestPollingCounter() {
  const countRef = useRef(0);     // contador de TICKS exitosos
  const targetRef = useRef(5);    // 5 o 10 según el botón

  // El fn suma 1 y lo devuelve como data
  const pollFn = useCallback(async () => {
    countRef.current += 1;
    return { count: countRef.current };
  }, []);

  const {
    data,
    error,
    isRunning,
    isFetching,
    start,
    stop,
    reset,
  } = usePolling(pollFn, {
    interval: 500,      // 0.5s entre ticks
    leading: true,      // dispara inmediatamente al arrancar
    enabled: false,     // lo lanzamos a demanda con start()
    pauseOnHidden: false,
    // OJO: attempts es "errores consecutivos", no ticks.
    // Por eso usamos data.count que devolvemos en pollFn.
    stopCondition: (data /*, attempts*/) => {
      const c = data?.count ?? 0;
      return c >= targetRef.current;
    },
  });

  const startTo = (n, fresh = true) => {
    targetRef.current = n;
    if (fresh) {
      // arrancar limpio desde 0
      countRef.current = 0;
      reset();
    }
    start();
  };

  return (
    <div style={{ padding: 16, fontFamily: "sans-serif" }}>
      <h2>Test usePolling (contador)</h2>
      <p>
        Count (ticks): <b>{data?.count ?? 0}</b>
        {"  "} | Running: <b>{String(isRunning)}</b>
        {"  "} | Fetching: <b>{String(isFetching)}</b>
      </p>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="border-2 bg-clip-padding" onClick={() => startTo(5, true)}>Start fresh to 5</button>
        <button className="border-2 bg-clip-padding" onClick={() => startTo(10, true)}>Start fresh to 10</button>
        <button className="border-2 bg-clip-padding" onClick={() => startTo(10, false)}>Continue to 10</button>
        <button className="border-2 bg-clip-padding" onClick={() => stop()}>Stop</button>
        <button className="border-2 bg-clip-padding" onClick={() => { stop(); countRef.current = 0; reset(); }}>
          Reset
        </button>
      </div>

      {error && <pre style={{ color: "red" }}>{String(error)}</pre>}
    </div>
  );
}