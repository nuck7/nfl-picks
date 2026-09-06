import React from "react";
import { createRoot } from 'react-dom/client';
import App from "./App";
import { BrowserRouter } from "react-router-dom";
// Self-hosted so the font is same-origin and versioned with the build. The
// weight-axis file only: no italic, no optical-size axis. Its @font-face
// blocks are unicode-range gated, so a browser fetches the latin subset
// alone (~48KB) and never requests the others.
import '@fontsource-variable/inter/wght'

const container = document.getElementById('app');
const root = createRoot(container!);

root.render(
    <BrowserRouter>
        <App />
    </BrowserRouter>
);
