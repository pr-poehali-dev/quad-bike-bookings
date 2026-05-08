const BASE = "https://functions.poehali.dev/8cfecd38-89ea-4a27-8830-1ebad7a59ff1";

function adminToken(): string {
  return localStorage.getItem("quad_admin_token") || "";
}

async function request(method: string, path: string, body?: unknown, admin = false) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (admin) headers["X-Admin-Token"] = adminToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.error || "Ошибка сервера" };
  return data;
}

export const api = {
  // Публичные
  getSlots: () => request("GET", "/slots"),
  getAvailability: (date: string) => request("GET", `/availability?date=${date}`),
  getCompanies: () => request("GET", "/companies"),
  book: (data: unknown) => request("POST", "/book", data),

  // Авторизация
  auth: (password: string) => request("POST", "/auth", { password }),

  // Админ
  getBookings: () => request("GET", "/bookings", undefined, true),
  updateBooking: (id: string, patch: unknown) => request("PUT", `/bookings/${id}`, patch, true),
  saveSlots: (slots: unknown[]) => request("POST", "/settings/slots", { slots }, true),
  saveCompanies: (companies: string[]) => request("POST", "/settings/companies", { companies }, true),
  changePassword: (newPassword: string) => request("POST", "/settings/password", { newPassword }, true),
};
