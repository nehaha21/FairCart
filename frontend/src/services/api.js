import axios from "axios";

const API = axios.create({ baseURL: "/api" });

export const searchProducts = (query) =>
  API.get(`/products/search?q=${encodeURIComponent(query)}`);

export const analyzeProduct = (id) =>
  API.get(`/products/analyze/${id}`);

export const getStats = () =>
  API.get("/products/stats");

export const getCategories = () =>
  API.get("/products/categories");
