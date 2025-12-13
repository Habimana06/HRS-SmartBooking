import apiClient from "./apiClient.js";

export const adminService = {
  async getDashboard(params = {}) {
    const { data } = await apiClient.get("/admin/dashboard", { params });

    const normalizeDashboard = (d) => {
      const revenueByMonth = Array.isArray(d?.monthlyRevenueChart || d?.MonthlyRevenueChart)
        ? (d.monthlyRevenueChart || d.MonthlyRevenueChart).map(point => ({
            month: point.label || point.Label || "",
            revenue: Number(point.value ?? point.Value ?? 0),
            bookings: Number(point.bookings ?? point.Bookings ?? 0)
          }))
        : [];

      const paymentMethods = Array.isArray(d?.paymentMethodsDistribution || d?.PaymentMethodsDistribution)
        ? (d.paymentMethodsDistribution || d.PaymentMethodsDistribution).map((point, idx) => ({
            name: point.label || point.Label || point.method || point.Method || `Method ${idx + 1}`,
            value: Number(point.value ?? point.Value ?? point.count ?? point.Count ?? 0),
            color: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#6366F1"][idx % 5]
          }))
        : [];

      const roomOccupancy = Array.isArray(d?.roomOccupancyByType || d?.RoomOccupancyByType)
        ? (d.roomOccupancyByType || d.RoomOccupancyByType).map((room, idx) => {
            const occupied = Number(room.occupied ?? room.Occupied ?? room.value ?? room.Value ?? 0);
            const total = Number(room.total ?? room.Total ?? occupied);
            const percentage = total > 0 ? Math.round((occupied / total) * 100) : 100;
            return {
              type: room.type || room.Type || room.label || room.Label || `Type ${idx + 1}`,
              occupied,
              total,
              percentage
            };
          })
        : [];

      return {
        totalUsers: d?.totalUsers ?? d?.TotalUsers ?? 0,
        activeStaff: d?.activeStaff ?? d?.ActiveStaff ?? 0,
        totalRevenue: d?.totalRevenue ?? d?.TotalRevenue ?? 0,
        monthlyRevenue: d?.monthlyRevenue ?? d?.MonthlyRevenue ?? 0,
        todayBookings: d?.todayBookings ?? d?.TodayBookings ?? 0,
        pendingBookings: d?.pendingBookings ?? d?.PendingBookings ?? 0,
        failedTransactions: d?.failedTransactions ?? d?.FailedTransactions ?? 0,
        pendingVerifications: d?.pendingVerifications ?? d?.PendingVerifications ?? 0,
        revenueByMonth,
        paymentMethods,
        roomOccupancy,
        userGrowth: d?.userGrowthChart || d?.UserGrowthChart || [],
        recentActivities: d?.recentActivities || d?.RecentActivities || []
      };
    };

    return normalizeDashboard(data);
  },

  async getUsers() {
    const { data } = await apiClient.get("/admin/users");
    if (Array.isArray(data)) {
      return data.map(u => ({
        userId: u.userId ?? u.UserId,
        firstName: u.firstName ?? u.FirstName,
        lastName: u.lastName ?? u.LastName,
        email: u.email ?? u.Email,
        phoneNumber: u.phoneNumber ?? u.PhoneNumber,
        role: u.role ?? u.Role ?? "User",
        status: (u.isActive ?? u.IsActive ?? true) ? "Active" : "Inactive",
        lastLogin: u.lastLogin ?? u.LastLogin ?? "",
        isVerified: u.isVerified ?? u.IsVerified ?? false,
      }));
    }
    return data;
  },

  async getUser(id) {
    const { data } = await apiClient.get(`/admin/users/${id}`);
    return data;
  },

  async createUser(user) {
    const { data } = await apiClient.post("/admin/users", user);
    return data;
  },

  async updateUser(id, user) {
    const { data } = await apiClient.put(`/admin/users/${id}`, user);
    return data;
  },

  async deleteUser(id) {
    await apiClient.delete(`/admin/users/${id}`);
  },

  async assignUserRole(payload) {
    const { data } = await apiClient.post("/admin/users/assign-role", payload);
    return data;
  },

  async getRoles() {
    const { data } = await apiClient.get("/admin/roles");
    // Transform backend data to frontend format
    if (data && typeof data === 'object') {
      return {
        roles: Array.isArray(data.roles) ? data.roles.map(role => ({
          id: role.id || role.Id,
          name: role.name || role.Name,
          users: role.users || role.Users || 0,
          permissions: role.permissions || role.Permissions || [],
          color: role.color || role.Color || "blue",
          description: role.description || role.Description || "",
          createdAt: role.createdAt || role.CreatedAt || new Date().toISOString().split('T')[0]
        })) : [],
        activityLog: Array.isArray(data.activityLog) ? data.activityLog : []
      };
    }
    return { roles: [], activityLog: [] };
  },

  async upsertRoles(roles) {
    const { data } = await apiClient.put("/admin/roles", roles);
    return data;
  },

  async setRoleStatus(roleName, enabled) {
    const { data } = await apiClient.put(`/admin/roles/${encodeURIComponent(roleName)}/status`, null, { params: { enabled } });
    return data;
  },

  async assignRole(payload) {
    const { data } = await apiClient.post("/admin/roles/assign", payload);
    return data;
  },

  async getStaff() {
    const { data } = await apiClient.get("/admin/staff");
    // Transform backend data to frontend format
    if (Array.isArray(data)) {
      return data.map(staff => ({
        id: staff.userId || staff.id || staff.UserId,
        name: staff.name || staff.Name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
        role: staff.role || staff.Role,
        status: staff.status || staff.Status || "Active",
        shift: staff.shift || staff.Shift || "Day",
        email: staff.email || staff.Email,
        phone: staff.phone || staff.Phone,
        joinDate: staff.joinDate || staff.JoinDate || staff.createdAt || staff.CreatedAt,
        performance: staff.performance || staff.Performance || 90,
        leaves: staff.leaves || staff.Leaves || 0
      }));
    }
    return data || [];
  },

  async createStaff(staff) {
    const { data } = await apiClient.post("/admin/staff", staff);
    return data;
  },

  async updateStaff(id, staff) {
    const { data } = await apiClient.put(`/admin/staff/${id}`, staff);
    return data;
  },

  async deleteStaff(id) {
    await apiClient.delete(`/admin/staff/${id}`);
  },

  async getPayments() {
    const { data } = await apiClient.get("/admin/payments");
    // Transform backend data to frontend format
    if (Array.isArray(data)) {
      return data.map(payment => ({
        id: payment.paymentId || payment.id || payment.PaymentId,
        paymentId: payment.paymentId || payment.id || payment.PaymentId,
        customer: payment.customer || payment.Customer || "Unknown",
        amount: payment.amount || payment.Amount || 0,
        method: payment.method || payment.Method || payment.paymentMethod || payment.PaymentMethod || "Card",
        status: payment.status || payment.Status || payment.paymentStatus || payment.PaymentStatus || "Pending",
        date: payment.date || payment.Date || payment.paymentDate || payment.PaymentDate,
        bookingId: payment.bookingId || payment.BookingId
      }));
    }
    return data || [];
  },

  async getReports() {
    const { data } = await apiClient.get("/admin/reports");
    // Return data as-is, it should already be in the correct format
    return data || {
      reports: [],
      revenueData: [],
      categoryData: [],
      userGrowthData: []
    };
  },

  async getAuditLogs() {
    const { data } = await apiClient.get("/admin/audit-logs");
    // Transform backend data to frontend format
    if (Array.isArray(data)) {
      return data.map(log => ({
        id: log.id || log.Id,
        actor: log.actor || log.Actor || "System",
        action: log.action || log.Action || "",
        target: log.target || log.Target || "",
        time: log.time || log.Time || new Date().toLocaleString(),
        status: log.status || log.Status || "Success"
      }));
    }
    return data || [];
  },

  async getSystemConfig() {
    const { data } = await apiClient.get("/admin/config");
    return data;
  },

  async updateSystemConfig(config) {
    const { data } = await apiClient.put("/admin/config", config);
    return data;
  },

  async saveUserPermissions(userPermissions) {
    const { data } = await apiClient.put("/admin/users/permissions", userPermissions);
    return data;
  },

  async createBackup() {
    const { data } = await apiClient.post("/admin/backup/create");
    return data;
  },

  async listBackups() {
    const { data } = await apiClient.get("/admin/backup/list");
    return data;
  },

  async downloadBackupPdf(backupId) {
    const response = await apiClient.get(`/admin/backup/${backupId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async deleteBackup(backupId) {
    const { data } = await apiClient.delete(`/admin/backup/${backupId}`);
    return data;
  },
};
