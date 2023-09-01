import React from "react";
import { createRoot } from 'react-dom/client';
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { runJobs } from "./utils/scheduledJobs";
import './styles.css'

const container = document.getElementById('app');
const root = createRoot(container!);
// Starts scheduled jobs
runJobs()

root.render(
    <BrowserRouter>
        <App />
    </BrowserRouter>
);
