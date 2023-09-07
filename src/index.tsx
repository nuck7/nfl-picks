import React from "react";
import { createRoot } from 'react-dom/client';
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import './styles.css'

const container = document.getElementById('app');
const root = createRoot(container!);

root.render(
    <BrowserRouter>
        <App />
    </BrowserRouter>
);
