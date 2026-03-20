"use client";

import React, { createContext, useContext, ReactNode } from "react";

type HttpContextType = {
  get: (path: string, params?: Record<string, string>) => Promise<any>;
  post: (path: string, data?: any) => Promise<any>;
  postWithFormData: (path: string, data?: Record<string, any>) => Promise<any>;
  remove: (path: string) => Promise<any>;
};

const HttpContext = createContext<HttpContextType>({
  get: async () => {},
  post: async () => {},
  postWithFormData: async () => {},
  remove: async () => {},
});

export const useHttp = () => useContext(HttpContext);

export const HttpProvider = ({ children }: { children: ReactNode }) => {
  const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "";

  const get = async (path: string, params?: Record<string, string>) => {
    const url = new URL(`${baseURL}${path}`);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    return res.json();
  };

  const post = async (path: string, data?: any) => {
    const res = await fetch(`${baseURL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  };

  const postWithFormData = async (path: string, data?: Record<string, any>) => {
    const formData = new FormData();
    if (data) Object.entries(data).forEach(([k, v]) => formData.append(k, v));
    const res = await fetch(`${baseURL}${path}`, {
      method: "POST",
      body: formData,
    });
    return res.json();
  };

  const remove = async (path: string) => {
    const res = await fetch(`${baseURL}${path}`, { method: "DELETE" });
    return res.json();
  };

  return (
    <HttpContext.Provider value={{ get, post, postWithFormData, remove }}>
      {children}
    </HttpContext.Provider>
  );
};
