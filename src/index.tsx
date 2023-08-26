import React from "react";
import { createRoot } from 'react-dom/client';
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { runJobs } from "./utils/scheduledJobs";

const container = document.getElementById('app');
const root = createRoot(container!);
// Starts scheduled jobs
console.log("INDEX TSX")
runJobs()

root.render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
