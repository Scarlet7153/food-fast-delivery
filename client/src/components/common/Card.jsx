import React from "react";

// Generic Card: use flex-col and allow full height when needed via `h-full` in className
export const Card = ({ children, className }) => (
    <div className={`rounded-xl border shadow p-4 bg-white flex flex-col ${className || ""}`}>
        {children}
    </div>
);

export const CardContent = ({ children, className }) => (
    <div className={`mt-2 ${className || ""}`}>{children}</div>
);

// Optional helpers for consistent structure
export const CardHeader = ({ children, className }) => (
    <div className={`mb-2 ${className || ""}`}>{children}</div>
);

export const CardFooter = ({ children, className }) => (
    <div className={`mt-auto ${className || ""}`}>{children}</div>
);
