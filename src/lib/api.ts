const BASE = "https://functions.poehali.dev/8cfecd38-89ea-4a27-8830-1ebad7a59ff1";

function adminToken(): string {
  return localStorage.getItem("quad_admin_token") || "";
}

async function call(action: string, params: Record<string, unknown> = {}, admin = false) {
  const body: Record<string, unknown> = { action, ...params };
  if (admin) body.token = adminToken();

  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.error || "Ошибка сервера" };
  return data;
}

export const api = {
  // Публичные
  getSlots: () => call("getSlots"),
  getAvailability: (date: string) => call("getAvailability", { date }),
  getCompanies: () => call("getCompanies"),
  book: (data: Record<string, unknown>) => call("book", data),

  // Авторизация
  auth: (password: string) => call("auth", { password }),

  // Админ
  getBookings: () => call("getBookings", {}, true),
  updateBooking: (id: string, patch: Record<string, unknown>) => call("updateBooking", { id, ...patch }, true),
  saveSlots: (slots: unknown[]) => call("saveSlots", { slots }, true),
  saveCompanies: (companies: string[]) => call("saveCompanies", { companies }, true),
  changePassword: (newPassword: string) => call("changePassword", { newPassword }, true),
};
